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

    $validator = new Validator();
    $validator->validateRequired($data->email    ?? '', 'email');
    $validator->validateEmail($data->email       ?? '', 'email');
    $validator->validateRequired($data->password ?? '', 'password');
    $validator->validatePassword($data->password ?? '', 'password');
    $validator->validateRequired($data->nom      ?? '', 'nom');
    $validator->validateMinLength($data->nom     ?? '', 2, 'nom');
    $validator->validateRequired($data->prenom   ?? '', 'prenom');
    $validator->validateMinLength($data->prenom  ?? '', 2, 'prenom');
    if (!empty($data->telephone)) {
        $validator->validatePhone($data->telephone, 'telephone', false);
    }
    if ($validator->hasErrors()) {
        Response::validationError($validator->getFirstError());
    }

    // Email déjà pris (user OU contact)
    $checkStmt = $db->prepare("SELECT id FROM persons WHERE email = :email LIMIT 1");
    $checkStmt->execute([':email' => $data->email]);
    if ($checkStmt->rowCount() > 0) {
        Response::conflict("Cet email est déjà utilisé");
    }

    $rules          = require __DIR__ . '/../config/business-rules.php';
    $prefixeCode    = $rules['parrainage']['prefixe_code'];
    $bonusFilleul   = (int)$rules['parrainage']['bonus_filleul_da'];
    $bonusParrain   = (int)$rules['parrainage']['bonus_parrain_da'];

    $person_id      = UuidHelper::generate();
    $password_hash  = Auth::hashPassword($data->password);

    // Générer un code parrainage unique
    $code_parrainage = $prefixeCode . strtoupper(substr(str_replace('-', '', $person_id), 0, 6));
    $checkCode = $db->prepare("SELECT id FROM persons WHERE code_parrainage = :code LIMIT 1");
    $checkCode->execute([':code' => $code_parrainage]);
    while ($checkCode->rowCount() > 0) {
        $code_parrainage = $prefixeCode . strtoupper(bin2hex(random_bytes(3)));
        $checkCode->execute([':code' => $code_parrainage]);
    }

    $db->beginTransaction();

    // Insérer directement dans persons (plus de trigger ni de tiers)
    $db->prepare("
        INSERT INTO persons
          (id, email, password_hash, nom, prenom, telephone,
           role, statut, source, crm_statut, code_parrainage,
           profession, entreprise, created_at, updated_at)
        VALUES
          (:id, :email, :password_hash, :nom, :prenom, :telephone,
           'user', 'actif', 'inscription', 'client', :code_parrainage,
           :profession, :entreprise, NOW(), NOW())
    ")->execute([
        ':id'             => $person_id,
        ':email'          => $data->email,
        ':password_hash'  => $password_hash,
        ':nom'            => $data->nom,
        ':prenom'         => $data->prenom,
        ':telephone'      => $data->telephone ?? null,
        ':code_parrainage'=> $code_parrainage,
        ':profession'     => $data->profession ?? null,
        ':entreprise'     => $data->entreprise ?? null,
    ]);

    // Créer l'entrée parrainage
    $db->prepare("
        INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales)
        VALUES (:id, :parrain_id, :code_parrain, 0, 0)
    ")->execute([
        ':id'          => UuidHelper::generate(),
        ':parrain_id'  => $person_id,
        ':code_parrain'=> $code_parrainage,
    ]);

    $db->commit();

    // Traiter le code parrainage utilisé à l'inscription
    $code_utilise = $data->code_parrainage ?? $data->codeParrainage ?? null;
    if (!empty($code_utilise)) {
        $parr = $db->prepare("SELECT id, parrain_id FROM parrainages WHERE code_parrain = :code LIMIT 1");
        $parr->execute([':code' => $code_utilise]);
        $parrainage = $parr->fetch();

        if ($parrainage && $parrainage['parrain_id'] !== $person_id) {
            $db->beginTransaction();

            $db->prepare("UPDATE parrainages SET parraines = parraines + 1, updated_at = NOW() WHERE id = :id")
               ->execute([':id' => $parrainage['id']]);

            $db->prepare("
                INSERT INTO parrainages_details
                  (id, parrainage_id, filleul_id, recompense_parrain, recompense_filleul, statut, date_inscription)
                VALUES (:id, :parrainage_id, :filleul_id, :r_parrain, :r_filleul, 'en_attente', NOW())
            ")->execute([
                ':id'           => UuidHelper::generate(),
                ':parrainage_id'=> $parrainage['id'],
                ':filleul_id'   => $person_id,
                ':r_parrain'    => $bonusParrain,
                ':r_filleul'    => $bonusFilleul,
            ]);

            $db->prepare("
                INSERT INTO notifications (id, person_id, type, titre, message, lue)
                VALUES (:id, :person_id, 'parrainage', 'Nouveau filleul !', :msg, 0)
            ")->execute([
                ':id'        => UuidHelper::generate(),
                ':person_id' => $parrainage['parrain_id'],
                ':msg'       => 'Un nouveau membre a rejoint Coffice grâce à votre code. Votre bonus de ' . number_format($bonusParrain, 0, ',', ' ') . ' DA sera crédité dès sa première réservation.',
            ]);

            $db->prepare("
                INSERT INTO notifications (id, person_id, type, titre, message, lue)
                VALUES (:id, :person_id, 'parrainage', 'Code parrainage appliqué !', :msg, 0)
            ")->execute([
                ':id'        => UuidHelper::generate(),
                ':person_id' => $person_id,
                ':msg'       => 'Votre code de parrainage a bien été enregistré. Vous recevrez ' . number_format($bonusFilleul, 0, ',', ' ') . ' DA de crédit dès votre première réservation.',
            ]);

            $db->commit();
        }
    }

    try {
        Mailer::sendWelcomeEmail($data->email, $data->prenom . ' ' . $data->nom, $code_parrainage, $data->email);
    } catch (Exception $e) {
        Logger::error('Failed to send welcome email', ['email' => $data->email, 'error' => $e->getMessage()]);
    }

    try {
        AdminNotifier::newUser($data->prenom . ' ' . $data->nom, $data->email);
    } catch (Exception $e) {
        Logger::error('Failed to send admin notification', ['error' => $e->getMessage()]);
    }

    $token        = Auth::generateToken($person_id, $data->email, 'user');
    $refreshToken = Auth::generateRefreshToken($person_id, $data->email, 'user');

    Response::success([
        'token'        => $token,
        'refreshToken' => $refreshToken,
        'user' => [
            'id'             => $person_id,
            'email'          => $data->email,
            'nom'            => $data->nom,
            'prenom'         => $data->prenom,
            'role'           => 'user',
            'codeParrainage' => $code_parrainage,
            'credit'         => 0,
        ],
    ], "Inscription réussie", 201);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    Logger::error("Database error in register", ['error' => $e->getMessage()]);
    Response::serverError("Erreur lors de l'inscription");
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    Logger::error("Register error", ['error' => $e->getMessage()]);
    Response::serverError("Erreur lors de l'inscription");
}
