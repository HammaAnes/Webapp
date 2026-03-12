<?php

/**
 * Configuration CORS et chargement .env
 */

// Charger le fichier .env si il existe
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorer les commentaires et lignes vides
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }

        // Parser la ligne KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Enlever les guillemets si présents
            $value = trim($value, '"\'');

            // Définir la variable d'environnement
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Configuration CORS sécurisée
$allowed_origins = [
    'https://test.coffice.dz',
    'https://coffice.dz',
    'https://www.coffice.dz',
    'http://localhost:5173', // Développement Vite
    'http://localhost:3000'  // Développement alternatif
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isDevelopment = ($_ENV['APP_ENV'] ?? getenv('APP_ENV')) === 'development';

// Vérifier si l'origine est autorisée
if (in_array($origin, $allowed_origins)) {
    // Origine autorisée - permettre credentials
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} elseif ($isDevelopment) {
    // En développement, autoriser toutes les origines SANS credentials
    header("Access-Control-Allow-Origin: *");
    // Ne pas définir Allow-Credentials avec wildcard origin
} else {
    // Origine non autorisée en production
    header("Access-Control-Allow-Origin: null");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Info, Apikey, Accept, Origin");

// Headers de sécurité HTTP
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Permissions-Policy: geolocation=(), microphone=(), camera=()");

// Content Security Policy (CSP) pour JSON API
if (!$isDevelopment) {
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none';");
}

// HSTS (HTTP Strict Transport Security) - Force HTTPS
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
}

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
