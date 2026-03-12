<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();

    $id = $_GET['id'] ?? null;

    if (!$id) {
        Response::error("ID requis", 400);
    }

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("
        SELECT r.*,
               e.nom as espace_nom,
               e.type as espace_type,
               e.prix_heure,
               e.prix_jour,
               e.capacite,
               u.nom as user_nom,
               u.prenom as user_prenom,
               u.email as user_email
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        Response::error("Reservation introuvable", 404);
    }

    if ($auth['role'] !== 'admin' && $reservation['user_id'] !== $auth['id']) {
        Response::error("Acces refuse", 403);
    }

    Response::success($reservation);

} catch (Exception $e) {
    error_log("Erreur reservation show: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
