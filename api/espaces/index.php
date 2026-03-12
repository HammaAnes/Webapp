<?php

/**
 * API: Gestion des espaces
 * GET /api/espaces/index.php - Lister les espaces
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';

try {
    $db = Database::getInstance()->getConnection();

    $query = "SELECT id, nom, type, capacite, prix_heure, prix_demi_journee, prix_jour, prix_semaine,
                     description, equipements, disponible, etage, image_url
              FROM espaces
              ORDER BY nom ASC";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $espaces = [];
    while ($row = $stmt->fetch()) {
        // Gérer NULL et JSON invalide
        $row['equipements'] = $row['equipements'] ? json_decode($row['equipements']) : [];
        if (json_last_error() !== JSON_ERROR_NONE) {
            $row['equipements'] = [];
        }
        $espaces[] = $row;
    }

    Response::success($espaces);

} catch (Exception $e) {
    error_log("Espaces error: " . $e->getMessage());
    Response::serverError();
}
