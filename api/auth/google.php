<?php

/**
 * API: Authentification Google OAuth
 * POST /api/auth/google.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Validator.php';
require_once '../utils/RateLimiter.php';

try {
    // Rate limiting basé sur IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitKey = 'google_auth_' . $ip;

    $maxAttempts = (int)(getenv('RATE_LIMIT_MAX_ATTEMPTS') ?: 60);
    $decayMinutes = (int)(getenv('RATE_LIMIT_DECAY_MINUTES') ?: 1);

    if (RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts, $decayMinutes)) {
        $availableIn = RateLimiter::availableIn($rateLimitKey, $decayMinutes);
        Response::error(
            "Trop de tentatives. Réessayez dans " . ceil($availableIn / 60) . " minute(s).",
            429
        );
    }

    RateLimiter::hit($rateLimitKey);

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::validationError("Données JSON invalides");
    }

    // Valider le token Google
    $validator = new Validator();
    $validator->validateRequired($data->credential ?? '', 'credential');

    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    // Vérifier le token Google avec l'API Google
    $credential = $data->credential;

    // Décoder le JWT Google (c'est un JWT encodé en 3 parties)
    $parts = explode('.', $credential);
    if (count($parts) !== 3) {
        Response::error("Token Google invalide", 401);
    }

    // Décoder la partie payload (partie centrale)
    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

    if (!$payload || !isset($payload['email']) || !isset($payload['sub'])) {
        Response::error("Token Google invalide", 401);
    }

    // Vérifier que le token est bien émis par Google
    if (!isset($payload['iss']) || !in_array($payload['iss'], ['accounts.google.com', 'https://accounts.google.com'])) {
        Response::error("Token Google invalide - émetteur non reconnu", 401);
    }

    // Vérifier que le token n'est pas expiré
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        Response::error("Token Google expiré", 401);
    }

    $googleId = $payload['sub'];
    $email = $payload['email'];
    $emailVerified = $payload['email_verified'] ?? false;
    $prenom = $payload['given_name'] ?? '';
    $nom = $payload['family_name'] ?? '';
    $picture = $payload['picture'] ?? null;

    if (!$emailVerified) {
        Response::error("L'email Google doit être vérifié", 401);
    }

    $db = Database::getInstance()->getConnection();

    // Vérifier si l'utilisateur existe déjà avec cet email
    $query = "SELECT id, email, nom, prenom, role, statut, code_parrainage, credit, google_id
              FROM users
              WHERE email = :email
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $user = $stmt->fetch();

    if ($user) {
        // Utilisateur existant
        if ($user['statut'] !== 'actif') {
            Response::error("Compte inactif ou suspendu", 403);
        }

        // Mettre à jour le google_id si ce n'est pas déjà fait
        if (empty($user['google_id'])) {
            $updateQuery = "UPDATE users SET google_id = :google_id WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([
                ':google_id' => $googleId,
                ':id' => $user['id']
            ]);
        }

        $userId = $user['id'];
        $userRole = $user['role'];
        $codeParrainage = $user['code_parrainage'];
        $credit = (float)($user['credit'] ?? 0);

    } else {
        // Nouvel utilisateur - création automatique

        // Générer un code de parrainage unique
        $codeParrainage = 'COFFICE-' . strtoupper(substr($prenom, 0, 3) . substr($nom, 0, 3) . rand(100, 999));

        // Vérifier l'unicité du code
        $checkQuery = "SELECT id FROM users WHERE code_parrainage = :code LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([':code' => $codeParrainage]);

        while ($checkStmt->rowCount() > 0) {
            $codeParrainage = 'COFFICE-' . strtoupper(substr($prenom, 0, 3) . substr($nom, 0, 3) . rand(100, 999));
            $checkStmt->execute([':code' => $codeParrainage]);
        }

        // Insérer le nouvel utilisateur
        $insertQuery = "INSERT INTO users (
            email, nom, prenom, google_id, role, statut, code_parrainage, credit, created_at
        ) VALUES (
            :email, :nom, :prenom, :google_id, 'user', 'actif', :code_parrainage, 0, NOW()
        )";

        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->execute([
            ':email' => $email,
            ':nom' => $nom,
            ':prenom' => $prenom,
            ':google_id' => $googleId,
            ':code_parrainage' => $codeParrainage
        ]);

        $userId = $db->lastInsertId();
        $userRole = 'user';
        $credit = 0;
    }

    // Mettre à jour la dernière connexion
    $query = "UPDATE users SET derniere_connexion = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $userId]);

    // Générer les tokens JWT
    $token = Auth::generateToken($userId, $email, $userRole);
    $refreshToken = Auth::generateRefreshToken($userId, $email, $userRole);

    // Connexion réussie - clear rate limit
    RateLimiter::clear($rateLimitKey);

    Response::success([
        'token' => $token,
        'refreshToken' => $refreshToken,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'nom' => $nom,
            'prenom' => $prenom,
            'role' => $userRole,
            'codeParrainage' => $codeParrainage,
            'credit' => $credit
        ],
        'isNewUser' => !$user
    ], $user ? "Connexion réussie" : "Compte créé avec succès");

} catch (PDOException $e) {
    error_log("Database error in Google auth: " . $e->getMessage());
    Response::error("Erreur de base de données", 500);
} catch (Exception $e) {
    error_log("Google auth error: " . $e->getMessage());
    Response::error("Erreur lors de l'authentification Google", 500);
}
