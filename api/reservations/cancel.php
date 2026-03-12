<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

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

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("SELECT * FROM reservations WHERE id = ?");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        Response::error("Reservation introuvable", 404);
    }

    if (!$isAdmin && $reservation['user_id'] !== $userId) {
        Response::error("Acces refuse", 403);
    }

    if ($reservation['statut'] === 'annulee') {
        Response::error("Reservation deja annulee", 400);
    }

    if ($reservation['statut'] === 'terminee') {
        Response::error("Impossible d'annuler une reservation terminee", 400);
    }

    $stmt = $db->prepare("UPDATE reservations SET statut = 'annulee' WHERE id = ?");
    $result = $stmt->execute([$id]);

    if (!$result) {
        Response::error("Erreur lors de l'annulation", 500);
    }

    $stmt = $db->prepare("
        SELECT r.*, e.nom as espace_nom, e.type as espace_type
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    Response::success($updated, "Reservation annulee");

} catch (Exception $e) {
    error_log("Erreur reservation cancel: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
