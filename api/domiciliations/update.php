<?php

/**
 * API: Mettre à jour une demande de domiciliation
 * PUT /api/domiciliations/update.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Mailer.php';
require_once '../utils/UuidHelper.php';

try {
    $auth = Auth::verifyAuth();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        Response::error("ID requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $query = "SELECT user_id, statut FROM domiciliations WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    $demande = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$demande) {
        Response::error("Demande non trouvée", 404);
    }

    if ($auth['role'] !== 'admin' && $demande['user_id'] !== $auth['id']) {
        Response::error("Accès refusé", 403);
    }

    if (isset($data->statut) && $auth['role'] !== 'admin') {
        Response::error("Vous n'êtes pas autorisé à changer le statut d'une domiciliation", 403);
    }

    if (isset($data->statut) && $auth['role'] === 'admin') {
        $rules = require __DIR__ . '/../config/business-rules.php';
        $transitions = $rules['domiciliation']['transitions_statut_autorisees'];
        $statutActuel = $demande['statut'] ?? '';
        $nouveauStatut = $data->statut;

        if (!isset($transitions[$statutActuel]) || !in_array($nouveauStatut, $transitions[$statutActuel], true)) {
            Response::error(
                "Transition de statut invalide : impossible de passer de '$statutActuel' à '$nouveauStatut'",
                400
            );
        }
    }

    $updates = [];
    $params = [':id' => $data->id];

    $allowed_fields = [
        'statut', 'raison_sociale', 'forme_juridique', 'capital',
        'activite_principale', 'nif', 'nis', 'registre_commerce',
        'article_imposition', 'numero_auto_entrepreneur', 'wilaya', 'commune',
        'adresse_actuelle', 'representant_nom', 'representant_prenom',
        'representant_telephone', 'representant_email', 'montant_mensuel',
        'notes_admin', 'commentaire_admin', 'visible_sur_site', 'date_debut', 'date_fin',
        'situation_administrative', 'type_structure',
        'reference_contrat_notarie', 'date_debut_contrat', 'date_fin_contrat', 'numero_bureau',
        'code_nae', 'activite_exercee', 'description_activite',
        'representant_fonction', 'representant_adresse_residence', 'representant_ville',
        'date_validation', 'date_debut_souhaitee', 'ville_immatriculation',
        'domaine_activite', 'adresse_siege_social', 'date_creation_entreprise'
    ];

    foreach ($allowed_fields as $field) {
        if (isset($data->$field)) {
            $updates[] = "$field = :$field";
            $value = $data->$field;
            if ($field === 'options' && !is_string($value)) {
                $value = json_encode($value);
            }
            $params[":$field"] = $value;
        }
    }

    if (isset($data->options) && !isset($params[':options'])) {
        $updates[] = "options = :options";
        $params[':options'] = is_string($data->options) ? $data->options : json_encode($data->options);
    }

    if (isset($data->cgu_acceptees)) {
        $updates[] = "cgu_acceptees = :cgu_acceptees";
        $params[':cgu_acceptees'] = $data->cgu_acceptees ? 1 : 0;
    }

    if (empty($updates)) {
        Response::error("Aucune donnée à mettre à jour", 400);
    }

    $updates[] = "updated_at = NOW()";
    $query = "UPDATE domiciliations SET " . implode(', ', $updates) . " WHERE id = :id";

    $db->beginTransaction();

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    if (isset($data->statut) && $auth['role'] === 'admin' && !empty($demande['user_id'])) {
        $notifId = UuidHelper::generate();
        $notifStmt = $db->prepare("INSERT INTO notifications (id, user_id, type, titre, message, lue, created_at) VALUES (?, ?, 'domiciliation', ?, ?, 0, NOW())");
        $statusLabels = [
            'en_attente_signature' => 'Dossier validé — signature requise',
            'domiciliation_creee' => 'Domiciliation créée',
            'active' => 'Domiciliation activée',
            'refusee' => 'Demande refusée',
            'resiliee' => 'Domiciliation résiliée',
            'en_attente_complements' => 'Compléments requis',
        ];
        $titre = $statusLabels[$data->statut] ?? 'Mise à jour de votre domiciliation';
        $message = 'Le statut de votre domiciliation a été mis à jour : ' . ($statusLabels[$data->statut] ?? $data->statut);
        $notifStmt->execute([$notifId, $demande['user_id'], $titre, $message]);

        if ($data->statut === 'domiciliation_creee' && isset($data->montant_mensuel)) {
            $transactionId = UuidHelper::generate();
            $domForTx = $db->prepare("SELECT raison_sociale FROM domiciliations WHERE id = ?");
            $domForTx->execute([$data->id]);
            $domRow = $domForTx->fetch(PDO::FETCH_ASSOC);
            $reference = 'DOM-' . date('YmdHis') . '-' . substr($transactionId, 0, 8);
            $description = 'Signature domiciliation - ' . ($domRow['raison_sociale'] ?? '');
            $modePaiement = $data->mode_paiement ?? 'cash';
            $txStmt = $db->prepare("INSERT INTO transactions (id, user_id, type, montant, statut, mode_paiement, reference, description, date_paiement, created_at) VALUES (?, ?, 'domiciliation', ?, 'en_attente', ?, ?, ?, NOW(), NOW())");
            $txStmt->execute([$transactionId, $demande['user_id'], $data->montant_mensuel, $modePaiement, $reference, $description]);
        }
    }

    $db->commit();

    if (isset($data->statut) && $auth['role'] === 'admin' && !empty($demande['user_id'])) {
        try {
            $userStmt = $db->prepare("SELECT email, prenom, nom FROM users WHERE id = ?");
            $userStmt->execute([$demande['user_id']]);
            $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);
            if ($userRow) {
                $domStmt = $db->prepare("SELECT * FROM domiciliations WHERE id = ?");
                $domStmt->execute([$data->id]);
                $updatedDom = $domStmt->fetch(PDO::FETCH_ASSOC);
                if ($updatedDom) {
                    Mailer::sendDomiciliationStatus($userRow['email'], $data->statut, $updatedDom);
                }
            }
        } catch (Exception $notifErr) {
            error_log("Email notification error on domiciliation update: " . $notifErr->getMessage());
        }
    }

    Response::success(null, "Demande mise à jour avec succès");

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Update domiciliation error: " . $e->getMessage());
    Response::serverError();
}
