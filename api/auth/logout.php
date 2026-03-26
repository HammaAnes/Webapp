<?php

/**
 * API: Déconnexion utilisateur
 * POST /api/auth/logout.php
 * Note: Avec JWT, la déconnexion est gérée côté client (suppression du token)
 * Cet endpoint permet de logger la déconnexion côté serveur
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    // Vérifier l'authentification pour logger qui se déconnecte (optionnel)
    try {
        $user = Auth::verifyAuth();
        if ($user) {
            error_log("User logout: {$user['email']} (ID: {$user['id']})");
        }
    } catch (\Throwable $authErr) {
        // Token absent ou expiré — déconnexion quand même
    }

    Response::success(null, "Déconnexion réussie");

} catch (\Throwable $e) {
    error_log("Logout error: " . $e->getMessage());
    // Toujours retourner succès : la déconnexion côté client doit fonctionner
    Response::success(null, "Déconnexion réussie");
}
