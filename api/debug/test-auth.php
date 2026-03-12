<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';

header('Content-Type: application/json');

$debugInfo = [
    'timestamp' => date('Y-m-d H:i:s'),
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
];

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$debugInfo['auth_header'] = [
    'present' => !empty($authHeader),
    'value' => !empty($authHeader) ? substr($authHeader, 0, 20) . '...' : null,
];

if (empty($authHeader)) {
    echo json_encode([
        'success' => false,
        'message' => 'No authorization header provided',
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);
    exit;
}

$token = str_replace('Bearer ', '', $authHeader);
$debugInfo['token_length'] = strlen($token);

try {
    $auth = Auth::verifyAuth();

    $debugInfo['auth_result'] = [
        'success' => true,
        'user_id' => $auth['id'] ?? null,
        'email' => $auth['email'] ?? null,
        'role' => $auth['role'] ?? null,
    ];

    $db = Database::getInstance()->getConnection();
    $stmt = $db->prepare("SELECT id, email, role, nom, prenom, created_at FROM users WHERE id = ?");
    $stmt->execute([$auth['id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $debugInfo['user_from_db'] = $user ?: null;

    echo json_encode([
        'success' => true,
        'message' => 'Authentication successful',
        'user' => $user,
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $debugInfo['auth_result'] = [
        'success' => false,
        'error' => $e->getMessage(),
    ];

    echo json_encode([
        'success' => false,
        'message' => 'Authentication failed: ' . $e->getMessage(),
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);
}
