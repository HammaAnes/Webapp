<?php

/**
 * API: Activer une domiciliation (Admin)
 * POST /api/domiciliations/activate.php
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
    $validator->required(['domiciliation_id', 'montant_mensuel', 'date_debut', 'date_fin']);

    if (!$validator->isValid()) {
        Response::badRequest($validator->getErrors());
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Vérifier que la domiciliation existe et est validée
    $query = "SELECT * FROM domiciliations WHERE id = :id AND statut = 'validee'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->execute();

    $domiciliation = $stmt->fetch();

    if (!$domiciliation) {
        Response::notFound('Demande de domiciliation introuvable ou non validée');
    }

    // Activer la domiciliation
    $query = "UPDATE domiciliations
              SET statut = 'active',
                  date_debut = :date_debut,
                  date_fin = :date_fin,
                  montant_mensuel = :montant_mensuel,
                  visible_sur_site = TRUE,
                  updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->bindParam(':date_debut', $data['date_debut']);
    $stmt->bindParam(':date_fin', $data['date_fin']);
    $stmt->bindParam(':montant_mensuel', $data['montant_mensuel']);

    if (!$stmt->execute()) {
        Response::serverError('Erreur lors de l\'activation');
    }

    // Créer une transaction pour le premier paiement
    $transactionId = UuidHelper::generate();
    $query = "INSERT INTO transactions
              (id, user_id, type, montant, statut, mode_paiement, reference, description, date_paiement, created_at)
              VALUES (:id, :user_id, 'domiciliation', :montant, 'en_attente', :mode_paiement, :reference, :description, NOW(), NOW())";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $transactionId);
    $stmt->bindParam(':user_id', $domiciliation['user_id']);
    $stmt->bindParam(':montant', $data['montant_mensuel']);
    $mode_paiement = $data['mode_paiement'] ?? 'cash';
    $stmt->bindParam(':mode_paiement', $mode_paiement);
    $reference = 'DOM-' . date('YmdHis') . '-' . substr($transactionId, 0, 8);
    $stmt->bindParam(':reference', $reference);
    $description = 'Activation domiciliation - ' . $domiciliation['raison_sociale'];
    $stmt->bindParam(':description', $description);
    $stmt->execute();

    // Créer une notification pour l'utilisateur
    $notificationId = UuidHelper::generate();
    $query = "INSERT INTO notifications
              (id, user_id, type, titre, message, created_at)
              VALUES (:id, :user_id, 'domiciliation', :titre, :message, NOW())";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $notificationId);
    $stmt->bindParam(':user_id', $domiciliation['user_id']);
    $titre = 'Domiciliation activée';
    $message = 'Votre domiciliation est maintenant active. Montant mensuel: ' . number_format($data['montant_mensuel'], 2, ',', ' ') . ' DA';
    $stmt->bindParam(':titre', $titre);
    $stmt->bindParam(':message', $message);
    $stmt->execute();

    Response::success([
        'message' => 'Domiciliation activée avec succès',
        'id' => $data['domiciliation_id'],
        'transaction_id' => $transactionId,
        'reference' => $reference
    ]);

} catch (Exception $e) {
    error_log("Activate domiciliation error: " . $e->getMessage());
    Response::serverError();
}
