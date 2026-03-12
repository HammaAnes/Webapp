<?php

/**
 * API: Créer un abonnement
 * POST /api/abonnements/create.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/UuidHelper.php';

try {
    $auth = Auth::verifyAuth();

    // Vérifier que l'utilisateur est admin
    if ($auth['role'] !== 'admin') {
        Response::error("Accès non autorisé", 403);
    }

    $data = json_decode(file_get_contents("php://input"));

    // Validation
    if (empty($data->nom) || empty($data->type) || !isset($data->prix)) {
        Response::error("Données manquantes (nom, type, prix requis)", 400);
    }

    $db = Database::getInstance()->getConnection();

    $abonnement_id = UuidHelper::generate();

    // Encoder les avantages en JSON
    $avantages = !empty($data->avantages) ? json_encode($data->avantages) : null;

    $query = "INSERT INTO abonnements (
                id, nom, type, prix, prix_avec_domiciliation, duree_mois,
                description, avantages, actif, statut, ordre
              ) VALUES (
                :id, :nom, :type, :prix, :prix_avec_domiciliation, :duree_mois,
                :description, :avantages, :actif, :statut, :ordre
              )";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $abonnement_id,
        ':nom' => $data->nom,
        ':type' => $data->type,
        ':prix' => $data->prix,
        ':prix_avec_domiciliation' => $data->prix_avec_domiciliation ?? null,
        ':duree_mois' => $data->duree_mois ?? 1,
        ':description' => $data->description ?? null,
        ':avantages' => $avantages,
        ':actif' => isset($data->actif) ? (int)$data->actif : 1,
        ':statut' => $data->statut ?? 'actif',
        ':ordre' => $data->ordre ?? 0
    ]);

    // Récupérer l'abonnement créé
    $query = "SELECT * FROM abonnements WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $abonnement_id]);
    $abonnement = $stmt->fetch();

    if (!empty($abonnement['avantages'])) {
        $abonnement['avantages'] = json_decode($abonnement['avantages'], true);
    }

    Response::success($abonnement, "Abonnement créé avec succès", 201);

} catch (Exception $e) {
    error_log("Create abonnement error: " . $e->getMessage());
    Response::serverError("Erreur lors de la création de l'abonnement");
}
