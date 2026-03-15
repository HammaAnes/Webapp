<?php

/**
 * API: Rejeter une demande de domiciliation (Admin)
 * POST /api/domiciliations/reject.php
 */

require_once __DIR__ . '/../bootstrap.php';

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
    $validator->required(['domiciliation_id', 'commentaire']);

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

    $allowedFromStatuts = ['dossier_preparatoire', 'en_attente_complements', 'en_attente_signature', 'domiciliation_creee'];
    if (!in_array($domiciliation['statut'], $allowedFromStatuts)) {
        Response::error("Cette demande ne peut pas être refusée depuis son statut actuel ('" . $domiciliation['statut'] . "')", 400);
    }

    // Mettre à jour le statut
    $query = "UPDATE domiciliations
              SET statut = 'refusee',
                  notes_admin = :notes,
                  updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->bindParam(':notes', $data['commentaire']);

    if (!$stmt->execute()) {
        Response::serverError('Erreur lors du rejet');
    }

    // Créer une notification pour l'utilisateur
    $notificationId = UuidHelper::generate();
    $query = "INSERT INTO notifications
              (id, user_id, type, titre, message, created_at)
              VALUES (:id, :user_id, 'domiciliation', :titre, :message, NOW())";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $notificationId);
    $stmt->bindParam(':user_id', $domiciliation['user_id']);
    $titre = 'Demande de domiciliation refusée';
    $message = 'Votre demande de domiciliation a été refusée. Raison: ' . $data['commentaire'];
    $stmt->bindParam(':titre', $titre);
    $stmt->bindParam(':message', $message);
    $stmt->execute();

    try {
        $userStmt = $db->prepare("SELECT email, prenom, nom FROM users WHERE id = ?");
        $userStmt->execute([$domiciliation['user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            $domiciliation['commentaire_admin'] = $data['commentaire'];
            Mailer::sendDomiciliationStatus($user['email'], 'refusee', $domiciliation);
        }
    } catch (Exception $mailErr) {
        error_log("Email domiciliation reject error: " . $mailErr->getMessage());
    }

    Response::success([
        'message' => 'Demande rejetée',
        'id' => $data['domiciliation_id']
    ]);

} catch (Exception $e) {
    error_log("Reject domiciliation error: " . $e->getMessage());
    Response::serverError();
}
