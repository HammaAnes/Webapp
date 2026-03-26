<?php

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';

try {
    $db = Database::getInstance()->getConnection();
    $db->query("SELECT 1");

    Response::success([
        'status' => 'ok',
        'database' => 'connected',
        'timestamp' => date('c'),
    ]);
} catch (Exception $e) {
    http_response_code(503);
    Response::error('Service indisponible: ' . $e->getMessage(), 503);
}
