<?php

/**
 * API: Mise à jour du statut d'un parrainage
 * PATCH /api/parrainages/update.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    if ($auth['role'] !== 'admin') {
        Response::error("Accès non autorisé", 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $statut = $data['statut'] ?? null;

    if (!$id || !$statut) {
        Response::error("Paramètres manquants (id, statut)", 400);
    }

    $allowedStatuts = ['en_attente', 'valide', 'paye'];
    if (!in_array($statut, $allowedStatuts)) {
        Response::error("Statut invalide. Valeurs acceptées : " . implode(', ', $allowedStatuts), 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT id, statut FROM parrainages_details WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $detail = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$detail) {
        Response::error("Parrainage introuvable", 404);
    }

    $dateValidation = $statut === 'valide' ? ", date_validation = NOW()" : "";
    $query = "UPDATE parrainages_details SET statut = :statut" . $dateValidation . " WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':statut' => $statut, ':id' => $id]);

    if ($statut === 'valide' || $statut === 'paye') {
        $stmt = $db->prepare("SELECT recompense_parrain, parrainage_id FROM parrainages_details WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && $statut === 'paye') {
            $stmt = $db->prepare("UPDATE parrainages SET updated_at = NOW() WHERE id = :pid");
            $stmt->execute([':pid' => $row['parrainage_id']]);
        }
    }

    Response::success(['message' => 'Statut mis à jour avec succès', 'statut' => $statut]);

} catch (Exception $e) {
    error_log("Parrainages update error: " . $e->getMessage());
    Response::serverError("Erreur lors de la mise à jour");
}
