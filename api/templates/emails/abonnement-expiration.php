<?php
$appUrl        = env('APP_URL', 'https://coffice.dz');
$prenom        = htmlspecialchars($prenom ?? '');
$planNom       = htmlspecialchars($plan_nom ?? 'votre abonnement');
$prixMensuel   = isset($prix_mensuel) ? number_format((float)$prix_mensuel, 0, ',', ' ') . ' DA/mois' : '';
$dateFin       = htmlspecialchars($date_fin ?? '');
$joursRestants = (int)($jours_restants ?? 7);

$urgency      = $joursRestants <= 1 ? 'danger' : ($joursRestants <= 7 ? 'warning' : 'info');
$urgencyLabel = $joursRestants <= 1 ? 'Expire demain !' : 'Expire dans ' . $joursRestants . ' jours';
$heroBg       = $joursRestants <= 1 ? '#dc2626' : ($joursRestants <= 7 ? '#ea580c' : '#0284c7');
$heroEmoji    = $joursRestants <= 1 ? '⏰' : '📅';

$infoRows = ['Abonnement' => $planNom, 'Date d\'expiration' => $dateFin];
if ($prixMensuel) $infoRows['Tarif'] = $prixMensuel;

$content =
    Mailer::hero($heroEmoji, 'Votre abonnement expire bientôt', 'Bonjour ' . $prenom . ', renouvelez votre abonnement pour continuer à profiter de Coffice sans interruption.', $heroBg) .
    Mailer::statusBadge($urgencyLabel, $urgency) .
    Mailer::infoBox($infoRows) .
    '<p style="font-size:15px;line-height:1.7;color:#374151;margin:20px 0 0;">Renouvelez avant la date d\'expiration pour conserver votre accès à tous les espaces et services.</p>' .
    Mailer::ctaButton($appUrl . '/app/abonnements', 'Renouveler mon abonnement');

echo Mailer::wrapInLayout('Abonnement expirant – Coffice', $content, $planNom . ' expire ' . ($joursRestants <= 1 ? 'demain' : 'dans ' . $joursRestants . ' jours') . ' — renouvelez maintenant');
