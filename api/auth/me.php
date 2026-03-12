<?php

/**
 * API: Obtenir l'utilisateur courant
 * GET /api/auth/me.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    // Vérifier l'authentification
    $auth = Auth::verifyAuth();

    // Récupérer les informations complètes de l'utilisateur
    $db = Database::getInstance()->getConnection();

    $query = "SELECT id, email, nom, prenom, telephone, role, statut, avatar,
                     profession, entreprise, adresse, bio, wilaya, commune,
                     type_entreprise, nif, nis, registre_commerce,
                     article_imposition, numero_auto_entrepreneur, raison_sociale,
                     date_creation_entreprise, capital, siege_social,
                     activite_principale, forme_juridique, code_parrainage, credit,
                     absences, banned_until, derniere_connexion, created_at, updated_at
              FROM users
              WHERE id = :id
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $auth['id']);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::unauthorized("Utilisateur non trouvé");
    }

    $user = $stmt->fetch();

    // Convertir snake_case en camelCase pour le frontend
    $userResponse = [
        'id' => $user['id'],
        'email' => $user['email'],
        'nom' => $user['nom'],
        'prenom' => $user['prenom'],
        'telephone' => $user['telephone'],
        'role' => $user['role'],
        'statut' => $user['statut'],
        'avatar' => $user['avatar'],
        'profession' => $user['profession'],
        'entreprise' => $user['entreprise'],
        'adresse' => $user['adresse'],
        'bio' => $user['bio'],
        'wilaya' => $user['wilaya'],
        'commune' => $user['commune'],
        'typeEntreprise' => $user['type_entreprise'],
        'nif' => $user['nif'],
        'nis' => $user['nis'],
        'registreCommerce' => $user['registre_commerce'],
        'articleImposition' => $user['article_imposition'],
        'numeroAutoEntrepreneur' => $user['numero_auto_entrepreneur'],
        'raisonSociale' => $user['raison_sociale'],
        'dateCreationEntreprise' => $user['date_creation_entreprise'],
        'capital' => $user['capital'],
        'siegeSocial' => $user['siege_social'],
        'activitePrincipale' => $user['activite_principale'],
        'formeJuridique' => $user['forme_juridique'],
        'codeParrainage' => $user['code_parrainage'],
        'credit' => (float)($user['credit'] ?? 0),
        'absences' => $user['absences'],
        'bannedUntil' => $user['banned_until'],
        'derniereConnexion' => $user['derniere_connexion'],
        'createdAt' => $user['created_at'],
        'updatedAt' => $user['updated_at']
    ];

    Response::success($userResponse);

} catch (Exception $e) {
    error_log("Get current user error: " . $e->getMessage());
    Response::serverError();
}
