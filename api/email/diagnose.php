<?php
/**
 * Diagnostic email — endpoint admin
 * Affiche la config SMTP et peut envoyer un email de test
 * URL : /api/email/diagnose.php?to=test@example.com
 */

require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();
if ($auth['role'] !== 'admin') {
    Response::error('Accès réservé aux administrateurs', 403);
    exit;
}

$mailer      = env('MAIL_MAILER', 'smtp');
$fromEmail   = env('MAIL_FROM_ADDRESS', 'desk@coffice.dz');
$fromName    = env('MAIL_FROM_NAME', 'Coffice');
$smtpHost    = env('MAIL_HOST', 'mail.coffice.dz');
$smtpPort    = env('MAIL_PORT', '465');
$smtpUser    = env('MAIL_USERNAME', 'desk@coffice.dz');
$smtpEnc     = env('MAIL_ENCRYPTION', 'ssl');
$appUrl      = env('APP_URL', 'https://coffice.dz');

$result = [
    'config' => [
        'MAIL_MAILER'       => $mailer,
        'MAIL_HOST'         => $smtpHost,
        'MAIL_PORT'         => $smtpPort,
        'MAIL_ENCRYPTION'   => $smtpEnc,
        'MAIL_USERNAME'     => $smtpUser,
        'MAIL_FROM_ADDRESS' => $fromEmail,
        'MAIL_FROM_NAME'    => $fromName,
        'APP_URL'           => $appUrl,
    ],
    'diagnostic' => [],
    'smtp_test'  => null,
];

if ($mailer === 'log') {
    $result['diagnostic'][] = '⚠️ MAIL_MAILER=log — les emails sont uniquement loggés, aucun envoi réel';
} elseif ($mailer === 'smtp') {
    $result['diagnostic'][] = '✓ MAIL_MAILER=smtp — utilise PHPMailer (SSL port 465)';
    if (empty(env('MAIL_HOST', ''))) {
        $result['diagnostic'][] = '⚠️ MAIL_HOST non configuré dans .env — utilise la valeur par défaut mail.coffice.dz';
    }
} else {
    $result['diagnostic'][] = '⚠️ MAIL_MAILER="' . $mailer . '" non reconnu — utiliser smtp';
}

$testTo = $_GET['to'] ?? null;

if ($testTo && filter_var($testTo, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Coffice — Test SMTP (' . date('H:i:s') . ')';
    $html    = '<h2>Test SMTP Coffice</h2><p>Si tu reçois cet email, le SMTP fonctionne correctement.</p><p>Serveur : ' . htmlspecialchars($smtpHost) . ':' . htmlspecialchars($smtpPort) . '</p><p>Timestamp : ' . date('Y-m-d H:i:s') . '</p>';

    $smtpError = null;
    $sent = false;
    try {
        $sent = Mailer::sendRaw($testTo, $subject, $html);
    } catch (\Throwable $e) {
        $smtpError = $e->getMessage();
    }

    $result['smtp_test'] = [
        'to'      => $testTo,
        'success' => $sent,
        'error'   => $smtpError,
        'verdict' => $sent
            ? '✓ Email envoyé via SMTP Coffice — vérifiez la boîte de réception et les spams'
            : '✗ Échec SMTP — ' . ($smtpError ?? 'vérifiez les logs serveur et la config .env'),
    ];
}

if (!$testTo) {
    $result['diagnostic'][] = 'Pour tester l\'envoi, ajouter ?to=votre@email.com à l\'URL';
}

Response::success($result, 'Diagnostic email complet');
