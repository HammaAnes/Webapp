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
    $email    = $googleData['email'];
    $prenom   = $googleData['given_name'] ?? '';
    $nom      = $googleData['family_name'] ?? '';

    // Chercher dans persons (users avec compte)
    $stmt = $db->prepare("
        SELECT id, email, nom, prenom, role, statut, google_id, code_parrainage, credit
        FROM persons
        WHERE (email = :email OR google_id = :google_id)
          AND role IS NOT NULL
        LIMIT 1
    ");
    $stmt->execute([':email' => $email, ':google_id' => $googleId]);
    $person = $stmt->fetch(PDO::FETCH_ASSOC);

    $isNewUser = false;

    if ($person) {
        if ($person['statut'] !== 'actif') {
            Response::error("Compte inactif ou suspendu", 403);
        }

        if ($person['role'] === 'admin') {
            Response::error("Les comptes administrateur doivent utiliser la connexion par email et mot de passe", 403);
        }

        if (empty($person['google_id'])) {
            $db->prepare("UPDATE persons SET google_id = :gid, derniere_connexion = NOW() WHERE id = :id")
               ->execute([':gid' => $googleId, ':id' => $person['id']]);
        } else {
            $db->prepare("UPDATE persons SET derniere_connexion = NOW() WHERE id = :id")
               ->execute([':id' => $person['id']]);
        }

        $userId         = $person['id'];
        $userRole       = $person['role'];
        $codeParrainage = $person['code_parrainage'];
        $credit         = (float)($person['credit'] ?? 0);

    } else {
        $isNewUser = true;
        $userId    = UuidHelper::generate();

        // Générer un code parrainage unique
        $codeParrainage = 'CPF' . strtoupper(substr(str_replace('-', '', $userId), 0, 6));
        $chkCode = $db->prepare("SELECT id FROM persons WHERE code_parrainage = ? LIMIT 1");
        $chkCode->execute([$codeParrainage]);
        while ($chkCode->fetch()) {
            $codeParrainage = 'CPF' . strtoupper(bin2hex(random_bytes(3)));
            $chkCode->execute([$codeParrainage]);
        }

        $db->beginTransaction();

        $db->prepare("
            INSERT INTO persons
              (id, email, nom, prenom, google_id, role, statut, source, crm_statut,
               code_parrainage, derniere_connexion, created_at, updated_at)
            VALUES
              (:id, :email, :nom, :prenom, :gid, 'user', 'actif', 'google', 'client',
               :code, NOW(), NOW(), NOW())
        ")->execute([
            ':id'    => $userId,
            ':email' => $email,
            ':nom'   => $nom,
            ':prenom'=> $prenom,
            ':gid'   => $googleId,
            ':code'  => $codeParrainage,
        ]);

        $db->prepare("
            INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales)
            VALUES (:id, :parrain_id, :code, 0, 0)
        ")->execute([
            ':id'        => UuidHelper::generate(),
            ':parrain_id'=> $userId,
            ':code'      => $codeParrainage,
        ]);

        $db->commit();

        $userRole = 'user';
        $credit   = 0;

        try {
            Mailer::sendWelcomeEmail($email, $prenom . ' ' . $nom, $codeParrainage, $email);
        } catch (Exception $e) {
            Logger::error('Failed to send welcome email for Google user', [
                'email' => $email, 'error' => $e->getMessage()
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

    $token        = Auth::generateToken($userId, $email, $userRole);
    $refreshToken = Auth::generateRefreshToken($userId, $email, $userRole);

    RateLimiter::clear($rateLimitKey);

    Response::success([
        'token'        => $token,
        'refreshToken' => $refreshToken,
        'user'         => [
            'id'             => $userId,
            'email'          => $email,
            'nom'            => $person ? $person['nom'] : $nom,
            'prenom'         => $person ? $person['prenom'] : $prenom,
            'role'           => $userRole,
            'codeParrainage' => $codeParrainage,
            'credit'         => $credit,
        ]
    ], $isNewUser ? "Compte créé avec succès" : "Connexion réussie");

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    Logger::error("Database error in Google auth", ['error' => $e->getMessage()]);
    Response::error("Erreur de base de données: " . $e->getMessage(), 500);
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    Logger::error("Google auth error", ['error' => $e->getMessage()]);
    Response::error("Erreur lors de l'authentification Google: " . $e->getMessage(), 500);
}
