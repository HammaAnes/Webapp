<?php

/**
 * Bootstrap - Fichier d'initialisation complet pour l'API Coffice
 * Charge et configure tous les composants nécessaires au fonctionnement de l'API
 *
 * Usage dans un endpoint:
 * require_once __DIR__ . '/../bootstrap.php';
 */

// =====================================================
// CONFIGURATION ENVIRONNEMENT PHP
// =====================================================

// Timezone
date_default_timezone_set('Africa/Algiers');

// Encodage
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

// Configuration erreurs (production vs développement)
$isProduction = ($_ENV['APP_ENV'] ?? 'production') === 'production';

if ($isProduction) {
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    ini_set('log_errors', '1');
}

// Logs directory
$logDir = __DIR__ . '/../logs';
if (!file_exists($logDir)) {
    if (!mkdir($logDir, 0755, true) && !is_dir($logDir)) {
        error_log('Failed to create logs directory: ' . $logDir);
    }
}
if (is_dir($logDir) && is_writable($logDir)) {
    ini_set('error_log', $logDir . '/php_errors.log');
}

// Limites de mémoire et temps d'exécution
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '60');

// Upload configuration
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');

// Session configuration (si nécessaire pour certains endpoints)
ini_set('session.cookie_httponly', '1');
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);
ini_set('session.cookie_secure', $isHttps ? '1' : '0');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', 'Lax');

// =====================================================
// CHARGEMENT CONFIGURATION
// =====================================================

// Charger .env si disponible
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        if ($key !== '' && !isset($_ENV[$key])) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

// =====================================================
// CHARGEMENT CORS
// =====================================================

require_once __DIR__ . '/config/cors.php';

// =====================================================
// CHARGEMENT UTILITAIRES ESSENTIELS
// =====================================================

// Gestionnaire de réponses HTTP
require_once __DIR__ . '/utils/Response.php';

// UUID Helper
require_once __DIR__ . '/utils/UuidHelper.php';

// Logger
require_once __DIR__ . '/utils/Logger.php';

// =====================================================
// GESTIONNAIRE D'ERREURS GLOBAL
// =====================================================

// Gestionnaire d'erreurs PHP
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    // Ne pas traiter les erreurs supprimées avec @
    if (!(error_reporting() & $errno)) {
        return false;
    }

    $errorTypes = [
        E_ERROR => 'ERROR',
        E_WARNING => 'WARNING',
        E_PARSE => 'PARSE',
        E_NOTICE => 'NOTICE',
        E_CORE_ERROR => 'CORE_ERROR',
        E_CORE_WARNING => 'CORE_WARNING',
        E_COMPILE_ERROR => 'COMPILE_ERROR',
        E_COMPILE_WARNING => 'COMPILE_WARNING',
        E_USER_ERROR => 'USER_ERROR',
        E_USER_WARNING => 'USER_WARNING',
        E_USER_NOTICE => 'USER_NOTICE',
        E_STRICT => 'STRICT',
        E_RECOVERABLE_ERROR => 'RECOVERABLE_ERROR',
        E_DEPRECATED => 'DEPRECATED',
        E_USER_DEPRECATED => 'USER_DEPRECATED',
    ];

    $errorType = $errorTypes[$errno] ?? 'UNKNOWN';

    Logger::error("PHP $errorType: $errstr", [
        'file' => $errfile,
        'line' => $errline,
        'type' => $errorType
    ]);

    // Ne pas exécuter le gestionnaire d'erreurs interne de PHP
    return true;
});

// Gestionnaire d'exceptions non capturées
set_exception_handler(function ($exception) {
    Logger::error('Uncaught Exception: ' . $exception->getMessage(), [
        'exception' => get_class($exception),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString()
    ]);

    // Réponse JSON en cas d'exception non capturée
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Une erreur interne est survenue',
        'message' => $isProduction ? 'Erreur serveur' : $exception->getMessage()
    ]);
    exit;
});

// Gestionnaire d'arrêt fatal
register_shutdown_function(function () {
    $error = error_get_last();

    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        Logger::error('Fatal Error: ' . $error['message'], [
            'file' => $error['file'],
            'line' => $error['line'],
            'type' => $error['type']
        ]);

        // Si les headers n'ont pas encore été envoyés
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Une erreur fatale est survenue',
                'message' => 'Erreur serveur'
            ]);
        }
    }
});

// =====================================================
// CHARGEMENT BASE DE DONNÉES
// =====================================================

require_once __DIR__ . '/config/database.php';

try {
    $database = Database::getInstance();
    $db = $database->getConnection();
} catch (Exception $e) {
    Logger::error('Database connection failed: ' . $e->getMessage());
    Response::error('Service temporairement indisponible', 503);
    exit;
}

// =====================================================
// CHARGEMENT AUTRES UTILITAIRES
// =====================================================

// Authentification
require_once __DIR__ . '/utils/Auth.php';

// Validation
require_once __DIR__ . '/utils/Validator.php';

// Sanitization
require_once __DIR__ . '/utils/Sanitizer.php';

// Rate Limiting
require_once __DIR__ . '/utils/RateLimiter.php';

// Pagination
require_once __DIR__ . '/utils/Pagination.php';

// Error Handler
require_once __DIR__ . '/utils/ErrorHandler.php';

// Mailer
require_once __DIR__ . '/utils/Mailer.php';

// Admin Notifier
require_once __DIR__ . '/utils/AdminNotifier.php';

// =====================================================
// FONCTIONS GLOBALES HELPERS
// =====================================================

/**
 * Obtenir la connexion à la base de données
 */
function getDb(): PDO
{
    return Database::getInstance()->getConnection();
}

/**
 * Obtenir le logger
 * @deprecated Utiliser directement les méthodes statiques Logger::error(), Logger::info(), etc.
 */
function getLogger(): string
{
    return 'Logger';
}

/**
 * Logger un message info
 */
function logInfo(string $message, array $context = []): void
{
    Logger::info($message, $context);
}

/**
 * Logger un warning
 */
function logWarning(string $message, array $context = []): void
{
    Logger::warning($message, $context);
}

/**
 * Logger une erreur
 */
function logError(string $message, array $context = []): void
{
    Logger::error($message, $context);
}

/**
 * Générer un UUID
 */
function generateUuid(): string
{
    return UuidHelper::generate();
}

/**
 * Valider un UUID
 */
function isValidUuid(string $uuid): bool
{
    return UuidHelper::isValid($uuid);
}

/**
 * Obtenir l'utilisateur authentifié
 */
function getAuthUser(): ?array
{
    try {
        return Auth::verifyAuth();
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Vérifier si l'utilisateur est admin
 */
function isAdmin(): bool
{
    $user = getAuthUser();
    return $user && ($user['role'] ?? '') === 'admin';
}

/**
 * Obtenir une variable d'environnement
 */
function env(string $key, $default = null)
{
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

/**
 * Sanitizer une chaîne
 */
function sanitize(string $input): string
{
    return Sanitizer::cleanHtml($input);
}

/**
 * Sanitizer un email
 */
function sanitizeEmail(string $email): ?string
{
    return Sanitizer::cleanEmail($email);
}

/**
 * Valider un email
 */
function isValidEmail(string $email): bool
{
    return Validator::isValidEmail($email);
}

/**
 * Valider un numéro de téléphone algérien
 */
function isValidPhone(string $phone): bool
{
    return Validator::isValidPhone($phone);
}

/**
 * Obtenir l'adresse IP du client
 */
function getClientIp(): string
{
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Obtenir le User-Agent
 */
function getUserAgent(): string
{
    return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
}

/**
 * Vérifier si la requête est AJAX
 */
function isAjaxRequest(): bool
{
    return !empty($_SERVER['HTTP_X_REQUESTED_WITH'])
        && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

/**
 * Obtenir la méthode HTTP
 */
function getRequestMethod(): string
{
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Obtenir les données JSON du body
 */
function getJsonInput()
{
    $input = file_get_contents('php://input');
    return json_decode($input);
}

/**
 * Envoyer une réponse JSON succès
 */
function jsonSuccess($data = null, string $message = null, int $code = 200): void
{
    Response::success($data, $message, $code);
}

/**
 * Envoyer une réponse JSON erreur
 */
function jsonError(string $message, int $code = 400): void
{
    Response::error($message, $code);
}

/**
 * Créer une pagination
 */
function paginate(int $total, int $page = 1, int $perPage = 20): array
{
    return Pagination::create($total, $page, $perPage);
}

// =====================================================
// LOGGING INITIAL
// =====================================================

Logger::info('API Bootstrap initialized', [
    'method' => getRequestMethod(),
    'uri' => $_SERVER['REQUEST_URI'] ?? '',
    'ip' => getClientIp()
]);

// =====================================================
// RETOUR DES DÉPENDANCES COMMUNES
// =====================================================

return [
    'db' => $db,
    'validator' => new Validator(),
    'sanitizer' => new Sanitizer(),
    'isProduction' => $isProduction
];