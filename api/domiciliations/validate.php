<?php

/**
 * API: Valider une demande de domiciliation (Admin)
 * POST /api/domiciliations/validate.php
 *
 * Transitions de statut autorisées :
 *   dossier_preparatoire  → en_attente_signature
 *   en_attente_complements → en_attente_signature
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

    if ($auth['role'] !== 'admin') {
        Response::unauthorized('Accès réservé aux administrateurs');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    $validator = new Validator($data);
    $validator->required(['domiciliation_id']);

    if (!$validator->isValid()) {
        Response::badRequest($validator->getErrors());
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT * FROM domiciliations WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->execute();
    $domiciliation = $stmt->fetch();

    if (!$domiciliation) {
        Response::notFound('Demande de domiciliation introuvable');
    }

    $allowedFromStatuts = ['dossier_preparatoire', 'en_attente_complements'];
    if (!in_array($domiciliation['statut'], $allowedFromStatuts)) {
        Response::badRequest('Cette demande ne peut pas être validée depuis son statut actuel (' . $domiciliation['statut'] . ')');
    }

    $notes = $data['commentaire'] ?? 'Dossier validé — en attente de signature notariale';
    $query = "UPDATE domiciliations
              SET statut = 'en_attente_signature',
                  notes_admin = :notes,
                  updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->bindParam(':notes', $notes);

    if (!$stmt->execute()) {
        Response::serverError('Erreur lors de la validation');
    }

    if (!empty($domiciliation['user_id'])) {
        $notificationId = UuidHelper::generate();
        $query = "INSERT INTO notifications
                  (id, user_id, type, titre, message, created_at)
                  VALUES (:id, :user_id, 'domiciliation', :titre, :message, NOW())";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $notificationId);
        $stmt->bindParam(':user_id', $domiciliation['user_id']);
        $titre = 'Dossier de domiciliation validé';
        $message = 'Votre dossier a été validé. Vous serez contacté pour planifier la signature du contrat chez le notaire.';
        $stmt->bindParam(':titre', $titre);
        $stmt->bindParam(':message', $message);
        $stmt->execute();
    }

    Response::success([
        'message' => 'Dossier validé — en attente de signature notariale',
        'id' => $data['domiciliation_id'],
        'statut' => 'en_attente_signature',
    ]);

} catch (Exception $e) {
    error_log("Validate domiciliation error: " . $e->getMessage());
    Response::serverError();
}
