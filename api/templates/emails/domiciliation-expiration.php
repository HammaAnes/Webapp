<?php
$appUrl         = env('APP_URL', 'https://coffice.dz');
$prenom         = htmlspecialchars($prenom ?? '');
$raisonSociale  = htmlspecialchars($raison_sociale ?? '');
$dateFin        = htmlspecialchars($date_fin ?? '');
$joursRestants  = (int)($jours_restants ?? 30);

$isUrgent      = $joursRestants <= 7;
$urgencyLabel  = $isUrgent ? 'Expire dans ' . $joursRestants . ' jour' . ($joursRestants > 1 ? 's' : '') : 'Expire dans 30 jours';
$urgency       = $isUrgent ? 'warning' : 'info';
$heroBg        = $isUrgent ? '#ea580c' : '#0284c7';
$heroEmoji     = $isUrgent ? '⚠️' : '📅';
$heroSub       = 'Bonjour ' . $prenom . ', pensez à renouveler votre contrat avant la date d\'échéance.';

$content =
    Mailer::hero($heroEmoji, 'Votre domiciliation expire bientôt', $heroSub, $heroBg) .
    Mailer::statusBadge($urgencyLabel, $urgency) .
    Mailer::infoBox([
        'Entreprise'          => $raisonSociale,
        'Date d\'expiration'  => $dateFin,
        'Adresse'             => 'Mohammadia Mall, 4ème étage, Bureau 1178, Alger',
    ]) .
    '<p style="font-size:15px;line-height:1.7;color:#374151;margin:20px 0 4px;">Pour renouveler votre domiciliation et conserver votre adresse légale, contactez notre équipe.</p>
<p style="font-size:14px;color:#64748b;margin:0;">📞 +213 795 38 01 24 &nbsp;·&nbsp; ✉️ <a href="mailto:desk@coffice.dz" style="color:#0284c7;">desk@coffice.dz</a></p>' .
    Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Renouveler ma domiciliation');

echo Mailer::wrapInLayout('Domiciliation expirant bientôt – Coffice', $content, 'La domiciliation de ' . $raisonSociale . ' expire ' . ($isUrgent ? 'dans ' . $joursRestants . ' jours' : 'bientôt'));
