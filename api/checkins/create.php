<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $auth = Auth::requireAdmin();
        $userId = $auth['id'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['reservation_id'])) {
            Response::error('ID de réservation requis', 400);
        }

        $reservationId = $data['reservation_id'];
        $heureArrivee = $data['heure_arrivee_reelle'] ?? date('Y-m-d H:i:s');
        $note = $data['note'] ?? null;

        $stmt = $db->prepare("
            SELECT r.*, r.user_id
            FROM reservations r
            WHERE r.id = ? AND r.statut = 'confirmee'
        ");
        $stmt->execute([$reservationId]);
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reservation) {
            Response::notFound('Réservation non trouvée ou non confirmée');
        }

        $checkStmt = $db->prepare("SELECT id FROM checkins WHERE reservation_id = ?");
        $checkStmt->execute([$reservationId]);
        if ($checkStmt->fetch()) {
            Response::error('Un check-in existe déjà pour cette réservation', 400);
        }

        $db->beginTransaction();

        $checkinId = UuidHelper::generate();
        $insertStmt = $db->prepare("
            INSERT INTO checkins
            (id, reservation_id, user_id, heure_arrivee_reelle, statut, note, enregistre_par)
            VALUES (?, ?, ?, ?, 'en_cours', ?, ?)
        ");
        $insertStmt->execute([
            $checkinId,
            $reservationId,
            $reservation['user_id'],
            $heureArrivee,
            $note,
            $userId
        ]);

        $updateStmt = $db->prepare("
            UPDATE reservations
            SET statut = 'en_cours', checkin_id = ?
            WHERE id = ?
        ");
        $updateStmt->execute([$checkinId, $reservationId]);

        $db->commit();

        $heureDebut = new DateTime($reservation['date_debut']);
        $arriveeReelle = new DateTime($heureArrivee);
        $retardMinutes = max(0, ($arriveeReelle->getTimestamp() - $heureDebut->getTimestamp()) / 60);

        Response::success([
            'id' => $checkinId,
            'retard_minutes' => round($retardMinutes),
            'message' => 'Check-in enregistré avec succès'
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        Response::error($e->getMessage());
    }
} else {
    Response::error('Méthode non autorisée', 405);
}
