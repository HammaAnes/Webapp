<?php

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = Auth::verifyAuth();

    if ($auth['role'] !== 'admin') {
        Response::unauthorized('Acces reserve aux administrateurs');
    }

    $data = json_decode(file_get_contents('php://input'), true);

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
        Response::notFound('Domiciliation introuvable ou ne peut pas etre activee depuis son statut actuel');
    }

    $dateDebut = new DateTime($data['date_debut']);
    $dateFin = new DateTime($data['date_fin']);
    if ($dateFin <= $dateDebut) {
        Response::badRequest('La date de fin doit etre posterieure a la date de debut');
    }

    $numeroBureau = isset($data['numero_bureau']) && $data['numero_bureau'] > 0 ? intval($data['numero_bureau']) : null;

    if ($numeroBureau !== null) {
        if ($numeroBureau < 1 || $numeroBureau > 60) {
            Response::badRequest('Le numero de bureau doit etre compris entre 1 et 60');
        }
        $bureauCheckStmt = $db->prepare("SELECT id FROM domiciliations WHERE numero_bureau = ? AND statut IN ('active', 'domiciliation_creee') AND id != ?");
        $bureauCheckStmt->execute([$numeroBureau, $data['domiciliation_id']]);
        if ($bureauCheckStmt->fetch()) {
            Response::error('Ce numero de bureau est deja attribue a une domiciliation active', 409);
        }
    }

    $db->beginTransaction();

    $bureauSet = $numeroBureau !== null ? ", numero_bureau = :numero_bureau" : "";

    $query = "UPDATE domiciliations
              SET statut = 'active',
                  date_debut = :date_debut,
                  date_fin = :date_fin,
                  date_debut_contrat = :date_debut_contrat,
                  date_fin_contrat = :date_fin_contrat,
                  montant_mensuel = :montant_mensuel,
                  date_activation = NOW(),
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
        $db->rollBack();
        Response::serverError('Erreur lors de l\'activation');
    }

    if (!empty($domiciliation['user_id'])) {
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

        $notificationId = UuidHelper::generate();
        $notifQuery = "INSERT INTO notifications (id, user_id, type, titre, message, lue, created_at) VALUES (?, ?, 'domiciliation', ?, ?, 0, NOW())";
        $notifStmt = $db->prepare($notifQuery);
        $titre = 'Domiciliation activee';
        $message = 'Votre domiciliation est maintenant active. Montant mensuel: ' . number_format($data['montant_mensuel'], 2, ',', ' ') . ' DA';
        $notifStmt->execute([$notificationId, $domiciliation['user_id'], $titre, $message]);
    }

    $db->commit();

    if (!empty($domiciliation['user_id'])) {
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
    }

    Response::success([
        'message' => 'Domiciliation activee avec succes',
        'id' => $data['domiciliation_id'],
        'transaction_id' => $transactionId ?? null,
        'reference' => $reference ?? null
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Activate domiciliation error: " . $e->getMessage());
    Response::serverError();
}
