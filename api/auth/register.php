<?php

/**
 * API: Inscription utilisateur
 * POST /api/auth/register.php
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::validationError("Données JSON invalides");
    }

    // Utiliser la classe Validator
    $validator = new Validator();

    $validator->validateRequired($data->email ?? '', 'email');
    $validator->validateEmail($data->email ?? '', 'email');
    $validator->validateRequired($data->password ?? '', 'password');
    $validator->validatePassword($data->password ?? '', 'password');
    $validator->validateRequired($data->nom ?? '', 'nom');
    $validator->validateMinLength($data->nom ?? '', 2, 'nom');
    $validator->validateRequired($data->prenom ?? '', 'prenom');
    $validator->validateMinLength($data->prenom ?? '', 2, 'prenom');

    // Validation téléphone si fourni
    if (!empty($data->telephone)) {
        $validator->validatePhone($data->telephone, 'telephone', false);
    }

    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    $db = Database::getInstance()->getConnection();

    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        error_log("Email already exists: " . $data->email);
        Response::conflict("Cet email est déjà utilisé");
    }

    error_log("Hashing password...");
    $password_hash = Auth::hashPassword($data->password);

    $user_id = UuidHelper::generate();
    error_log("Generated user ID: " . $user_id);

    $profession = $data->profession ?? null;
    $entreprise = $data->entreprise ?? null;

    // Générer le code de parrainage unique - format COFFICE-XXX000
    $prenomClean = preg_replace('/[^A-Za-z]/', '', $data->prenom);
    $prefix = strtoupper(substr(str_pad($prenomClean, 3, 'X'), 0, 3));
    $suffix = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
    $code_parrain = 'COFFICE-' . $prefix . $suffix;
    // Ensure uniqueness
    $checkStmt = $db->prepare("SELECT id FROM parrainages WHERE code_parrain = :code LIMIT 1");
    $checkStmt->execute([':code' => $code_parrain]);
    if ($checkStmt->rowCount() > 0) {
        $suffix = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        $code_parrain = 'COFFICE-' . $prefix . $suffix;
    }

    $query = "INSERT INTO users (id, email, password_hash, nom, prenom, telephone, profession, entreprise, code_parrainage, role, statut)
              VALUES (:id, :email, :password_hash, :nom, :prenom, :telephone, :profession, :entreprise, :code_parrainage, 'user', 'actif')";

    $stmt = $db->prepare($query);
    $result = $stmt->execute([
        ':id' => $user_id,
        ':email' => $data->email,
        ':password_hash' => $password_hash,
        ':nom' => $data->nom,
        ':prenom' => $data->prenom,
        ':telephone' => $data->telephone ?? null,
        ':profession' => $profession,
        ':entreprise' => $entreprise,
        ':code_parrainage' => $code_parrain
    ]);

    if (!$result) {
        error_log("Failed to insert user: " . print_r($stmt->errorInfo(), true));
        Response::error("Erreur lors de la création de l'utilisateur", 500);
    }

    error_log("User created successfully with code parrainage: " . $code_parrain);

    $parrainage_id = UuidHelper::generate();

    $query = "INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales)
              VALUES (:id, :parrain_id, :code_parrain, 0, 0)";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $parrainage_id,
        ':parrain_id' => $user_id,
        ':code_parrain' => $code_parrain
    ]);

    error_log("Parrainage code created: " . $code_parrain);

    // Traiter le code parrainage si fourni (support camelCase et snake_case pour rétrocompatibilité)
    $code_parrainage = $data->code_parrainage ?? $data->codeParrainage ?? null;
    if (!empty($code_parrainage)) {
        error_log("Processing referral code: " . $code_parrainage);

        $query = "SELECT id, parrain_id FROM parrainages
                  WHERE code_parrain = :code
                  LIMIT 1";

        $stmt = $db->prepare($query);
        $stmt->execute([':code' => $code_parrainage]);
        $parrainage = $stmt->fetch();

        if ($parrainage && $parrainage['parrain_id'] !== $user_id) {
            // Créditer le nouveau filleul avec 3000 DA
            $query = "UPDATE users SET credit = credit + 3000 WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->execute([':user_id' => $user_id]);

            // Incrémenter les compteurs du parrain
            $query = "UPDATE parrainages
                      SET parraines = parraines + 1,
                          recompenses_totales = recompenses_totales + 3000,
                          updated_at = NOW()
                      WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute([':id' => $parrainage['id']]);

            // Créditer aussi le parrain avec 3000 DA
            $query = "UPDATE users SET credit = credit + 3000 WHERE id = :parrain_id";
            $stmt = $db->prepare($query);
            $stmt->execute([':parrain_id' => $parrainage['parrain_id']]);

            // Créer une entrée dans parrainages_details
            $detail_id = UuidHelper::generate();
            $query = "INSERT INTO parrainages_details (id, parrainage_id, filleul_id, recompense_parrain, recompense_filleul, statut, date_inscription)
                      VALUES (:id, :parrainage_id, :filleul_id, 3000, 3000, 'en_attente', NOW())";
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':id' => $detail_id,
                ':parrainage_id' => $parrainage['id'],
                ':filleul_id' => $user_id
            ]);

            // Créer une notification pour le parrain
            $notif_id = UuidHelper::generate();
            $query = "INSERT INTO notifications (id, user_id, type, titre, message, lue)
                      VALUES (:id, :user_id, 'parrainage', 'Nouveau filleul !',
                              'Vous avez gagné 3 000 DA grâce à votre code de parrainage', 0)";
            $stmt = $db->prepare($query);
            $stmt->execute([':id' => $notif_id, ':user_id' => $parrainage['parrain_id']]);

            // Créer une notification pour le nouveau filleul
            $notif_filleul_id = UuidHelper::generate();
            $query = "INSERT INTO notifications (id, user_id, type, titre, message, lue)
                      VALUES (:id, :user_id, 'parrainage', 'Bonus de bienvenue !',
                              'Vous avez reçu 3 000 DA pour votre inscription via un code de parrainage', 0)";
            $stmt = $db->prepare($query);
            $stmt->execute([':id' => $notif_filleul_id, ':user_id' => $user_id]);

            error_log("Referral processed: parrain=" . $parrainage['parrain_id'] . " filleul=" . $user_id);
        }
    }

    $token = Auth::generateToken($user_id, $data->email, 'user');
    $refreshToken = Auth::generateRefreshToken($user_id, $data->email, 'user');
    error_log("Tokens generated");

    error_log("Registration complete for: " . $data->email);

    try {
        Mailer::sendWelcomeEmail($data->email, $data->prenom . ' ' . $data->nom);
    } catch (Exception $e) {
        Logger::error('Failed to send welcome email', [
            'email' => $data->email,
            'error' => $e->getMessage()
        ]);
    }

    try {
        AdminNotifier::newUser($data->prenom . ' ' . $data->nom, $data->email);
    } catch (Exception $e) {
        Logger::error('Failed to send admin notification for new user', [
            'error' => $e->getMessage()
        ]);
    }

    Response::success([
        'token' => $token,
        'refreshToken' => $refreshToken,
        'user' => [
            'id' => $user_id,
            'email' => $data->email,
            'nom' => $data->nom,
            'prenom' => $data->prenom,
            'role' => 'user',
            'codeParrainage' => $code_parrain,
            'credit' => 0
        ]
    ], "Inscription réussie", 201);

} catch (PDOException $e) {
    error_log("Database error in register: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    Response::serverError("Erreur lors de l'inscription");
} catch (Exception $e) {
    error_log("Register error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    Response::serverError("Erreur lors de l'inscription");
}
