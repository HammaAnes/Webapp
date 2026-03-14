<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$prenom = htmlspecialchars($prenom ?? '');
$codePromo = htmlspecialchars($code_promo ?? '');
$reduction = htmlspecialchars($reduction ?? '');
$typeReduction = htmlspecialchars($type_reduction ?? 'pourcentage');
$dateExpiration = htmlspecialchars($date_expiration ?? '');
$description = htmlspecialchars($description ?? '');

$reductionLabel = $typeReduction === 'montant'
    ? number_format((float)str_replace([' ', 'DA', '%'], '', $reduction), 0, ',', ' ') . ' DA de réduction'
    : $reduction . '% de réduction';

$infoRows = ['Code promo' => $codePromo, 'Réduction' => $reductionLabel];
if ($dateExpiration) {
    $infoRows['Valable jusqu\'au'] = $dateExpiration;
}

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Un code promo pour vous&nbsp;!</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', un code promotionnel a été attribué à votre compte Coffice.</p>
' . ($description ? '<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 16px;">' . $description . '</p>' : '') . '
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;"><tr><td style="background-color:#0284c7;border-radius:12px;padding:20px 40px;text-align:center;">
<p style="margin:0 0 4px;font-size:12px;color:#bae6fd;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Votre code</p>
<p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:4px;font-family:monospace;">' . $codePromo . '</p>
</td></tr></table>
' . Mailer::infoBox($infoRows) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Utilisez ce code lors de votre prochaine réservation pour bénéficier de votre réduction.</p>
' . Mailer::ctaButton($appUrl . '/app/reservations', 'Faire une réservation');

echo Mailer::wrapInLayout('Code promo attribué', $content, 'Votre code promo ' . $codePromo . ' — ' . $reductionLabel);
