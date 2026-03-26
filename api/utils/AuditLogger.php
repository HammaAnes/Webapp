<?php

/**
 * Classe pour logger les actions dans le système d'audit
 */
require_once __DIR__ . '/IpHelper.php';

class AuditLogger
{
    private static $db = null;

    private static function getDb(): ?PDO
    {
        if (self::$db === null) {
            try {
                require_once __DIR__ . '/../config/database.php';
                require_once __DIR__ . '/UuidHelper.php';
                self::$db = Database::getInstance()->getConnection();
            } catch (Exception $e) {
                error_log("AuditLogger: impossible de se connecter à la DB: " . $e->getMessage());
            }
        }
        return self::$db;
    }

    /**
     * Logger une action
     *
     * @param string $action Action effectuée (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
     * @param string|null $userId ID de l'utilisateur
     * @param string|null $entityType Type d'entité (user, reservation, domiciliation, etc.)
     * @param string|null $entityId ID de l'entité
     * @param array|null $oldValues Valeurs avant modification
     * @param array|null $newValues Valeurs après modification
     */
    public static function log(
        $action,
        $userId = null,
        $entityType = null,
        $entityId = null,
        $oldValues = null,
        $newValues = null
    ) {
        try {
            $db = self::getDb();

            // Récupérer IP et User Agent
            $ipAddress = IpHelper::getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

            $changesJson = null;
            if ($oldValues || $newValues) {
                $changesArray = [];
                if ($oldValues) $changesArray['old'] = $oldValues;
                if ($newValues) $changesArray['new'] = $newValues;
                $changesJson = json_encode($changesArray, JSON_UNESCAPED_UNICODE);
            }

            $query = "INSERT INTO audit_logs
                      (id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at)
                      VALUES
                      (:id, :user_id, :action, :entity_type, :entity_id, :changes, :ip_address, :user_agent, NOW())";

            $stmt = $db->prepare($query);
            $stmt->execute([
                ':id' => UuidHelper::generate(),
                ':user_id' => $userId,
                ':action' => $action,
                ':entity_type' => $entityType,
                ':entity_id' => $entityId,
                ':changes' => $changesJson,
                ':ip_address' => $ipAddress,
                ':user_agent' => $userAgent
            ]);

            return true;
        } catch (Exception $e) {
            // Ne pas bloquer l'application si le logging échoue
            error_log("Audit log error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Logger une connexion
     */
    public static function logLogin($userId, $success = true)
    {
        self::log(
            $success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            $userId,
            'auth',
            null,
            null,
            ['success' => $success]
        );
    }

    /**
     * Logger une déconnexion
     */
    public static function logLogout($userId)
    {
        self::log('LOGOUT', $userId, 'auth');
    }

    /**
     * Logger une création
     */
    public static function logCreate($userId, $entityType, $entityId, $values)
    {
        self::log('CREATE', $userId, $entityType, $entityId, null, $values);
    }

    /**
     * Logger une modification
     */
    public static function logUpdate($userId, $entityType, $entityId, $oldValues, $newValues)
    {
        self::log('UPDATE', $userId, $entityType, $entityId, $oldValues, $newValues);
    }

    /**
     * Logger une suppression
     */
    public static function logDelete($userId, $entityType, $entityId, $oldValues = null)
    {
        self::log('DELETE', $userId, $entityType, $entityId, $oldValues, null);
    }

    /**
     * Logger une action personnalisée
     */
    public static function logAction($action, $userId, $entityType = null, $entityId = null, $data = null)
    {
        self::log($action, $userId, $entityType, $entityId, null, $data);
    }

    /**
     * Récupérer les logs d'un utilisateur
     */
    public static function getUserLogs($userId, $limit = 50, $offset = 0)
    {
        try {
            $db = self::getDb();

            $query = "SELECT * FROM audit_logs
                      WHERE user_id = :user_id
                      ORDER BY created_at DESC
                      LIMIT :limit OFFSET :offset";

            $stmt = $db->prepare($query);
            $stmt->bindValue(':user_id', $userId);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Get user logs error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Récupérer les logs d'une entité
     */
    public static function getEntityLogs($entityType, $entityId, $limit = 50)
    {
        try {
            $db = self::getDb();

            $query = "SELECT al.*, u.nom, u.prenom, u.email
                      FROM audit_logs al
                      LEFT JOIN persons u ON al.user_id = u.id
                      WHERE al.entity_type = :entity_type
                      AND al.entity_id = :entity_id
                      ORDER BY al.created_at DESC
                      LIMIT :limit";

            $stmt = $db->prepare($query);
            $stmt->bindValue(':entity_type', $entityType);
            $stmt->bindValue(':entity_id', $entityId);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Get entity logs error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Nettoyer les logs anciens (à appeler via cron)
     */
    public static function cleanup($days = 365)
    {
        try {
            $db = self::getDb();

            $query = "DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";

            $stmt = $db->prepare($query);
            $stmt->execute([':days' => $days]);

            $deleted = $stmt->rowCount();

            error_log("Audit logs cleanup: $deleted logs deleted");

            return $deleted;
        } catch (Exception $e) {
            error_log("Audit logs cleanup error: " . $e->getMessage());
            return 0;
        }
    }
}
