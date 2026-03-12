<?php

/**
 * API: Connexion utilisateur
 * POST /api/auth/login.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/UuidHelper.php';
require_once '../utils/Validator.php';
require_once '../utils/RateLimiter.php';

try {
    // Rate limiting basé sur IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitKey = 'login_' . $ip;

    $maxAttempts = (int)(getenv('RATE_LIMIT_MAX_ATTEMPTS') ?: 60);
    $decayMinutes = (int)(getenv('RATE_LIMIT_DECAY_MINUTES') ?: 1);

    if (RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts, $decayMinutes)) {
        $availableIn = RateLimiter::availableIn($rateLimitKey, $decayMinutes);
        Response::error(
            "Trop de tentatives de connexion. Réessayez dans " . ceil($availableIn / 60) . " minute(s).",
            429
        );
    }

    RateLimiter::hit($rateLimitKey);

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::validationError("Données JSON invalides");
    }

    // Utiliser la classe Validator
    $validator = new Validator();

    $validator->validateRequired($data->email ?? '', 'email');
    $validator->validateEmail($data->email ?? '', 'email');
    $validator->validateRequired($data->password ?? '', 'password');

    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    $db = Database::getInstance()->getConnection();

    $query = "SELECT id, email, password_hash, nom, prenom, role, statut, code_parrainage, credit
              FROM users
              WHERE email = :email
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Email ou mot de passe incorrect", 401);
    }

    $user = $stmt->fetch();

    if ($user['statut'] !== 'actif') {
        Response::error("Compte inactif ou suspendu", 403);
    }

    if (!Auth::verifyPassword($data->password, $user['password_hash'])) {
        Response::error("Email ou mot de passe incorrect", 401);
    }

    $token = Auth::generateToken($user['id'], $user['email'], $user['role']);
    $refreshToken = Auth::generateRefreshToken($user['id'], $user['email'], $user['role']);

    // Mettre à jour la dernière connexion
    $query = "UPDATE users SET derniere_connexion = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $user['id']]);

    // Connexion réussie - clear rate limit
    RateLimiter::clear($rateLimitKey);

    Response::success([
        'token' => $token,
        'refreshToken' => $refreshToken,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'nom' => $user['nom'],
            'prenom' => $user['prenom'],
            'role' => $user['role'],
            'codeParrainage' => $user['code_parrainage'],
            'credit' => (float)($user['credit'] ?? 0)
        ]
    ], "Connexion réussie");

} catch (PDOException $e) {
    error_log("Database error in login: " . $e->getMessage());
    Response::error("Erreur de base de données", 500);
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error("Erreur lors de la connexion", 500);
}
