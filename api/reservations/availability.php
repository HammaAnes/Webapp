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

    $OPEN_MINUTE  = 8 * 60 + 30;
    $CLOSE_MINUTE = 18 * 60 + 30;
    $SLOT_STEP    = 30;

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
            $dayEnd   = strtotime($dayStr . ' 18:30:00');
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
        for ($slotMin = $OPEN_MINUTE; $slotMin < $CLOSE_MINUTE; $slotMin += $SLOT_STEP) {
            $slotStartTs = strtotime($dayStr) + $slotMin * 60;
            $slotEndTs   = $slotStartTs + $SLOT_STEP * 60;

            $seatsInSlot = 0;
            foreach ($reservations as $res) {
                $rStart = strtotime($res['date_debut']);
                $rEnd   = strtotime($res['date_fin']);
                if ($rStart < $slotEndTs && $rEnd > $slotStartTs) {
                    if ($isOpenSpace) {
                        $seatsInSlot += intval($res['participants']);
                    } else {
                        $seatsInSlot = max($seatsInSlot, 1);
                    }
                }
            }
            if ($seatsInSlot > $maxSeats) {
                $maxSeats = $seatsInSlot;
            }
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
