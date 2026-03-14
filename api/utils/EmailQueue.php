<?php

class EmailQueue
{
    private static array $typeToCategory = [
        'welcome'                    => 'transactionnel',
        'reservation_created'        => 'transactionnel',
        'reservation_confirmed'      => 'transactionnel',
        'reservation_cancelled'      => 'transactionnel',
        'reservation_reminder'       => 'rappels',
        'domiciliation_submitted'    => 'transactionnel',
        'domiciliation_status'       => 'transactionnel',
        'domiciliation_reminder'     => 'rappels',
        'courrier_recu'              => 'transactionnel',
        'abonnement_expiration'      => 'rappels',
        'parrainage_bonus'           => 'transactionnel',
        'code_promo_attribue'        => 'marketing',
        'password_reset'             => 'systeme',
        'admin_notification'         => 'systeme',
    ];

    public static function enqueue(
        string $type,
        string $toEmail,
        string $subject,
        string $template,
        array $payload,
        ?string $userId = null,
        int $priority = 3,
        ?\DateTime $scheduledAt = null
    ): ?string {
        global $db;

        if (!$db) {
            return null;
        }

        if (self::isDuplicate($type, $userId, $toEmail)) {
            Logger::info('EmailQueue: duplicate suppressed', ['type' => $type, 'to' => $toEmail]);
            return null;
        }

        if ($userId) {
            $category = self::$typeToCategory[$type] ?? 'transactionnel';
            if (!self::isAllowed($userId, $category)) {
                Logger::info('EmailQueue: blocked by user preference', ['type' => $type, 'user_id' => $userId, 'category' => $category]);
                return null;
            }
        }

        try {
            $id = UuidHelper::generate();
            $scheduled = $scheduledAt ? $scheduledAt->format('Y-m-d H:i:s') : date('Y-m-d H:i:s');

            $stmt = $db->prepare('
                INSERT INTO email_queue
                    (id, user_id, type, to_email, subject, template, payload, status, priority, scheduled_at, attempts, max_attempts, created_at)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, \'pending\', ?, ?, 0, 3, NOW())
            ');
            $stmt->execute([
                $id,
                $userId,
                $type,
                $toEmail,
                $subject,
                $template,
                json_encode($payload, JSON_UNESCAPED_UNICODE),
                $priority,
                $scheduled,
            ]);

            return $id;
        } catch (Exception $e) {
            Logger::error('EmailQueue: enqueue failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public static function processPending(int $batchSize = 20): array
    {
        global $db;

        $results = ['processed' => 0, 'sent' => 0, 'failed' => 0];

        $stmt = $db->prepare("
            SELECT * FROM email_queue
            WHERE status = 'pending'
              AND scheduled_at <= NOW()
              AND attempts < max_attempts
            ORDER BY priority ASC, scheduled_at ASC
            LIMIT ?
        ");
        $stmt->execute([$batchSize]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as $item) {
            $db->prepare("UPDATE email_queue SET status = 'processing', last_attempt_at = NOW(), attempts = attempts + 1 WHERE id = ?")->execute([$item['id']]);

            $payload = json_decode($item['payload'], true) ?: [];

            try {
                $sent = Mailer::send(
                    $item['to_email'],
                    $item['subject'],
                    self::renderTemplate($item['template'], $payload)
                );

                if ($sent) {
                    $db->prepare("UPDATE email_queue SET status = 'sent' WHERE id = ?")->execute([$item['id']]);
                    EmailLogger::logSent($item['type'], $item['to_email'], $item['subject'], $item['user_id'] ?: null);
                    $results['sent']++;
                } else {
                    self::handleFailure($item, 'Mailer::send returned false');
                    $results['failed']++;
                }
            } catch (Exception $e) {
                self::handleFailure($item, $e->getMessage());
                $results['failed']++;
            }

            $results['processed']++;
            usleep(200000);
        }

        return $results;
    }

    private static function handleFailure(array $item, string $error): void
    {
        global $db;

        $attempts = (int) $item['attempts'];
        $maxAttempts = (int) $item['max_attempts'];

        if ($attempts >= $maxAttempts) {
            $db->prepare("UPDATE email_queue SET status = 'failed', error_message = ? WHERE id = ?")->execute([$error, $item['id']]);
            EmailLogger::logFailed($item['type'], $item['to_email'], $item['subject'], $error, $item['user_id'] ?: null, $attempts);
            Logger::error('EmailQueue: item permanently failed', ['id' => $item['id'], 'type' => $item['type'], 'error' => $error]);
        } else {
            $delays = [1, 5, 30];
            $delayMinutes = $delays[min($attempts - 1, count($delays) - 1)];
            $nextTry = date('Y-m-d H:i:s', strtotime("+{$delayMinutes} minutes"));

            $db->prepare("
                UPDATE email_queue
                SET status = 'pending', scheduled_at = ?, error_message = ?
                WHERE id = ?
            ")->execute([$nextTry, $error, $item['id']]);
        }
    }

    private static function isDuplicate(string $type, ?string $userId, string $toEmail): bool
    {
        global $db;

        $stmt = $db->prepare("
            SELECT COUNT(*) FROM email_queue
            WHERE type = ?
              AND to_email = ?
              AND status IN ('pending', 'processing', 'sent')
              AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
              " . ($userId ? "AND user_id = ?" : "") . "
        ");

        $params = [$type, $toEmail];
        if ($userId) {
            $params[] = $userId;
        }

        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    private static function isAllowed(string $userId, string $category): bool
    {
        global $db;

        $column = match($category) {
            'rappels'    => 'email_rappels',
            'marketing'  => 'email_marketing',
            'systeme'    => 'email_systeme',
            default      => 'email_transactionnel',
        };

        $stmt = $db->prepare("SELECT $column FROM email_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$prefs) {
            return true;
        }

        return (bool) $prefs[$column];
    }

    private static function renderTemplate(string $template, array $payload): string
    {
        $templatePath = __DIR__ . '/../templates/emails/' . $template . '.php';

        if (!file_exists($templatePath)) {
            return Mailer::wrapInLayout('Notification Coffice', '<p>' . htmlspecialchars(json_encode($payload, JSON_UNESCAPED_UNICODE)) . '</p>');
        }

        ob_start();
        extract($payload);
        require $templatePath;
        return ob_get_clean();
    }

    public static function getQueueStats(): array
    {
        global $db;

        $stmt = $db->query("
            SELECT
                status,
                COUNT(*) AS count
            FROM email_queue
            GROUP BY status
        ");
        $byStatus = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $byStatus[$row['status']] = (int) $row['count'];
        }

        $failedStmt = $db->query("
            SELECT * FROM email_queue
            WHERE status = 'failed'
            ORDER BY created_at DESC
            LIMIT 20
        ");

        $pendingStmt = $db->query("
            SELECT * FROM email_queue
            WHERE status = 'pending'
            ORDER BY priority ASC, scheduled_at ASC
            LIMIT 20
        ");

        return [
            'by_status' => $byStatus,
            'failed'    => $failedStmt->fetchAll(PDO::FETCH_ASSOC),
            'pending'   => $pendingStmt->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    public static function retry(string $id): bool
    {
        global $db;

        $stmt = $db->prepare("
            UPDATE email_queue
            SET status = 'pending', attempts = 0, scheduled_at = NOW(), error_message = NULL
            WHERE id = ? AND status = 'failed'
        ");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public static function ensureUserPreferences(string $userId): void
    {
        global $db;

        $stmt = $db->prepare("SELECT id FROM email_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);

        if (!$stmt->fetch()) {
            $id = UuidHelper::generate();
            $token = bin2hex(random_bytes(32));
            $db->prepare("
                INSERT INTO email_preferences (id, user_id, unsubscribe_token)
                VALUES (?, ?, ?)
            ")->execute([$id, $userId, $token]);
        }
    }
}
