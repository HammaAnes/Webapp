<?php

/**
 * API: Valider une demande de domiciliation (Admin)
 * POST /api/domiciliations/validate.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Validator.php';
require_once '../utils/UuidHelper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = Auth::verifyAuth();

    // Vérifier que l'utilisateur est admin
    if ($auth['role'] !== 'admin') {
        Response::unauthorized('Accès réservé aux administrateurs');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    // Validation
    $validator = new Validator($data);
    $validator->required(['domiciliation_id']);

    if (!$validator->isValid()) {
        Response::badRequest($validator->getErrors());
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Vérifier que la domiciliation existe
    $query = "SELECT * FROM domiciliations WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->execute();

    $domiciliation = $stmt->fetch();

    if (!$domiciliation) {
        Response::notFound('Demande de domiciliation introuvable');
    }

    // Mettre à jour le statut
    $query = "UPDATE domiciliations
              SET statut = 'validee',
                  notes_admin = :notes,
                  updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $notes = $data['commentaire'] ?? 'Demande validée par l\'administrateur';
    $stmt->bindParam(':notes', $notes);

    if (!$stmt->execute()) {
        Response::serverError('Erreur lors de la validation');
    }

    // Créer une notification pour l'utilisateur
    $notificationId = UuidHelper::generate();
    $query = "INSERT INTO notifications
              (id, user_id, type, titre, message, created_at)
              VALUES (:id, :user_id, 'domiciliation', :titre, :message, NOW())";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $notificationId);
    $stmt->bindParam(':user_id', $domiciliation['user_id']);
    $titre = 'Demande de domiciliation validée';
    $message = 'Votre demande de domiciliation a été validée. Un administrateur vous contactera prochainement pour finaliser l\'activation.';
    $stmt->bindParam(':titre', $titre);
    $stmt->bindParam(':message', $message);
    $stmt->execute();

    Response::success([
        'message' => 'Demande validée avec succès',
        'id' => $data['domiciliation_id']
    ]);

} catch (Exception $e) {
    error_log("Validate domiciliation error: " . $e->getMessage());
    Response::serverError();
}
