<?php

/**
 * API: Vérifier un code parrainage
 * POST /api/parrainages/verify.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->code)) {
        Response::error("Code parrainage requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Chercher le code parrainage
    $query = "SELECT p.*, u.nom, u.prenom
              FROM parrainages p
              LEFT JOIN users u ON p.parrain_id = u.id
              WHERE p.code_parrain = :code
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $data->code);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Code parrainage invalide", 404);
    }

    $parrainage = $stmt->fetch(PDO::FETCH_ASSOC);

    Response::success([
        'code' => $parrainage['code_parrain'],
        'parrain_nom' => $parrainage['nom'] . ' ' . $parrainage['prenom'],
        'valid' => true
    ], "Code parrainage valide");

} catch (Exception $e) {
    error_log("Verify parrainage error: " . $e->getMessage());
    Response::serverError("Erreur lors de la vérification du code parrainage");
}
