<?php

/**
 * API: Mettre à jour une demande de domiciliation
 * PUT /api/domiciliations/update.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        Response::error("ID requis", 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Vérifier que la demande appartient à l'utilisateur ou qu'il est admin
    $query = "SELECT user_id FROM domiciliations WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    $demande = $stmt->fetch();

    if (!$demande) {
        Response::error("Demande non trouvée", 404);
    }

    if ($auth['role'] !== 'admin' && $demande['user_id'] !== $auth['id']) {
        Response::error("Accès refusé", 403);
    }

    // Construire la requête UPDATE dynamiquement
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

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    Response::success(null, "Demande mise à jour avec succès");

} catch (Exception $e) {
    error_log("Update domiciliation error: " . $e->getMessage());
    Response::serverError();
}
