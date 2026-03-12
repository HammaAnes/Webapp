<?php

/**
 * API: Liste des abonnements
 * GET /api/abonnements/index.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';

try {
    $db = Database::getInstance()->getConnection();

    // Paramètres de filtrage
    $actif = isset($_GET['actif']) ? (int)$_GET['actif'] : null;
    $statut = isset($_GET['statut']) ? $_GET['statut'] : null;

    // Construction de la requête
    $where = [];
    $params = [];

    if ($actif !== null) {
        $where[] = "actif = :actif";
        $params[':actif'] = $actif;
    }

    if ($statut) {
        $where[] = "statut = :statut";
        $params[':statut'] = $statut;
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $query = "SELECT * FROM abonnements $whereClause ORDER BY ordre ASC, created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $abonnements = $stmt->fetchAll();

    // Décoder les JSON
    foreach ($abonnements as &$abonnement) {
        if (!empty($abonnement['avantages'])) {
            $abonnement['avantages'] = json_decode($abonnement['avantages'], true);
        }
    }

    Response::success($abonnements);

} catch (Exception $e) {
    error_log("Get abonnements error: " . $e->getMessage());
    Response::serverError("Erreur lors de la récupération des abonnements");
}
