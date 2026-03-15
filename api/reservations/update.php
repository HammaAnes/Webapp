<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/UuidHelper.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Methode non autorisee", 405);
}

function parseUpdateDate(string $input): string {
    if (preg_match('/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $input)) {
        $dt = new DateTime($input);
        $dt->setTimezone(new DateTimeZone('Africa/Algiers'));
        return $dt->format('Y-m-d H:i:s');
    }
    $clean = str_replace(['T', 'Z'], [' ', ''], $input);
    $clean = preg_replace('/\.\d{3}$/', '', $clean);
    return trim($clean);
}

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $isAdmin = $auth['role'] === 'admin';

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data || empty($data['id'])) {
        Response::error("ID reservation requis", 400);
    }

    $id = $data['id'];

    $db = Database::getInstance()->getConnection();

    // Bug 7 — Join espaces to get type and capacite for date change re-validation
    $stmt = $db->prepare("
        SELECT r.*, e.prix_heure, e.prix_jour, e.type as espace_type, e.capacite, e.nom as espace_nom
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        Response::error("Reservation introuvable", 404);
    }

    if (!$isAdmin && $reservation['user_id'] !== $userId) {
        Response::error("Acces refuse", 403);
    }

    $updates = [];
    $params = [];

    if ($isAdmin && isset($data['statut'])) {
        $validStatuts = ['en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee', 'no_show'];
        if (!in_array($data['statut'], $validStatuts)) {
            Response::error("Statut invalide", 400);
        }
        $validTransitions = [
            'en_attente' => ['confirmee', 'annulee'],
            'confirmee'  => ['en_cours', 'annulee', 'no_show'],
            'en_cours'   => ['terminee', 'annulee'],
            'terminee'   => [],
            'annulee'    => [],
            'no_show'    => [],
        ];
        $currentStatut = $reservation['statut'] ?? '';
        $allowed = $validTransitions[$currentStatut] ?? [];
        if (!in_array($data['statut'], $allowed)) {
            Response::error("Transition invalide : impossible de passer de '$currentStatut' à '{$data['statut']}'", 400);
        }
        $updates[] = "statut = ?";
        $params[] = $data['statut'];
    }

    if ($isAdmin && isset($data['montant_paye'])) {
        $updates[] = "montant_paye = ?";
        $params[] = floatval($data['montant_paye']);
    }

    if ($isAdmin && isset($data['mode_paiement'])) {
        $updates[] = "mode_paiement = ?";
        $params[] = $data['mode_paiement'];
    }

    if (isset($data['participants'])) {
        $updates[] = "participants = ?";
        $params[] = max(1, intval($data['participants']));
    }

    if (isset($data['notes'])) {
        $updates[] = "notes = ?";
        $params[] = trim($data['notes']);
    }

    // Bug 7 — Support date changes with availability re-check
    $newDateDebut = null;
    $newDateFin = null;

    if (isset($data['date_debut'])) {
        $newDateDebut = parseUpdateDate($data['date_debut']);
        $updates[] = "date_debut = ?";
        $params[] = $newDateDebut;
    }

    if (isset($data['date_fin'])) {
        $newDateFin = parseUpdateDate($data['date_fin']);
        $updates[] = "date_fin = ?";
        $params[] = $newDateFin;
    }

    if ($newDateDebut || $newDateFin) {
        $checkDebut = $newDateDebut ?? $reservation['date_debut'];
        $checkFin   = $newDateFin   ?? $reservation['date_fin'];

        if (strtotime($checkFin) <= strtotime($checkDebut)) {
            Response::error("La date de fin doit etre apres la date de debut", 400);
        }

        $espaceId  = $reservation['espace_id'];
        $isOS      = strtolower($reservation['espace_type'] ?? '') === 'open_space'
                     || stripos($reservation['espace_nom'] ?? '', 'open') !== false
                     || stripos($reservation['espace_nom'] ?? '', 'coworking') !== false;
        $capacite  = intval($reservation['capacite'] ?? 12);
        $currentParticipants = isset($data['participants'])
            ? max(1, intval($data['participants']))
            : max(1, intval($reservation['participants'] ?? 1));

        if ($isOS) {
            $stmtAvail = $db->prepare("
                SELECT COALESCE(SUM(GREATEST(COALESCE(participants, 1), 1)), 0) as seats_taken
                FROM reservations
                WHERE espace_id = ? AND id != ?
                AND statut NOT IN ('annulee', 'terminee')
                AND date_debut < ? AND date_fin > ?
            ");
            $stmtAvail->execute([$espaceId, $id, $checkFin, $checkDebut]);
            $seatsTaken = intval($stmtAvail->fetch(PDO::FETCH_ASSOC)['seats_taken'] ?? 0);

            if ($seatsTaken + $currentParticipants > $capacite) {
                $seatsLeft = max(0, $capacite - $seatsTaken);
                Response::error("Seulement $seatsLeft place(s) disponible(s) sur le nouveau creneau", 409);
            }
        } else {
            $stmtAvail = $db->prepare("
                SELECT id FROM reservations
                WHERE espace_id = ? AND id != ?
                AND statut NOT IN ('annulee', 'terminee')
                AND date_debut < ? AND date_fin > ?
                LIMIT 1
            ");
            $stmtAvail->execute([$espaceId, $id, $checkFin, $checkDebut]);
            if ($stmtAvail->fetch()) {
                Response::error("Le nouveau creneau est deja reserve", 409);
            }
        }
    }

    if (empty($updates)) {
        Response::error("Aucune donnee a mettre a jour", 400);
    }

    $params[] = $id;
    $sql = "UPDATE reservations SET " . implode(", ", $updates) . " WHERE id = ?";

    $stmt = $db->prepare($sql);
    $result = $stmt->execute($params);

    if (!$result) {
        Response::error("Erreur lors de la mise a jour", 500);
    }

    $stmt = $db->prepare("
        SELECT r.*, e.nom as espace_nom, e.type as espace_type
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($isAdmin && isset($data['statut']) && !empty($reservation['user_id'])) {
        try {
            $notifId = UuidHelper::generate();
            $statusMessages = [
                'confirmee'  => 'Votre réservation a été confirmée.',
                'annulee'    => 'Votre réservation a été annulée.',
                'en_cours'   => 'Votre réservation est en cours.',
                'terminee'   => 'Votre réservation est terminée.',
                'no_show'    => 'Vous avez été marqué absent pour votre réservation.',
            ];
            $message = $statusMessages[$data['statut']] ?? 'Le statut de votre réservation a été mis à jour.';
            $notifStmt = $db->prepare("INSERT INTO notifications (id, user_id, type, titre, message, lue, created_at) VALUES (?, ?, 'reservation', 'Mise à jour réservation', ?, 0, NOW())");
            $notifStmt->execute([$notifId, $reservation['user_id'], $message]);
        } catch (Exception $notifErr) {
            error_log("Notification error on reservation update: " . $notifErr->getMessage());
        }
    }

    Response::success($updated, "Reservation mise a jour");

} catch (Exception $e) {
    error_log("Erreur reservation update: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
