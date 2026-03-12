<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $id = $_GET['id'] ?? null;
    if (!$id) {
        Response::error("ID du code promo requis", 400);
    }

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data)) {
        Response::error("Données manquantes", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $checkQuery = "SELECT id FROM codes_promo WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        Response::error("Code promo non trouvé", 404);
    }

    $updateFields = [];
    $params = [':id' => $id];

    if (isset($data->code)) {
        $updateFields[] = "code = :code";
        $params[':code'] = strtoupper($data->code);
    }

    if (isset($data->type)) {
        if (!in_array($data->type, ['pourcentage', 'montant_fixe'])) {
            Response::error("Type invalide. Doit être 'pourcentage' ou 'montant_fixe'", 400);
        }
        $updateFields[] = "type = :type";
        $params[':type'] = $data->type;
    }

    if (isset($data->valeur)) {
        $updateFields[] = "valeur = :valeur";
        $params[':valeur'] = $data->valeur;
    }

    if (isset($data->date_debut)) {
        $updateFields[] = "date_debut = :date_debut";
        $params[':date_debut'] = $data->date_debut;
    }

    if (isset($data->date_fin)) {
        $updateFields[] = "date_fin = :date_fin";
        $params[':date_fin'] = $data->date_fin;
    }

    if (isset($data->utilisations_max)) {
        $updateFields[] = "utilisations_max = :utilisations_max";
        $params[':utilisations_max'] = $data->utilisations_max;
    }

    if (isset($data->montant_min)) {
        $updateFields[] = "montant_min = :montant_min";
        $params[':montant_min'] = $data->montant_min;
    }

    if (isset($data->types_application)) {
        $updateFields[] = "types_application = :types_application";
        $params[':types_application'] = is_array($data->types_application)
            ? json_encode($data->types_application)
            : json_encode(['tous']);
    }

    if (isset($data->actif)) {
        $updateFields[] = "actif = :actif";
        $params[':actif'] = $data->actif ? 1 : 0;
    }

    if (isset($data->description)) {
        $updateFields[] = "description = :description";
        $params[':description'] = $data->description;
    }

    if (isset($data->conditions)) {
        $updateFields[] = "conditions = :conditions";
        $params[':conditions'] = $data->conditions;
    }

    if (empty($updateFields)) {
        Response::error("Aucune donnée à mettre à jour", 400);
    }

    $query = "UPDATE codes_promo SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    Response::success(['id' => $id], "Code promo mis à jour avec succès");

} catch (Exception $e) {
    error_log("Update promo error: " . $e->getMessage());
    Response::serverError("Erreur lors de la mise à jour du code promo");
}
