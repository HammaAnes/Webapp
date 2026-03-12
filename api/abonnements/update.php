<?php

/**
 * API: Mettre à jour un abonnement
 * PUT /api/abonnements/update.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    // Vérifier que l'utilisateur est admin
    if ($auth['role'] !== 'admin') {
        Response::error("Accès non autorisé", 403);
    }

    $data = json_decode(file_get_contents("php://input"));

    // Validation
    if (empty($data->id)) {
        Response::error("ID de l'abonnement manquant", 400);
    }

    $db = Database::getInstance()->getConnection();

    // Vérifier que l'abonnement existe
    $query = "SELECT id FROM abonnements WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $data->id]);

    if (!$stmt->fetch()) {
        Response::error("Abonnement introuvable", 404);
    }

    // Construire la requête de mise à jour dynamiquement
    $updates = [];
    $params = [':id' => $data->id];

    if (isset($data->nom)) {
        $updates[] = "nom = :nom";
        $params[':nom'] = $data->nom;
    }

    if (isset($data->type)) {
        $updates[] = "type = :type";
        $params[':type'] = $data->type;
    }

    if (isset($data->prix)) {
        $updates[] = "prix = :prix";
        $params[':prix'] = $data->prix;
    }

    if (isset($data->prix_avec_domiciliation)) {
        $updates[] = "prix_avec_domiciliation = :prix_avec_domiciliation";
        $params[':prix_avec_domiciliation'] = $data->prix_avec_domiciliation;
    }

    if (isset($data->duree_mois)) {
        $updates[] = "duree_mois = :duree_mois";
        $params[':duree_mois'] = $data->duree_mois;
    }

    if (isset($data->description)) {
        $updates[] = "description = :description";
        $params[':description'] = $data->description;
    }

    if (isset($data->avantages)) {
        $updates[] = "avantages = :avantages";
        $params[':avantages'] = json_encode($data->avantages);
    }

    if (isset($data->actif)) {
        $updates[] = "actif = :actif";
        $params[':actif'] = (int)$data->actif;
    }

    if (isset($data->statut)) {
        $updates[] = "statut = :statut";
        $params[':statut'] = $data->statut;
    }

    if (isset($data->ordre)) {
        $updates[] = "ordre = :ordre";
        $params[':ordre'] = $data->ordre;
    }

    if (empty($updates)) {
        Response::error("Aucune donnée à mettre à jour", 400);
    }

    $query = "UPDATE abonnements SET " . implode(', ', $updates) . " WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    // Récupérer l'abonnement mis à jour
    $query = "SELECT * FROM abonnements WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $data->id]);
    $abonnement = $stmt->fetch();

    if (!empty($abonnement['avantages'])) {
        $abonnement['avantages'] = json_decode($abonnement['avantages'], true);
    }

    Response::success($abonnement, "Abonnement mis à jour avec succès");

} catch (Exception $e) {
    error_log("Update abonnement error: " . $e->getMessage());
    Response::serverError("Erreur lors de la mise à jour de l'abonnement");
}
