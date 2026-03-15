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
require_once '../utils/Mailer.php';

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

    $query = "SELECT * FROM domiciliations WHERE id = :id AND statut IN ('en_attente_signature', 'domiciliation_creee')";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->execute();

    $domiciliation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$domiciliation) {
        Response::notFound('Domiciliation introuvable ou ne peut pas être activée depuis son statut actuel (statut requis: en_attente_signature ou domiciliation_creee)');
    }

    // Validation des dates
    $dateDebut = new DateTime($data['date_debut']);
    $dateFin = new DateTime($data['date_fin']);
    if ($dateFin <= $dateDebut) {
        Response::badRequest('La date de fin doit être postérieure à la date de début');
    }

    // Validation du numéro de bureau
    if (isset($data['numero_bureau']) && $data['numero_bureau'] > 0) {
        $bureauNum = intval($data['numero_bureau']);
        if ($bureauNum < 1 || $bureauNum > 60) {
            Response::badRequest('Le numéro de bureau doit être compris entre 1 et 60');
        }
        $bureauCheckStmt = $db->prepare("SELECT id FROM domiciliations WHERE numero_bureau = ? AND statut IN ('active', 'domiciliation_creee') AND id != ?");
        $bureauCheckStmt->execute([$bureauNum, $data['domiciliation_id']]);
        if ($bureauCheckStmt->fetch()) {
            Response::error('Ce numéro de bureau est déjà attribué à une domiciliation active', 409);
        }
    }

    // Activer la domiciliation
    $numeroBureau = isset($data['numero_bureau']) && $data['numero_bureau'] > 0 ? intval($data['numero_bureau']) : null;
    $bureauSet = $numeroBureau !== null ? ", numero_bureau = :numero_bureau" : "";

    $query = "UPDATE domiciliations
              SET statut = 'active',
                  date_debut = :date_debut,
                  date_fin = :date_fin,
                  date_debut_contrat = :date_debut_contrat,
                  date_fin_contrat = :date_fin_contrat,
                  montant_mensuel = :montant_mensuel,
                  visible_sur_site = TRUE,
                  updated_at = NOW()
                  $bureauSet
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data['domiciliation_id']);
    $stmt->bindParam(':date_debut', $data['date_debut']);
    $stmt->bindParam(':date_fin', $data['date_fin']);
    $stmt->bindParam(':date_debut_contrat', $data['date_debut']);
    $stmt->bindParam(':date_fin_contrat', $data['date_fin']);
    $stmt->bindParam(':montant_mensuel', $data['montant_mensuel']);
    if ($numeroBureau !== null) {
        $stmt->bindParam(':numero_bureau', $numeroBureau, PDO::PARAM_INT);
    }

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

    try {
        $userStmt = $db->prepare("SELECT email, prenom, nom FROM users WHERE id = ?");
        $userStmt->execute([$domiciliation['user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            $domiciliation['date_debut'] = $data['date_debut'];
            $domiciliation['date_fin'] = $data['date_fin'];
            $domiciliation['montant_mensuel'] = $data['montant_mensuel'];
            Mailer::sendDomiciliationStatus($user['email'], 'active', $domiciliation);
        }
    } catch (Exception $mailErr) {
        error_log("Email domiciliation activate error: " . $mailErr->getMessage());
    }

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
