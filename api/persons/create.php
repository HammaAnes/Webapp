<?php

/**
 * API Admin: Créer une personne (contact OU utilisateur avec compte)
 * POST /api/persons/create.php
 *
 * Si password ou role fourni → crée un utilisateur avec compte
 * Sinon                      → crée un contact CRM sans compte
 */

require_once __DIR__ . '/../bootstrap.php';

Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['nom']) || empty($data['prenom'])) {
        Response::error('Nom et prénom requis', 400);
    }

    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        Response::error('Email invalide', 400);
    }

    // Email déjà utilisé ?
    if (!empty($data['email'])) {
        $chk = $db->prepare("SELECT id FROM persons WHERE email = ? LIMIT 1");
        $chk->execute([$data['email']]);
        if ($chk->fetch()) {
            Response::error('Cet email est déjà utilisé', 409);
        }
    }

    $wantsAccount  = !empty($data['password']) || !empty($data['role']);
    $isAutoGenPwd  = $wantsAccount && empty($data['password']);
    $password      = $isAutoGenPwd ? bin2hex(random_bytes(8)) : ($data['password'] ?? null);
    $role          = $wantsAccount ? (in_array($data['role'] ?? '', ['admin','user']) ? $data['role'] : 'user') : null;
    $statut        = $wantsAccount ? 'actif' : null;
    $password_hash = $wantsAccount ? Auth::hashPassword($password) : null;

    $id = UuidHelper::generate();

    // Code parrainage (uniquement pour les users avec compte)
    $code_parrainage = null;
    if ($wantsAccount) {
        $prefix = 'CPF';
        $code_parrainage = $prefix . strtoupper(substr(str_replace('-', '', $id), 0, 6));
        $chkCode = $db->prepare("SELECT id FROM persons WHERE code_parrainage = ? LIMIT 1");
        $chkCode->execute([$code_parrainage]);
        while ($chkCode->fetch()) {
            $code_parrainage = $prefix . strtoupper(bin2hex(random_bytes(3)));
            $chkCode->execute([$code_parrainage]);
        }
    }

    $db->prepare("
        INSERT INTO persons
          (id, nom, prenom, email, telephone,
           password_hash, role, statut,
           source, crm_statut, notes, created_by,
           profession, entreprise, code_parrainage,
           created_at, updated_at)
        VALUES
          (:id, :nom, :prenom, :email, :telephone,
           :password_hash, :role, :statut,
           :source, :crm_statut, :notes, :created_by,
           :profession, :entreprise, :code_parrainage,
           NOW(), NOW())
    ")->execute([
        ':id'             => $id,
        ':nom'            => trim($data['nom']),
        ':prenom'         => trim($data['prenom']),
        ':email'          => !empty($data['email']) ? trim($data['email']) : null,
        ':telephone'      => !empty($data['telephone']) ? trim($data['telephone']) : null,
        ':password_hash'  => $password_hash,
        ':role'           => $role,
        ':statut'         => $statut,
        ':source'         => $data['source']     ?? 'inscription',
        ':crm_statut'     => $data['crm_statut'] ?? 'client',
        ':notes'          => $data['notes']       ?? null,
        ':created_by'     => $authUser['id'] ?? null,
        ':profession'     => $data['profession']  ?? null,
        ':entreprise'     => $data['entreprise']  ?? null,
        ':code_parrainage'=> $code_parrainage,
    ]);

    // Créer l'entrée parrainage si c'est un user avec compte
    if ($wantsAccount && $code_parrainage) {
        $db->prepare("
            INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales)
            VALUES (:id, :parrain_id, :code, 0, 0)
        ")->execute([
            ':id'       => UuidHelper::generate(),
            ':parrain_id'=> $id,
            ':code'     => $code_parrainage,
        ]);
    }

    // Envoyer l'email si c'est un user avec un mot de passe auto-généré
    $emailSent = false;
    if ($wantsAccount && $isAutoGenPwd && !empty($data['email'])) {
        try {
            $subject = 'Bienvenue sur Coffice — Vos identifiants de connexion';
            $body    = Mailer::wrapInLayout(
                'Bienvenue sur Coffice',
                '<h2>Bonjour ' . htmlspecialchars($data['prenom']) . ',</h2>'
                . '<p>Un compte a été créé pour vous sur la plateforme Coffice.</p>'
                . Mailer::infoBox([
                    'Email'                   => htmlspecialchars($data['email']),
                    'Mot de passe temporaire' => $password,
                ])
                . '<p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>'
                . Mailer::ctaButton('https://coffice.dz/connexion', 'Se connecter'),
                'Vos identifiants Coffice'
            );
            $emailSent = Mailer::send($data['email'], $subject, $body);
        } catch (Exception $e) {
            Logger::warning('Welcome email failed', ['error' => $e->getMessage(), 'person_id' => $id]);
        }
    }

    Logger::info('Person created', [
        'admin_id'    => $authUser['id'] ?? null,
        'person_id'   => $id,
        'has_account' => $wantsAccount,
        'email'       => $data['email'] ?? null,
    ]);

    Response::success([
        'id'             => $id,
        'nom'            => $data['nom'],
        'prenom'         => $data['prenom'],
        'email'          => $data['email'] ?? null,
        'role'           => $role,
        'statut'         => $statut,
        'code_parrainage'=> $code_parrainage,
        'has_account'    => $wantsAccount,
        'temp_password'  => ($wantsAccount && $isAutoGenPwd) ? $password : null,
        'email_sent'     => $emailSent,
    ], 'Personne créée avec succès', 201);

} catch (PDOException $e) {
    Logger::error('persons/create PDO error', ['error' => $e->getMessage()]);
    Response::error('Erreur base de données: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    Logger::error('persons/create error', ['error' => $e->getMessage()]);
    Response::error('Erreur: ' . $e->getMessage(), 500);
}
