<?php

class Mailer
{
    private static $usePHPMailer = false;
    private static $config = [];

    public static function init(): void
    {
        self::$config = [
            'from_email' => env('MAIL_FROM_ADDRESS', 'desk@coffice.dz'),
            'from_name' => env('MAIL_FROM_NAME', 'Coffice'),
            'smtp_host' => env('MAIL_HOST', 'mail.coffice.dz'),
            'smtp_port' => (int) env('MAIL_PORT', 465),
            'smtp_username' => env('MAIL_USERNAME', 'desk@coffice.dz'),
            'smtp_password' => env('MAIL_PASSWORD', ''),
            'smtp_encryption' => env('MAIL_ENCRYPTION', 'ssl'),
            'use_smtp' => env('MAIL_MAILER', 'smtp') === 'smtp'
        ];

        $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
        if (file_exists($autoloadPath)) {
            require_once $autoloadPath;
        }

        self::$usePHPMailer = class_exists('PHPMailer\PHPMailer\PHPMailer');

        if (!self::$usePHPMailer) {
            Logger::warning('PHPMailer not available, falling back to mail()', [
                'autoload_exists' => file_exists($autoloadPath),
                'autoload_path' => realpath($autoloadPath) ?: $autoloadPath
            ]);
        }
    }

    public static function send(string $to, string $subject, string $body, ?string $plainText = null): bool
    {
        if (empty(self::$config)) {
            self::init();
        }

        try {
            if (self::$usePHPMailer && self::$config['use_smtp']) {
                $result = self::sendWithPHPMailer($to, $subject, $body, $plainText);
                if ($result) return true;
                Logger::warning('PHPMailer SMTP failed, trying mail() fallback', ['to' => $to]);
                return self::sendWithMailFunction($to, $subject, $body);
            } else {
                return self::sendWithMailFunction($to, $subject, $body);
            }
        } catch (Exception $e) {
            Logger::error('Email sending failed', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
                'smtp_host' => self::$config['smtp_host'] ?? 'unknown',
                'smtp_port' => self::$config['smtp_port'] ?? 'unknown',
                'use_phpmailer' => self::$usePHPMailer ? 'yes' : 'no'
            ]);
            try {
                return self::sendWithMailFunction($to, $subject, $body);
            } catch (Exception $fallbackError) {
                Logger::error('mail() fallback also failed', ['error' => $fallbackError->getMessage()]);
                return false;
            }
        }
    }

    private static function sendWithPHPMailer(string $to, string $subject, string $body, ?string $plainText): bool
    {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        $mail->isSMTP();
        $mail->Host = self::$config['smtp_host'];
        $mail->SMTPAuth = !empty(self::$config['smtp_username']);
        $mail->Username = self::$config['smtp_username'];
        $mail->Password = self::$config['smtp_password'];
        $mail->Port = self::$config['smtp_port'];
        $mail->CharSet = 'UTF-8';
        $mail->Timeout = 15;
        $mail->SMTPKeepAlive = false;

        $port = self::$config['smtp_port'];
        if ($port === 465) {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($port === 587) {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPSecure = self::$config['smtp_encryption'];
        }

        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];

        $fromName = self::$config['from_name'];
        if ($fromName === self::$config['from_email']) {
            $fromName = 'Coffice';
        }
        $mail->setFrom(self::$config['from_email'], $fromName);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;

        if ($plainText) {
            $mail->AltBody = $plainText;
        } else {
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));
        }

        $result = $mail->send();

        if ($result) {
            Logger::info('Email sent successfully via PHPMailer', [
                'to' => $to,
                'subject' => $subject
            ]);
        } else {
            Logger::error('PHPMailer send returned false', [
                'to' => $to,
                'subject' => $subject,
                'errorInfo' => $mail->ErrorInfo
            ]);
        }

        return $result;
    }

    private static function sendWithMailFunction(string $to, string $subject, string $body): bool
    {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . self::$config['from_name'] . ' <' . self::$config['from_email'] . '>',
            'Reply-To: ' . self::$config['from_email'],
            'X-Mailer: PHP/' . phpversion()
        ];

        return mail($to, $subject, $body, implode("\r\n", $headers));
    }

    public static function sendWelcomeEmail(string $to, string $name): bool
    {
        $subject = 'Bienvenue chez Coffice !';
        $body = self::renderTemplate('welcome', [
            'name' => $name,
            'login_url' => env('APP_URL', 'https://coffice.dz') . '/connexion'
        ]);

        return self::send($to, $subject, $body);
    }

    public static function sendReservationConfirmation(string $to, array $reservation): bool
    {
        $subject = 'Confirmation de réservation – ' . ($reservation['espace_nom'] ?? 'Coffice');
        $body = self::renderTemplate('reservation-confirmation', [
            'reservation' => $reservation
        ]);

        return self::send($to, $subject, $body);
    }

    public static function sendPasswordReset(string $to, string $name, string $token): bool
    {
        $subject = 'Réinitialisation de votre mot de passe – Coffice';
        $resetUrl = env('APP_URL', 'https://coffice.dz') . '/reset-password?token=' . $token;

        $body = self::renderTemplate('password-reset', [
            'name' => $name,
            'reset_url' => $resetUrl,
            'expires_in' => '1 heure'
        ]);

        return self::send($to, $subject, $body);
    }

    public static function sendDomiciliationStatus(string $to, string $status, array $domiciliation): bool
    {
        $statusLabels = [
            'en_attente' => 'En attente de validation',
            'en_attente_signature' => 'En attente de signature',
            'validee' => 'Validée',
            'active' => 'Activée',
            'rejetee' => 'Rejetée',
            'refusee' => 'Refusée',
            'expiree' => 'Expirée',
            'resiliee' => 'Résiliée'
        ];

        $subject = 'Domiciliation – ' . ($statusLabels[$status] ?? $status);
        $body = self::renderTemplate('domiciliation-status', [
            'status' => $status,
            'status_label' => $statusLabels[$status] ?? $status,
            'domiciliation' => $domiciliation
        ]);

        return self::send($to, $subject, $body);
    }

    public static function sendReservationReminder(string $to, array $reservation): bool
    {
        $subject = 'Rappel – Réservation demain à ' . date('H:i', strtotime($reservation['date_debut']));
        $body = self::renderTemplate('reservation-reminder', [
            'reservation' => $reservation
        ]);

        return self::send($to, $subject, $body);
    }

    private static function renderTemplate(string $template, array $data): string
    {
        $templatePath = __DIR__ . '/../templates/emails/' . $template . '.php';

        if (!file_exists($templatePath)) {
            Logger::warning('Email template not found: ' . $template);
            return self::renderDefaultTemplate($data);
        }

        ob_start();
        extract($data);
        require $templatePath;
        return ob_get_clean();
    }

    private static function renderDefaultTemplate(array $data): string
    {
        $content = '<p>' . htmlspecialchars(json_encode($data, JSON_UNESCAPED_UNICODE)) . '</p>';
        return self::wrapInLayout('Notification Coffice', $content);
    }

    public static function wrapInLayout(string $title, string $content, string $preheader = ''): string
    {
        $brandColor = '#0F766E';
        $cofficeUrl = env('APP_URL', 'https://coffice.dz');
        $logoUrl = $cofficeUrl . '/logo-web-transparent-black.png';

        return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>' . htmlspecialchars($title) . '</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style type="text/css">
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
body{margin:0;padding:0;width:100%!important;background-color:#f0f2f5}
a{color:' . $brandColor . '}
@media only screen and (max-width:620px){
.wrapper{width:100%!important;padding:0 12px!important}
.content-cell{padding:28px 20px!important}
.header-cell{padding:24px 20px!important}
.footer-cell{padding:20px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f0f2f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">' . htmlspecialchars($preheader) . '</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="580" class="wrapper" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td class="header-cell" style="padding:32px 40px 28px;border-bottom:1px solid #e8eaed;text-align:center;">
<a href="' . $cofficeUrl . '" style="text-decoration:none;"><img src="' . $logoUrl . '" alt="Coffice" width="140" style="height:auto;display:inline-block;" /></a>
</td></tr>
<tr><td class="content-cell" style="padding:40px 40px 36px;">
' . $content . '
</td></tr>
<tr><td class="footer-cell" style="background-color:#f8f9fa;padding:28px 40px;border-top:1px solid #e8eaed;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center" style="padding-bottom:16px;"><a href="' . $cofficeUrl . '" style="text-decoration:none;"><img src="' . $logoUrl . '" alt="Coffice" width="100" style="height:auto;display:inline-block;opacity:0.5;" /></a></td></tr>
<tr><td align="center" style="font-size:13px;line-height:1.6;color:#8b8f96;">
<p style="margin:0 0 4px;">Mohammadia Mall, 4&egrave;me &eacute;tage, Bureau 1178, Alger</p>
<p style="margin:0 0 4px;">T&eacute;l. : +213 23 804 924 | Mobile : +213 795 38 01 24</p>
<p style="margin:0;"><a href="mailto:desk@coffice.dz" style="color:' . $brandColor . ';text-decoration:none;">desk@coffice.dz</a> | <a href="' . $cofficeUrl . '" style="color:' . $brandColor . ';text-decoration:none;">coffice.dz</a></p>
</td></tr>
<tr><td align="center" style="padding-top:20px;border-top:1px solid #e8eaed;">
<p style="margin:0;font-size:11px;color:#a0a4ab;">Vous recevez cet e-mail car vous disposez d\'un compte sur Coffice.</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>';
    }

    public static function infoBox(array $rows): string
    {
        $html = '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa;border:1px solid #e8eaed;border-radius:12px;overflow:hidden;margin:24px 0;">';
        $count = count($rows);
        $i = 0;
        foreach ($rows as $label => $value) {
            $border = ($i < $count - 1) ? '1px solid #f0f1f3' : 'none';
            $html .= '<tr><td style="padding:14px 20px;font-size:14px;color:#6b7280;font-weight:500;border-bottom:' . $border . ';width:45%;">' . htmlspecialchars($label) . '</td>';
            $html .= '<td style="padding:14px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:' . $border . ';">' . htmlspecialchars($value) . '</td></tr>';
            $i++;
        }
        $html .= '</table>';
        return $html;
    }

    public static function ctaButton(string $href, string $text, bool $secondary = false): string
    {
        $bg = $secondary ? '#1f2937' : '#0F766E';
        return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
<tr><td align="center" style="border-radius:12px;background-color:' . $bg . ';">
<a href="' . htmlspecialchars($href) . '" target="_blank" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;background-color:' . $bg . ';font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">' . htmlspecialchars($text) . '</a>
</td></tr></table>';
    }

    public static function statusBadge(string $label, string $variant = 'info'): string
    {
        $styles = [
            'success' => ['bg' => '#ecfdf5', 'color' => '#059669'],
            'warning' => ['bg' => '#fffbeb', 'color' => '#d97706'],
            'danger'  => ['bg' => '#fef2f2', 'color' => '#dc2626'],
            'info'    => ['bg' => '#eff6ff', 'color' => '#2563eb'],
        ];
        $s = $styles[$variant] ?? $styles['info'];
        return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;">
<tr><td style="background-color:' . $s['bg'] . ';color:' . $s['color'] . ';font-size:13px;font-weight:700;padding:8px 20px;border-radius:24px;letter-spacing:0.3px;text-transform:uppercase;">' . htmlspecialchars($label) . '</td></tr></table>';
    }

    public static function highlightBox(string $amount, string $label): string
    {
        return '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#111827;border-radius:12px;margin:24px 0;">
<tr><td align="center" style="padding:28px 20px;">
<p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">' . htmlspecialchars($label) . '</p>
<p style="margin:0;font-size:36px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">' . htmlspecialchars($amount) . '</p>
</td></tr></table>';
    }
}
