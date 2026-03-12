<?php

/**
 * API: Supprimer un utilisateur (soft delete)
 * DELETE /api/users/delete.php?id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    // Seul l'admin peut supprimer des utilisateurs
    Auth::requireAdmin();

    $userId = $_GET['id'] ?? null;

    if (!$userId) {
        Response::error("ID utilisateur manquant", 400);
    }

    $db = Database::getInstance()->getConnection();

    // Désactiver l'utilisateur au lieu de le supprimer
    $query = "UPDATE users SET statut = 'inactif' WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Utilisateur non trouvé", 404);
    }

    Response::success(['id' => $userId], "Utilisateur supprimé avec succès");

} catch (Exception $e) {
    error_log("User delete error: " . $e->getMessage());
    Response::serverError();
}
