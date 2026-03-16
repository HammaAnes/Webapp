<?php
/**
 * Brevo Transactional Email Webhook
 *
 * Receives real-time delivery status events from Brevo and updates email_logs accordingly.
 * Configure this URL in your Brevo dashboard:
 *   Settings → Senders & IP → Webhooks → Add a webhook
 *   URL: https://coffice.dz/api/email/brevo-webhook.php
 *   Events to enable: delivered, hard_bounce, soft_bounce, spam, unsubscribed, invalid_email, blocked
 *
 * No authentication header required — Brevo signs nothing by default.
 * For extra security, add a shared secret as a query param and validate it here.
 */

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$webhookSecret = env('BREVO_WEBHOOK_SECRET', '');
if (!empty($webhookSecret)) {
    $token = $_GET['token'] ?? '';
    if (!hash_equals($webhookSecret, $token)) {
        Logger::security('Brevo webhook: invalid token', ['ip' => $_SERVER['REMOTE_ADDR'] ?? '']);
        http_response_code(403);
        exit;
    }
}

$rawBody = file_get_contents('php://input');

if (empty($rawBody)) {
    http_response_code(400);
    exit;
}

$event = json_decode($rawBody, true);

if (!is_array($event) || empty($event['event'])) {
    http_response_code(400);
    exit;
}

$eventType = $event['event'];
$email     = $event['email'] ?? null;
$messageId = $event['message-id'] ?? null;
$timestamp = $event['ts_event'] ?? $event['date'] ?? null;

try {
    $statusMap = [
        'delivered'     => 'sent',
        'hard_bounce'   => 'bounced',
        'soft_bounce'   => 'bounced',
        'bounce'        => 'bounced',
        'spam'          => 'bounced',
        'invalid_email' => 'failed',
        'blocked'       => 'failed',
        'unsubscribed'  => null,
    ];

    if (!isset($statusMap[$eventType])) {
        http_response_code(200);
        exit;
    }

    $newStatus = $statusMap[$eventType];

    if ($newStatus && $messageId) {
        $stmt = $db->prepare("
            UPDATE email_logs
            SET status = ?,
                metadata = JSON_SET(
                    COALESCE(metadata, '{}'),
                    '$.brevo_event', ?,
                    '$.brevo_message_id', ?,
                    '$.brevo_ts', ?
                )
            WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.brevo_message_id')) = ?
              AND status != 'bounced'
        ");
        $stmt->execute([$newStatus, $eventType, $messageId, $timestamp, $messageId]);
    }

    if ($eventType === 'unsubscribed' && $email) {
        $db->prepare("
            UPDATE email_preferences
            SET email_marketing = 0,
                email_rappels = 0
            WHERE user_id = (
                SELECT id FROM users WHERE email = ? LIMIT 1
            )
        ")->execute([$email]);

        Logger::info('Brevo webhook: user unsubscribed', ['email' => $email]);
    }

    if (in_array($eventType, ['hard_bounce', 'blocked', 'invalid_email']) && $email) {
        Logger::warning('Brevo webhook: delivery failure', [
            'email'     => $email,
            'event'     => $eventType,
            'reason'    => $event['reason'] ?? $event['error'] ?? '',
            'message_id' => $messageId,
        ]);
    }

    http_response_code(200);
    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    Logger::error('brevo-webhook.php error', ['error' => $e->getMessage(), 'event' => $eventType]);
    http_response_code(500);
}
