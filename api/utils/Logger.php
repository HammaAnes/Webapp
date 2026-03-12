<?php

/**
 * Utilitaire de logging standardisé
 * Gère les niveaux de log : INFO, WARNING, ERROR, SECURITY
 */

class Logger
{
    public const LEVEL_INFO = 'info';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_ERROR = 'error';
    public const LEVEL_SECURITY = 'security';

    private static $db = null;

    /**
     * Initialiser la connexion à la base de données
     */
    private static function getDb()
    {
        if (self::$db === null) {
            try {
                require_once __DIR__ . '/../config/database.php';
                self::$db = Database::getInstance()->getConnection();
            } catch (Exception $e) {
                error_log("Logger: Impossible de se connecter à la DB: " . $e->getMessage());
            }
        }
        return self::$db;
    }

    /**
     * Logger un message
     *
     * @param string $level Niveau du log (info, warning, error, security)
     * @param string $message Message à logger
     * @param array $context Contexte additionnel (optionnel)
     * @param string|null $userId ID de l'utilisateur (optionnel)
     */
    public static function log($level, $message, $context = [], $userId = null)
    {
        // Log dans error_log PHP (toujours)
        $logMessage = "[{$level}] {$message}";
        if (!empty($context)) {
            $logMessage .= " | Context: " . json_encode($context);
        }
        error_log($logMessage);

        // Tenter de logger en base de données
        try {
            $db = self::getDb();
            if ($db) {
                $query = "INSERT INTO logs (id, level, message, context, user_id, ip_address, created_at)
                          VALUES (UUID(), :level, :message, :context, :user_id, :ip_address, NOW())";

                $stmt = $db->prepare($query);
                $stmt->execute([
                    ':level' => $level,
                    ':message' => substr($message, 0, 1000), // Limiter à 1000 caractères
                    ':context' => !empty($context) ? json_encode($context) : null,
                    ':user_id' => $userId,
                    ':ip_address' => self::getClientIp()
                ]);
            }
        } catch (Exception $e) {
            // Si échec du log en DB, au moins on a le error_log
            error_log("Logger: Erreur lors du log en DB: " . $e->getMessage());
        }
    }

    /**
     * Logger une info
     */
    public static function info($message, $context = [], $userId = null)
    {
        self::log(self::LEVEL_INFO, $message, $context, $userId);
    }

    /**
     * Logger un warning
     */
    public static function warning($message, $context = [], $userId = null)
    {
        self::log(self::LEVEL_WARNING, $message, $context, $userId);
    }

    /**
     * Logger une erreur
     */
    public static function error($message, $context = [], $userId = null)
    {
        self::log(self::LEVEL_ERROR, $message, $context, $userId);
    }

    /**
     * Logger un événement de sécurité
     */
    public static function security($message, $context = [], $userId = null)
    {
        self::log(self::LEVEL_SECURITY, $message, $context, $userId);
    }

    /**
     * Obtenir l'IP du client
     */
    private static function getClientIp()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'] ?? null;
        }
    }
}
