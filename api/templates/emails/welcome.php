<?php
$code_section = !empty($code_parrainage) ? '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin:20px 0;">
<tr><td style="padding:20px;">
<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px;">Votre code de parrainage</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#374151;">Partagez ce code et gagnez <strong>3 000 DA</strong> pour chaque ami qui s\'inscrit.</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td align="center" style="background-color:#0284c7;border-radius:8px;padding:12px 20px;">
<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:3px;font-family:monospace,monospace;">' . htmlspecialchars($code_parrainage) . '</span>
</td></tr></table>
</td></tr></table>' : '';

$steps_section = '
<p style="font-size:15px;font-weight:600;color:#111827;margin:20px 0 14px;">Vos 3 premières étapes&nbsp;:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
<tr>
<td style="width:34px;vertical-align:top;padding:2px 12px 16px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:28px;height:28px;border-radius:50%;background-color:#0284c7;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#ffffff;line-height:28px;">1</td></tr></table>
</td>
<td style="vertical-align:top;padding-bottom:16px;">
  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">Complétez votre profil</p>
  <p style="margin:0;font-size:13px;color:#6b7280;">Ajoutez votre téléphone, entreprise et informations de contact.</p>
</td>
</tr>
<tr>
<td style="width:34px;vertical-align:top;padding:2px 12px 16px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:28px;height:28px;border-radius:50%;background-color:#0284c7;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#ffffff;line-height:28px;">2</td></tr></table>
</td>
<td style="vertical-align:top;padding-bottom:16px;">
  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">Explorez nos espaces</p>
  <p style="margin:0;font-size:13px;color:#6b7280;">Box privés, open space, salles de réunion — trouvez l\'espace idéal.</p>
</td>
</tr>
<tr>
<td style="width:34px;vertical-align:top;padding:2px 12px 0 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:28px;height:28px;border-radius:50%;background-color:#0284c7;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#ffffff;line-height:28px;">3</td></tr></table>
</td>
<td style="vertical-align:top;">
  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">Faites votre première réservation</p>
  <p style="margin:0;font-size:13px;color:#6b7280;">Réservez en quelques clics depuis votre espace personnel.</p>
</td>
</tr>
</table>';

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px;">Bienvenue chez Coffice, ' . htmlspecialchars($name) . '&nbsp;!</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 20px;">Nous sommes ravis de vous compter parmi nos membres. Votre compte a été créé avec succès.</p>
' . Mailer::infoBox([
    'Nom complet' => htmlspecialchars($name),
    'E-mail' => htmlspecialchars($email ?? ''),
]) . '
' . $steps_section . '
' . $code_section . '
' . Mailer::ctaButton(htmlspecialchars($login_url), 'Accéder à mon espace') . '
<p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:20px;">Des questions ? Appelez-nous au +213 795 38 01 24 ou écrivez à desk@coffice.dz</p>';

echo Mailer::wrapInLayout('Bienvenue chez Coffice', $content, 'Votre compte Coffice a été créé avec succès');
?>
