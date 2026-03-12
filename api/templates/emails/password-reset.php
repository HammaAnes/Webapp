<?php
$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px;">R&eacute;initialisation de votre mot de passe</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . htmlspecialchars($name) . ', vous avez demand&eacute; la r&eacute;initialisation de votre mot de passe.</p>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 4px;">Cliquez sur le bouton ci-dessous pour d&eacute;finir un nouveau mot de passe&nbsp;:</p>
' . Mailer::ctaButton(htmlspecialchars($reset_url), 'R&eacute;initialiser mon mot de passe') . '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;border-top:1px solid #e8eaed;">
<tr><td style="padding-top:16px;font-size:13px;color:#9ca3af;">Ce lien est valable pendant ' . htmlspecialchars($expires_in) . '. Si vous n\'avez pas fait cette demande, ignorez simplement cet e-mail.</td></tr>
</table>';

echo Mailer::wrapInLayout('Réinitialisation mot de passe', $content, 'Réinitialisation de votre mot de passe Coffice');
?>
