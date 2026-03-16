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

    $isOpenSpace = strtolower($espace['type']) === 'open_space';
    $capacite = max(1, intval($espace['capacite']));

    $dateDebutFull = (strlen($dateDebut) <= 10) ? $dateDebut . ' 00:00:00' : $dateDebut;
    $dateFinFull   = (strlen($dateFin) <= 10)   ? $dateFin . ' 23:59:59'   : $dateFin;

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

    $OPEN_MINUTE  = 8 * 60 + 30;
    $CLOSE_MINUTE = 18 * 60 + 30;
    $SLOT_STEP    = 30;

    $dayAvailability = [];

    $current = strtotime(substr($dateDebut, 0, 10));
    $end     = strtotime(substr($dateFin, 0, 10));

    while ($current <= $end) {
        $dayStr    = date('Y-m-d', $current);
        $dayOfWeek = (int)date('N', $current);

        if ($dayOfWeek == 5 || $dayOfWeek == 6) {
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
        'espace_id'     => $espaceId,
        'is_open_space' => $isOpenSpace,
        'capacity'      => $capacite,
        'days'          => $dayAvailability,
    ]);

} catch (Exception $e) {
    error_log("Erreur availability: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
