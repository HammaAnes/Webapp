<?php

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $isAdmin = $auth['role'] === 'admin';

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data || empty($data['id'])) {
        Response::error("ID requis", 400);
    }

    $id = $data['id'];

    $stmt = $db->prepare("SELECT * FROM reservations WHERE id = ?");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        Response::error("Reservation introuvable", 404);
    }

    if (!$isAdmin && $reservation['person_id'] !== $userId) {
        Response::error("Acces refuse", 403);
    }

    if ($reservation['statut'] === 'annulee') {
        Response::error("Reservation deja annulee", 400);
    }

    if ($reservation['statut'] === 'terminee') {
        Response::error("Impossible d'annuler une reservation terminee", 400);
    }

    $db->beginTransaction();

    $stmt = $db->prepare("UPDATE reservations SET statut = 'annulee' WHERE id = ?");
    $result = $stmt->execute([$id]);

    if (!$result) {
        $db->rollBack();
        Response::error("Erreur lors de l'annulation", 500);
    }

    if (!empty($reservation['code_promo_id'])) {
        $db->prepare("
            UPDATE codes_promo
            SET utilisations_actuelles = GREATEST(utilisations_actuelles - 1, 0)
            WHERE id = ?
        ")->execute([$reservation['code_promo_id']]);

        // BUG 5.3 fix: supprimer aussi l'enregistrement d'utilisation individuel
        $db->prepare("
            DELETE FROM utilisations_codes_promo WHERE reservation_id = ?
        ")->execute([$id]);
    }

    $db->commit();

    $stmt = $db->prepare("
        SELECT r.*, e.nom as espace_nom, e.type as espace_type
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $updated, 'message' => 'Reservation annulee']);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        if (ob_get_level() > 0) { ob_end_flush(); }
        flush();
    }

    try {
        $userStmt = $db->prepare("SELECT prenom, nom, email FROM persons WHERE id = ?");
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            AdminNotifier::reservationCancelled($updated, $user['prenom'] . ' ' . $user['nom'], $user['email']);
        }
    } catch (Exception $notifErr) {
        error_log("Admin notification error: " . $notifErr->getMessage());
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Erreur reservation cancel: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
