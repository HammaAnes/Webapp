<?php

class Mailer
{
    private static bool $initialized = false;
    private static bool $usePHPMailer = false;
    private static array $config = [];

    public static function init(): void
    {
        $mailer = env('MAIL_MAILER', 'smtp');

        self::$config = [
            'mailer'          => $mailer,
            'from_email'      => env('MAIL_FROM_ADDRESS', 'desk@coffice.dz'),
            'from_name'       => env('MAIL_FROM_NAME', 'Coffice'),
            'admin_email'     => env('MAIL_ADMIN', env('MAIL_FROM_ADDRESS', 'desk@coffice.dz')),
            'smtp_host'       => env('MAIL_HOST', 'mail.coffice.dz'),
            'smtp_port'       => (int) env('MAIL_PORT', 465),
            'smtp_username'   => env('MAIL_USERNAME', 'desk@coffice.dz'),
            'smtp_password'   => env('MAIL_PASSWORD', 'Coffice2026!'),
            'smtp_encryption' => env('MAIL_ENCRYPTION', 'ssl'),
            'verify_ssl'      => env('MAIL_VERIFY_SSL', 'false') === 'true',
            'app_url'         => env('APP_URL', 'https://coffice.dz'),
        ];

        if ($mailer === 'smtp') {
            $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
            if (file_exists($autoloadPath)) {
                require_once $autoloadPath;
            }
            self::$usePHPMailer = class_exists('PHPMailer\PHPMailer\PHPMailer');

            if (!self::$usePHPMailer) {
                Logger::warning('PHPMailer not available, will use mail() fallback');
            }
        }

        self::$initialized = true;
    }

    public static function send(
        string $to,
        string $subject,
        string $body,
        ?string $plainText = null,
        string $type = 'custom',
        ?string $userId = null
    ): bool {
        if (!self::$initialized) {
            self::init();
        }

        $mailer = self::$config['mailer'];

        if ($mailer === 'log') {
            Logger::info('Mailer [log transport]: email would be sent', [
                'to'      => $to,
                'subject' => $subject,
                'type'    => $type,
            ]);
            EmailLogger::logSent($type, $to, $subject, $userId, null, ['transport' => 'log']);
            return true;
        }

        return self::sendViaSMTP($to, $subject, $body, $plainText, $type, $userId);
    }

    private static function sendViaSMTP(
        string $to,
        string $subject,
        string $body,
        ?string $plainText,
        string $type,
        ?string $userId
    ): bool {
        $attempts = 1;

        try {
            if (self::$usePHPMailer) {
                $result = self::sendWithPHPMailer($to, $subject, $body, $plainText);
                if ($result) {
                    EmailLogger::logSent($type, $to, $subject, $userId);
                    return true;
                }
                Logger::warning('PHPMailer SMTP failed, trying socket fallback', ['to' => $to]);
                $attempts = 2;
            }

            $fallback = self::sendWithSocketSMTP($to, $subject, $body, $plainText);
            if ($fallback) {
                EmailLogger::logSent($type, $to, $subject, $userId, null, $attempts > 1 ? ['fallback' => 'socket'] : []);
            } else {
                EmailLogger::logFailed($type, $to, $subject, 'All transports failed', $userId);
            }
            return $fallback;

        } catch (Exception $e) {
            Logger::error('Mailer SMTP exception', [
                'to'        => $to,
                'subject'   => $subject,
                'error'     => $e->getMessage(),
                'smtp_host' => self::$config['smtp_host'] ?? '?',
                'smtp_port' => self::$config['smtp_port'] ?? '?',
            ]);

            try {
                $attempts = 2;
                $fallback = self::sendWithMailFunction($to, $subject, $body);
                if ($fallback) {
                    EmailLogger::logSent($type, $to, $subject, $userId, null, [
                        'fallback'       => 'mail()',
                        'original_error' => $e->getMessage(),
                    ]);
                } else {
                    EmailLogger::logFailed($type, $to, $subject, $e->getMessage() . ' | fallback also failed', $userId);
                }
                return $fallback;
            } catch (Exception $fe) {
                Logger::error('mail() fallback also failed', ['error' => $fe->getMessage()]);
                EmailLogger::logFailed($type, $to, $subject, $e->getMessage() . ' | ' . $fe->getMessage(), $userId);
                return false;
            }
        }
    }

    private static function sendWithPHPMailer(string $to, string $subject, string $body, ?string $plainText): bool
    {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = self::$config['smtp_host'];
        $mail->SMTPAuth   = !empty(self::$config['smtp_username']);
        $mail->Username   = self::$config['smtp_username'];
        $mail->Password   = self::$config['smtp_password'];
        $mail->Port       = self::$config['smtp_port'];
        $mail->CharSet    = 'UTF-8';
        $mail->Timeout    = 15;
        $mail->SMTPKeepAlive = false;

        $port = self::$config['smtp_port'];
        if ($port === 465) {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($port === 587) {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPSecure = self::$config['smtp_encryption'];
        }

        $verifySSL = self::$config['verify_ssl'];
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer'      => $verifySSL,
                'verify_peer_name' => $verifySSL,
                'allow_self_signed' => !$verifySSL,
            ],
        ];

        $fromName = self::$config['from_name'];
        $mail->setFrom(self::$config['from_email'], $fromName);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = $plainText ?? strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

        $result = $mail->send();

        if (!$result) {
            Logger::error('PHPMailer send returned false', ['to' => $to, 'errorInfo' => $mail->ErrorInfo]);
        }

        return $result;
    }

    private static function sendWithMailFunction(string $to, string $subject, string $body): bool
    {
        // Fallback: try socket SMTP if mail() is unavailable
        if (!function_exists('mail')) {
            return self::sendWithSocketSMTP($to, $subject, $body);
        }

        $headers = implode("\r\n", [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . self::$config['from_name'] . ' <' . self::$config['from_email'] . '>',
            'Reply-To: ' . self::$config['from_email'],
            'X-Mailer: PHP/' . phpversion(),
        ]);

        return @mail($to, $subject, $body, $headers);
    }

    private static function sendWithSocketSMTP(string $to, string $subject, string $body, ?string $plainText = null): bool
    {
        $host     = self::$config['smtp_host'];
        $port     = self::$config['smtp_port'];
        $user     = self::$config['smtp_username'];
        $pass     = self::$config['smtp_password'];
        $from     = self::$config['from_email'];
        $fromName = self::$config['from_name'];

        $ctx = stream_context_create([
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ],
        ]);

        $scheme = ($port === 465) ? 'ssl' : 'tcp';
        $errno  = 0;
        $errstr = '';
        $sock   = stream_socket_client("$scheme://$host:$port", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);

        if (!$sock) {
            throw new \RuntimeException("SMTP socket error: $errstr ($errno)");
        }

        $read = function () use ($sock): string {
            $line = '';
            while ($chunk = fgets($sock, 512)) {
                $line .= $chunk;
                if (strlen($chunk) >= 4 && $chunk[3] === ' ') break;
            }
            return $line;
        };

        $send = function (string $cmd) use ($sock, $read): string {
            fwrite($sock, $cmd . "\r\n");
            return $read();
        };

        $read(); // greeting

        $domain = gethostname() ?: 'coffice.dz';
        $ehlo = $send("EHLO $domain");

        if ($port === 587) {
            $send("STARTTLS");
            stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $send("EHLO $domain");
        }

        $send("AUTH LOGIN");
        $send(base64_encode($user));
        $resp = $send(base64_encode($pass));

        if (strpos($resp, '235') === false) {
            fclose($sock);
            throw new \RuntimeException("SMTP AUTH failed: " . trim($resp));
        }

        $send("MAIL FROM:<$from>");
        $send("RCPT TO:<$to>");
        $send("DATA");

        $boundary = 'coffice_' . md5(uniqid());
        $plain    = $plainText ?? strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));
        $encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encFrom    = '=?UTF-8?B?' . base64_encode($fromName) . '?=';

        $message  = "From: $encFrom <$from>\r\n";
        $message .= "To: <$to>\r\n";
        $message .= "Subject: $encSubject\r\n";
        $message .= "MIME-Version: 1.0\r\n";
        $message .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
        $message .= "Date: " . date('r') . "\r\n";
        $message .= "\r\n";
        $message .= "--$boundary\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($plain)) . "\r\n";
        $message .= "--$boundary\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($body)) . "\r\n";
        $message .= "--$boundary--\r\n";
        $message .= ".";

        $resp = $send($message);
        $send("QUIT");
        fclose($sock);

        $ok = strpos($resp, '250') !== false;
        if (!$ok) {
            Logger::error('SMTP socket send failed', ['response' => trim($resp), 'to' => $to]);
        }
        return $ok;
    }

    public static function sendRaw(string $to, string $subject, string $body, ?string $plainText = null): bool
    {
        if (!self::$initialized) {
            self::init();
        }

        $mailer = self::$config['mailer'];

        if ($mailer === 'log') {
            Logger::info('Mailer [log transport raw]: ' . $to . ' — ' . $subject);
            return true;
        }

        try {
            if (self::$usePHPMailer) {
                $result = self::sendWithPHPMailer($to, $subject, $body, $plainText);
                if ($result) return true;
            }
            return self::sendWithSocketSMTP($to, $subject, $body, $plainText);
        } catch (\Throwable $e) {
            Logger::error('Mailer::sendRaw exception', ['to' => $to, 'error' => $e->getMessage()]);
            try {
                return self::sendWithSocketSMTP($to, $subject, $body, $plainText);
            } catch (\Throwable $fe) {
                Logger::error('Mailer::sendRaw fallback failed', ['error' => $fe->getMessage()]);
                return false;
            }
        }
    }

    public static function sendWelcomeEmail(string $to, string $name, string $codeParrainage = '', string $email = ''): bool
    {
        if (!self::$initialized) self::init();
        $subject = 'Bienvenue chez Coffice !';
        $body = self::renderTemplate('welcome', [
            'name'            => $name,
            'email'           => $email ?: $to,
            'code_parrainage' => $codeParrainage,
            'login_url'       => self::$config['app_url'] . '/app',
        ]);
        return self::send($to, $subject, $body, null, 'welcome');
    }

    public static function sendReservationConfirmation(string $to, array $reservation): bool
    {
        if (!self::$initialized) self::init();
        $subject = 'Confirmation de réservation – ' . ($reservation['espace_nom'] ?? 'Coffice');
        $body = self::renderTemplate('reservation-confirmation', ['reservation' => $reservation]);
        return self::send($to, $subject, $body, null, 'reservation_confirmed');
    }

    public static function sendPasswordReset(string $to, string $name, string $token): bool
    {
        if (!self::$initialized) self::init();
        $resetUrl = self::$config['app_url'] . '/reset-password?token=' . $token;
        $subject  = 'Réinitialisation de votre mot de passe – Coffice';
        $body = self::renderTemplate('password-reset', [
            'name'       => $name,
            'reset_url'  => $resetUrl,
            'expires_in' => '1 heure',
        ]);
        return self::send($to, $subject, $body, null, 'password_reset');
    }

    public static function sendDomiciliationStatus(string $to, string $status, array $domiciliation): bool
    {
        if (!self::$initialized) self::init();
        $statusLabels = [
            'dossier_preparatoire'   => 'Dossier en cours',
            'en_attente_complements' => 'Compléments requis',
            'en_attente_signature'   => 'En attente de signature',
            'domiciliation_creee'    => 'Domiciliation créée',
            'active'                 => 'Active',
            'refusee'                => 'Refusée',
            'expiree'                => 'Expirée',
            'resiliee'               => 'Résiliée',
        ];

        $subject = 'Domiciliation – ' . ($statusLabels[$status] ?? $status);
        $body = self::renderTemplate('domiciliation-status', [
            'status'       => $status,
            'status_label' => $statusLabels[$status] ?? $status,
            'domiciliation' => $domiciliation,
        ]);
        return self::send($to, $subject, $body, null, 'domiciliation_status');
    }

    public static function sendReservationReminder(string $to, array $reservation): bool
    {
        if (!self::$initialized) self::init();
        $subject = 'Rappel – Réservation demain à ' . date('H:i', strtotime($reservation['date_debut'] ?? 'now'));
        $body = self::renderTemplate('reservation-reminder', ['reservation' => $reservation]);
        return self::send($to, $subject, $body, null, 'reservation_reminder');
    }

    public static function sendParrainageBonus(string $to, string $parrainPrenom, string $filleulPrenom, string $filleulNom, int $bonusMontant, ?string $userId = null): bool
    {
        if (!self::$initialized) self::init();
        $subject = 'Votre bonus de parrainage de ' . number_format($bonusMontant, 0, ',', ' ') . ' DA est crédité !';
        $body = self::renderTemplate('parrainage-bonus', [
            'prenom'        => $parrainPrenom,
            'filleul_prenom' => $filleulPrenom,
            'filleul_nom'   => $filleulNom,
            'bonus_montant' => $bonusMontant,
        ]);
        return self::send($to, $subject, $body, null, 'parrainage_bonus', $userId);
    }

    public static function sendAbonnementValide(string $to, array $data): bool
    {
        if (!self::$initialized) self::init();
        $nomAbonnement = $data['abonnement_nom'] ?? $data['nom'] ?? 'Coffice';
        $subject = 'Votre abonnement ' . $nomAbonnement . ' est activé !';
        $body = self::renderTemplate('abonnement-valide', ['souscription' => $data]);
        return self::send($to, $subject, $body, null, 'abonnement_valide');
    }

    public static function sendAbonnementRefuse(string $to, array $data): bool
    {
        if (!self::$initialized) self::init();
        $nomAbonnement = $data['abonnement_nom'] ?? $data['nom'] ?? 'Coffice';
        $subject = 'Votre demande d\'abonnement ' . $nomAbonnement . ' — réponse de Coffice';
        $body = self::renderTemplate('abonnement-refuse', ['souscription' => $data]);
        return self::send($to, $subject, $body, null, 'abonnement_refuse');
    }

    public static function sendAbonnementExpiration(string $to, array $data): bool
    {
        if (!self::$initialized) self::init();
        $jours = (int)($data['jours_restants'] ?? 7);
        $planNom = $data['plan_nom'] ?? 'votre abonnement';
        $subject = $jours <= 1
            ? 'Votre abonnement ' . $planNom . ' expire demain !'
            : 'Votre abonnement ' . $planNom . ' expire dans ' . $jours . ' jours';
        $body = self::renderTemplate('abonnement-expiration', $data);
        return self::send($to, $subject, $body, null, 'abonnement_expiration');
    }

    public static function sendDomiciliationExpiration(string $to, array $data): bool
    {
        if (!self::$initialized) self::init();
        $jours = (int)($data['jours_restants'] ?? 30);
        $raisonSociale = $data['raison_sociale'] ?? 'votre domiciliation';
        $subject = 'Votre domiciliation ' . $raisonSociale . ' expire dans ' . $jours . ' jour' . ($jours > 1 ? 's' : '');
        $body = self::renderTemplate('domiciliation-expiration', $data);
        return self::send($to, $subject, $body, null, 'domiciliation_expiration');
    }

    private static function renderTemplate(string $template, array $tplData): string
    {
        $templatePath = __DIR__ . '/../templates/emails/' . $template . '.php';

        if (!file_exists($templatePath)) {
            Logger::warning('Email template not found: ' . $template);
            return self::wrapInLayout(
                'Notification Coffice',
                '<p>' . htmlspecialchars(json_encode($tplData, JSON_UNESCAPED_UNICODE)) . '</p>'
            );
        }

        ob_start();
        (static function (array $tplData, string $_templatePath) {
            extract($tplData, EXTR_SKIP);
            include $_templatePath;
        })($tplData, $templatePath);
        return ob_get_clean();
    }

    public static function getAdminEmail(): string
    {
        if (!self::$initialized) self::init();
        return self::$config['admin_email'];
    }

    public static function getFromEmail(): string
    {
        if (!self::$initialized) self::init();
        return self::$config['from_email'];
    }

    public static function hero(string $emoji, string $title, string $subtitle, string $bgColor = '#0f172a'): string
    {
        return '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
<tr><td align="center" style="background-color:' . $bgColor . ';border-radius:16px;padding:44px 32px 40px;">
<p style="margin:0 0 14px;font-size:52px;line-height:1;mso-line-height-rule:exactly;">' . $emoji . '</p>
<h1 style="margin:0 0 10px;font-size:27px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;">' . htmlspecialchars($title) . '</h1>
<p style="margin:0;font-size:15px;color:rgba(255,255,255,0.78);line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;">' . $subtitle . '</p>
</td></tr>
</table>';
    }

    public static function wrapInLayout(string $title, string $content, string $preheader = '', ?string $unsubscribeUrl = null): string
    {
        if (!self::$initialized) self::init();
        $brandColor = '#0284c7';
        $cofficeUrl = self::$config['app_url'] ?? env('APP_URL', 'https://coffice.dz');
        $logoUrl    = $cofficeUrl . '/logo_coffice.png';
        $adminEmail = self::$config['admin_email'] ?? 'desk@coffice.dz';

        $unsubscribeLink = '';
        if ($unsubscribeUrl) {
            $unsubscribeLink = '
<tr><td align="center" style="padding-top:16px;">
<a href="' . htmlspecialchars($unsubscribeUrl) . '" style="color:#9ca3af;font-size:11px;text-decoration:underline;">Se désabonner</a>
</td></tr>';
        }

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
body{margin:0;padding:0;width:100%!important;background-color:#f1f5f9}
a{color:' . $brandColor . '}
@media only screen and (max-width:620px){
.wrapper{width:100%!important;padding:0 8px!important}
.content-cell{padding:28px 20px!important}
.header-cell{padding:28px 20px 24px!important}
.footer-cell{padding:24px 20px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica Neue,Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">' . htmlspecialchars($preheader) . '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:40px 16px 32px;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="580" class="wrapper" style="max-width:580px;">

    <!-- Logo top -->
    <tr><td align="center" class="header-cell" style="padding:0 0 24px;">
      <a href="' . $cofficeUrl . '" style="text-decoration:none;">
        <img src="' . $logoUrl . '" alt="Coffice" width="130" style="height:auto;display:inline-block;" />
      </a>
    </td></tr>

    <!-- White card -->
    <tr><td style="background-color:#ffffff;border-radius:20px;box-shadow:0 2px 20px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.04);">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">

        <!-- Content -->
        <tr><td class="content-cell" style="padding:40px 44px 44px;">
          ' . $content . '
        </td></tr>

        <!-- Footer -->
        <tr><td class="footer-cell" style="background-color:#f8fafc;border-top:1px solid #e8edf2;border-radius:0 0 20px 20px;padding:28px 44px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center" style="padding-bottom:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 8px;" valign="middle">
                  <a href="mailto:' . htmlspecialchars($adminEmail) . '" style="color:#64748b;text-decoration:none;font-size:13px;">📧 ' . htmlspecialchars($adminEmail) . '</a>
                </td>
                <td style="padding:0 4px;color:#cbd5e1;font-size:14px;" valign="middle">·</td>
                <td style="padding:0 8px;" valign="middle">
                  <a href="' . $cofficeUrl . '" style="color:#64748b;text-decoration:none;font-size:13px;">🌐 coffice.dz</a>
                </td>
              </tr>
              </table>
            </td></tr>
            <tr><td align="center">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Mohammadia Mall, 4ème étage · Bureau 1178 · Alger<br>+213 23 804 924 &nbsp;·&nbsp; +213 795 38 01 24</p>
            </td></tr>
            <tr><td align="center" style="padding-top:16px;border-top:1px solid #e2e8f0;margin-top:16px;">
              <!-- padding-top trick via inner table -->
            </td></tr>
            <tr><td align="center">
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">Vous recevez cet e-mail car vous disposez d\'un compte sur Coffice.</p>
            </td></tr>
            ' . $unsubscribeLink . '
          </table>
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
        $html  = '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa;border:1px solid #e8eaed;border-radius:12px;overflow:hidden;margin:24px 0;">';
        $count = count($rows);
        $i     = 0;
        foreach ($rows as $label => $value) {
            $border = ($i < $count - 1) ? '1px solid #f0f1f3' : 'none';
            $html .= '<tr><td style="padding:14px 20px;font-size:14px;color:#6b7280;font-weight:500;border-bottom:' . $border . ';width:45%;">' . htmlspecialchars((string) $label) . '</td>';
            $isPassword = stripos((string) $label, 'mot de passe') !== false || stripos((string) $label, 'password') !== false;
            $valueStyle = $isPassword
                ? 'padding:14px 20px;font-size:15px;color:#0284c7;font-weight:700;text-align:right;border-bottom:' . $border . ';font-family:\'Courier New\',Courier,monospace;letter-spacing:2px;'
                : 'padding:14px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:' . $border . ';';
            $html .= '<td style="' . $valueStyle . '">' . htmlspecialchars((string) $value) . '</td></tr>';
            $i++;
        }
        $html .= '</table>';
        return $html;
    }

    public static function ctaButton(string $href, string $text, bool $secondary = false): string
    {
        $bg = $secondary ? '#1f2937' : '#0284c7';
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
