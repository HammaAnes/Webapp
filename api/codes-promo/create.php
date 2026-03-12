<?php

/**
 * API: Créer un code promo (Admin uniquement)
 * POST /api/codes-promo/create.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->code) || empty($data->type) || empty($data->valeur) || empty($data->date_debut) || empty($data->date_fin)) {
        Response::error("Données manquantes (code, type, valeur, date_debut, date_fin requis)", 400);
    }

    if (!in_array($data->type, ['pourcentage', 'montant_fixe'])) {
        Response::error("Type invalide. Doit être 'pourcentage' ou 'montant_fixe'", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Vérifier que le code n'existe pas déjà
    $query = "SELECT COUNT(*) as count FROM codes_promo WHERE code = :code";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $data->code);
    $stmt->execute();

    if ($stmt->fetch()['count'] > 0) {
        Response::error("Ce code promo existe déjà", 400);
    }

    // Préparer types_application en JSON
    $typesApplication = null;
    if (!empty($data->types_application)) {
        if (is_array($data->types_application)) {
            $typesApplication = json_encode($data->types_application);
        } else {
            $typesApplication = json_encode(['tous']);
        }
    }

    // Créer le code promo
    $query = "INSERT INTO codes_promo (
                id, code, type, valeur, date_debut, date_fin,
                utilisations_max, montant_min, types_application,
                actif, description, conditions
              ) VALUES (
                UUID(), :code, :type, :valeur, :date_debut, :date_fin,
                :utilisations_max, :montant_min, :types_application,
                :actif, :description, :conditions
              )";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':code' => strtoupper($data->code),
        ':type' => $data->type,
        ':valeur' => $data->valeur,
        ':date_debut' => $data->date_debut,
        ':date_fin' => $data->date_fin,
        ':utilisations_max' => $data->utilisations_max ?? null,
        ':montant_min' => $data->montant_min ?? 0,
        ':types_application' => $typesApplication,
        ':actif' => $data->actif ?? true,
        ':description' => $data->description ?? null,
        ':conditions' => $data->conditions ?? null
    ]);

    Response::success(['code' => strtoupper($data->code)], "Code promo créé avec succès", 201);

} catch (Exception $e) {
    error_log("Create promo error: " . $e->getMessage());
    Response::serverError("Erreur lors de la création du code promo");
}
