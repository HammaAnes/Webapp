<?php

/**
 * API: Créer une demande de domiciliation
 * POST /api/domiciliations/create.php
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::verifyAuth();

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        Response::error("Données JSON invalides", 400);
    }

    $dataArr = json_decode($rawInput, true);

    $rules = require __DIR__ . '/../config/business-rules.php';
    $reglesDom = $rules['domiciliation'];
    $reglesIds  = $rules['identifiants_fiscaux'];

    if (($data->type_structure ?? 'societe') === 'societe' && empty($data->raison_sociale) && empty($data->forme_juridique)) {
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

    $target_person_id  = null;
    $is_admin_creation = false;

    if ($auth['role'] === 'admin') {
        $is_admin_creation = true;

        $target_person_id = $data->person_id ?? $data->user_id ?? null;
        if (empty($target_person_id)) {
            Response::error("Un utilisateur ou un contact est requis", 400);
        }

        $stmt = $db->prepare("SELECT id FROM persons WHERE id = :id");
        $stmt->execute([':id' => $target_person_id]);
        if (!$stmt->fetch()) {
            Response::error("Personne introuvable", 404);
        }
    } else {
        $target_person_id = $auth['id'];
    }

    $db->beginTransaction();

    // Plusieurs domiciliations (sociétés différentes) sont autorisées pour un même utilisateur.

    if (!empty($data->numero_bureau)) {
        $numBureau = intval($data->numero_bureau);
        if ($numBureau < 1 || $numBureau > 60) {
            $db->rollBack();
            Response::error("Le numéro de bureau doit être entre 1 et 60", 400);
        }
        $bureauStmt = $db->prepare("SELECT id FROM domiciliations WHERE numero_bureau = :bureau AND statut NOT IN ('refusee','resiliee','expiree') LIMIT 1 FOR UPDATE");
        $bureauStmt->execute([':bureau' => $numBureau]);
        if ($bureauStmt->fetch()) {
            $db->rollBack();
            Response::error("Le bureau N°$numBureau est déjà attribué à une domiciliation active", 409);
        }
    }

    if (!empty($data->nif)) {
        $stmt = $db->prepare("SELECT id FROM domiciliations WHERE nif = :nif AND statut NOT IN ('refusee','resiliee','expiree') LIMIT 1 FOR UPDATE");
        $stmt->execute([':nif' => $data->nif]);
        if ($stmt->fetch()) {
            $db->rollBack();
            Response::error("Une domiciliation existe déjà avec ce NIF", 409);
        }
    }

    if (!empty($data->registre_commerce)) {
        $stmt = $db->prepare("SELECT id FROM domiciliations WHERE registre_commerce = :rc AND statut NOT IN ('refusee','resiliee','expiree') LIMIT 1 FOR UPDATE");
        $stmt->execute([':rc' => $data->registre_commerce]);
        if ($stmt->fetch()) {
            $db->rollBack();
            Response::error("Une domiciliation existe déjà avec ce registre de commerce", 409);
        }
    }

    $id = UuidHelper::generate();

    $statut_initial = $is_admin_creation && !empty($data->statut) ? $data->statut : 'dossier_preparatoire';

    // Résoudre le montant mensuel avec fallback sur le défaut pour les domiciliations actives admin
    $montantMensuelResolu = isset($data->montant_mensuel) ? floatval($data->montant_mensuel) : null;
    if ($is_admin_creation && in_array($statut_initial, ['active', 'domiciliation_creee']) && $montantMensuelResolu === null) {
        $montantMensuelResolu = $reglesDom['montant_mensuel_defaut'];
    }

    $options_json = null;
    if (isset($data->options)) {
        $options_json = is_string($data->options) ? $data->options : json_encode($data->options);
    }

    $query = "INSERT INTO domiciliations
              (id, person_id, situation_administrative, type_structure,
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
              (:id, :person_id, :situation_administrative, :type_structure,
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
    $params = [
        ':id'        => $id,
        ':person_id' => $target_person_id,
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
        ':montant_mensuel' => $montantMensuelResolu,
        ':date_debut' => $data->date_debut ?? null,
        ':date_fin' => $data->date_fin ?? null,
        ':notes_admin' => $data->notes_admin ?? null,
        ':commentaire_admin' => $data->commentaire_admin ?? null,
    ];
    $stmt->execute($params);

    if ($is_admin_creation && $target_person_id && in_array($statut_initial, ['active', 'domiciliation_creee']) && $montantMensuelResolu > 0) {
        $montant_mensuel = $montantMensuelResolu;
        $mois = 6;
        if (!empty($data->date_debut_contrat) && !empty($data->date_fin_contrat)) {
            try {
                $debut = new DateTime($data->date_debut_contrat);
                $fin = new DateTime($data->date_fin_contrat);
                if ($fin > $debut) {
                    $diff = $debut->diff($fin);
                    $totalMonths = $diff->m + ($diff->y * 12);
                    if ($diff->d > 0) {
                        $totalMonths++;
                    }
                    $mois = max(1, $totalMonths);
                }
            } catch (Exception $dateErr) {
                error_log("Invalid contract dates: " . $dateErr->getMessage());
            }
        }
        $montant_total = $montant_mensuel * $mois;

        CaisseHelper::insert($db, [
            'domiciliation_id'  => $id,
            'person_id'         => $target_person_id,
            'type_transaction'  => 'domiciliation',
            'montant'           => $montant_total,
            'mode_paiement'     => $data->mode_paiement ?? 'cash',
            'statut'            => 'encaisse',
            'notes'             => 'Domiciliation ' . $mois . ' mois - ' . ($data->raison_sociale ?? ''),
        ]);
    }

    $db->commit();

    try {
        $userStmt = $db->prepare("SELECT prenom, nom, email FROM persons WHERE id = ?");
        $userStmt->execute([$target_person_id]);
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
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Create domiciliation error: " . $e->getMessage());
    Response::serverError("Erreur lors de la création : " . $e->getMessage());
}
