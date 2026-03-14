<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$prenom = htmlspecialchars($prenom ?? '');
$expediteur = htmlspecialchars($expediteur ?? 'Expéditeur inconnu');
$typeCourrier = htmlspecialchars($type_courrier ?? 'Courrier');
$dateReception = htmlspecialchars($date_reception ?? date('d/m/Y'));
$raisonSociale = htmlspecialchars($raison_sociale ?? '');

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Nouveau courrier reçu</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 16px;">Bonjour ' . $prenom . ', un nouveau courrier a été reçu pour <strong>' . $raisonSociale . '</strong>.</p>
' . Mailer::statusBadge('Courrier reçu', 'info') . '
' . Mailer::infoBox([
    'Expéditeur'      => $expediteur,
    'Type'            => $typeCourrier,
    'Date de réception' => $dateReception,
    'Destinataire'    => $raisonSociale,
]) . '
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 16px;">Connectez-vous à votre espace pour indiquer votre souhait : retrait en bureau, scan ou réexpédition.</p>
' . Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Gérer mon courrier');

echo Mailer::wrapInLayout('Nouveau courrier reçu', $content, 'Un courrier est arrivé pour ' . $raisonSociale);
