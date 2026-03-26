<?php

/**
 * API: Obtenir la personne connectée
 * GET /api/auth/me.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare("
        SELECT id, email, nom, prenom, telephone, role, statut, avatar,
               profession, entreprise, adresse, bio, wilaya, commune,
               type_entreprise, nif, nis, registre_commerce,
               article_imposition, numero_auto_entrepreneur, raison_sociale,
               date_creation_entreprise, capital, siege_social,
               activite_principale, code_parrainage, credit,
               absences, banned_until, derniere_connexion,
               created_at, updated_at, carte_identite_url
        FROM persons
        WHERE id = :id
          AND role IS NOT NULL
        LIMIT 1
    ");
    $stmt->bindParam(':id', $auth['id']);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::unauthorized("Utilisateur non trouvé");
    }

    $p = $stmt->fetch();

    if ($p['statut'] !== 'actif') {
        Response::error("Compte inactif ou suspendu", 403);
    }

    Response::success([
        'id'                     => $p['id'],
        'email'                  => $p['email'],
        'nom'                    => $p['nom'],
        'prenom'                 => $p['prenom'],
        'telephone'              => $p['telephone'],
        'role'                   => $p['role'],
        'statut'                 => $p['statut'],
        'avatar'                 => $p['avatar'],
        'profession'             => $p['profession'],
        'entreprise'             => $p['entreprise'],
        'adresse'                => $p['adresse'],
        'bio'                    => $p['bio'],
        'wilaya'                 => $p['wilaya'],
        'commune'                => $p['commune'],
        'typeEntreprise'         => $p['type_entreprise'],
        'nif'                    => $p['nif'],
        'nis'                    => $p['nis'],
        'registreCommerce'       => $p['registre_commerce'],
        'articleImposition'      => $p['article_imposition'],
        'numeroAutoEntrepreneur' => $p['numero_auto_entrepreneur'],
        'raisonSociale'          => $p['raison_sociale'],
        'dateCreationEntreprise' => $p['date_creation_entreprise'],
        'capital'                => $p['capital'],
        'siegeSocial'            => $p['siege_social'],
        'activitePrincipale'     => $p['activite_principale'],
        'codeParrainage'         => $p['code_parrainage'],
        'credit'                 => (float)($p['credit'] ?? 0),
        'absences'               => (int)($p['absences'] ?? 0),
        'bannedUntil'            => $p['banned_until'],
        'derniereConnexion'      => $p['derniere_connexion'],
        'createdAt'              => $p['created_at'],
        'updatedAt'              => $p['updated_at'],
        'carteIdentiteUrl'       => $p['carte_identite_url'],
    ]);

} catch (Exception $e) {
    error_log("Get current user error: " . $e->getMessage());
    Response::serverError();
}
