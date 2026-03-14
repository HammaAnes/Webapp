<?php

class EmailLogger
{
    public static function log(
        string $type,
        string $recipient,
        string $subject,
        string $status,
        ?string $userId = null,
        ?string $errorMessage = null,
        array $metadata = [],
        int $attempts = 1
    ): void {
        global $db;

        if (!$db) {
            return;
        }

        try {
            $id = UuidHelper::generate();
            $stmt = $db->prepare('
                INSERT INTO email_logs
                    (id, user_id, type, recipient, subject, status, attempts, error_message, metadata, sent_at)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $id,
                $userId,
                $type,
                $recipient,
                $subject,
                $status,
                $attempts,
                $errorMessage,
                !empty($metadata) ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
            ]);
        } catch (Exception $e) {
            Logger::error('EmailLogger: failed to write log', ['error' => $e->getMessage()]);
        }
    }

    public static function logSent(
        string $type,
        string $recipient,
        string $subject,
        ?string $userId = null,
        array $metadata = []
    ): void {
        self::log($type, $recipient, $subject, 'sent', $userId, null, $metadata);
    }

    public static function logFailed(
        string $type,
        string $recipient,
        string $subject,
        string $errorMessage,
        ?string $userId = null,
        int $attempts = 1,
        array $metadata = []
    ): void {
        self::log($type, $recipient, $subject, 'failed', $userId, $errorMessage, $metadata, $attempts);
    }

    public static function getLogs(
        int $page = 1,
        int $limit = 50,
        array $filters = []
    ): array {
        global $db;

        $offset = ($page - 1) * $limit;
        $where = [];
        $params = [];

        if (!empty($filters['type'])) {
            $where[] = 'el.type = ?';
            $params[] = $filters['type'];
        }
        if (!empty($filters['status'])) {
            $where[] = 'el.status = ?';
            $params[] = $filters['status'];
        }
        if (!empty($filters['user_id'])) {
            $where[] = 'el.user_id = ?';
            $params[] = $filters['user_id'];
        }
        if (!empty($filters['date_debut'])) {
            $where[] = 'DATE(el.sent_at) >= ?';
            $params[] = $filters['date_debut'];
        }
        if (!empty($filters['date_fin'])) {
            $where[] = 'DATE(el.sent_at) <= ?';
            $params[] = $filters['date_fin'];
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM email_logs el $whereClause");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare("
            SELECT
                el.*,
                CONCAT(u.prenom, ' ', u.nom) AS user_name,
                u.email AS user_email_addr
            FROM email_logs el
            LEFT JOIN users u ON el.user_id = u.id
            $whereClause
            ORDER BY el.sent_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'data'  => $logs,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit),
        ];
    }

    public static function getStats(): array
    {
        global $db;

        $stmt = $db->query("
            SELECT
                COUNT(*) AS total,
                SUM(status = 'sent') AS sent,
                SUM(status = 'failed') AS failed,
                SUM(status = 'bounced') AS bounced,
                COUNT(DISTINCT recipient) AS unique_recipients,
                COUNT(CASE WHEN sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS last_7_days,
                COUNT(CASE WHEN sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS last_30_days
            FROM email_logs
        ");

        $global = $stmt->fetch(PDO::FETCH_ASSOC);

        $byTypeStmt = $db->query("
            SELECT type, COUNT(*) AS count, SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed
            FROM email_logs
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY type
            ORDER BY count DESC
            LIMIT 10
        ");
        $byType = $byTypeStmt->fetchAll(PDO::FETCH_ASSOC);

        $trendStmt = $db->query("
            SELECT
                DATE(sent_at) AS date,
                COUNT(*) AS total,
                SUM(status = 'sent') AS sent,
                SUM(status = 'failed') AS failed
            FROM email_logs
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
            GROUP BY DATE(sent_at)
            ORDER BY date ASC
        ");
        $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'global'  => $global,
            'by_type' => $byType,
            'trend'   => $trend,
        ];
    }
}
