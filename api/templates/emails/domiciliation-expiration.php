<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$prenom = htmlspecialchars($prenom ?? '');
$raisonSociale = htmlspecialchars($raison_sociale ?? '');
$dateFin = htmlspecialchars($date_fin ?? '');
$joursRestants = (int)($jours_restants ?? 30);

$urgency = $joursRestants <= 7 ? 'warning' : 'info';
$urgencyLabel = $joursRestants <= 7 ? 'Expire dans ' . $joursRestants . ' jours' : 'Expire dans 30 jours';

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Votre domiciliation expire bientôt</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', le contrat de domiciliation de <strong>' . $raisonSociale . '</strong> arrive à échéance.</p>
' . Mailer::statusBadge($urgencyLabel, $urgency) . '
' . Mailer::infoBox([
    'Entreprise'       => $raisonSociale,
    'Date d\'expiration' => $dateFin,
    'Adresse'          => 'Mohammadia Mall, 4ème étage, Bureau 1178, Alger',
]) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Pour renouveler votre contrat de domiciliation et maintenir votre adresse légale, contactez notre équipe.</p>
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 16px;">Tél. : +213 795 38 01 24 | E-mail : desk@coffice.dz</p>
' . Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Gérer ma domiciliation');

echo Mailer::wrapInLayout('Domiciliation expirant bientôt', $content, 'La domiciliation de ' . $raisonSociale . ' expire ' . ($joursRestants <= 7 ? 'dans ' . $joursRestants . ' jours' : 'dans 30 jours'));
