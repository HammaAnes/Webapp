<?php

/**
 * Forgot Password - Endpoint de demande de réinitialisation de mot de passe
 * POST /api/auth/forgot-password
 *
 * Body: { "email": "user@example.com" }
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Mailer.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['email'])) {
        Response::error('Email requis', 400);
        exit;
    }

    $email = Sanitizer::cleanEmail($input['email']);

    if (!Validator::isValidEmail($email)) {
        Response::error('Email invalide', 400);
        exit;
    }

    $stmt = $db->prepare('SELECT id, email, nom, prenom, statut FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        Response::success(null, 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.');
        Logger::warning('Password reset attempted for non-existent email', ['email' => $email]);
        exit;
    }

    if ($user['statut'] === 'suspendu' || $user['statut'] === 'inactif') {
        Response::error('Ce compte n\'est pas actif', 403);
        exit;
    }

    $checkStmt = $db->prepare('
        SELECT COUNT(*) as count
        FROM password_resets
        WHERE user_id = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        AND used_at IS NULL
    ');
    $checkStmt->execute([$user['id']]);
    $recentRequests = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($recentRequests['count'] > 2) {
        Response::error('Trop de demandes de réinitialisation. Veuillez réessayer dans 15 minutes.', 429);
        exit;
    }

    $tokenBytes = random_bytes(32);
    $token = bin2hex($tokenBytes);
    $resetId = UuidHelper::generate();

    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $insertStmt = $db->prepare('
        INSERT INTO password_resets
        (id, user_id, email, token, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');

    $insertStmt->execute([
        $resetId,
        $user['id'],
        $user['email'],
        hash('sha256', $token),
        $expiresAt,
        getClientIp(),
        getUserAgent()
    ]);

    $emailSent = Mailer::sendPasswordReset(
        $user['email'],
        $user['prenom'] . ' ' . $user['nom'],
        $token
    );

    if (!$emailSent) {
        Logger::error('Failed to send password reset email', [
            'user_id' => $user['id'],
            'email' => $user['email']
        ]);
    }

    Logger::info('Password reset requested', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'ip' => getClientIp()
    ]);

    Response::success(
        null,
        'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
    );

} catch (PDOException $e) {
    Logger::error('Database error in forgot-password', ['error' => $e->getMessage()]);
    Response::error('Erreur lors du traitement de la demande', 500);
} catch (Exception $e) {
    Logger::error('Error in forgot-password', ['error' => $e->getMessage()]);
    Response::error('Une erreur est survenue', 500);
}
