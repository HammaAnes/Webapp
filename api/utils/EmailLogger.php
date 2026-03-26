<?php

class EmailLogger
{
    public static function log(
        string $template,
        string $toEmail,
        string $subject,
        string $status,
        ?string $userId = null,
        ?string $contactId = null,
        ?string $errorMessage = null,
        array $metadata = []
    ): void {
        global $db;

        if (!$db) {
            return;
        }

        try {
            $id = UuidHelper::generate();
            $stmt = $db->prepare('
                INSERT INTO email_logs
                    (id, person_id, template, to_email, subject, status, error_message, metadata, created_at)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $id,
                $userId ?? $contactId,
                $template,
                $toEmail,
                $subject,
                $status,
                $errorMessage,
                !empty($metadata) ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
            ]);
        } catch (Exception $e) {
            Logger::error('EmailLogger: failed to write log', ['error' => $e->getMessage()]);
        }
    }

    public static function logSent(
        string $template,
        string $toEmail,
        string $subject,
        ?string $userId = null,
        ?string $contactId = null,
        array $metadata = []
    ): void {
        self::log($template, $toEmail, $subject, 'sent', $userId, $contactId, null, $metadata);
    }

    public static function logFailed(
        string $template,
        string $toEmail,
        string $subject,
        string $errorMessage,
        ?string $userId = null,
        ?string $contactId = null,
        array $metadata = []
    ): void {
        self::log($template, $toEmail, $subject, 'failed', $userId, $contactId, $errorMessage, $metadata);
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
            $where[] = 'el.template = ?';
            $params[] = $filters['type'];
        }
        if (!empty($filters['status'])) {
            $where[] = 'el.status = ?';
            $params[] = $filters['status'];
        }
        if (!empty($filters['user_id'])) {
            $where[] = 'el.person_id = ?';
            $params[] = $filters['user_id'];
        }
        if (!empty($filters['date_debut'])) {
            $where[] = 'DATE(el.created_at) >= ?';
            $params[] = $filters['date_debut'];
        }
        if (!empty($filters['date_fin'])) {
            $where[] = 'DATE(el.created_at) <= ?';
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
            LEFT JOIN persons u ON el.person_id = u.id
            $whereClause
            ORDER BY el.created_at DESC
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
                COUNT(DISTINCT to_email) AS unique_recipients,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS last_7_days,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS last_30_days
            FROM email_logs
        ");
        $global = $stmt->fetch(PDO::FETCH_ASSOC);

        $byTypeStmt = $db->query("
            SELECT template, COUNT(*) AS nb, SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed
            FROM email_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY template
            ORDER BY nb DESC
            LIMIT 10
        ");
        $byType = $byTypeStmt->fetchAll(PDO::FETCH_ASSOC);

        $trendStmt = $db->query("
            SELECT
                DATE(created_at) AS label,
                COUNT(*) AS total,
                SUM(status = 'sent') AS sent,
                SUM(status = 'failed') AS failed
            FROM email_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
            GROUP BY DATE(created_at)
            ORDER BY label ASC
        ");
        $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'global'  => $global,
            'by_type' => $byType,
            'trend'   => $trend,
        ];
    }
}
