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
    $userId = $auth['id'];
    $isAdmin = $auth['role'] === 'admin';

    $db = Database::getInstance()->getConnection();

    if ($isAdmin) {
        $stmt = $db->prepare("
            SELECT r.*,
                   e.nom as espace_nom,
                   e.type as espace_type,
                   e.prix_heure,
                   e.prix_jour,
                   u.nom as user_nom,
                   u.prenom as user_prenom,
                   u.email as user_email
            FROM reservations r
            JOIN espaces e ON r.espace_id = e.id
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        ");
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT r.*,
                   e.nom as espace_nom,
                   e.type as espace_type,
                   e.prix_heure,
                   e.prix_jour
            FROM reservations r
            JOIN espaces e ON r.espace_id = e.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$userId]);
    }

    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success($reservations);

} catch (Exception $e) {
    error_log("Erreur reservations index: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
