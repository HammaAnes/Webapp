<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$name = htmlspecialchars($name ?? '');
$email = htmlspecialchars($email ?? '');
$loginUrl = htmlspecialchars($login_url ?? $appUrl . '/app');

$codeSection = !empty($code_parrainage) ? '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 0;">
<tr><td style="background:linear-gradient(135deg,#0369a1 0%,#0284c7 100%);border-radius:14px;padding:24px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;">Votre code de parrainage</p>
  <p style="margin:0 0 12px;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.5;">Partagez-le, gagnez <strong>3 000 DA</strong> pour chaque ami inscrit.</p>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);border-radius:10px;padding:12px 24px;border:1px solid rgba(255,255,255,0.25);">
      <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:5px;font-family:\'Courier New\',Courier,monospace;">' . htmlspecialchars($code_parrainage) . '</span>
    </td>
  </tr></table>
</td></tr>
</table>' : '';

$stepsSection = '
<p style="font-size:14px;font-weight:700;color:#0f172a;margin:28px 0 16px;text-transform:uppercase;letter-spacing:0.5px;">Vos 3 premières étapes</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr>
  <td style="width:40px;vertical-align:top;padding-top:1px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:32px;height:32px;border-radius:50%;background-color:#dbeafe;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;line-height:32px;">1</td></tr></table>
  </td>
  <td style="vertical-align:top;padding-bottom:20px;">
    <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a;">Complétez votre profil</p>
    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Téléphone, entreprise, informations professionnelles.</p>
  </td>
</tr>
<tr>
  <td style="width:40px;vertical-align:top;padding-top:1px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:32px;height:32px;border-radius:50%;background-color:#dbeafe;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;line-height:32px;">2</td></tr></table>
  </td>
  <td style="vertical-align:top;padding-bottom:20px;">
    <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a;">Explorez nos espaces</p>
    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Box privés, open space, salles de réunion — à votre rythme.</p>
  </td>
</tr>
<tr>
  <td style="width:40px;vertical-align:top;padding-top:1px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:32px;height:32px;border-radius:50%;background-color:#dbeafe;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;line-height:32px;">3</td></tr></table>
  </td>
  <td style="vertical-align:top;">
    <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a;">Faites votre première réservation</p>
    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Réservez en quelques clics depuis votre tableau de bord.</p>
  </td>
</tr>
</table>';

$content =
    Mailer::hero('👋', 'Bienvenue chez Coffice, ' . $name . ' !', 'Votre compte a été créé avec succès. Bienvenue dans votre nouvel espace de travail.', '#0f172a') .
    Mailer::infoBox(['Nom complet' => $name, 'E-mail' => $email]) .
    $stepsSection .
    $codeSection .
    Mailer::ctaButton($loginUrl, 'Accéder à mon espace') .
    '<p style="font-size:13px;color:#94a3b8;text-align:center;margin:20px 0 0;">Une question&nbsp;? Écrivez-nous à <a href="mailto:desk@coffice.dz" style="color:#0284c7;">desk@coffice.dz</a>.</p>';

echo Mailer::wrapInLayout('Bienvenue chez Coffice', $content, 'Votre compte Coffice est prêt — connexion en un clic');
