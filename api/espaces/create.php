<?php

/**
 * API: Créer un espace
 * POST /api/espaces/create.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/UuidHelper.php';

try {
    $auth = Auth::requireAdmin();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->nom) || empty($data->type)) {
        Response::error("Nom et type requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $id = UuidHelper::generate();

    $query = "INSERT INTO espaces
              (id, nom, type, description, capacite, equipements,
               prix_heure, prix_demi_journee, prix_jour, prix_semaine, disponible, image_url)
              VALUES
              (:id, :nom, :type, :description, :capacite, :equipements,
               :prix_heure, :prix_demi_journee, :prix_jour, :prix_semaine, :disponible, :image_url)";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $id,
        ':nom' => $data->nom,
        ':type' => $data->type,
        ':description' => $data->description ?? null,
        ':capacite' => $data->capacite ?? 1,
        ':equipements' => isset($data->equipements) ? json_encode($data->equipements) : null,
        ':prix_heure' => $data->prix_heure ?? 0,
        ':prix_demi_journee' => $data->prix_demi_journee ?? 0,
        ':prix_jour' => $data->prix_jour ?? 0,
        ':prix_semaine' => $data->prix_semaine ?? 0,
        ':disponible' => $data->disponible ?? true,
        ':image_url' => $data->image_url ?? null
    ]);

    Response::success(['id' => $id], "Espace créé avec succès");

} catch (Exception $e) {
    error_log("Create espace error: " . $e->getMessage());
    Response::serverError();
}
