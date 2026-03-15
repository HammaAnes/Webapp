<?php

/**
 * API: Créer une demande de domiciliation
 * POST /api/domiciliations/create.php
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::verifyAuth();

    $data = json_decode(file_get_contents("php://input"));

    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        Response::error("Données JSON invalides", 400);
    }

    $rules = require __DIR__ . '/../config/business-rules.php';
    $reglesDom = $rules['domiciliation'];
    $reglesIds  = $rules['identifiants_fiscaux'];

    if (empty($data->raison_sociale) && empty($data->forme_juridique)) {
        Response::error("Raison sociale ou forme juridique requise", 400);
    }

    if (!empty($data->raison_sociale) && strlen($data->raison_sociale) > $reglesIds['raison_sociale_longueur_max']) {
        Response::error("La raison sociale ne peut pas dépasser " . $reglesIds['raison_sociale_longueur_max'] . " caractères", 400);
    }

    if (!empty($data->nif)) {
        $nif = trim($data->nif);
        if (strlen($nif) !== $reglesIds['nif_longueur'] || !ctype_digit($nif)) {
            Response::error("Le NIF doit contenir exactement " . $reglesIds['nif_longueur'] . " chiffres", 400);
        }
    }

    if (!empty($data->nis)) {
        $nis = trim($data->nis);
        if (strlen($nis) !== $reglesIds['nis_longueur'] || !ctype_digit($nis)) {
            Response::error("Le NIS doit contenir exactement " . $reglesIds['nis_longueur'] . " chiffres", 400);
        }
    }

    if (!empty($data->registre_commerce) && strlen($data->registre_commerce) > $reglesIds['registre_longueur_max']) {
        Response::error("Le numéro de registre de commerce ne peut pas dépasser " . $reglesIds['registre_longueur_max'] . " caractères", 400);
    }

    if (!empty($data->representant_email) && !filter_var($data->representant_email, FILTER_VALIDATE_EMAIL)) {
        Response::error("L'email du représentant légal n'est pas valide", 400);
    }

    if (!empty($data->representant_telephone)) {
        $tel = preg_replace('/[\s\-\(\)]/', '', $data->representant_telephone);
        $algerien = '/^(\+213|0)?[5-7][0-9]{8}$/';
        $francais = '/^(\+33|0)[1-9][0-9]{8}$/';
        if (!preg_match($algerien, $tel) && !preg_match($francais, $tel)) {
            Response::error("Le numéro de téléphone du représentant n'est pas valide", 400);
        }
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $target_user_id = null;
    $target_contact_id = null;
    $is_admin_creation = false;

    if ($auth['role'] === 'admin') {
        $is_admin_creation = true;

        if (!empty($data->user_id) && !empty($data->contact_id)) {
            Response::error("Une domiciliation ne peut être liée qu'à un utilisateur OU un contact, pas les deux", 400);
        }

        if (!empty($data->user_id)) {
            $target_user_id = $data->user_id;

            $query = "SELECT id FROM users WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->execute([':user_id' => $target_user_id]);
            if (!$stmt->fetch()) {
                Response::error("Utilisateur introuvable", 404);
            }
        } elseif (!empty($data->contact_id)) {
            $target_contact_id = $data->contact_id;

            $query = "SELECT id FROM contacts WHERE id = :contact_id";
            $stmt = $db->prepare($query);
            $stmt->execute([':contact_id' => $target_contact_id]);
            if (!$stmt->fetch()) {
                Response::error("Contact introuvable", 404);
            }
        } else {
            Response::error("Un utilisateur ou un contact est requis", 400);
        }
    } else {
        $target_user_id = $auth['id'];
    }

    if (!$is_admin_creation) {
        $query = "SELECT id FROM domiciliations
                  WHERE user_id = :user_id
                  AND statut IN ('dossier_preparatoire', 'en_attente_signature', 'domiciliation_creee', 'en_attente_complements', 'active')";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $target_user_id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::error("Vous avez déjà une demande de domiciliation en cours ou active", 400);
        }
    }

    if (!empty($data->nif)) {
        $stmt = $db->prepare("SELECT id FROM domiciliations WHERE nif = :nif AND statut NOT IN ('refusee','resiliee','expiree') LIMIT 1");
        $stmt->execute([':nif' => $data->nif]);
        if ($stmt->fetch()) {
            Response::error("Une domiciliation existe déjà avec ce NIF (" . $data->nif . ")", 409);
        }
    }

    if (!empty($data->registre_commerce)) {
        $stmt = $db->prepare("SELECT id FROM domiciliations WHERE registre_commerce = :rc AND statut NOT IN ('refusee','resiliee','expiree') LIMIT 1");
        $stmt->execute([':rc' => $data->registre_commerce]);
        if ($stmt->fetch()) {
            Response::error("Une domiciliation existe déjà avec ce registre de commerce (" . $data->registre_commerce . ")", 409);
        }
    }

    $id = UuidHelper::generate();

    $statut_initial = $is_admin_creation && !empty($data->statut) ? $data->statut : 'dossier_preparatoire';

    $options_json = null;
    if (isset($data->options)) {
        $options_json = is_string($data->options) ? $data->options : json_encode($data->options);
    }

    $query = "INSERT INTO domiciliations
              (id, user_id, contact_id, situation_administrative, type_structure,
               raison_sociale, forme_juridique, capital,
               activite_principale, nif, nis, registre_commerce, article_imposition,
               numero_auto_entrepreneur, code_nae, activite_exercee, description_activite,
               wilaya, commune, adresse_actuelle,
               representant_nom, representant_prenom, representant_fonction, representant_telephone,
               representant_email, representant_adresse_residence, representant_ville,
               domaine_activite, adresse_siege_social,
               date_creation_entreprise, ville_immatriculation,
               numero_bureau, reference_contrat_notarie, date_debut_contrat, date_fin_contrat,
               options, cgu_acceptees, date_cgu_acceptation, date_debut_souhaitee,
               statut, montant_mensuel, date_debut, date_fin, notes_admin, commentaire_admin)
              VALUES
              (:id, :user_id, :contact_id, :situation_administrative, :type_structure,
               :raison_sociale, :forme_juridique, :capital,
               :activite_principale, :nif, :nis, :registre_commerce, :article_imposition,
               :numero_auto_entrepreneur, :code_nae, :activite_exercee, :description_activite,
               :wilaya, :commune, :adresse_actuelle,
               :representant_nom, :representant_prenom, :representant_fonction, :representant_telephone,
               :representant_email, :representant_adresse_residence, :representant_ville,
               :domaine_activite, :adresse_siege_social,
               :date_creation_entreprise, :ville_immatriculation,
               :numero_bureau, :reference_contrat_notarie, :date_debut_contrat, :date_fin_contrat,
               :options, :cgu_acceptees, :date_cgu_acceptation, :date_debut_souhaitee,
               :statut, :montant_mensuel, :date_debut, :date_fin, :notes_admin, :commentaire_admin)";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $id,
        ':user_id' => $target_user_id,
        ':contact_id' => $target_contact_id,
        ':situation_administrative' => $data->situation_administrative ?? 'deja_creee',
        ':type_structure' => $data->type_structure ?? 'societe',
        ':raison_sociale' => $data->raison_sociale ?? null,
        ':forme_juridique' => $data->forme_juridique ?? null,
        ':capital' => $data->capital ?? null,
        ':activite_principale' => $data->activite_principale ?? null,
        ':nif' => $data->nif ?? null,
        ':nis' => $data->nis ?? null,
        ':registre_commerce' => $data->registre_commerce ?? null,
        ':article_imposition' => $data->article_imposition ?? null,
        ':numero_auto_entrepreneur' => $data->numero_auto_entrepreneur ?? null,
        ':code_nae' => $data->code_nae ?? null,
        ':activite_exercee' => $data->activite_exercee ?? null,
        ':description_activite' => $data->description_activite ?? null,
        ':wilaya' => $data->wilaya ?? null,
        ':commune' => $data->commune ?? null,
        ':adresse_actuelle' => $data->adresse_actuelle ?? null,
        ':representant_nom' => $data->representant_nom ?? null,
        ':representant_prenom' => $data->representant_prenom ?? null,
        ':representant_fonction' => $data->representant_fonction ?? null,
        ':representant_telephone' => $data->representant_telephone ?? null,
        ':representant_email' => $data->representant_email ?? null,
        ':representant_adresse_residence' => $data->representant_adresse_residence ?? null,
        ':representant_ville' => $data->representant_ville ?? null,
        ':domaine_activite' => $data->domaine_activite ?? null,
        ':adresse_siege_social' => $data->adresse_siege_social ?? null,
        ':date_creation_entreprise' => $data->date_creation_entreprise ?? null,
        ':ville_immatriculation' => $data->ville_immatriculation ?? null,
        ':numero_bureau' => $data->numero_bureau ?? null,
        ':reference_contrat_notarie' => $data->reference_contrat_notarie ?? null,
        ':date_debut_contrat' => $data->date_debut_contrat ?? null,
        ':date_fin_contrat' => $data->date_fin_contrat ?? null,
        ':options' => $options_json,
        ':cgu_acceptees' => !empty($data->cgu_acceptees) ? 1 : 0,
        ':date_cgu_acceptation' => !empty($data->cgu_acceptees) ? date('Y-m-d H:i:s') : null,
        ':date_debut_souhaitee' => $data->date_debut_souhaitee ?? null,
        ':statut' => $statut_initial,
        ':montant_mensuel' => $data->montant_mensuel ?? 12000,
        ':date_debut' => $data->date_debut ?? null,
        ':date_fin' => $data->date_fin ?? null,
        ':notes_admin' => $data->notes_admin ?? null,
        ':commentaire_admin' => $data->commentaire_admin ?? null
    ]);

    if ($is_admin_creation && $target_user_id && in_array($statut_initial, ['active', 'domiciliation_creee']) && !empty($data->montant_mensuel)) {
        $montant_mensuel = floatval($data->montant_mensuel);
        $mois = 6;
        if (!empty($data->date_debut_contrat) && !empty($data->date_fin_contrat)) {
            $debut = new DateTime($data->date_debut_contrat);
            $fin = new DateTime($data->date_fin_contrat);
            $diff = $debut->diff($fin);
            $mois = max(1, $diff->m + ($diff->y * 12));
        }
        $montant_total = $montant_mensuel * $mois;

        $transaction_id = UuidHelper::generate();
        $transQuery = "INSERT INTO transactions
                  (id, user_id, type, montant, statut, mode_paiement, reference, description, date_paiement)
                  VALUES
                  (:id, :user_id, 'domiciliation', :montant, 'completee', :mode_paiement, :reference, :description, NOW())";

        $transStmt = $db->prepare($transQuery);
        $transStmt->execute([
            ':id' => $transaction_id,
            ':user_id' => $target_user_id,
            ':montant' => $montant_total,
            ':mode_paiement' => $data->mode_paiement ?? 'cash',
            ':reference' => 'DOM-' . date('YmdHis'),
            ':description' => 'Domiciliation ' . $mois . ' mois - ' . ($data->raison_sociale ?? '')
        ]);
    }

    try {
        $userStmt = $db->prepare("SELECT prenom, nom, email FROM users WHERE id = ?");
        $userStmt->execute([$target_user_id]);
        $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($userRow) {
            if (!$is_admin_creation) {
                AdminNotifier::newDomiciliation(
                    $data->raison_sociale ?? '',
                    $userRow['prenom'] . ' ' . $userRow['nom'],
                    $userRow['email']
                );
                Mailer::sendDomiciliationStatus($userRow['email'], 'dossier_preparatoire', [
                    'raison_sociale' => $data->raison_sociale ?? '',
                    'id' => $id,
                    'prenom' => $userRow['prenom'],
                    'nom' => $userRow['nom'],
                ]);
            }
        }
    } catch (Exception $notifErr) {
        error_log("Notification error: " . $notifErr->getMessage());
    }

    Response::success(['id' => $id], "Demande de domiciliation créée avec succès", 201);

} catch (Exception $e) {
    error_log("Create domiciliation error: " . $e->getMessage());
    Response::serverError();
}
