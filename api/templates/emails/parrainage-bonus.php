<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$prenom = htmlspecialchars($prenom ?? '');
$filleulPrenom = htmlspecialchars($filleul_prenom ?? 'votre filleul');
$filleulNom = htmlspecialchars($filleul_nom ?? '');
$bonusMontant = isset($bonus_montant) ? number_format((float)$bonus_montant, 0, ',', ' ') . ' DA' : '3 000 DA';

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Bonus de parrainage débloqué&nbsp;!</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', bonne nouvelle&nbsp;! <strong>' . $filleulPrenom . ' ' . $filleulNom . '</strong> a effectué sa première réservation chez Coffice.</p>
' . Mailer::statusBadge('Bonus débloqué', 'success') . '
' . Mailer::highlightBox($bonusMontant, 'Votre bonus de parrainage') . '
' . Mailer::infoBox([
    'Filleul'         => $filleulPrenom . ' ' . $filleulNom,
    'Bonus crédité'   => $bonusMontant,
]) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Votre bonus a été crédité sur votre compte. Vous pouvez l\'utiliser lors de votre prochaine réservation.</p>
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 16px;">Continuez à parrainer vos contacts et cumulez des avantages&nbsp;!</p>
' . Mailer::ctaButton($appUrl . '/app/parrainage', 'Voir mon parrainage');

echo Mailer::wrapInLayout('Bonus de parrainage débloqué', $content, 'Votre filleul ' . $filleulPrenom . ' a fait sa première réservation — bonus de ' . $bonusMontant . ' crédité');
