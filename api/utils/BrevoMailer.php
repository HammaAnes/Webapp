<?php

class BrevoMailer
{
    private static function getApiKey(): string
    {
        return env('BREVO_API_KEY', '');
    }

    private static function getSenderEmail(): string
    {
        return env('BREVO_SENDER_EMAIL', env('MAIL_FROM_ADDRESS', 'desk@coffice.dz'));
    }

    private static function getSenderName(): string
    {
        return env('BREVO_SENDER_NAME', env('MAIL_FROM_NAME', 'Coffice'));
    }

    public static function send(
        string $to,
        string $subject,
        string $htmlContent,
        ?string $plainText = null,
        string $type = 'custom',
        ?string $userId = null
    ): bool {
        $apiKey = self::getApiKey();

        if (empty($apiKey)) {
            Logger::error('BrevoMailer: BREVO_API_KEY is not configured');
            EmailLogger::logFailed($type, $to, $subject, 'BREVO_API_KEY not configured', $userId);
            return false;
        }

        $payload = [
            'sender'      => [
                'email' => self::getSenderEmail(),
                'name'  => self::getSenderName(),
            ],
            'to'          => [['email' => $to]],
            'subject'     => $subject,
            'htmlContent' => $htmlContent,
        ];

        if ($plainText) {
            $payload['textContent'] = $plainText;
        }

        $ch = curl_init('https://api.brevo.com/v3/smtp/email');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_HTTPHEADER     => [
                'accept: application/json',
                'api-key: ' . $apiKey,
                'content-type: application/json',
            ],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $error = 'Brevo cURL error: ' . $curlError;
            Logger::error($error, ['to' => $to, 'subject' => $subject]);
            EmailLogger::logFailed($type, $to, $subject, $error, $userId);
            return false;
        }

        if ($httpCode === 201) {
            $decoded = json_decode($response, true);
            $messageId = $decoded['messageId'] ?? null;
            Logger::info('BrevoMailer: email sent', ['to' => $to, 'message_id' => $messageId]);
            EmailLogger::logSent($type, $to, $subject, $userId, $messageId ? ['brevo_message_id' => $messageId] : []);
            return true;
        }

        $body = json_decode($response, true);
        $errorMsg = 'Brevo HTTP ' . $httpCode;

        if (!empty($body['message'])) {
            $errorMsg .= ': ' . $body['message'];
        }
        if (!empty($body['code'])) {
            $errorMsg .= ' (code: ' . $body['code'] . ')';
        }

        if ($httpCode === 429) {
            $errorMsg = 'Brevo rate limit exceeded — retry later';
        } elseif ($httpCode === 401) {
            $errorMsg = 'Brevo authentication failed — check BREVO_API_KEY';
        } elseif ($httpCode === 400) {
            $errorMsg = 'Brevo bad request: ' . ($body['message'] ?? $response);
        }

        Logger::error('BrevoMailer: send failed', [
            'to'        => $to,
            'http_code' => $httpCode,
            'error'     => $errorMsg,
            'response'  => is_array($body) ? $body : substr($response, 0, 200),
        ]);
        EmailLogger::logFailed($type, $to, $subject, $errorMsg, $userId);
        return false;
    }

    public static function isConfigured(): bool
    {
        return !empty(env('BREVO_API_KEY', ''));
    }
}
