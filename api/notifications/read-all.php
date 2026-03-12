<?php

/**
 * API: Marquer toutes les notifications comme lues
 * PUT /api/notifications/read-all.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "UPDATE notifications SET lue = 1 WHERE user_id = :user_id AND lue = 0";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $auth['id']);
    $stmt->execute();

    $count = $stmt->rowCount();

    Response::success(['count' => $count], "$count notification(s) marquée(s) comme lue(s)");

} catch (Exception $e) {
    error_log("Read all notifications error: " . $e->getMessage());
    Response::serverError("Erreur lors de la mise à jour des notifications");
}
