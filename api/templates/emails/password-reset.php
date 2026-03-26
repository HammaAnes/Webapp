<?php
$appUrl = env('APP_URL', 'https://coffice.dz');

$securityBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
<tr><td style="padding:16px 20px;">
  <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">⚠️ &nbsp;Si vous n\'avez pas fait cette demande, ignorez cet e-mail — votre mot de passe restera inchangé.</p>
</td></tr>
</table>';

$content =
    Mailer::hero('🔐', 'Réinitialisation du mot de passe', 'Bonjour ' . htmlspecialchars($name) . ', nous avons reçu une demande de réinitialisation.', '#4f46e5') .
    '<p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 8px;">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est valable pendant <strong>' . htmlspecialchars($expires_in) . '</strong>.</p>' .
    Mailer::ctaButton(htmlspecialchars($reset_url), 'Réinitialiser mon mot de passe') .
    $securityBlock;

echo Mailer::wrapInLayout('Réinitialisation mot de passe – Coffice', $content, 'Réinitialisez votre mot de passe Coffice — lien valable ' . htmlspecialchars($expires_in));
