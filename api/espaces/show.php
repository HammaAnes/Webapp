<?php

/**
 * API: Détail d'un espace
 * GET /api/espaces/show.php?id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';

try {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        Response::error("ID requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT * FROM espaces WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    $espace = $stmt->fetch();

    if (!$espace) {
        Response::error("Espace non trouvé", 404);
    }

    Response::success($espace);

} catch (Exception $e) {
    error_log("Get espace error: " . $e->getMessage());
    Response::serverError();
}
