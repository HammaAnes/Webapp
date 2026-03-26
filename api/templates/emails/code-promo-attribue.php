<?php
$appUrl        = env('APP_URL', 'https://coffice.dz');
$prenom        = htmlspecialchars($prenom ?? '');
$codePromo     = htmlspecialchars($code_promo ?? '');
$reduction     = htmlspecialchars($reduction ?? '');
$typeReduction = htmlspecialchars($type_reduction ?? 'pourcentage');
$dateExp       = htmlspecialchars($date_expiration ?? '');
$description   = htmlspecialchars($description ?? '');

$reductionLabel = $typeReduction === 'montant'
    ? number_format((float)str_replace([' ', 'DA', '%'], '', $reduction), 0, ',', ' ') . ' DA de réduction'
    : $reduction . '% de réduction';

$codeBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
<tr><td align="center" style="background:linear-gradient(135deg,#6d28d9 0%,#7c3aed 100%);border-radius:16px;padding:32px 24px;">
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;">Votre code exclusif</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr><td style="background:rgba(255,255,255,0.15);border:2px dashed rgba(255,255,255,0.4);border-radius:12px;padding:14px 32px;">
      <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:6px;font-family:\'Courier New\',Courier,monospace;">' . $codePromo . '</span>
    </td></tr>
  </table>
  <p style="margin:12px 0 0;font-size:18px;font-weight:700;color:#e9d5ff;">' . $reductionLabel . '</p>
</td></tr>
</table>';

$infoRows = ['Réduction' => $reductionLabel];
if ($dateExp) $infoRows['Valable jusqu\'au'] = $dateExp;

$content =
    Mailer::hero('🎁', 'Un code promo pour vous !', 'Bonjour ' . $prenom . ', un avantage exclusif a été ajouté à votre compte.', '#7c3aed') .
    ($description ? '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 4px;">' . $description . '</p>' : '') .
    $codeBlock .
    Mailer::infoBox($infoRows) .
    '<p style="font-size:14px;color:#64748b;margin:0 0 4px;">Saisissez ce code lors de votre prochaine réservation pour en bénéficier automatiquement.</p>' .
    Mailer::ctaButton($appUrl . '/app/reservations', 'Utiliser mon code');

echo Mailer::wrapInLayout('Code promo attribué – Coffice', $content, $codePromo . ' — ' . $reductionLabel . ' sur votre prochaine réservation');
