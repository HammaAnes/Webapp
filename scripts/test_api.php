#!/usr/bin/env php
<?php

/**
 * Script de test complet de toutes les fonctionnalités de l'API Coffice
 *
 * Usage: php scripts/test_api.php [URL_API]
 * Exemple: php scripts/test_api.php https://coffice.dz/api
 */

// Configuration
$API_URL = $argv[1] ?? 'http://localhost:8080/api';
$TIMESTAMP = time();
$TEST_EMAIL = "test_{$TIMESTAMP}@coffice.dz";
$TEST_PASSWORD = 'Test@123456';
$ADMIN_EMAIL = 'admin@coffice.dz';
$ADMIN_PASSWORD = 'Admin@Coffice2025';

// Couleurs pour le terminal
const COLOR_RESET = "\033[0m";
const COLOR_GREEN = "\033[32m";
const COLOR_RED = "\033[31m";
const COLOR_YELLOW = "\033[33m";
const COLOR_BLUE = "\033[34m";
const COLOR_CYAN = "\033[36m";

// Compteurs
$totalTests = 0;
$passedTests = 0;
$failedTests = 0;

// Variables pour stocker les données
$userToken = null;
$adminToken = null;
$userId = null;
$espaceId = null;
$reservationId = null;
$domiciliationId = null;
$codePromoId = null;

// Fonction pour afficher les messages
function logMessage($message, $color = COLOR_RESET)
{
    echo $color . $message . COLOR_RESET . PHP_EOL;
}

// Fonction pour logger un test
function logTest($name, $passed, $error = null)
{
    global $totalTests, $passedTests, $failedTests;

    $totalTests++;

    if ($passed) {
        $passedTests++;
        logMessage("✓ {$name}", COLOR_GREEN);
    } else {
        $failedTests++;
        logMessage("✗ {$name}", COLOR_RED);
        if ($error) {
            logMessage("  Erreur: {$error}", COLOR_RED);
        }
    }
}

// Fonction pour faire une requête API
function makeRequest($endpoint, $method = 'GET', $data = null, $token = null)
{
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

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decodedResponse = json_decode($response, true);

    return [
        'success' => $httpCode >= 200 && $httpCode < 300,
        'code' => $httpCode,
        'data' => $decodedResponse,
        'raw' => $response
    ];
}

// En-tête
logMessage('╔═══════════════════════════════════════════════════════╗', COLOR_BLUE);
logMessage('║   COFFICE - Test Complet de l\'API PHP                ║', COLOR_BLUE);
logMessage('╚═══════════════════════════════════════════════════════╝', COLOR_BLUE);
logMessage("\nURL API: {$API_URL}", COLOR_YELLOW);
logMessage("Date: " . date('d/m/Y H:i:s') . "\n", COLOR_YELLOW);

// TESTS AUTHENTIFICATION
logMessage("\n=== TESTS AUTHENTIFICATION ===", COLOR_CYAN);

// Test 1: Inscription utilisateur
$result = makeRequest('/auth/register.php', 'POST', [
    'email' => $TEST_EMAIL,
    'password' => $TEST_PASSWORD,
    'prenom' => 'Test',
    'nom' => 'User',
    'telephone' => '0555123456'
]);

$passed = $result['success'] && isset($result['data']['success']) && $result['data']['success'];
logTest('Inscription utilisateur', $passed, $passed ? null : json_encode($result['data']));

if ($passed && isset($result['data']['user']['id'])) {
    $userId = $result['data']['user']['id'];
}

// Test 2: Connexion utilisateur
$result = makeRequest('/auth/login.php', 'POST', [
    'email' => $TEST_EMAIL,
    'password' => $TEST_PASSWORD
]);

$passed = $result['success'] && isset($result['data']['token']);
logTest('Connexion utilisateur', $passed);

if ($passed) {
    $userToken = $result['data']['token'];
}

// Test 3: Récupération profil utilisateur
if ($userToken) {
    $result = makeRequest('/auth/me.php', 'GET', null, $userToken);
    $passed = $result['success'] && isset($result['data']['user']);
    logTest('Récupération profil utilisateur', $passed);
}

// Test 4: Connexion admin
$result = makeRequest('/auth/login.php', 'POST', [
    'email' => $ADMIN_EMAIL,
    'password' => $ADMIN_PASSWORD
]);

$passed = $result['success'] && isset($result['data']['token']);
logTest('Connexion administrateur', $passed);

if ($passed) {
    $adminToken = $result['data']['token'];
}

// Test 5: Déconnexion
if ($userToken) {
    $result = makeRequest('/auth/logout.php', 'POST', null, $userToken);
    $passed = $result['success'];
    logTest('Déconnexion', $passed);

    // Reconnecter pour les tests suivants
    $result = makeRequest('/auth/login.php', 'POST', [
        'email' => $TEST_EMAIL,
        'password' => $TEST_PASSWORD
    ]);
    if ($result['success'] && isset($result['data']['token'])) {
        $userToken = $result['data']['token'];
    }
}

// TESTS GESTION DES ESPACES
logMessage("\n=== TESTS GESTION DES ESPACES ===", COLOR_CYAN);

// Test 6: Liste des espaces (public)
$result = makeRequest('/espaces/index.php');
$passed = $result['success'] && isset($result['data']['data']) && is_array($result['data']['data']);
logTest('Liste des espaces (public)', $passed);

if ($passed && count($result['data']['data']) > 0) {
    $espaceId = $result['data']['data'][0]['id'];
}

// Test 7: Détails d'un espace
if ($espaceId) {
    $result = makeRequest("/espaces/show.php?id={$espaceId}");
    $passed = $result['success'] && isset($result['data']['data']);
    logTest('Détails d\'un espace', $passed);
}

// Test 8: Création espace (admin)
if ($adminToken) {
    $result = makeRequest('/espaces/create.php', 'POST', [
        'nom' => "Espace Test {$TIMESTAMP}",
        'type' => 'bureau',
        'capacite' => 4,
        'prixHeure' => 2000,
        'prixJour' => 10000,
        'description' => 'Espace de test',
        'statut' => 'disponible'
    ], $adminToken);

    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Création d\'un espace (admin)', $passed);
}

// TESTS RÉSERVATIONS
logMessage("\n=== TESTS RÉSERVATIONS ===", COLOR_CYAN);

// Test 9: Créer une réservation
if ($userToken && $espaceId) {
    $tomorrow = date('Y-m-d\TH:i:s', strtotime('tomorrow 09:00:00'));
    $endDate = date('Y-m-d\TH:i:s', strtotime('tomorrow 17:00:00'));

    $result = makeRequest('/reservations/create.php', 'POST', [
        'espaceId' => $espaceId,
        'dateDebut' => $tomorrow,
        'dateFin' => $endDate,
        'typeReservation' => 'jour',
        'notes' => 'Réservation de test'
    ], $userToken);

    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Création d\'une réservation', $passed, $passed ? null : json_encode($result['data']));

    if ($passed && isset($result['data']['data'])) {
        $reservationId = is_array($result['data']['data']) ? $result['data']['data']['id'] : $result['data']['data'];
    }
}

// Test 10: Liste des réservations utilisateur
if ($userToken) {
    $result = makeRequest('/reservations/index.php', 'GET', null, $userToken);
    $passed = $result['success'] && isset($result['data']['data']);
    logTest('Liste des réservations utilisateur', $passed);
}

// Test 11: Détails d'une réservation
if ($userToken && $reservationId) {
    $result = makeRequest("/reservations/show.php?id={$reservationId}", 'GET', null, $userToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Détails d\'une réservation', $passed);
}

// Test 12: Annulation d'une réservation
if ($userToken && $reservationId) {
    $result = makeRequest("/reservations/cancel.php?id={$reservationId}", 'POST', null, $userToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Annulation d\'une réservation', $passed);
}

// TESTS DOMICILIATION
logMessage("\n=== TESTS DOMICILIATION ===", COLOR_CYAN);

// Test 13: Création demande domiciliation
if ($userToken && $userId) {
    $result = makeRequest('/domiciliations/create.php', 'POST', [
        'userId' => $userId,
        'raisonSociale' => 'Test Company SARL',
        'formeJuridique' => 'SARL',
        'nif' => '099012345678901',
        'representantLegal' => [
            'nom' => 'User',
            'prenom' => 'Test',
            'email' => $TEST_EMAIL,
            'telephone' => '0555123456'
        ]
    ], $userToken);

    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Création demande domiciliation', $passed, $passed ? null : json_encode($result['data']));

    if ($passed && isset($result['data']['data'])) {
        $domiciliationId = is_array($result['data']['data']) ? $result['data']['data']['id'] : $result['data']['data'];
    }
}

// Test 14: Liste des demandes (user)
if ($userToken) {
    $result = makeRequest('/domiciliations/user.php', 'GET', null, $userToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Liste demandes domiciliation (user)', $passed);
}

// Test 15: Validation domiciliation (admin)
if ($adminToken && $domiciliationId) {
    $result = makeRequest("/domiciliations/validate.php?id={$domiciliationId}", 'POST', null, $adminToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Validation domiciliation (admin)', $passed);
}

// TESTS CODES PROMO
logMessage("\n=== TESTS CODES PROMO ===", COLOR_CYAN);

// Test 16: Création code promo
if ($adminToken) {
    $today = date('Y-m-d');
    $future = date('Y-m-d', strtotime('+30 days'));

    $result = makeRequest('/codes-promo/create.php', 'POST', [
        'code' => "TEST{$TIMESTAMP}",
        'description' => 'Code promo de test',
        'typeRemise' => 'pourcentage',
        'valeurRemise' => 20,
        'dateDebut' => $today,
        'dateFin' => $future,
        'utilisationsMax' => 100,
        'actif' => true
    ], $adminToken);

    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Création code promo (admin)', $passed);

    if ($passed && isset($result['data']['data'])) {
        $codePromoId = is_array($result['data']['data']) ? $result['data']['data']['id'] : $result['data']['data'];
    }
}

// Test 17: Liste codes promo
if ($adminToken) {
    $result = makeRequest('/codes-promo/index.php', 'GET', null, $adminToken);
    $passed = $result['success'] && isset($result['data']['data']);
    logTest('Liste des codes promo (admin)', $passed);
}

// TESTS GESTION UTILISATEURS
logMessage("\n=== TESTS GESTION UTILISATEURS ===", COLOR_CYAN);

// Test 18: Liste utilisateurs (admin)
if ($adminToken) {
    $result = makeRequest('/users/index.php', 'GET', null, $adminToken);
    $passed = $result['success'] && isset($result['data']['data']);
    logTest('Liste des utilisateurs (admin)', $passed);
}

// Test 19: Détails utilisateur
if ($adminToken && $userId) {
    $result = makeRequest("/users/show.php?id={$userId}", 'GET', null, $adminToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Détails d\'un utilisateur (admin)', $passed);
}

// Test 20: Statistiques admin
if ($adminToken) {
    $result = makeRequest('/admin/stats.php', 'GET', null, $adminToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Statistiques admin', $passed);
}

// Test 21: Revenus admin
if ($adminToken) {
    $result = makeRequest('/admin/revenue.php', 'GET', null, $adminToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Revenus admin', $passed);
}

// TESTS NOTIFICATIONS
logMessage("\n=== TESTS NOTIFICATIONS ===", COLOR_CYAN);

// Test 22: Liste notifications
if ($userToken) {
    $result = makeRequest('/notifications/index.php', 'GET', null, $userToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Liste des notifications', $passed);
}

// Test 23: Marquer toutes comme lues
if ($userToken) {
    $result = makeRequest('/notifications/read-all.php', 'POST', null, $userToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Marquer notifications comme lues', $passed);
}

// TESTS PARRAINAGE
logMessage("\n=== TESTS PARRAINAGE ===", COLOR_CYAN);

// Test 24: Liste parrainages
if ($userToken) {
    $result = makeRequest('/parrainages/index.php', 'GET', null, $userToken);
    $passed = $result['success'] && isset($result['data']['success']);
    logTest('Liste des parrainages', $passed);
}

// RÉSUMÉ FINAL
logMessage("\n╔═══════════════════════════════════════════════════════╗", COLOR_BLUE);
logMessage("║                   RÉSUMÉ DES TESTS                      ║", COLOR_BLUE);
logMessage("╚═══════════════════════════════════════════════════════╝", COLOR_BLUE);
logMessage("\nTotal de tests: {$totalTests}", COLOR_CYAN);
logMessage("Tests réussis: {$passedTests}", COLOR_GREEN);
logMessage("Tests échoués: {$failedTests}", COLOR_RED);

if ($totalTests > 0) {
    $successRate = round(($passedTests / $totalTests) * 100, 2);
    $rateColor = $successRate >= 80 ? COLOR_GREEN : COLOR_YELLOW;
    logMessage("Taux de réussite: {$successRate}%\n", $rateColor);

    if ($failedTests === 0) {
        logMessage("✅ TOUS LES TESTS SONT PASSÉS !", COLOR_GREEN);
        exit(0);
    } else {
        logMessage("⚠️  {$failedTests} test(s) ont échoué", COLOR_YELLOW);
        exit(1);
    }
} else {
    logMessage("❌ Aucun test exécuté", COLOR_RED);
    exit(1);
}
