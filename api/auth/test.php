<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'ok',
    'message' => 'PHP is alive here',
    'time' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
]);
exit;