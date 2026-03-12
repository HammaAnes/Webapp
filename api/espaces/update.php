<?php

/**
 * API: Mettre à jour un espace
 * PUT /api/espaces/update.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        Response::error("ID requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Vérifier que l'espace existe
    $query = "SELECT id FROM espaces WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Espace non trouvé", 404);
    }

    // Construire la requête UPDATE dynamiquement
    $updates = [];
    $params = [':id' => $data->id];

    $allowed_fields = [
        'nom', 'type', 'description', 'capacite', 'equipements',
        'prix_heure', 'prix_demi_journee', 'prix_jour', 'prix_semaine', 'disponible', 'image_url', 'etage'
    ];

    foreach ($allowed_fields as $field) {
        if (isset($data->$field)) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data->$field;
        }
    }

    if (empty($updates)) {
        Response::error("Aucune donnée à mettre à jour", 400);
    }

    $updates[] = "updated_at = NOW()";
    $query = "UPDATE espaces SET " . implode(', ', $updates) . " WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    Response::success(null, "Espace mis à jour avec succès");

} catch (Exception $e) {
    error_log("Update espace error: " . $e->getMessage());
    Response::serverError();
}
