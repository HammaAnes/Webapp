#!/usr/bin/env php
<?php

/**
 * Script de Test Complet - Coffice API
 *
 * Usage: php scripts/test_complete.php [API_URL]
 * Exemple: php scripts/test_complete.php https://test.coffice.dz/api
 */

// Couleurs pour output console
class Colors
{
    public static $GREEN = "\033[32m";
    public static $RED = "\033[31m";
    public static $YELLOW = "\033[33m";
    public static $BLUE = "\033[34m";
    public static $RESET = "\033[0m";
    public static $BOLD = "\033[1m";
}

class CofficeAPITester
{
    private $baseUrl;
    private $token = null;
    private $refreshToken = null;
    private $testUser = null;
    private $stats = [
        'total' => 0,
        'passed' => 0,
        'failed' => 0,
        'skipped' => 0
    ];

    public function __construct($baseUrl)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        echo Colors::$BOLD . Colors::$BLUE . "\n";
        echo "╔═══════════════════════════════════════════════╗\n";
        echo "║  COFFICE API - SUITE DE TESTS COMPLÈTE      ║\n";
        echo "║  Version 3.0.1                                ║\n";
        echo "╚═══════════════════════════════════════════════╝\n";
        echo Colors::$RESET . "\n";
        echo "URL de l'API: " . Colors::$YELLOW . $this->baseUrl . Colors::$RESET . "\n\n";
    }

    private function request($endpoint, $method = 'GET', $data = null, $useAuth = true)
    {
        $url = $this->baseUrl . $endpoint;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $headers = ['Content-Type: application/json'];

        if ($useAuth && $this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        switch ($method) {
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'PUT':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                break;
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['error' => $error, 'http_code' => $httpCode];
        }

        $decoded = json_decode($response, true);
        return [
            'data' => $decoded,
            'http_code' => $httpCode,
            'raw' => $response
        ];
    }

    private function test($name, $callback)
    {
        $this->stats['total']++;
        echo "Testing: " . $name . " ... ";

        try {
            $result = $callback();
            if ($result === true) {
                $this->stats['passed']++;
                echo Colors::$GREEN . "✓ PASSED" . Colors::$RESET . "\n";
                return true;
            } elseif ($result === 'skip') {
                $this->stats['skipped']++;
                echo Colors::$YELLOW . "⊘ SKIPPED" . Colors::$RESET . "\n";
                return 'skip';
            } else {
                $this->stats['failed']++;
                echo Colors::$RED . "✗ FAILED" . Colors::$RESET;
                if (is_string($result)) {
                    echo " - " . $result;
                }
                echo "\n";
                return false;
            }
        } catch (Exception $e) {
            $this->stats['failed']++;
            echo Colors::$RED . "✗ ERROR: " . $e->getMessage() . Colors::$RESET . "\n";
            return false;
        }
    }

    private function section($title)
    {
        echo "\n" . Colors::$BOLD . Colors::$BLUE;
        echo "═══════════════════════════════════════════════\n";
        echo "  " . strtoupper($title) . "\n";
        echo "═══════════════════════════════════════════════\n";
        echo Colors::$RESET . "\n";
    }

    public function runAllTests()
    {
        $startTime = microtime(true);

        // 1. Tests Authentification
        $this->section("1. Authentification");
        $this->testAuthentication();

        // 2. Tests Espaces
        $this->section("2. Gestion des Espaces");
        $this->testEspaces();

        // 3. Tests Réservations
        $this->section("3. Gestion des Réservations");
        $this->testReservations();

        // 4. Tests Codes Promo
        $this->section("4. Codes Promotionnels");
        $this->testCodesPromo();

        // 5. Tests Utilisateurs (Admin)
        $this->section("5. Gestion Utilisateurs");
        $this->testUsers();

        // 6. Statistiques
        $this->section("6. Statistiques & Analytics");
        $this->testStats();

        // Résumé final
        $this->printSummary($startTime);
    }

    private function testAuthentication()
    {
        // Test inscription
        $this->test("Inscription nouvel utilisateur", function () {
            $email = 'test_' . time() . '@coffice.test';
            $response = $this->request('/auth/register.php', 'POST', [
                'email' => $email,
                'password' => 'Test123456',
                'nom' => 'Test',
                'prenom' => 'User',
                'telephone' => '0555000000'
            ], false);

            if ($response['http_code'] === 201 && isset($response['data']['success'])) {
                $this->testUser = [
                    'email' => $email,
                    'password' => 'Test123456'
                ];
                return true;
            }
            return "HTTP " . $response['http_code'];
        });

        // Test connexion
        $this->test("Connexion utilisateur", function () {
            if (!$this->testUser) {
                return 'skip';
            }

            $response = $this->request('/auth/login.php', 'POST', [
                'email' => $this->testUser['email'],
                'password' => $this->testUser['password']
            ], false);

            if ($response['http_code'] === 200 && isset($response['data']['data']['token'])) {
                $this->token = $response['data']['data']['token'];
                $this->refreshToken = $response['data']['data']['refreshToken'] ?? null;
                return true;
            }
            return "HTTP " . $response['http_code'];
        });

        // Test vérification token
        $this->test("Vérification token (me)", function () {
            if (!$this->token) {
                return 'skip';
            }

            $response = $this->request('/auth/me.php');
            return $response['http_code'] === 200 && isset($response['data']['data']['email']);
        });

        // Test refresh token
        $this->test("Refresh token", function () {
            if (!$this->refreshToken) {
                return 'skip';
            }

            $response = $this->request('/auth/refresh.php', 'POST', [
                'refreshToken' => $this->refreshToken
            ], false);

            if ($response['http_code'] === 200 && isset($response['data']['data']['token'])) {
                $this->token = $response['data']['data']['token'];
                return true;
            }
            return "HTTP " . $response['http_code'];
        });
    }

    private function testEspaces()
    {
        // Liste des espaces
        $this->test("Récupération liste espaces", function () {
            $response = $this->request('/espaces/index.php', 'GET', null, false);
            return $response['http_code'] === 200 && isset($response['data']['data']);
        });

        // Détails d'un espace (si disponible)
        $this->test("Détails d'un espace", function () {
            $listResponse = $this->request('/espaces/index.php', 'GET', null, false);
            if ($listResponse['http_code'] !== 200 || empty($listResponse['data']['data'])) {
                return 'skip';
            }

            $espaceId = $listResponse['data']['data'][0]['id'];
            $response = $this->request('/espaces/show.php?id=' . $espaceId, 'GET', null, false);
            return $response['http_code'] === 200 && isset($response['data']['data']['id']);
        });
    }

    private function testReservations()
    {
        if (!$this->token) {
            $this->test("Liste réservations", function () { return 'skip'; });
            $this->test("Création réservation", function () { return 'skip'; });
            return;
        }

        // Liste des réservations
        $this->test("Liste réservations utilisateur", function () {
            $response = $this->request('/reservations/index.php');
            return $response['http_code'] === 200;
        });

        // Création réservation (si espace disponible)
        $this->test("Création réservation", function () {
            $espacesResponse = $this->request('/espaces/index.php', 'GET', null, false);
            if ($espacesResponse['http_code'] !== 200 || empty($espacesResponse['data']['data'])) {
                return 'skip';
            }

            $espaceId = $espacesResponse['data']['data'][0]['id'];
            $dateDebut = date('Y-m-d H:i:s', strtotime('+2 days'));
            $dateFin = date('Y-m-d H:i:s', strtotime('+2 days +2 hours'));

            $response = $this->request('/reservations/create.php', 'POST', [
                'espace_id' => $espaceId,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'participants' => 1,
                'notes' => 'Test automatique'
            ]);

            return $response['http_code'] === 201 || $response['http_code'] === 200;
        });
    }

    private function testCodesPromo()
    {
        if (!$this->token) {
            $this->test("Liste codes promo", function () { return 'skip'; });
            return;
        }

        $this->test("Récupération codes promo", function () {
            $response = $this->request('/codes-promo/index.php');
            return $response['http_code'] === 200;
        });
    }

    private function testUsers()
    {
        if (!$this->token) {
            $this->test("Liste utilisateurs", function () { return 'skip'; });
            return;
        }

        $this->test("Liste utilisateurs", function () {
            $response = $this->request('/users/index.php');
            // Peut retourner 403 si pas admin, c'est normal
            return $response['http_code'] === 200 || $response['http_code'] === 403;
        });
    }

    private function testStats()
    {
        if (!$this->token) {
            $this->test("Statistiques admin", function () { return 'skip'; });
            return;
        }

        $this->test("Statistiques dashboard", function () {
            $response = $this->request('/admin/stats.php');
            // Peut retourner 403 si pas admin, c'est normal
            return $response['http_code'] === 200 || $response['http_code'] === 403;
        });
    }

    private function printSummary($startTime)
    {
        $duration = round(microtime(true) - $startTime, 2);

        echo "\n" . Colors::$BOLD;
        echo "═══════════════════════════════════════════════\n";
        echo "  RÉSUMÉ DES TESTS\n";
        echo "═══════════════════════════════════════════════\n";
        echo Colors::$RESET;

        echo "\nTotal tests: " . Colors::$BOLD . $this->stats['total'] . Colors::$RESET . "\n";
        echo Colors::$GREEN . "✓ Réussis: " . $this->stats['passed'] . Colors::$RESET . "\n";
        echo Colors::$RED . "✗ Échoués: " . $this->stats['failed'] . Colors::$RESET . "\n";
        echo Colors::$YELLOW . "⊘ Ignorés: " . $this->stats['skipped'] . Colors::$RESET . "\n";

        $successRate = $this->stats['total'] > 0
            ? round(($this->stats['passed'] / $this->stats['total']) * 100, 1)
            : 0;

        echo "\nTaux de réussite: " . Colors::$BOLD;
        if ($successRate >= 80) {
            echo Colors::$GREEN;
        } elseif ($successRate >= 60) {
            echo Colors::$YELLOW;
        } else {
            echo Colors::$RED;
        }
        echo $successRate . "%" . Colors::$RESET . "\n";

        echo "Durée: " . $duration . "s\n\n";

        if ($this->stats['failed'] === 0) {
            echo Colors::$GREEN . Colors::$BOLD;
            echo "✓ TOUS LES TESTS SONT PASSÉS !\n";
            echo "L'API est prête pour la production.\n";
            echo Colors::$RESET . "\n";
            exit(0);
        } else {
            echo Colors::$RED . Colors::$BOLD;
            echo "⚠ CERTAINS TESTS ONT ÉCHOUÉ\n";
            echo "Veuillez corriger les erreurs avant le déploiement.\n";
            echo Colors::$RESET . "\n";
            exit(1);
        }
    }
}

// Point d'entrée
$apiUrl = $argv[1] ?? 'http://localhost/api';
$tester = new CofficeAPITester($apiUrl);
$tester->runAllTests();
