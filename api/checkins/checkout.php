<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $auth = Auth::requireAdmin();
        $userId = $auth['id'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['checkin_id'])) {
            Response::error('ID de check-in requis', 400);
        }

        $checkinId = $data['checkin_id'];
        $heureDepart = $data['heure_depart_reel'] ?? date('Y-m-d H:i:s');

        $stmt = $db->prepare("
            SELECT c.*, r.id as reservation_id
            FROM checkins c
            LEFT JOIN reservations r ON c.reservation_id = r.id
            WHERE c.id = ? AND c.statut = 'en_cours'
        ");
        $stmt->execute([$checkinId]);
        $checkin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$checkin) {
            Response::notFound('Check-in non trouvé ou déjà terminé');
        }

        $db->beginTransaction();

        $updateCheckinStmt = $db->prepare("
            UPDATE checkins
            SET heure_depart_reel = ?, statut = 'parti'
            WHERE id = ?
        ");
        $updateCheckinStmt->execute([$heureDepart, $checkinId]);

        $updateReservationStmt = $db->prepare("
            UPDATE reservations
            SET statut = 'terminee'
            WHERE id = ?
        ");
        $updateReservationStmt->execute([$checkin['reservation_id']]);

        $db->commit();

        $arrivee = new DateTime($checkin['heure_arrivee_reelle']);
        $depart = new DateTime($heureDepart);
        $dureeMinutes = ($depart->getTimestamp() - $arrivee->getTimestamp()) / 60;

        Response::success([
            'message' => 'Check-out enregistré avec succès',
            'duree_minutes' => round($dureeMinutes)
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
