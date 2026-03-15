<?php

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];

    $espaceId = $_GET['espace_id'] ?? null;
    $dateDebut = $_GET['date_debut'] ?? null;
    $dateFin = $_GET['date_fin'] ?? null;

    if (empty($espaceId)) {
        Response::error("L'identifiant de l'espace est requis", 400);
    }
    if (empty($dateDebut) || empty($dateFin)) {
        Response::error("Les dates de debut et de fin sont requises", 400);
    }

    $db = Database::getInstance()->getConnection();

    $stmtEspace = $db->prepare("SELECT id, nom, type, capacite FROM espaces WHERE id = ? AND disponible = 1");
    $stmtEspace->execute([$espaceId]);
    $espace = $stmtEspace->fetch(PDO::FETCH_ASSOC);

    if (!$espace) {
        Response::error("Espace introuvable", 404);
    }

    $isOpenSpace = strtolower($espace['type']) === 'open_space'
        || stripos($espace['nom'], 'open') !== false
        || stripos($espace['nom'], 'coworking') !== false;

    $capacite = intval($espace['capacite']);

    $stmt = $db->prepare("
        SELECT date_debut, date_fin, participants, statut
        FROM reservations
        WHERE espace_id = ?
        AND statut NOT IN ('annulee', 'terminee')
        AND date_fin >= ?
        AND date_debut <= ?
        ORDER BY date_debut ASC
    ");
    $stmt->execute([
        $espaceId,
        $dateDebut . ' 00:00:00',
        $dateFin . ' 23:59:59'
    ]);
    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmtBlocages = $db->prepare("
        SELECT date_debut, date_fin, type, motif, statut
        FROM blocages_espaces
        WHERE espace_id = ?
        AND statut NOT IN ('annule', 'termine')
        AND date_fin >= ?
        AND date_debut <= ?
    ");
    $stmtBlocages->execute([
        $espaceId,
        $dateDebut . ' 00:00:00',
        $dateFin . ' 23:59:59'
    ]);
    $blocages = $stmtBlocages->fetchAll(PDO::FETCH_ASSOC);

    $slotSummary = [];

    foreach ($reservations as $res) {
        $rStart = strtotime($res['date_debut']);
        $rEnd   = strtotime($res['date_fin']);
        $participants = intval($res['participants']);

        $slotStart = $rStart - ($rStart % 3600);
        $slotCur = $slotStart;
        while ($slotCur < $rEnd) {
            $key = date('Y-m-d H:i', $slotCur);
            if (!isset($slotSummary[$key])) {
                $slotSummary[$key] = 0;
            }
            if ($isOpenSpace) {
                $slotSummary[$key] += $participants;
            } else {
                $slotSummary[$key] = max($slotSummary[$key], 1);
            }
            $slotCur += 3600;
        }
    }

    $dayAvailability = [];
    $current = strtotime($dateDebut);
    $end = strtotime($dateFin);

    while ($current <= $end) {
        $dayStr = date('Y-m-d', $current);
        $dayOfWeek = (int)date('N', $current);

        if ($dayOfWeek >= 5) {
            $current += 86400;
            continue;
        }

        $isBlocked = false;
        foreach ($blocages as $b) {
            $bStart = strtotime($b['date_debut']);
            $bEnd   = strtotime($b['date_fin']);
            $dayStart = strtotime($dayStr . ' 08:30:00');
            $dayEnd   = strtotime($dayStr . ' 18:00:00');
            if ($bStart <= $dayStart && $bEnd >= $dayEnd) {
                $isBlocked = true;
                break;
            }
        }

        if ($isBlocked) {
            $dayAvailability[$dayStr] = [
                'date' => $dayStr,
                'status' => 'blocked',
                'seats_taken' => $capacite,
                'seats_available' => 0,
                'capacity' => $capacite,
            ];
            $current += 86400;
            continue;
        }

        $maxSeats = 0;
        for ($h = 8; $h < 18; $h++) {
            $key = sprintf('%s %02d:00', $dayStr, $h);
            $taken = $slotSummary[$key] ?? 0;
            if ($taken > $maxSeats) {
                $maxSeats = $taken;
            }
        }
        $key_half = sprintf('%s 08:30', $dayStr);
        if (isset($slotSummary[$key_half]) && $slotSummary[$key_half] > $maxSeats) {
            $maxSeats = $slotSummary[$key_half];
        }

        $seatsAvailable = max(0, $capacite - $maxSeats);

        if ($isOpenSpace) {
            if ($seatsAvailable <= 0) {
                $status = 'full';
            } elseif ($maxSeats > 0) {
                $status = 'partial';
            } else {
                $status = 'available';
            }
        } else {
            if ($maxSeats > 0) {
                $status = 'full';
            } else {
                $status = 'available';
            }
        }

        $dayAvailability[$dayStr] = [
            'date' => $dayStr,
            'status' => $status,
            'seats_taken' => $maxSeats,
            'seats_available' => $seatsAvailable,
            'capacity' => $capacite,
        ];

        $current += 86400;
    }

    Response::success([
        'espace_id' => $espaceId,
        'is_open_space' => $isOpenSpace,
        'capacity' => $capacite,
        'days' => array_values($dayAvailability),
        'blocages' => $blocages,
    ]);

} catch (Exception $e) {
    error_log("Erreur availability: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
