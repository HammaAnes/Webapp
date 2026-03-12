<?php
$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px;">Bienvenue chez Coffice, ' . htmlspecialchars($name) . '&nbsp;!</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 20px;">Nous sommes ravis de vous compter parmi nos membres. Votre compte a été créé avec succès.</p>
' . Mailer::infoBox([
    'Nom' => htmlspecialchars($name),
]) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:20px 0 12px;">Vous pouvez dès maintenant accéder à notre plateforme pour&nbsp;:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
<tr><td style="padding:6px 0 6px 16px;font-size:15px;line-height:1.7;color:#4b5563;">&#8226;&nbsp; Réserver un espace de travail (box, open space, salle de r&eacute;union)</td></tr>
<tr><td style="padding:6px 0 6px 16px;font-size:15px;line-height:1.7;color:#4b5563;">&#8226;&nbsp; Consulter les disponibilitées en temps réel</td></tr>
<tr><td style="padding:6px 0 6px 16px;font-size:15px;line-height:1.7;color:#4b5563;">&#8226;&nbsp; Demander une domiciliation commerciale</td></tr>
<tr><td style="padding:6px 0 6px 16px;font-size:15px;line-height:1.7;color:#4b5563;">&#8226;&nbsp; Gérer vos réservations et abonnements</td></tr>
</table>
' . Mailer::ctaButton(htmlspecialchars($login_url), 'Accéder à mon espace');

echo Mailer::wrapInLayout('Bienvenue chez Coffice', $content, 'Votre compte Coffice a été créé avec succès');
?>
