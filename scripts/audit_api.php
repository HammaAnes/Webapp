#!/usr/bin/env php
<?php

/**
 * Script d'audit API - Conformité REST et sécurité
 * Teste les standards REST, codes HTTP, et sécurité
 *
 * Usage: php scripts/audit_api.php [URL_API]
 */

$API_URL = $argv[1] ?? 'http://localhost:8080/api';

// Couleurs
const C_RESET = "\033[0m";
const C_GREEN = "\033[32m";
const C_RED = "\033[31m";
const C_YELLOW = "\033[33m";
const C_CYAN = "\033[36m";
const C_BOLD = "\033[1m";

$results = [];
$passed = 0;
$total = 0;

function makeRequest($endpoint, $method = 'GET', $data = null, $token = null) {
    global $API_URL;

    $url = $API_URL . $endpoint;
    $ch = curl_init($url);

    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $start = microtime(true);
    $response = curl_exec($ch);
    $time = round((microtime(true) - $start) * 1000);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => json_decode($response, true),
        'raw' => $response,
        'time' => $time
    ];
}

function test($module, $name, $expected, $actual, $details = '', $time = 0) {
    global $results, $passed, $total;

    $total++;
    $status = ($expected == $actual || (is_array($expected) && in_array($actual, $expected)));

    if ($status) $passed++;

    $results[] = [
        'module' => $module,
        'test' => $name,
        'expected' => is_array($expected) ? implode(' / ', $expected) : $expected,
        'actual' => $actual,
        'status' => $status ? 'OK' : 'FAIL',
        'details' => $details,
        'time' => $time . ' ms'
    ];

    return $status;
}

echo C_BOLD . C_CYAN . "\n==================== RAPPORT D'AUDIT API ====================\n\n" . C_RESET;

// TEST 1: Détection API
$result = makeRequest('/check.php');
test('Routing', 'Détection API (/backend/public/api)', 'Endpoint joignable',
     $result['code'], 'Prefix API valide détecté', $result['time']);

// TEST 2: Connexion utilisateur (doit retourner 200 + token)
$validEmail = 'admin@coffice.dz';
$validPass = 'Admin@Coffice2025';
$result = makeRequest('/auth/login.php', 'POST', [
    'email' => $validEmail,
    'password' => $validPass
]);
$hasToken = isset($result['data']['token']);
test('Auth', 'Connexion utilisateur', 'HTTP 200 + token',
     $result['code'], $hasToken ? 'Token JWT reçu' : 'Échec authentification', $result['time']);

$validToken = $hasToken ? $result['data']['token'] : null;

// TEST 3: Accès sans token (doit retourner 401)
$result = makeRequest('/auth/me.php', 'GET');
test('Sécurité', 'Accès sans token', 'HTTP 401',
     $result['code'], 'Protection des routes', $result['time']);

// TEST 4: Token invalide (doit retourner 401)
$result = makeRequest('/auth/me.php', 'GET', null, 'invalid_token_xyz123');
test('Sécurité', 'Token invalide', 'HTTP 401',
     $result['code'], 'JWT invalide rejeté', $result['time']);

// TEST 5: Récupération profil avec token valide
if ($validToken) {
    $result = makeRequest('/auth/me.php', 'GET', null, $validToken);
    test('Utilisateur', 'Profil utilisateur', 'HTTP 200',
         $result['code'], 'Récupération profil', $result['time']);
}

// TEST 6: Création réservation (doit retourner 201)
if ($validToken) {
    // Récupérer un espace
    $espacesResult = makeRequest('/espaces/index.php');
    $espaceId = null;
    if ($espacesResult['code'] == 200 && !empty($espacesResult['data']['data'])) {
        $espaceId = $espacesResult['data']['data'][0]['id'];
    }

    if ($espaceId) {
        $tomorrow = date('Y-m-d\TH:i:s', strtotime('tomorrow 09:00:00'));
        $endDate = date('Y-m-d\TH:i:s', strtotime('tomorrow 11:00:00'));

        $result = makeRequest('/reservations/create.php', 'POST', [
            'espace_id' => $espaceId,
            'date_debut' => $tomorrow,
            'date_fin' => $endDate,
            'participants' => 1
        ], $validToken);

        test('Métier', 'Création réservation', 'HTTP 201',
             $result['code'], 'Création resource REST', $result['time']);

        $reservationId = $result['data']['data']['id'] ?? null;

        // TEST 7: Double réservation (conflit 409)
        if ($reservationId) {
            $result = makeRequest('/reservations/create.php', 'POST', [
                'espace_id' => $espaceId,
                'date_debut' => $tomorrow,
                'date_fin' => $endDate,
                'participants' => 1
            ], $validToken);

            test('Métier', 'Double réservation', [409, 422],
                 $result['code'], 'Conflit horaire', $result['time']);
        }
    }
}

// TEST 8: Validation champs invalides (doit retourner 400 ou 422)
if ($validToken) {
    $result = makeRequest('/reservations/create.php', 'POST', [
        'espace_id' => '',
        'date_debut' => 'invalid',
    ], $validToken);

    test('Validation', 'Champs invalides', [400, 422],
         $result['code'], 'Validation backend', $result['time']);
}

// TEST 9: Méthode HTTP non autorisée (405)
$result = makeRequest('/auth/me.php', 'DELETE', null, $validToken);
test('HTTP', 'Méthode interdite', 405,
     $result['code'], 'Respect REST', $result['time']);

// TEST 10: Performance globale
$avgTime = array_sum(array_column($results, 'time')) / count($results);
test('Performance', 'Temps réponse', '< 2s',
     number_format($avgTime / 1000, 2) . 's', 'Temps réponse global', round($avgTime));

// Affichage tableau
echo str_repeat('-', 170) . "\n";
printf("| %-10s | %-35s | %-20s | %-7s | %-8s | %-30s | %-8s |\n",
    'MODULE', 'TEST', 'ATTENDU', 'REÇU', 'STATUT', 'DÉTAILS', 'TEMPS');
echo str_repeat('-', 170) . "\n";

foreach ($results as $r) {
    $color = $r['status'] == 'OK' ? C_GREEN : C_RED;
    printf("| %-10s | %-35s | %-20s | %-7s | %s%-8s%s | %-30s | %-8s |\n",
        $r['module'], $r['test'], $r['expected'], $r['actual'],
        $color, $r['status'], C_RESET,
        substr($r['details'], 0, 30), $r['time']);
}

echo str_repeat('-', 170) . "\n";

// Résumé
$conformity = round(($passed / $total) * 100);
$statusColor = $conformity >= 80 ? C_GREEN : ($conformity >= 50 ? C_YELLOW : C_RED);

echo "\n" . C_BOLD . "RÉSUMÉ GLOBAL :\n" . C_RESET;
echo C_GREEN . "✔ Tests réussis : $passed / $total\n" . C_RESET;
echo "📊 Taux de conformité : $statusColor$conformity %\n" . C_RESET;

if ($conformity < 80) {
    echo C_RED . "🚨 APPLICATION NON CONFORME (BLOQUANT PROD)\n" . C_RESET;
    exit(1);
} else {
    echo C_GREEN . "✅ APPLICATION CONFORME\n" . C_RESET;
    exit(0);
}

echo str_repeat('=', 60) . "\n\n";
