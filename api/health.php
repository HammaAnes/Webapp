<?php

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';

try {
    $db = Database::getInstance()->getConnection();
    $db->query("SELECT 1");

    $columnCheck = $db->prepare("
        SELECT COUNT(*) as found
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'carte_identite_url'
    ");
    $columnCheck->execute();
    $carteIdentiteColExists = (int)$columnCheck->fetchColumn() > 0;

    if (!$carteIdentiteColExists) {
        $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS carte_identite_url TEXT DEFAULT NULL");
        $carteIdentiteColExists = true;
        $migrationApplied = true;
    } else {
        $migrationApplied = false;
    }

    Response::success([
        'status' => 'ok',
        'database' => 'connected',
        'timestamp' => date('c'),
        'migrations' => [
            'carte_identite_url' => $carteIdentiteColExists ? 'ok' : 'missing',
            'auto_applied' => $migrationApplied,
        ],
    ]);
} catch (Exception $e) {
    http_response_code(503);
    Response::error('Service indisponible: ' . $e->getMessage(), 503);
}
