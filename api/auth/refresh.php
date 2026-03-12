<?php

/**
 * API: Rafraîchir le token JWT
 * POST /api/auth/refresh.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->refreshToken)) {
        Response::error("Refresh token manquant", 400);
    }

    // Valider le refresh token
    $userData = Auth::validateToken($data->refreshToken);

    if (!$userData) {
        Response::error("Refresh token invalide ou expiré", 401);
    }

    // Vérifier que c'est bien un refresh token
    $decoded = json_decode(base64_decode(str_replace('_', '/', str_replace('-', '+', explode('.', $data->refreshToken)[1]))));

    if (!isset($decoded->type) || $decoded->type !== 'refresh') {
        Response::error("Token invalide", 401);
    }

    // Vérifier que l'utilisateur existe toujours et est actif
    $db = Database::getInstance()->getConnection();

    $query = "SELECT id, email, role, statut FROM users
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $userData->id]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::error("Utilisateur introuvable", 404);
    }

    if ($user['statut'] !== 'actif') {
        Response::error("Compte désactivé", 403);
    }

    // Générer de nouveaux tokens
    $newAccessToken = Auth::generateToken($user['id'], $user['email'], $user['role']);
    $newRefreshToken = Auth::generateRefreshToken($user['id'], $user['email'], $user['role']);

    Response::success([
        'token' => $newAccessToken,
        'refreshToken' => $newRefreshToken,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ], "Token rafraîchi avec succès");

} catch (Exception $e) {
    error_log("Refresh token error: " . $e->getMessage());
    Response::error("Erreur lors du rafraîchissement du token", 500);
}
