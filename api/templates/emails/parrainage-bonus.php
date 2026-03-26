<?php
$appUrl       = env('APP_URL', 'https://coffice.dz');
$prenom       = htmlspecialchars($prenom ?? '');
$filleulPrenom = htmlspecialchars($filleul_prenom ?? 'votre filleul');
$filleulNom   = htmlspecialchars($filleul_nom ?? '');
$bonusMontant = isset($bonus_montant) ? number_format((float)$bonus_montant, 0, ',', ' ') . ' DA' : '3 000 DA';

$content =
    Mailer::hero('🎊', 'Bonus de parrainage débloqué !', 'Bonjour ' . $prenom . ', votre filleul <strong>' . $filleulPrenom . ' ' . $filleulNom . '</strong> a effectué sa première réservation.', '#059669') .
    Mailer::statusBadge('Bonus crédité', 'success') .
    Mailer::highlightBox($bonusMontant, 'Crédité sur votre compte') .
    Mailer::infoBox([
        'Filleul'       => $filleulPrenom . ' ' . $filleulNom,
        'Bonus crédité' => $bonusMontant,
    ]) .
    '<p style="font-size:15px;line-height:1.7;color:#374151;margin:20px 0 6px;">Votre bonus est disponible immédiatement et utilisable pour votre prochaine réservation.</p>
<p style="font-size:14px;color:#64748b;margin:0;">Continuez à parrainer vos proches pour cumuler encore plus d\'avantages&nbsp;!</p>' .
    Mailer::ctaButton($appUrl . '/app/parrainage', 'Voir mon programme de parrainage');

echo Mailer::wrapInLayout('Bonus de parrainage – Coffice', $content, $filleulPrenom . ' a fait sa première réservation — votre bonus de ' . $bonusMontant . ' est crédité !');
