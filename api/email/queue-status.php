<?php
require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();
if ($auth['role'] !== 'admin') {
    Response::error('Accès réservé aux administrateurs', 403);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $stats = EmailQueue::getQueueStats();
    Response::success($stats, 'Statut de la file d\'attente email');
} catch (Exception $e) {
    Logger::error('email/queue-status.php error', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la récupération de la queue', 500);
}
