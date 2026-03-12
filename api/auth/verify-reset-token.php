<?php

/**
 * Verify Reset Token - Vérifie la validité d'un token de réinitialisation
 * GET /api/auth/verify-reset-token?token=abc123
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    if (!isset($_GET['token']) || empty($_GET['token'])) {
        Response::error('Token requis', 400);
        exit;
    }

    $token = trim($_GET['token']);
    $hashedToken = hash('sha256', $token);

    $stmt = $db->prepare('
        SELECT pr.id, pr.expires_at, pr.used_at, u.email
        FROM password_resets pr
        INNER JOIN users u ON pr.user_id = u.id
        WHERE pr.token = ?
        LIMIT 1
    ');
    $stmt->execute([$hashedToken]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        Response::error('Token invalide', 400);
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

    Response::success([
        'valid' => true,
        'email' => $reset['email'],
        'expires_at' => $reset['expires_at']
    ], 'Token valide');

} catch (PDOException $e) {
    Logger::error('Database error in verify-reset-token', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la vérification du token', 500);
} catch (Exception $e) {
    Logger::error('Error in verify-reset-token', ['error' => $e->getMessage()]);
    Response::error('Une erreur est survenue', 500);
}
