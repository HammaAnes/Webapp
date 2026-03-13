<?php

/**
 * API: Google OAuth Callback
 * POST /api/auth/google-callback.php
 *
 * Reçoit le token Google ID et crée/connecte l'utilisateur
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Validator.php';

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::validationError("Données JSON invalides");
    }

    $validator = new Validator();
    $validator->validateRequired($data->idToken ?? '', 'idToken');

    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    // Vérifier le token Google avec l'API Google
    $googleClientId = getenv('GOOGLE_CLIENT_ID') ?: '';

    if (empty($googleClientId)) {
        Response::error("Configuration Google OAuth manquante", 500);
    }

    // Vérifier le token ID avec Google
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($data->idToken));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        Response::error("Token Google invalide", 401);
    }

    $googleData = json_decode($response, true);

    if (!$googleData || !isset($googleData['email']) || !isset($googleData['email_verified'])) {
        Response::error("Réponse Google invalide", 401);
    }

    if (!$googleData['email_verified']) {
        Response::error("Email Google non vérifié", 401);
    }

    // Vérifier que le token appartient à notre application
    if ($googleData['aud'] !== $googleClientId) {
        Response::error("Token Google invalide pour cette application", 401);
    }

    $email = $googleData['email'];
    $googleId = $googleData['sub'];
    $nom = $googleData['family_name'] ?? '';
    $prenom = $googleData['given_name'] ?? '';
    $picture = $googleData['picture'] ?? null;

    $db = Database::getInstance()->getConnection();

    // Vérifier si l'utilisateur existe déjà (par email ou google_id)
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

    if ($user) {
        // Utilisateur existant
        if ($user['statut'] !== 'actif') {
            Response::error("Compte inactif ou suspendu", 403);
        }

        // Mettre à jour google_id si manquant
        if (empty($user['google_id'])) {
            $updateQuery = "UPDATE users SET google_id = :google_id, derniere_connexion = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([
                ':google_id' => $googleId,
                ':id' => $user['id']
            ]);
        } else {
            // Mettre à jour seulement la dernière connexion
            $updateQuery = "UPDATE users SET derniere_connexion = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([':id' => $user['id']]);
        }

        $userId = $user['id'];
        $userRole = $user['role'];
    } else {
        // Créer un nouvel utilisateur
        $codeParrainage = 'COFFICE-' . strtoupper(substr(md5($email . time()), 0, 6));

        $insertQuery = "INSERT INTO users (
            email, nom, prenom, google_id, code_parrainage, role, statut,
            date_inscription, derniere_connexion
        ) VALUES (
            :email, :nom, :prenom, :google_id, :code_parrainage, 'user', 'actif',
            NOW(), NOW()
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

        // Récupérer l'utilisateur nouvellement créé
        $query = "SELECT id, email, nom, prenom, role, statut, code_parrainage, credit
                  FROM users WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();
    }

    // Générer les tokens JWT
    $token = Auth::generateToken($userId, $email, $userRole);
    $refreshToken = Auth::generateRefreshToken($userId, $email, $userRole);

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
    ], "Connexion Google réussie");

} catch (PDOException $e) {
    error_log("Database error in Google callback: " . $e->getMessage());
    Response::error("Erreur de base de données", 500);
} catch (Exception $e) {
    error_log("Google OAuth error: " . $e->getMessage());
    Response::error("Erreur lors de la connexion Google", 500);
}
