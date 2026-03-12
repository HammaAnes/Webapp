<?php

/**
 * API: Supprimer une notification
 * DELETE /api/notifications/delete.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        Response::error("ID notification requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT id FROM notifications WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $data->id,
        ':user_id' => $auth['id']
    ]);

    if ($stmt->rowCount() === 0) {
        Response::error("Notification non trouvée", 404);
    }

    $query = "DELETE FROM notifications WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    Response::success(null, "Notification supprimée");

} catch (Exception $e) {
    error_log("Delete notification error: " . $e->getMessage());
    Response::serverError("Erreur lors de la suppression de la notification");
}
