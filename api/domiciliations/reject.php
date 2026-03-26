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

    $domiciliation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$domiciliation) {
        Response::notFound('Demande de domiciliation introuvable');
    }

    $allowedFromStatuts = ['dossier_preparatoire', 'en_attente_complements', 'en_attente_signature', 'domiciliation_creee'];
    if (!in_array($domiciliation['statut'], $allowedFromStatuts)) {
        Response::error("Cette demande ne peut pas être refusée depuis son statut actuel ('" . $domiciliation['statut'] . "')", 400);
    }

    $query = "UPDATE domiciliations
              SET statut = 'refusee',
                  motif_refus = :motif_refus,
                  commentaire_admin = :commentaire_admin,
                  updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->bindParam(':motif_refus', $data['commentaire']);
    $stmt->bindParam(':commentaire_admin', $data['commentaire']);

    if (!$stmt->execute()) {
        Response::serverError('Erreur lors du rejet');
    }

    if (!empty($domiciliation['person_id'])) {
        $notificationId = UuidHelper::generate();
        $query = "INSERT INTO notifications
                  (id, person_id, type, titre, message, lue, created_at)
                  VALUES (:id, :person_id, 'domiciliation', :titre, :message, 0, NOW())";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $notificationId);
        $stmt->bindParam(':person_id', $domiciliation['person_id']);
        $titre = 'Demande de domiciliation refusée';
        $message = 'Votre demande de domiciliation a été refusée. Raison: ' . $data['commentaire'];
        $stmt->bindParam(':titre', $titre);
        $stmt->bindParam(':message', $message);
        $stmt->execute();
    }

    if (!empty($domiciliation['person_id'])) {
        try {
            $userStmt = $db->prepare("SELECT email, prenom, nom FROM persons WHERE id = ?");
            $userStmt->execute([$domiciliation['person_id']]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $domiciliation['motif_refus'] = $data['commentaire'];
                Mailer::sendDomiciliationStatus($user['email'], 'refusee', $domiciliation);
            }
        } catch (Exception $mailErr) {
            error_log("Email domiciliation reject error: " . $mailErr->getMessage());
        }
    }

    Response::success([
        'message' => 'Demande rejetée',
        'id' => $data['domiciliation_id']
    ]);

} catch (Exception $e) {
    error_log("Reject domiciliation error: " . $e->getMessage());
    Response::serverError();
}
