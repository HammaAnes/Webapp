<?php

/**
 * Reset Password - Endpoint de réinitialisation effective du mot de passe
 * POST /api/auth/reset-password
 *
 * Body: {
 *   "token": "abc123...",
 *   "password": "newPassword123",
 *   "password_confirmation": "newPassword123"
 * }
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['token']) || !isset($input['password']) || !isset($input['password_confirmation'])) {
        Response::error('Token et mot de passe requis', 400);
        exit;
    }

    $token = trim($input['token']);
    $password = $input['password'];
    $passwordConfirmation = $input['password_confirmation'];

    if (empty($token) || empty($password)) {
        Response::error('Token et mot de passe requis', 400);
        exit;
    }

    if ($password !== $passwordConfirmation) {
        Response::error('Les mots de passe ne correspondent pas', 400);
        exit;
    }

    $minLength = env('PASSWORD_MIN_LENGTH', 6);
    if (strlen($password) < $minLength) {
        Response::error("Le mot de passe doit contenir au moins {$minLength} caractères", 400);
        exit;
    }

    $hashedToken = hash('sha256', $token);

    $stmt = $db->prepare('
        SELECT pr.id, pr.user_id, pr.email, pr.expires_at, pr.used_at,
               u.id as user_exists, u.statut
        FROM password_resets pr
        INNER JOIN users u ON pr.user_id = u.id
        WHERE pr.token = ?
        LIMIT 1
    ');
    $stmt->execute([$hashedToken]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        Response::error('Token invalide ou expiré', 400);
        exit;
    }

    if ($reset['used_at'] !== null) {
        Response::error('Ce lien a déjà été utilisé', 400);
        exit;
    }

    if (strtotime($reset['expires_at']) < time()) {
        Response::error('Ce lien a expiré', 400);
        exit;
    }

    if ($reset['statut'] === 'suspendu' || $reset['statut'] === 'inactif') {
        Response::error('Ce compte n\'est pas actif', 403);
        exit;
    }

    $db->beginTransaction();

    try {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $updateUserStmt = $db->prepare('
            UPDATE users
            SET password_hash = ?,
                updated_at = NOW()
            WHERE id = ?
        ');
        $updateUserStmt->execute([$passwordHash, $reset['user_id']]);

        $markUsedStmt = $db->prepare('
            UPDATE password_resets
            SET used_at = NOW()
            WHERE id = ?
        ');
        $markUsedStmt->execute([$reset['id']]);

        $invalidateOtherTokens = $db->prepare('
            UPDATE password_resets
            SET used_at = NOW()
            WHERE user_id = ?
            AND id != ?
            AND used_at IS NULL
        ');
        $invalidateOtherTokens->execute([$reset['user_id'], $reset['id']]);

        $db->commit();

        Logger::info('Password reset successful', [
            'user_id' => $reset['user_id'],
            'email' => $reset['email'],
            'ip' => getClientIp()
        ]);

        Response::success(
            null,
            'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
        );

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

} catch (PDOException $e) {
    Logger::error('Database error in reset-password', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la réinitialisation du mot de passe', 500);
} catch (Exception $e) {
    Logger::error('Error in reset-password', ['error' => $e->getMessage()]);
    Response::error('Une erreur est survenue', 500);
}
