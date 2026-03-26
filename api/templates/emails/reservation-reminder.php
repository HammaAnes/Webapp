<?php
$appUrl       = env('APP_URL', 'https://coffice.dz');
$prenomClient = htmlspecialchars($reservation['prenom'] ?? '');
$espaceName   = htmlspecialchars($reservation['espace_nom'] ?? 'N/A');
$dateDebut    = date('d/m/Y', strtotime($reservation['date_debut']));
$heureDebut   = date('H:i', strtotime($reservation['date_debut']));
$heureFin     = date('H:i', strtotime($reservation['date_fin']));
$participants = $reservation['nombre_personnes'] ?? $reservation['participants'] ?? 1;

$prepBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0 0;background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
<tr><td style="padding:20px 24px;">
  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Préparez votre venue</p>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:4px 0;font-size:13px;color:#78350f;">📍 &nbsp;Mohammadia Mall, 4ème étage, Bureau 1178, Alger</td></tr>
    <tr><td style="padding:4px 0;font-size:13px;color:#78350f;">📞 &nbsp;+213 795 38 01 24</td></tr>
    <tr><td style="padding:4px 0;font-size:13px;color:#78350f;">🕐 &nbsp;Arrivez 5 minutes avant votre créneau</td></tr>
  </table>
</td></tr>
</table>';

$content =
    Mailer::hero('🔔', 'Rappel&nbsp;: demain à ' . $heureDebut, 'Bonjour ' . $prenomClient . ', votre réservation est prévue pour demain.', '#b45309') .
    Mailer::infoBox([
        'Espace'       => $espaceName,
        'Date'         => $dateDebut,
        'Horaire'      => $heureDebut . ' – ' . $heureFin,
        'Participants' => $participants . ' personne' . ($participants > 1 ? 's' : ''),
    ]) .
    $prepBlock .
    '<p style="font-size:16px;font-weight:600;color:#0f172a;text-align:center;margin:28px 0 0;">À demain chez Coffice&nbsp;! ☕</p>';

echo Mailer::wrapInLayout('Rappel de réservation – Coffice', $content, 'Rappel : ' . $espaceName . ' demain à ' . $heureDebut);
