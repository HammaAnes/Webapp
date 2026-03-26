<?php

/**
 * API: Domiciliations d'une personne
 * GET /api/domiciliations/user.php?id=xxx  (ou ?user_id=xxx pour compat)
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::verifyAuth();

    $personId = $_GET['id'] ?? $_GET['user_id'] ?? null;

    if (!$personId) {
        Response::error("ID requis", 400);
    }

    if ($auth['role'] !== 'admin' && $auth['id'] !== $personId) {
        Response::error("Accès refusé", 403);
    }

    $stmt = $db->prepare("
        SELECT * FROM domiciliations
        WHERE person_id = :person_id
        ORDER BY date_debut_contrat DESC, created_at DESC
    ");
    $stmt->bindParam(':person_id', $personId);
    $stmt->execute();

    Response::success($stmt->fetchAll());

} catch (Exception $e) {
    Logger::error("Get person domiciliation error: " . $e->getMessage());
    Response::serverError();
}
