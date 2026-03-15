<?php

/**
 * API: Authentification Google OAuth
 * POST /api/auth/google.php
 *
 * Recoit le credential (ID token) Google et cree/connecte l'utilisateur
 */

require_once __DIR__ . '/../bootstrap.php';

try {
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

    $validator = new Validator();
    $validator->validateRequired($data->credential ?? '', 'credential');

    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    $credential = $data->credential;

    $googleClientId = getenv('GOOGLE_CLIENT_ID') ?: '';
    if (empty($googleClientId)) {
        Logger::error('GOOGLE_CLIENT_ID not configured');
        Response::error("Configuration Google OAuth manquante", 500);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($credential));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        Logger::error('Google token verification curl error', ['error' => $curlError]);
        Response::error("Impossible de vérifier le token Google", 500);
    }

    if ($httpCode !== 200) {
        Response::error("Token Google invalide", 401);
    }

    $googleData = json_decode($response, true);

    if (!$googleData || !isset($googleData['email']) || !isset($googleData['sub'])) {
        Response::error("Réponse Google invalide", 401);
    }

    $emailVerified = $googleData['email_verified'];
    if (empty($emailVerified) || $emailVerified === false || $emailVerified === 'false' || $emailVerified === '0') {
        Response::error("L'email Google doit être vérifié", 401);
    }

    if ($googleData['aud'] !== $googleClientId) {
        Logger::warning('Google token audience mismatch', [
            'expected' => $googleClientId,
            'received' => $googleData['aud'] ?? 'missing'
        ]);
        Response::error("Token Google invalide pour cette application", 401);
    }

    $googleId = $googleData['sub'];
    $email = $googleData['email'];
    $prenom = $googleData['given_name'] ?? '';
    $nom = $googleData['family_name'] ?? '';

    $db = Database::getInstance()->getConnection();

    $query = "SELECT id, email, nom, prenom, role, statut, code_parrainage, credit, google_id
              FROM users
              WHERE email = :email OR google_id = :google_id
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':email' => $email,
        ':google_id' => $googleId
    ]);

    $user = $stmt->fetch();
    $isNewUser = false;

    if ($user) {
        if ($user['statut'] !== 'actif') {
            Response::error("Compte inactif ou suspendu", 403);
        }

        if ($user['role'] === 'admin') {
            Response::error("Les comptes administrateur doivent utiliser la connexion par email et mot de passe", 403);
        }

        if (empty($user['google_id'])) {
            $updateQuery = "UPDATE users SET google_id = :google_id, derniere_connexion = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([
                ':google_id' => $googleId,
                ':id' => $user['id']
            ]);
        } else {
            $updateQuery = "UPDATE users SET derniere_connexion = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([':id' => $user['id']]);
        }

        $userId = $user['id'];
        $userRole = $user['role'];
        $codeParrainage = $user['code_parrainage'];
        $credit = (float)($user['credit'] ?? 0);

    } else {
        $isNewUser = true;
        $userId = UuidHelper::generate();

        $codeParrainage = 'CPF' . strtoupper(substr(str_replace('-', '', $userId), 0, 6));

        $checkQuery = "SELECT id FROM users WHERE code_parrainage = :code LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([':code' => $codeParrainage]);

        while ($checkStmt->rowCount() > 0) {
            $codeParrainage = 'CPF' . strtoupper(bin2hex(random_bytes(3)));
            $checkStmt->execute([':code' => $codeParrainage]);
        }

        $insertQuery = "INSERT INTO users (
            id, email, nom, prenom, google_id, role, statut,
            code_parrainage, credit, derniere_connexion
        ) VALUES (
            :id, :email, :nom, :prenom, :google_id, 'user', 'actif',
            :code_parrainage, 0, NOW()
        )";

        $insertStmt = $db->prepare($insertQuery);
        $result = $insertStmt->execute([
            ':id' => $userId,
            ':email' => $email,
            ':nom' => $nom,
            ':prenom' => $prenom,
            ':google_id' => $googleId,
            ':code_parrainage' => $codeParrainage
        ]);

        if (!$result) {
            Logger::error('Failed to insert Google user', ['email' => $email]);
            Response::error("Erreur lors de la création du compte", 500);
        }

        $parrainage_id = UuidHelper::generate();
        $pQuery = "INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales)
                   VALUES (:id, :parrain_id, :code_parrain, 0, 0)";
        $pStmt = $db->prepare($pQuery);
        $pStmt->execute([
            ':id' => $parrainage_id,
            ':parrain_id' => $userId,
            ':code_parrain' => $codeParrainage
        ]);

        $userRole = 'user';
        $credit = 0;

        try {
            Mailer::sendWelcomeEmail($email, $prenom . ' ' . $nom);
        } catch (Exception $e) {
            Logger::error('Failed to send welcome email for Google user', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
        }

        try {
            AdminNotifier::newUser($prenom . ' ' . $nom, $email);
        } catch (Exception $e) {
            Logger::error('Failed to send admin notification for Google user', [
                'error' => $e->getMessage()
            ]);
        }
    }

    $token = Auth::generateToken($userId, $email, $userRole);
    $refreshToken = Auth::generateRefreshToken($userId, $email, $userRole);

    RateLimiter::clear($rateLimitKey);

    Response::success([
        'token' => $token,
        'refreshToken' => $refreshToken,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'nom' => $user ? $user['nom'] : $nom,
            'prenom' => $user ? $user['prenom'] : $prenom,
            'role' => $userRole,
            'codeParrainage' => $codeParrainage,
            'credit' => $credit
        ]
    ], $isNewUser ? "Compte créé avec succès" : "Connexion réussie");

} catch (PDOException $e) {
    Logger::error("Database error in Google auth", ['error' => $e->getMessage()]);
    Response::error("Erreur de base de données", 500);
} catch (Exception $e) {
    Logger::error("Google auth error", ['error' => $e->getMessage()]);
    Response::error("Erreur lors de l'authentification Google", 500);
}
