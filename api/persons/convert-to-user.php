<?php

/**
 * API Admin: Convertir un contact en utilisateur avec compte
 * POST /api/persons/convert-to-user.php?id=xxx
 *
 * Simplifié : un simple UPDATE persons — la personne garde son ID.
 * Plus besoin de jongler entre users et tiers.
 */

require_once __DIR__ . '/../bootstrap.php';

Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $data     = json_decode(file_get_contents('php://input'), true) ?? [];
    $personId = $_GET['id'] ?? $data['person_id'] ?? $data['contact_id'] ?? null;
    if (!$personId) Response::error('ID manquant', 400);

    $person = $db->prepare("SELECT id, nom, prenom, email, role FROM persons WHERE id = ?");
    $person->execute([$personId]);
    $p = $person->fetch(PDO::FETCH_ASSOC);

    if (!$p) Response::error('Personne non trouvée', 404);
    if ($p['role'] !== null) Response::error('Cette personne a déjà un compte', 409);
    if (empty($p['email'])) Response::error('Email requis pour créer un compte', 400);
    $sendEmail = $data['send_welcome_email'] ?? $data['sendWelcomeEmail'] ?? true;
    $tempPassword  = bin2hex(random_bytes(8));
    $password_hash = Auth::hashPassword($tempPassword);

    // Générer un code parrainage unique
    $prefix = 'CPF';
    $code   = $prefix . strtoupper(substr(str_replace('-', '', $personId), 0, 6));
    $chk    = $db->prepare("SELECT id FROM persons WHERE code_parrainage = ? AND id != ? LIMIT 1");
    $chk->execute([$code, $personId]);
    while ($chk->fetch()) {
        $code = $prefix . strtoupper(bin2hex(random_bytes(3)));
        $chk->execute([$code, $personId]);
    }

    $db->beginTransaction();

    $db->prepare("
        UPDATE persons
        SET password_hash   = :pwd,
            role            = 'user',
            statut          = 'actif',
            code_parrainage = :code,
            updated_at      = NOW()
        WHERE id = :id
          AND role IS NULL
    ")->execute([
        ':pwd'  => $password_hash,
        ':code' => $code,
        ':id'   => $personId,
    ]);

    // Créer l'entrée parrainage
    $db->prepare("
        INSERT IGNORE INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales)
        VALUES (:id, :parrain_id, :code, 0, 0)
    ")->execute([
        ':id'       => UuidHelper::generate(),
        ':parrain_id'=> $personId,
        ':code'     => $code,
    ]);

    $db->commit();

    // Envoyer l'email si demandé
    $emailSent = false;
    if ($sendEmail && !empty($p['email'])) {
        try {
            $subject = 'Bienvenue sur Coffice — Vos identifiants de connexion';
            $body    = Mailer::wrapInLayout(
                'Bienvenue sur Coffice',
                '<h2>Bonjour ' . htmlspecialchars($p['prenom'] ?? '') . ',</h2>'
                . '<p>Un compte a été créé pour vous sur la plateforme Coffice.</p>'
                . Mailer::infoBox([
                    'Email'                   => htmlspecialchars($p['email']),
                    'Mot de passe temporaire' => $tempPassword,
                ])
                . '<p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>'
                . Mailer::ctaButton('https://coffice.dz/connexion', 'Se connecter'),
                'Vos identifiants Coffice'
            );
            $emailSent = Mailer::send($p['email'], $subject, $body);
        } catch (Exception $e) {
            Logger::warning('Welcome email failed on convert-to-user', ['error' => $e->getMessage()]);
        }
    }

    Logger::info('Contact converted to user', [
        'admin_id'  => $authUser['id'] ?? null,
        'person_id' => $personId,
        'email'     => $p['email'],
    ]);

    Response::success([
        'personId'          => $personId,
        'temporaryPassword' => $tempPassword,
        'emailSent'         => $emailSent,
    ], 'Contact converti en utilisateur avec succès');

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    Logger::error('persons/convert-to-user error', ['error' => $e->getMessage()]);
    Response::error('Erreur: ' . $e->getMessage(), 500);
}
