<?php

/**
 * API: Supprimer un espace (soft delete)
 * DELETE /api/espaces/delete.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        Response::error("ID requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Vérifier que l'espace existe et est disponible
    $query = "SELECT id, disponible FROM espaces WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Espace non trouvé", 404);
    }

    // Vérifier qu'il n'y a pas de réservations futures
    $query = "SELECT COUNT(*) as total FROM reservations
              WHERE espace_id = :espace_id
              AND date_fin > NOW()
              AND statut IN ('en_attente', 'confirmee')";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':espace_id', $data->id);
    $stmt->execute();

    $count = $stmt->fetch()['total'];

    if ($count > 0) {
        Response::error("Impossible de supprimer: des réservations futures existent", 400);
    }

    // Marquer comme indisponible au lieu de supprimer
    $query = "UPDATE espaces SET disponible = 0 WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    Response::success(null, "Espace supprimé avec succès");

} catch (Exception $e) {
    error_log("Delete espace error: " . $e->getMessage());
    Response::serverError();
}
