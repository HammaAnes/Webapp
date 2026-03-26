<?php
require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();
if ($auth['role'] !== 'admin') {
    Response::error('Accès réservé aux administrateurs', 403);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';

    if (!$id) {
        Response::error('L\'identifiant de l\'email est requis', 400);
        exit;
    }

    $retried = EmailQueue::retry($id);

    if ($retried) {
        Response::success(['id' => $id], 'Email remis en file d\'attente');
    } else {
        Response::error('Email introuvable ou déjà en attente', 404);
    }
} catch (Exception $e) {
    Logger::error('email/retry.php error', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la remise en file', 500);
}
