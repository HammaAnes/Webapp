<?php

/**
 * API: Liste des utilisateurs (Admin uniquement)
 * GET /api/users/index.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Pagination.php';

try {
    // Vérifier que l'utilisateur est admin
    Auth::requireAdmin();

    $db = Database::getInstance()->getConnection();

    // Pagination
    $pagination = Pagination::fromRequest();
    $total = Pagination::countTotal($db, 'users');

    // Récupérer tous les utilisateurs
    $query = "SELECT
                id, email, nom, prenom, telephone, role, statut,
                profession, entreprise, wilaya, commune,
                type_entreprise, nif, nis, registre_commerce,
                derniere_connexion, created_at
              FROM users
              ORDER BY created_at DESC
              " . $pagination->getSqlLimit();

    $stmt = $db->prepare($query);
    $stmt->execute();

    $users = [];
    while ($row = $stmt->fetch()) {
        $users[] = $row;
    }

    Response::success($pagination->formatResponse($users, $total));

} catch (Exception $e) {
    error_log("Users list error: " . $e->getMessage());
    Response::serverError();
}
