<?php

require_once '../config/cors.php';
require_once '../config/database.php';

header('Content-Type: application/json');

$debugInfo = [
    'timestamp' => date('Y-m-d H:i:s'),
];

try {
    $db = Database::getInstance()->getConnection();
    $debugInfo['connection'] = 'Success';

    $stmt = $db->query("SELECT * FROM espaces ORDER BY nom");
    $espaces = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $debugInfo['count'] = count($espaces);
    $debugInfo['espaces'] = [];

    foreach ($espaces as $espace) {
        $debugInfo['espaces'][] = [
            'id' => $espace['id'],
            'nom' => $espace['nom'],
            'type' => $espace['type'],
            'capacite' => $espace['capacite'],
            'prix_heure' => floatval($espace['prix_heure']),
            'prix_jour' => floatval($espace['prix_jour']),
            'disponible' => (bool)$espace['disponible'],
            'created_at' => $espace['created_at'],
        ];
    }

    $stmt = $db->query("
        SELECT
            e.nom as espace_nom,
            COUNT(r.id) as nb_reservations,
            SUM(r.montant_total) as total_revenue
        FROM espaces e
        LEFT JOIN reservations r ON e.id = r.espace_id
        GROUP BY e.id, e.nom
        ORDER BY nb_reservations DESC
    ");
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugInfo['stats'] = $stats;

    echo json_encode([
        'success' => true,
        'message' => 'Espaces loaded successfully',
        'data' => $espaces,
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    $debugInfo['error'] = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
    ];

    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $debugInfo['error'] = [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ];

    echo json_encode([
        'success' => false,
        'message' => 'General error',
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);
}
