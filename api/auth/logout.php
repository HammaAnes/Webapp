<?php

/**
 * API: Déconnexion utilisateur
 * POST /api/auth/logout.php
 * Note: Avec JWT, la déconnexion est gérée côté client (suppression du token)
 * Cet endpoint permet de logger la déconnexion côté serveur
 */

require_once '../config/cors.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

try {
    // Vérifier l'authentification pour logger qui se déconnecte
    $user = Auth::getCurrentUser();

    if ($user) {
        // Logger la déconnexion
        error_log("User logout: {$user['email']} (ID: {$user['id']})");
    }

    Response::success(null, "Déconnexion réussie");

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    // Retourner success même en cas d'erreur car la déconnexion client doit fonctionner
    Response::success(null, "Déconnexion réussie");
}
