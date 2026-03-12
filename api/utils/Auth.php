<?php

/**
 * Classe pour gérer l'authentification JWT
 */

class Auth
{
    private static $envLoaded = false;
    private static $issuer = "coffice.dz";
    private static $audience = "coffice-app";

    private static function loadEnv()
    {
        if (self::$envLoaded) {
            return;
        }

        $envFile = file_exists(__DIR__ . '/../.env')
            ? __DIR__ . '/../.env'
            : __DIR__ . '/../../.env';

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

        self::$envLoaded = true;
    }

    private static function getSecretKey()
    {
        self::loadEnv();
        $key = getenv('JWT_SECRET') ?: ($_ENV['JWT_SECRET'] ?? null);
        if (!$key) {
            error_log("CRITICAL ERROR: JWT_SECRET is not configured in .env file");
            throw new Exception("JWT_SECRET configuration is missing. Please set JWT_SECRET in your .env file.");
        }
        return $key;
    }

    /**
     * Générer un token JWT (access token)
     */
    public static function generateToken($user_id, $email, $role)
    {
        $issued_at = time();
        $expiration = $issued_at + (60 * 60); // 1 heure

        $payload = array(
            "iss" => self::$issuer,
            "aud" => self::$audience,
            "iat" => $issued_at,
            "exp" => $expiration,
            "type" => "access",
            "data" => array(
                "id" => $user_id,
                "email" => $email,
                "role" => $role
            )
        );

        return self::encode($payload);
    }

    /**
     * Générer un refresh token (durée de vie plus longue)
     */
    public static function generateRefreshToken($user_id, $email, $role)
    {
        $issued_at = time();
        $expiration = $issued_at + (30 * 24 * 60 * 60); // 30 jours

        $payload = array(
            "iss" => self::$issuer,
            "aud" => self::$audience,
            "iat" => $issued_at,
            "exp" => $expiration,
            "type" => "refresh",
            "data" => array(
                "id" => $user_id,
                "email" => $email,
                "role" => $role
            )
        );

        return self::encode($payload);
    }

    /**
     * Vérifier et décoder un token
     */
    public static function validateToken($token)
    {
        try {
            $decoded = self::decode($token);

            // Vérifier l'expiration
            if ($decoded->exp < time()) {
                return false;
            }

            // Vérifier l'émetteur
            if ($decoded->iss !== self::$issuer) {
                return false;
            }

            return $decoded->data;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Encoder un payload en JWT (simple implementation)
     */
    private static function encode($payload)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $header = self::base64UrlEncode($header);

        $payload = json_encode($payload);
        $payload = self::base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $header . "." . $payload, self::getSecretKey(), true);
        $signature = self::base64UrlEncode($signature);

        return $header . "." . $payload . "." . $signature;
    }

    /**
     * Décoder un JWT
     */
    private static function decode($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new Exception("Invalid token format");
        }

        list($header, $payload, $signature) = $parts;

        // Vérifier la signature
        $valid_signature = hash_hmac('sha256', $header . "." . $payload, self::getSecretKey(), true);
        $valid_signature = self::base64UrlEncode($valid_signature);

        if ($signature !== $valid_signature) {
            throw new Exception("Invalid signature");
        }

        $payload = json_decode(self::base64UrlDecode($payload));

        if (!$payload) {
            throw new Exception("Invalid payload");
        }

        return $payload;
    }

    /**
     * Helper pour encoder en base64 URL-safe
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Helper pour décoder du base64 URL-safe
     */
    private static function base64UrlDecode($data)
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Hasher un mot de passe
     */
    public static function hashPassword($password)
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    /**
     * Vérifier un mot de passe
     */
    public static function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    /**
     * Récupérer le token Bearer depuis les headers
     * Compatible avec tous les serveurs (Apache, Nginx, etc.)
     */
    public static function getBearerToken()
    {
        $auth_header = null;

        // Méthode 1: getallheaders() (Apache, Nginx avec PHP-FPM)
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] :
                          (isset($headers['authorization']) ? $headers['authorization'] : null);
        }

        // Méthode 2: $_SERVER['HTTP_AUTHORIZATION'] (Nginx, lighttpd)
        if (!$auth_header && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        }

        // Méthode 3: apache_request_headers() (Apache uniquement)
        if (!$auth_header && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] :
                          (isset($headers['authorization']) ? $headers['authorization'] : null);
        }

        // Méthode 4: $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] (Apache avec .htaccess RewriteRule)
        if (!$auth_header && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        // Méthode 5: getenv() pour cPanel (variable d'environnement créée par RewriteRule)
        if (!$auth_header) {
            $env_auth = getenv('HTTP_AUTHORIZATION') ?: getenv('REDIRECT_HTTP_AUTHORIZATION');
            if ($env_auth) {
                $auth_header = $env_auth;
            }
        }

        // Méthode 6: $_ENV pour compatibilité totale
        if (!$auth_header && isset($_ENV['HTTP_AUTHORIZATION'])) {
            $auth_header = $_ENV['HTTP_AUTHORIZATION'];
        }

        if (!$auth_header && isset($_ENV['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth_header = $_ENV['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (empty($auth_header)) {
            return null;
        }

        // Extraire le token (format: "Bearer TOKEN")
        if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Vérifier l'authentification et retourner les données utilisateur
     * Utiliser cette méthode dans tous les endpoints protégés
     */
    public static function verifyAuth()
    {
        $token = self::getBearerToken();

        if (!$token) {
            require_once __DIR__ . '/Response.php';
            Response::error("Token d'authentification manquant", 401);
            exit;
        }

        $userData = self::validateToken($token);

        if (!$userData) {
            require_once __DIR__ . '/Response.php';
            Response::error("Token invalide ou expiré", 401);
            exit;
        }

        return [
            'id' => $userData->id,
            'email' => $userData->email,
            'role' => $userData->role
        ];
    }

    /**
     * Vérifier que l'utilisateur est admin (sinon erreur 403)
     */
    public static function requireAdmin()
    {
        $auth = self::verifyAuth();

        if ($auth['role'] !== 'admin') {
            require_once __DIR__ . '/Response.php';
            Response::error("Accès refusé - droits administrateur requis", 403);
            exit;
        }

        return $auth;
    }

}
