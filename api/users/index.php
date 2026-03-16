<?php

/**
 * API: Liste des utilisateurs (Admin uniquement)
 * GET /api/users/index.php
 * GET /api/users/index.php?search=query
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Pagination.php';

try {
    Auth::requireAdmin();

    $db = Database::getInstance()->getConnection();

    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $whereClause = '';
    $params = [];

    if ($search !== '') {
        $whereClause = "WHERE (nom LIKE :s1 OR prenom LIKE :s2 OR email LIKE :s3 OR telephone LIKE :s4 OR entreprise LIKE :s5 OR CONCAT(prenom, ' ', nom) LIKE :s6 OR CONCAT(nom, ' ', prenom) LIKE :s7)";
        $searchParam = '%' . $search . '%';
        $params = [
            ':s1' => $searchParam,
            ':s2' => $searchParam,
            ':s3' => $searchParam,
            ':s4' => $searchParam,
            ':s5' => $searchParam,
            ':s6' => $searchParam,
            ':s7' => $searchParam,
        ];
    }

    $countQuery = "SELECT COUNT(*) FROM users $whereClause";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $pagination = Pagination::fromRequest();

    $query = "SELECT
                id, email, nom, prenom, telephone, role, statut,
                profession, entreprise, wilaya, commune,
                type_entreprise, nif, nis, registre_commerce,
                derniere_connexion, created_at, carte_identite_url
              FROM users
              $whereClause
              ORDER BY created_at DESC
              " . $pagination->getSqlLimit();

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $users = [];
    while ($row = $stmt->fetch()) {
        $users[] = $row;
    }

    Response::success($pagination->formatResponse($users, $total));

} catch (Exception $e) {
    error_log("Users list error: " . $e->getMessage());
    Response::serverError();
}
