<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $id = $_GET['id'] ?? null;
    if (!$id) {
        Response::error("ID du code promo requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $checkQuery = "SELECT id, code FROM codes_promo WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id);
    $checkStmt->execute();

    $promo = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$promo) {
        Response::error("Code promo non trouvé", 404);
    }

    $query = "DELETE FROM codes_promo WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    Response::success(['code' => $promo['code']], "Code promo supprimé avec succès");

} catch (Exception $e) {
    error_log("Delete promo error: " . $e->getMessage());
    Response::serverError("Erreur lors de la suppression du code promo");
}
