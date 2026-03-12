<?php

/**
 * API: Détails d'un utilisateur
 * GET /api/users/show.php?id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    // Récupérer l'ID depuis query params
    $userId = $_GET['id'] ?? null;

    if (!$userId) {
        Response::error("ID utilisateur manquant", 400);
    }

    // Un utilisateur peut voir ses propres infos, ou l'admin peut voir tout
    if ($auth['role'] !== 'admin' && $auth['id'] !== $userId) {
        Response::error("Accès refusé", 403);
    }

    $db = Database::getInstance()->getConnection();

    $query = "SELECT
                id, email, nom, prenom, telephone, role, statut, avatar,
                profession, entreprise, adresse, bio, wilaya, commune,
                type_entreprise, nif, nis, registre_commerce,
                article_imposition, numero_auto_entrepreneur,
                raison_sociale, date_creation_entreprise, capital,
                siege_social, activite_principale, forme_juridique,
                derniere_connexion, created_at, updated_at
              FROM users
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Utilisateur non trouvé", 404);
    }

    $user = $stmt->fetch();
    Response::success($user);

} catch (Exception $e) {
    error_log("User show error: " . $e->getMessage());
    Response::serverError();
}
