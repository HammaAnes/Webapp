<?php

/**
 * Endpoint de diagnostic système
 * Accessible via: /api/debug/diagnostic.php
 */

require_once '../config/database.php';

header('Content-Type: application/json');

$diagnostic = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'checks' => []
];

// 1. Test de connexion à la base de données
try {
    $db = Database::getInstance()->getConnection();
    $diagnostic['checks']['database_connection'] = [
        'status' => 'OK',
        'message' => 'Connexion réussie'
    ];

    // 2. Vérifier l'existence de la table espaces
    try {
        $stmt = $db->query("SHOW TABLES LIKE 'espaces'");
        $exists = $stmt->rowCount() > 0;

        if ($exists) {
            $diagnostic['checks']['table_espaces'] = [
                'status' => 'OK',
                'message' => 'Table espaces existe'
            ];

            // 3. Compter les espaces
            $stmt = $db->query("SELECT COUNT(*) as count FROM espaces");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $count = $result['count'];

            $diagnostic['checks']['espaces_count'] = [
                'status' => $count > 0 ? 'OK' : 'WARNING',
                'message' => "$count espace(s) trouvé(s)",
                'count' => $count
            ];

            // 4. Lister les espaces avec leurs IDs
            if ($count > 0) {
                $stmt = $db->query("SELECT id, nom, type, prix_heure, prix_jour, disponible FROM espaces ORDER BY nom");
                $espaces = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $diagnostic['espaces'] = array_map(function($e) {
                    return [
                        'id' => $e['id'],
                        'nom' => $e['nom'],
                        'type' => $e['type'],
                        'prix_heure' => floatval($e['prix_heure']),
                        'prix_jour' => floatval($e['prix_jour']),
                        'disponible' => (bool)$e['disponible']
                    ];
                }, $espaces);

                $diagnostic['checks']['espaces_list'] = [
                    'status' => 'OK',
                    'message' => 'Espaces listés avec succès'
                ];
            } else {
                $diagnostic['checks']['espaces_list'] = [
                    'status' => 'WARNING',
                    'message' => 'Aucun espace trouvé. Exécutez: php scripts/init_espaces.php'
                ];
            }

            // 5. Vérifier les réservations récentes
            $stmt = $db->query("SELECT COUNT(*) as count FROM reservations");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $resCount = $result['count'];

            $diagnostic['checks']['reservations_count'] = [
                'status' => 'OK',
                'message' => "$resCount réservation(s) dans la base",
                'count' => $resCount
            ];

            // 6. Vérifier les erreurs récentes
            $stmt = $db->query("
                SELECT COUNT(*) as count
                FROM reservations
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $recentCount = $result['count'];

            $diagnostic['checks']['recent_reservations'] = [
                'status' => 'INFO',
                'message' => "$recentCount réservation(s) dans la dernière heure",
                'count' => $recentCount
            ];

        } else {
            $diagnostic['checks']['table_espaces'] = [
                'status' => 'ERROR',
                'message' => 'Table espaces n\'existe pas. Exécutez le script SQL: database/coffice.sql'
            ];
        }

    } catch (PDOException $e) {
        $diagnostic['checks']['table_espaces'] = [
            'status' => 'ERROR',
            'message' => 'Erreur lors de la vérification: ' . $e->getMessage()
        ];
    }

} catch (Exception $e) {
    $diagnostic['checks']['database_connection'] = [
        'status' => 'ERROR',
        'message' => 'Connexion échouée: ' . $e->getMessage()
    ];
}

// 7. Vérifier les extensions PHP nécessaires
$extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
$diagnostic['checks']['php_extensions'] = [];

foreach ($extensions as $ext) {
    $loaded = extension_loaded($ext);
    $diagnostic['checks']['php_extensions'][$ext] = [
        'status' => $loaded ? 'OK' : 'ERROR',
        'loaded' => $loaded
    ];
}

// 8. Vérifier les permissions de fichiers
$diagnostic['checks']['file_permissions'] = [
    'uploads_dir' => is_writable(__DIR__ . '/../uploads') ? 'OK' : 'ERROR'
];

// Résumé global
$hasErrors = false;
$hasWarnings = false;

foreach ($diagnostic['checks'] as $check) {
    if (is_array($check)) {
        if (isset($check['status'])) {
            if ($check['status'] === 'ERROR') $hasErrors = true;
            if ($check['status'] === 'WARNING') $hasWarnings = true;
        } else {
            // Pour les checks imbriqués comme php_extensions
            foreach ($check as $subcheck) {
                if (isset($subcheck['status']) && $subcheck['status'] === 'ERROR') {
                    $hasErrors = true;
                }
            }
        }
    }
}

$diagnostic['summary'] = [
    'status' => $hasErrors ? 'ERROR' : ($hasWarnings ? 'WARNING' : 'OK'),
    'message' => $hasErrors
        ? 'Des erreurs critiques ont été détectées'
        : ($hasWarnings ? 'Quelques avertissements détectés' : 'Système opérationnel')
];

echo json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
