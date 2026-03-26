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
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitKey = 'login_' . $ip;

    $maxAttempts  = (int)(getenv('RATE_LIMIT_MAX_ATTEMPTS') ?: 60);
    $decayMinutes = (int)(getenv('RATE_LIMIT_DECAY_MINUTES') ?: 1);

    if (RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts, $decayMinutes)) {
        $availableIn = RateLimiter::availableIn($rateLimitKey, $decayMinutes);
        Response::error(
            "Trop de tentatives de connexion. Réessayez dans " . ceil($availableIn / 60) . " minute(s).",
            429
        );
    }

    RateLimiter::hit($rateLimitKey);

    $data = json_decode(file_get_contents("php://input"));
    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::validationError("Données JSON invalides");
    }

    $validator = new Validator();
    $validator->validateRequired($data->email ?? '', 'email');
    $validator->validateEmail($data->email ?? '', 'email');
    $validator->validateRequired($data->password ?? '', 'password');
    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    $db = Database::getInstance()->getConnection();

    $data->email = strtolower(trim($data->email));

    $stmt = $db->prepare("
        SELECT id, email, password_hash, nom, prenom, role, statut, code_parrainage, credit
        FROM persons
        WHERE LOWER(email) = :email
          AND role IS NOT NULL
          AND password_hash IS NOT NULL
        LIMIT 1
    ");
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Email ou mot de passe incorrect", 401);
    }

    $person = $stmt->fetch();

    if ($person['statut'] !== 'actif') {
        Response::error("Compte inactif ou suspendu", 403);
    }

    if (!Auth::verifyPassword($data->password, $person['password_hash'])) {
        Response::error("Email ou mot de passe incorrect", 401);
    }

    $db->prepare("UPDATE persons SET derniere_connexion = NOW() WHERE id = :id")
       ->execute([':id' => $person['id']]);

    RateLimiter::clear($rateLimitKey);

    $token        = Auth::generateToken($person['id'], $person['email'], $person['role']);
    $refreshToken = Auth::generateRefreshToken($person['id'], $person['email'], $person['role']);

    Response::success([
        'token'        => $token,
        'refreshToken' => $refreshToken,
        'user' => [
            'id'             => $person['id'],
            'email'          => $person['email'],
            'nom'            => $person['nom'],
            'prenom'         => $person['prenom'],
            'role'           => $person['role'],
            'codeParrainage' => $person['code_parrainage'],
            'credit'         => (float)($person['credit'] ?? 0),
        ],
    ], "Connexion réussie");

} catch (PDOException $e) {
    error_log("Database error in login: " . $e->getMessage());
    Response::error("Erreur de base de données", 500);
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error("Erreur lors de la connexion", 500);
}
