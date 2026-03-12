<?php

/**
 * Configuration de la base de données MySQL pour Coffice
 * Singleton pattern pour optimiser les connexions
 */

class Database
{
    private static $instance = null;
    private static $envLoaded = false;

    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $charset;
    private $conn;

    private function __construct()
    {
        self::loadEnv();

        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->port = $_ENV['DB_PORT'] ?? '3306';
        $this->db_name = $_ENV['DB_NAME'] ?? 'cofficed_coffice';
        $this->username = $_ENV['DB_USER'] ?? 'cofficed_user';
        $this->password = $_ENV['DB_PASSWORD'] ?? '';
        $this->charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

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

    public function getConnection()
    {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false
            ];

            // Ajouter MYSQL_ATTR_INIT_COMMAND seulement si disponible
            if (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
                $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES {$this->charset} COLLATE {$this->charset}_unicode_ci, time_zone = '+00:00'";
            }

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

            // Fallback : exécuter SET NAMES si la constante n'était pas disponible
            if (!defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
                $this->conn->exec("SET NAMES {$this->charset} COLLATE {$this->charset}_unicode_ci");
                $this->conn->exec("SET time_zone = '+00:00'");
            }

        } catch (PDOException $e) {
            error_log("DB Connection Error: " . $e->getMessage());
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'message' => 'Erreur de connexion à la base de données'
            ]));
        }

        return $this->conn;
    }
}
