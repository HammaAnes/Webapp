<?php

/**
 * API: Valider un code promo
 * POST /api/codes-promo/validate.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->code)) {
        Response::error("Code promo requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $db->beginTransaction();

    try {
        // Chercher le code promo avec FOR UPDATE pour éviter race conditions
        $query = "SELECT * FROM codes_promo
                  WHERE code = :code AND actif = 1
                  AND date_debut <= NOW()
                  AND date_fin >= NOW()
                  LIMIT 1
                  FOR UPDATE";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':code', $data->code);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            Response::error("Code promo invalide ou expiré", 404);
        }

        $promo = $stmt->fetch(PDO::FETCH_ASSOC);

        // Vérifier si applicable au type de service
        $type = $data->type ?? 'reservation';
        if (!empty($promo['types_application'])) {
            $typesApplicables = json_decode($promo['types_application'], true);
            if (!empty($typesApplicables) && !in_array($type, $typesApplicables) && !in_array('tous', $typesApplicables)) {
                $db->rollBack();
                Response::error("Ce code promo n'est pas applicable à ce type de service", 400);
            }
        }

        // Vérifier le montant minimum
        $montant = $data->montant ?? 0;
        if ($montant < $promo['montant_min']) {
            $db->rollBack();
            Response::error("Le montant minimum pour ce code promo est de " . $promo['montant_min'] . " DA", 400);
        }

        // Vérifier les utilisations (avec les compteurs actuels)
        if ($promo['utilisations_max'] !== null && $promo['utilisations_actuelles'] >= $promo['utilisations_max']) {
            $db->rollBack();
            Response::error("Ce code promo a atteint son nombre maximum d'utilisations", 400);
        }

        // Vérifier si l'utilisateur l'a déjà utilisé
        $query = "SELECT COUNT(*) as count FROM utilisations_codes_promo
                  WHERE code_promo_id = :promo_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':promo_id' => $promo['id'],
            ':user_id' => $auth['id']
        ]);

        if ($stmt->fetch()['count'] > 0) {
            $db->rollBack();
            Response::error("Vous avez déjà utilisé ce code promo", 400);
        }

        // Calculer la réduction
        $reduction = 0;

        if ($promo['type'] === 'pourcentage') {
            $reduction = ($montant * $promo['valeur']) / 100;
        } else {
            $reduction = $promo['valeur'];
        }

        // S'assurer que la réduction ne dépasse pas le montant
        $reduction = min($reduction, $montant);

        $db->commit();

        Response::success([
            'id' => $promo['id'],
            'code' => $promo['code'],
            'type' => $promo['type'],
            'valeur' => $promo['valeur'],
            'reduction' => round($reduction, 2),
            'montant_final' => round($montant - $reduction, 2)
        ], "Code promo valide");

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Validate promo error: " . $e->getMessage());
    Response::serverError("Erreur lors de la validation du code promo");
}
