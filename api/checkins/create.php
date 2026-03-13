<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/UuidHelper.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;
use Utils\UuidHelper;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $userId = Auth::getUserId();
        if (!$userId) {
            Response::unauthorized('Non authentifié');
        }

        $user = Auth::getUser();
        if ($user['role'] !== 'admin') {
            Response::forbidden('Seuls les administrateurs peuvent enregistrer les check-ins');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['reservation_id'])) {
            Response::badRequest('ID de réservation requis');
        }

        $reservationId = $data['reservation_id'];
        $heureArrivee = $data['heure_arrivee_reelle'] ?? date('Y-m-d H:i:s');
        $note = $data['note'] ?? null;

        // Vérifier que la réservation existe et est confirmée
        $stmt = $pdo->prepare("
            SELECT r.*, u.id as user_id
            FROM reservations r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ? AND r.statut = 'confirmee'
        ");
        $stmt->execute([$reservationId]);
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reservation) {
            Response::notFound('Réservation non trouvée ou non confirmée');
        }

        // Vérifier qu'il n'y a pas déjà un check-in
        $checkStmt = $pdo->prepare("SELECT id FROM checkins WHERE reservation_id = ?");
        $checkStmt->execute([$reservationId]);
        if ($checkStmt->fetch()) {
            Response::badRequest('Un check-in existe déjà pour cette réservation');
        }

        $pdo->beginTransaction();

        // Créer le check-in
        $checkinId = UuidHelper::generate();
        $insertStmt = $pdo->prepare("
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

        // Mettre à jour la réservation
        $updateStmt = $pdo->prepare("
            UPDATE reservations
            SET statut = 'en_cours', checkin_id = ?
            WHERE id = ?
        ");
        $updateStmt->execute([$checkinId, $reservationId]);

        $pdo->commit();

        // Calculer le retard
        $heureDebut = new DateTime($reservation['date_debut']);
        $arriveeReelle = new DateTime($heureArrivee);
        $retardMinutes = max(0, ($arriveeReelle->getTimestamp() - $heureDebut->getTimestamp()) / 60);

        Response::success([
            'id' => $checkinId,
            'retard_minutes' => round($retardMinutes),
            'message' => 'Check-in enregistré avec succès'
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
