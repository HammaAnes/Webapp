<?php

/**
 * API: Supprimer un abonnement
 * DELETE /api/abonnements/delete.php
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

    // Vérifier si des utilisateurs ont cet abonnement actif
    $query = "SELECT COUNT(*) as count FROM abonnements_utilisateurs
              WHERE abonnement_id = :id AND statut = 'actif'";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $data->id]);
    $result = $stmt->fetch();

    if ($result['count'] > 0) {
        Response::error("Impossible de supprimer cet abonnement car " . $result['count'] . " utilisateur(s) y sont abonné(s)", 400);
    }

    // Au lieu de supprimer, archiver l'abonnement
    $query = "UPDATE abonnements SET statut = 'archive', actif = 0 WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $data->id]);

    if ($stmt->rowCount() === 0) {
        Response::error("Abonnement introuvable", 404);
    }

    Response::success(null, "Abonnement archivé avec succès");

} catch (Exception $e) {
    error_log("Delete abonnement error: " . $e->getMessage());
    Response::serverError("Erreur lors de la suppression de l'abonnement");
}
