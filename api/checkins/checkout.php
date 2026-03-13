<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $userId = Auth::getUserId();
        if (!$userId) {
            Response::unauthorized('Non authentifié');
        }

        $user = Auth::getUser();
        if ($user['role'] !== 'admin') {
            Response::forbidden('Seuls les administrateurs peuvent enregistrer les check-outs');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['checkin_id'])) {
            Response::badRequest('ID de check-in requis');
        }

        $checkinId = $data['checkin_id'];
        $heureDepart = $data['heure_depart_reel'] ?? date('Y-m-d H:i:s');

        // Récupérer le check-in
        $stmt = $pdo->prepare("
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

        $pdo->beginTransaction();

        // Mettre à jour le check-in
        $updateCheckinStmt = $pdo->prepare("
            UPDATE checkins
            SET heure_depart_reel = ?, statut = 'parti'
            WHERE id = ?
        ");
        $updateCheckinStmt->execute([$heureDepart, $checkinId]);

        // Mettre à jour la réservation
        $updateReservationStmt = $pdo->prepare("
            UPDATE reservations
            SET statut = 'terminee'
            WHERE id = ?
        ");
        $updateReservationStmt->execute([$checkin['reservation_id']]);

        $pdo->commit();

        // Calculer la durée de présence
        $arrivee = new DateTime($checkin['heure_arrivee_reelle']);
        $depart = new DateTime($heureDepart);
        $dureeMinutes = ($depart->getTimestamp() - $arrivee->getTimestamp()) / 60;

        Response::success([
            'message' => 'Check-out enregistré avec succès',
            'duree_minutes' => round($dureeMinutes)
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        Response::error($e->getMessage());
    }
} else {
    Response::methodNotAllowed();
}
