<?php

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();

    $espaceId   = $_GET['espace_id'] ?? null;
    $dateDebut  = $_GET['date_debut'] ?? null;
    $dateFin    = $_GET['date_fin'] ?? null;
    $slotDetail = ($_GET['slot_detail'] ?? '') === 'true';

    if (empty($espaceId)) Response::error("L'identifiant de l'espace est requis", 400);
    if (empty($dateDebut) || empty($dateFin)) Response::error("Les dates sont requises", 400);

    $db = Database::getInstance()->getConnection();

    $stmtEspace = $db->prepare("SELECT id, nom, type, capacite FROM espaces WHERE id = ? AND disponible = 1");
    $stmtEspace->execute([$espaceId]);
    $espace = $stmtEspace->fetch(PDO::FETCH_ASSOC);
    if (!$espace) Response::error("Espace introuvable", 404);

    $isOpenSpace = strtolower($espace['type']) === 'open_space'
        || stripos($espace['nom'], 'open') !== false
        || stripos($espace['nom'], 'coworking') !== false;
    $capacite = max(1, intval($espace['capacite']));

    // Support both YYYY-MM-DD and YYYY-MM-DD HH:MM:SS formats
    $dateDebutFull = (strlen($dateDebut) <= 10) ? $dateDebut . ' 00:00:00' : $dateDebut;
    $dateFinFull   = (strlen($dateFin) <= 10)   ? $dateFin . ' 23:59:59'   : $dateFin;

    // GREATEST(COALESCE(participants, 1), 1) guarantees minimum 1 participant per reservation
    $stmt = $db->prepare("
        SELECT date_debut, date_fin, GREATEST(COALESCE(participants, 1), 1) as participants, statut, user_id
        FROM reservations
        WHERE espace_id = ?
        AND statut NOT IN ('annulee', 'terminee')
        AND date_fin > ?
        AND date_debut < ?
        ORDER BY date_debut ASC
    ");
    $stmt->execute([$espaceId, $dateDebutFull, $dateFinFull]);
    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmtBlocages = $db->prepare("
        SELECT date_debut, date_fin, type, motif, statut
        FROM blocages_espaces
        WHERE espace_id = ?
        AND statut NOT IN ('annule', 'termine')
        AND date_fin > ?
        AND date_debut < ?
    ");
    $stmtBlocages->execute([$espaceId, $dateDebutFull, $dateFinFull]);
    $blocages = $stmtBlocages->fetchAll(PDO::FETCH_ASSOC);

    $OPEN_MINUTE  = 8 * 60 + 30;  // 8h30
    $CLOSE_MINUTE = 18 * 60 + 30; // 18h30
    $SLOT_STEP    = 30;            // 30 minutes per slot — unified with frontend

    $dayAvailability = [];

    // Use only the date portion for iteration
    $current = strtotime(substr($dateDebut, 0, 10));
    $end     = strtotime(substr($dateFin, 0, 10));

    while ($current <= $end) {
        $dayStr    = date('Y-m-d', $current);
        $dayOfWeek = (int)date('N', $current);

        // Friday (5) and Saturday (6) = closed
        if ($dayOfWeek == 5 || $dayOfWeek == 6) {
            $current += 86400;
            continue;
        }

        // Check for full-day block
        $isBlocked = false;
        $dayStart  = strtotime($dayStr . ' 08:30:00');
        $dayEnd    = strtotime($dayStr . ' 18:30:00');
        foreach ($blocages as $b) {
            $bStart = strtotime($b['date_debut']);
            $bEnd   = strtotime($b['date_fin']);
            if ($bStart <= $dayStart && $bEnd >= $dayEnd) {
                $isBlocked = true;
                break;
            }
        }

        if ($isBlocked) {
            $dayAvailability[] = [
                'date'            => $dayStr,
                'status'          => 'blocked',
                'seats_taken'     => $capacite,
                'seats_available' => 0,
                'capacity'        => $capacite,
            ];
            $current += 86400;
            continue;
        }

        $maxSeatsInAnySlot = 0;
        $hasAnyReservation = false;
        $slots = [];

        for ($slotMin = $OPEN_MINUTE; $slotMin < $CLOSE_MINUTE; $slotMin += $SLOT_STEP) {
            $slotStartTs = strtotime($dayStr) + $slotMin * 60;
            $slotEndTs   = $slotStartTs + $SLOT_STEP * 60;

            $seatsInSlot = 0;
            foreach ($reservations as $res) {
                $rStart = strtotime($res['date_debut']);
                $rEnd   = strtotime($res['date_fin']);

                if ($rStart < $slotEndTs && $rEnd > $slotStartTs) {
                    $hasAnyReservation = true;
                    if ($isOpenSpace) {
                        $seatsInSlot += intval($res['participants']);
                    } else {
                        $seatsInSlot = $capacite;
                        break;
                    }
                }
            }

            // Check partial blocages on this slot
            foreach ($blocages as $b) {
                $bStart = strtotime($b['date_debut']);
                $bEnd   = strtotime($b['date_fin']);
                if ($bStart < $slotEndTs && $bEnd > $slotStartTs) {
                    $seatsInSlot = $capacite;
                    break;
                }
            }

            $maxSeatsInAnySlot = max($maxSeatsInAnySlot, $seatsInSlot);

            if ($slotDetail) {
                $slotH  = (int)floor($slotMin / 60);
                $slotM  = $slotMin % 60;
                $endMin = $slotMin + $SLOT_STEP;
                $endH   = (int)floor($endMin / 60);
                $endM   = $endMin % 60;
                $slots[] = [
                    'start'           => sprintf('%02d:%02d', $slotH, $slotM),
                    'end'             => sprintf('%02d:%02d', $endH, $endM),
                    'seats_taken'     => min($seatsInSlot, $capacite),
                    'seats_available' => max(0, $capacite - $seatsInSlot),
                ];
            }
        }

        $seatsAvailable = max(0, $capacite - $maxSeatsInAnySlot);

        if ($isOpenSpace) {
            $status = $seatsAvailable <= 0 ? 'full'
                    : ($hasAnyReservation ? 'partial' : 'available');
        } else {
            $status = $hasAnyReservation ? 'full' : 'available';
        }

        $dayData = [
            'date'            => $dayStr,
            'status'          => $status,
            'seats_taken'     => min($maxSeatsInAnySlot, $capacite),
            'seats_available' => $seatsAvailable,
            'capacity'        => $capacite,
        ];

        if ($slotDetail) {
            $dayData['slots'] = $slots;
        }

        $dayAvailability[] = $dayData;
        $current += 86400;
    }

    Response::success([
        'espace_id'    => $espaceId,
        'is_open_space'=> $isOpenSpace,
        'capacity'     => $capacite,
        'days'         => $dayAvailability,
        'blocages'     => $blocages,
    ]);

} catch (Exception $e) {
    error_log("Erreur availability: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
