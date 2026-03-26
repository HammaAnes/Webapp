<?php
$appUrl       = env('APP_URL', 'https://coffice.dz');
$prenom       = htmlspecialchars($prenom ?? '');
$expediteur   = htmlspecialchars($expediteur ?? 'Expéditeur inconnu');
$typeCourrier = htmlspecialchars($type_courrier ?? 'Courrier');
$dateRec      = htmlspecialchars($date_reception ?? date('d/m/Y'));
$raisonSoc    = htmlspecialchars($raison_sociale ?? '');

$actionsBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
<tr><td style="padding:20px 24px;">
  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">Que souhaitez-vous faire&nbsp;?</p>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:3px 0;font-size:13px;color:#1e40af;">📦 &nbsp; Retirer votre courrier au bureau</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#1e40af;">📸 &nbsp; Demander un scan numérique</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#1e40af;">📬 &nbsp; Réexpédition à votre adresse</td></tr>
  </table>
</td></tr>
</table>';

$content =
    Mailer::hero('📬', 'Nouveau courrier reçu', 'Bonjour ' . $prenom . ', un courrier est arrivé pour <strong>' . $raisonSoc . '</strong>.', '#0284c7') .
    Mailer::statusBadge('Courrier reçu', 'info') .
    Mailer::infoBox([
        'Expéditeur'        => $expediteur,
        'Type'              => $typeCourrier,
        'Date de réception' => $dateRec,
        'Destinataire'      => $raisonSoc,
    ]) .
    $actionsBlock .
    Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Gérer mon courrier');

echo Mailer::wrapInLayout('Nouveau courrier reçu – Coffice', $content, 'Un courrier de ' . $expediteur . ' est arrivé pour ' . $raisonSoc);
