<?php

/**
 * API: Créer un code promo (Admin uniquement)
 * POST /api/codes-promo/create.php
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::requireAdmin();
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->code) || empty($data->type) || empty($data->valeur) || empty($data->date_debut) || empty($data->date_fin)) {
        Response::error("Données manquantes (code, type, valeur, date_debut, date_fin requis)", 400);
    }

    if (!in_array($data->type, ['pourcentage', 'montant_fixe'])) {
        Response::error("Type invalide. Doit être 'pourcentage' ou 'montant_fixe'", 400);
    }

    // Vérifier que le code n'existe pas déjà
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM codes_promo WHERE code = ?");
    $stmt->execute([strtoupper($data->code)]);
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
    $id = UuidHelper::generate();
    $stmt = $db->prepare("
        INSERT INTO codes_promo (
            id, code, type, valeur, date_debut, date_fin,
            utilisations_max, montant_min, types_application,
            actif, description, conditions
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?
        )
    ");
    $stmt->execute([
        $id,
        strtoupper($data->code),
        $data->type,
        $data->valeur,
        $data->date_debut,
        $data->date_fin,
        $data->utilisations_max ?? null,
        $data->montant_min ?? 0,
        $typesApplication,
        isset($data->actif) ? (int)(bool)$data->actif : 1,
        $data->description ?? null,
        $data->conditions ?? null,
    ]);

    Response::success(['id' => $id, 'code' => strtoupper($data->code)], "Code promo créé avec succès", 201);

} catch (Exception $e) {
    error_log("Create promo error: " . $e->getMessage());
    Response::serverError("Erreur lors de la création du code promo");
}
