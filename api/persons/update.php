<?php

/**
 * API: Mettre à jour une personne
 * PUT /api/persons/update.php?id=xxx
 *
 * Un utilisateur peut modifier ses propres infos.
 * Un admin peut tout modifier (role, statut inclus).
 */

require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'])) {
    Response::error('Méthode non autorisée', 405);
}

try {
    $personId = $_GET['id'] ?? null;
    if (!$personId) {
        Response::error('ID manquant', 400);
    }

    // Accès : soi-même ou admin
    if ($auth['role'] !== 'admin' && $auth['id'] !== $personId) {
        Response::error('Accès refusé', 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        Response::error('Données JSON invalides', 400);
    }

    // Vérifier que la personne existe
    $chk = $db->prepare("SELECT id FROM persons WHERE id = ?");
    $chk->execute([$personId]);
    if (!$chk->fetch()) {
        Response::error('Personne non trouvée', 404);
    }

    // Champs accessibles à tous (soi-même)
    $allowedFields = [
        'nom'                      => 'nom',
        'prenom'                   => 'prenom',
        'telephone'                => 'telephone',
        'avatar'                   => 'avatar',
        'carte_identite_url'       => 'carte_identite_url',
        'carteIdentiteUrl'         => 'carte_identite_url',
        'profession'               => 'profession',
        'entreprise'               => 'entreprise',
        'adresse'                  => 'adresse',
        'bio'                      => 'bio',
        'wilaya'                   => 'wilaya',
        'commune'                  => 'commune',
        'type_entreprise'          => 'type_entreprise',
        'typeEntreprise'           => 'type_entreprise',
        'nif'                      => 'nif',
        'nis'                      => 'nis',
        'registre_commerce'        => 'registre_commerce',
        'registreCommerce'         => 'registre_commerce',
        'article_imposition'       => 'article_imposition',
        'articleImposition'        => 'article_imposition',
        'numero_auto_entrepreneur' => 'numero_auto_entrepreneur',
        'numeroAutoEntrepreneur'   => 'numero_auto_entrepreneur',
        'raison_sociale'           => 'raison_sociale',
        'raisonSociale'            => 'raison_sociale',
        'date_creation_entreprise' => 'date_creation_entreprise',
        'dateCreationEntreprise'   => 'date_creation_entreprise',
        'capital'                  => 'capital',
        'siege_social'             => 'siege_social',
        'siegeSocial'              => 'siege_social',
        'activite_principale'      => 'activite_principale',
        'activitePrincipale'       => 'activite_principale',
    ];

    // Champs admin uniquement
    if ($auth['role'] === 'admin') {
        $allowedFields['role']        = 'role';
        $allowedFields['statut']      = 'statut';
        $allowedFields['crm_statut']  = 'crm_statut';
        $allowedFields['crmStatut']   = 'crm_statut';
        $allowedFields['source']      = 'source';
        $allowedFields['notes']       = 'notes';
    }

    $sets   = [];
    $params = [':id' => $personId];

    foreach ($allowedFields as $inputKey => $dbCol) {
        if (!array_key_exists($inputKey, $data)) continue;
        $paramKey = ':' . $dbCol;
        if (isset($params[$paramKey])) continue; // éviter doublons camel/snake
        $value = $data[$inputKey];

        if ($dbCol === 'date_creation_entreprise' && $value) {
            $ts    = strtotime($value);
            $value = $ts !== false ? date('Y-m-d', $ts) : null;
        }
        if ($dbCol === 'capital' && $value !== null && $value !== '') {
            $value = floatval($value);
        }

        $sets[]          = "$dbCol = $paramKey";
        $params[$paramKey] = $value;
    }

    // Mot de passe (seulement admin ou soi-même)
    if (!empty($data['password'])) {
        $pwd = (string)$data['password'];
        if (strlen($pwd) < 8) {
            Response::error('Le mot de passe doit contenir au moins 8 caractères', 400);
        }
        $sets[]              = 'password_hash = :password_hash';
        $params[':password_hash'] = Auth::hashPassword($pwd);
    }

    if (empty($sets)) {
        Response::error('Aucune donnée à mettre à jour', 400);
    }

    $db->prepare("UPDATE persons SET " . implode(', ', $sets) . " WHERE id = :id")
       ->execute($params);

    Response::success(['id' => $personId], 'Personne mise à jour avec succès');

} catch (Exception $e) {
    error_log('persons/update error: ' . $e->getMessage());
    Response::error('Erreur: ' . $e->getMessage(), 500);
}
