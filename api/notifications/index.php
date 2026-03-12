<?php

/**
 * API: Liste des notifications d'un utilisateur
 * GET /api/notifications/index.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT * FROM notifications
              WHERE user_id = :user_id
              ORDER BY created_at DESC
              LIMIT 50";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $auth['id']);
    $stmt->execute();

    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success($notifications);

} catch (Exception $e) {
    error_log("Get notifications error: " . $e->getMessage());
    Response::serverError("Erreur lors de la récupération des notifications");
}
