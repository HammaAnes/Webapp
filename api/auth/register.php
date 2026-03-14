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

    $rules = require __DIR__ . '/../config/business-rules.php';
    $prefixeCode    = $rules['parrainage']['prefixe_code'];
    $bonusFilleul   = (int)$rules['parrainage']['bonus_filleul_da'];
    $bonusParrain   = (int)$rules['parrainage']['bonus_parrain_da'];

    $code_parrain = $prefixeCode . strtoupper(substr(str_replace('-', '', $user_id), 0, 6));

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
            $db->beginTransaction();

            $query = "UPDATE users SET credit = credit + :bonus WHERE id = :user_id";
            $db->prepare($query)->execute([':bonus' => $bonusFilleul, ':user_id' => $user_id]);

            $query = "UPDATE parrainages
                      SET parraines = parraines + 1,
                          recompenses_totales = recompenses_totales + :bonus,
                          updated_at = NOW()
                      WHERE id = :id";
            $db->prepare($query)->execute([':bonus' => $bonusParrain, ':id' => $parrainage['id']]);

            $query = "UPDATE users SET credit = credit + :bonus WHERE id = :parrain_id";
            $db->prepare($query)->execute([':bonus' => $bonusParrain, ':parrain_id' => $parrainage['parrain_id']]);

            $detail_id = UuidHelper::generate();
            $query = "INSERT INTO parrainages_details (id, parrainage_id, filleul_id, recompense_parrain, recompense_filleul, statut, date_inscription)
                      VALUES (:id, :parrainage_id, :filleul_id, :r_parrain, :r_filleul, 'en_attente', NOW())";
            $db->prepare($query)->execute([
                ':id' => $detail_id,
                ':parrainage_id' => $parrainage['id'],
                ':filleul_id' => $user_id,
                ':r_parrain' => $bonusParrain,
                ':r_filleul' => $bonusFilleul,
            ]);

            $notif_id = UuidHelper::generate();
            $query = "INSERT INTO notifications (id, user_id, type, titre, message, lue)
                      VALUES (:id, :user_id, 'parrainage', 'Nouveau filleul !',
                              :msg, 0)";
            $db->prepare($query)->execute([
                ':id' => $notif_id,
                ':user_id' => $parrainage['parrain_id'],
                ':msg' => 'Vous avez gagné ' . number_format($bonusParrain, 0, ',', ' ') . ' DA grâce à votre code de parrainage',
            ]);

            $notif_filleul_id = UuidHelper::generate();
            $query = "INSERT INTO notifications (id, user_id, type, titre, message, lue)
                      VALUES (:id, :user_id, 'parrainage', 'Bonus de bienvenue !',
                              :msg, 0)";
            $db->prepare($query)->execute([
                ':id' => $notif_filleul_id,
                ':user_id' => $user_id,
                ':msg' => 'Vous avez reçu ' . number_format($bonusFilleul, 0, ',', ' ') . ' DA pour votre inscription via un code de parrainage',
            ]);

            $db->commit();
            error_log("Referral bonuses credited: parrain=" . $bonusParrain . " DA, filleul=" . $bonusFilleul . " DA");
        }
    }

    $token = Auth::generateToken($user_id, $data->email, 'user');
    $refreshToken = Auth::generateRefreshToken($user_id, $data->email, 'user');
    error_log("Tokens generated");

    error_log("Registration complete for: " . $data->email);

    try {
        Mailer::sendWelcomeEmail($data->email, $data->prenom . ' ' . $data->nom, $code_parrain, $data->email);
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
