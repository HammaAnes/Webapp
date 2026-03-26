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
    $page    = max(1, (int)($_GET['page']    ?? 1));
    $limit   = min(100, max(1, (int)($_GET['limit'] ?? 50)));

    $filters = array_filter([
        'type'       => $_GET['type']      ?? '',
        'status'     => $_GET['status']    ?? '',
        'user_id'    => $_GET['user_id']   ?? '',
        'date_debut' => $_GET['date_debut'] ?? '',
        'date_fin'   => $_GET['date_fin']  ?? '',
    ]);

    if (isset($_GET['stats'])) {
        $stats = EmailLogger::getStats();
        Response::success($stats, 'Statistiques email');
        exit;
    }

    $result = EmailLogger::getLogs($page, $limit, $filters);
    Response::success($result, 'Logs email');
} catch (Exception $e) {
    Logger::error('email/logs.php error', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la récupération des logs', 500);
}
