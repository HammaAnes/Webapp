<?php

/**
 * Rate Limiter simple basé sur fichiers
 * Protège contre les attaques brute force
 */

class RateLimiter
{
    private static $cacheDir = __DIR__ . '/../.cache/ratelimit/';

    /**
     * Vérifie si une IP a dépassé la limite de requêtes
     * @param string $identifier Identifiant unique (IP, user_id, etc.)
     * @param int $maxAttempts Nombre maximum de tentatives
     * @param int $decayMinutes Durée en minutes avant reset
     * @return bool True si limite dépassée
     */
    public static function tooManyAttempts($identifier, $maxAttempts = 60, $decayMinutes = 1)
    {
        $key = self::getKey($identifier);
        $data = self::getData($key);

        $now = time();
        $windowStart = $now - ($decayMinutes * 60);

        // Nettoyer les anciennes tentatives
        $data['attempts'] = array_filter($data['attempts'], function ($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });

        return count($data['attempts']) >= $maxAttempts;
    }

    /**
     * Enregistre une tentative
     */
    public static function hit($identifier)
    {
        $key = self::getKey($identifier);
        $data = self::getData($key);

        $data['attempts'][] = time();
        self::saveData($key, $data);
    }

    /**
     * Reset le compteur
     */
    public static function clear($identifier)
    {
        $key = self::getKey($identifier);
        $file = self::$cacheDir . $key;
        if (file_exists($file)) {
            unlink($file);
        }
    }

    /**
     * Obtenir le nombre de tentatives restantes
     */
    public static function retriesLeft($identifier, $maxAttempts = 60, $decayMinutes = 1)
    {
        $key = self::getKey($identifier);
        $data = self::getData($key);

        $now = time();
        $windowStart = $now - ($decayMinutes * 60);

        $data['attempts'] = array_filter($data['attempts'], function ($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });

        return max(0, $maxAttempts - count($data['attempts']));
    }

    /**
     * Obtenir le temps avant le prochain essai
     */
    public static function availableIn($identifier, $decayMinutes = 1)
    {
        $key = self::getKey($identifier);
        $data = self::getData($key);

        if (empty($data['attempts'])) {
            return 0;
        }

        $oldestAttempt = min($data['attempts']);
        $expiresAt = $oldestAttempt + ($decayMinutes * 60);

        return max(0, $expiresAt - time());
    }

    // Méthodes privées

    private static function getKey($identifier)
    {
        return md5($identifier);
    }

    private static function getData($key)
    {
        self::ensureCacheDir();

        $file = self::$cacheDir . $key;

        if (file_exists($file)) {
            $content = file_get_contents($file);
            $data = json_decode($content, true);
            if ($data) {
                return $data;
            }
        }

        return ['attempts' => []];
    }

    private static function saveData($key, $data)
    {
        self::ensureCacheDir();

        $file = self::$cacheDir . $key;
        file_put_contents($file, json_encode($data));
    }

    private static function ensureCacheDir()
    {
        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0755, true);
        }
    }

    /**
     * Nettoyer les vieux fichiers de cache (appelé périodiquement)
     */
    public static function cleanup($olderThanHours = 24)
    {
        self::ensureCacheDir();

        $files = glob(self::$cacheDir . '*');
        $threshold = time() - ($olderThanHours * 3600);

        foreach ($files as $file) {
            if (filemtime($file) < $threshold) {
                unlink($file);
            }
        }
    }
}
