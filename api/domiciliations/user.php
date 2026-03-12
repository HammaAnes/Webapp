<?php

/**
 * API: Domiciliation d'un utilisateur spécifique
 * GET /api/domiciliations/user.php?user_id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        Response::error("ID utilisateur requis", 400);
    }

    // Vérifier que l'utilisateur demande ses propres données ou est admin
    if ($auth['role'] !== 'admin' && $auth['id'] !== $user_id) {
        Response::error("Accès refusé", 403);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT * FROM domiciliations
              WHERE user_id = :user_id
              ORDER BY created_at DESC
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $domiciliation = $stmt->fetch();

    if ($domiciliation) {
        Response::success($domiciliation);
    } else {
        Response::success(null);
    }

} catch (Exception $e) {
    error_log("Get user domiciliation error: " . $e->getMessage());
    Response::serverError();
}
