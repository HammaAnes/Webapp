<?php
$prenomClient = htmlspecialchars($reservation['prenom'] ?? '');
$espaceName = htmlspecialchars($reservation['espace_nom'] ?? 'N/A');
$dateDebut = date('d/m/Y', strtotime($reservation['date_debut']));
$heureDebut = date('H:i', strtotime($reservation['date_debut']));
$heureFin = date('H:i', strtotime($reservation['date_fin']));
$participants = $reservation['nombre_personnes'] ?? $reservation['participants'] ?? 1;

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px;">Rappel&nbsp;: réservation demain</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 16px;">Bonjour ' . $prenomClient . ', nous vous rappelons que votre réservation est prévue pour demain.</p>
' . Mailer::infoBox([
    'Espace' => $espaceName,
    'Date' => $dateDebut,
    'Horaire' => $heureDebut . ' – ' . $heureFin,
    'Participants' => $participants . ' personne' . ($participants > 1 ? 's' : ''),
]) . '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa;border:1px solid #e8eaed;border-radius:12px;margin:20px 0;">
<tr><td style="padding:16px 20px;font-size:14px;color:#374151;"><strong>Adresse&nbsp;:</strong> Mohammadia Mall, 4ème étage, Bureau 1178, Alger</td></tr>
<tr><td style="padding:0 20px 16px;font-size:14px;color:#374151;"><strong>T&eacute;l&eacute;phone&nbsp;:</strong> +213 795 38 01 24</td></tr>
</table>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 0;">&Agrave; demain chez Coffice&nbsp;!</p>';

echo Mailer::wrapInLayout('Rappel de réservation', $content, 'Rappel : votre réservation est prévue demain à ' . $heureDebut);
?>
