<?php

require_once '../config/database.php';

header('Content-Type: application/json');

$debugInfo = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'extensions' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
    ],
];

$envFile = file_exists(__DIR__ . '/../.env')
    ? __DIR__ . '/../.env'
    : __DIR__ . '/../../.env';

$debugInfo['env_file'] = [
    'path' => $envFile,
    'exists' => file_exists($envFile),
    'readable' => file_exists($envFile) && is_readable($envFile),
];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envVars = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        if (strpos($key, 'DB_') === 0) {
            $envVars[$key] = $key === 'DB_PASSWORD' ? '***' : trim($value);
        }
    }
    $debugInfo['env_vars'] = $envVars;
}

try {
    $db = Database::getInstance()->getConnection();
    $debugInfo['connection'] = 'Success';

    $stmt = $db->query("SELECT VERSION() as version");
    $version = $stmt->fetch(PDO::FETCH_ASSOC);
    $debugInfo['mysql_version'] = $version['version'] ?? 'Unknown';

    $stmt = $db->query("SELECT DATABASE() as dbname");
    $dbname = $stmt->fetch(PDO::FETCH_ASSOC);
    $debugInfo['current_database'] = $dbname['dbname'] ?? 'Unknown';

    $tables = [
        'users',
        'espaces',
        'reservations',
        'domiciliations',
        'codes_promo',
        'abonnements',
        'abonnements_utilisateurs',
        'notifications',
    ];

    $debugInfo['tables'] = [];
    foreach ($tables as $table) {
        try {
            $stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $debugInfo['tables'][$table] = [
                'exists' => true,
                'count' => $result['count'],
            ];
        } catch (PDOException $e) {
            $debugInfo['tables'][$table] = [
                'exists' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    $stmt = $db->query("SHOW TABLES");
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $debugInfo['all_tables'] = $allTables;

    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    $debugInfo['connection'] = 'Failed';
    $debugInfo['error'] = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
    ];

    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $debugInfo['error'] = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'trace' => $e->getTraceAsString(),
    ];

    echo json_encode([
        'success' => false,
        'message' => 'General error',
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);
}
