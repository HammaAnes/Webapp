<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$prenom = htmlspecialchars($prenom ?? '');
$planNom = htmlspecialchars($plan_nom ?? 'votre abonnement');
$prixMensuel = isset($prix_mensuel) ? number_format((float)$prix_mensuel, 0, ',', ' ') . ' DA/mois' : '';
$dateFin = htmlspecialchars($date_fin ?? '');
$joursRestants = (int)($jours_restants ?? 7);

$urgency = $joursRestants <= 1 ? 'danger' : ($joursRestants <= 7 ? 'warning' : 'info');
$urgencyLabel = $joursRestants <= 1 ? 'Expire demain !' : 'Expire dans ' . $joursRestants . ' jours';

$infoRows = ['Abonnement' => $planNom, 'Date d\'expiration' => $dateFin];
if ($prixMensuel) {
    $infoRows['Tarif'] = $prixMensuel;
}

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Votre abonnement expire bientôt</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', votre abonnement <strong>' . $planNom . '</strong> arrive à échéance.</p>
' . Mailer::statusBadge($urgencyLabel, $urgency) . '
' . Mailer::infoBox($infoRows) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Pour continuer à profiter de Coffice sans interruption, renouvelez votre abonnement avant la date d\'expiration.</p>
' . Mailer::ctaButton($appUrl . '/app/abonnements', 'Renouveler mon abonnement');

echo Mailer::wrapInLayout('Abonnement expirant bientôt', $content, 'Votre abonnement ' . $planNom . ' expire ' . ($joursRestants <= 1 ? 'demain' : 'dans ' . $joursRestants . ' jours'));
