<?php

/**
 * API Admin: Réinitialiser le mot de passe d'un utilisateur
 * PUT /api/users/reset-password.php?id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::verifyAuth();

    if ($auth['role'] !== 'admin') {
        Response::error('Accès refusé', 403);
    }

    $userId = $_GET['id'] ?? null;
    if (!$userId) {
        Response::error('ID utilisateur manquant', 400);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $password = isset($data['password']) ? trim($data['password']) : '';

    if (strlen($password) < 8) {
        Response::error('Le mot de passe doit contenir au moins 8 caractères', 400);
    }

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("SELECT id FROM persons WHERE id = ? AND role IS NOT NULL");
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) {
        Response::error('Utilisateur introuvable', 404);
    }

    $hashed = password_hash($password, PASSWORD_BCRYPT);
    $db->prepare("UPDATE persons SET password_hash = ? WHERE id = ?")->execute([$hashed, $userId]);

    Response::success(['id' => $userId], 'Mot de passe mis à jour');

} catch (Exception $e) {
    error_log('Reset password error: ' . $e->getMessage());
    Response::error('Erreur lors de la mise à jour du mot de passe', 500);
}
