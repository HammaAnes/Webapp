<?php

/**
 * API: Liste des codes promo (Admin uniquement)
 * GET /api/codes-promo/index.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT * FROM codes_promo ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $codes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success($codes);

} catch (Exception $e) {
    error_log("Codes promo error: " . $e->getMessage());
    Response::serverError("Erreur lors de la récupération des codes promo");
}
