<?php
$appUrl = env('APP_URL', 'https://coffice.dz');
$prenomClient = htmlspecialchars($reservation['prenom'] ?? '');
$espaceName   = htmlspecialchars($reservation['espace_nom'] ?? 'N/A');
$dateDebut    = date('d/m/Y', strtotime($reservation['date_debut']));
$heureDebut   = date('H:i', strtotime($reservation['date_debut']));
$heureFin     = date('H:i', strtotime($reservation['date_fin']));
$montant      = number_format($reservation['montant_total'] ?? $reservation['prix_total'] ?? $reservation['montant'] ?? 0, 0, ',', ' ') . ' DA';
$participants = $reservation['nombre_personnes'] ?? $reservation['participants'] ?? 1;
$nomJour      = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'][(int)date('N', strtotime($reservation['date_debut'])) - 1] ?? '';
$nomMois      = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][(int)date('n', strtotime($reservation['date_debut'])) - 1] ?? '';
$dateLong     = $nomJour . ' ' . date('j', strtotime($reservation['date_debut'])) . ' ' . $nomMois . ' ' . date('Y', strtotime($reservation['date_debut']));

$mapBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0 0;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
<tr><td style="padding:16px 20px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:1px;">📍 Adresse</p>
  <p style="margin:0;font-size:14px;color:#166534;font-weight:500;">Mohammadia Mall, 4ème étage · Bureau 1178 · Alger</p>
</td></tr>
</table>';

$content =
    Mailer::hero('✅', 'Réservation confirmée !', 'Bonjour ' . $prenomClient . ', votre réservation est bien enregistrée.', '#059669') .
    Mailer::infoBox([
        'Espace'       => $espaceName,
        'Date'         => ucfirst($dateLong),
        'Horaire'      => $heureDebut . ' – ' . $heureFin,
        'Participants' => $participants . ' personne' . ($participants > 1 ? 's' : ''),
        'Montant'      => $montant,
    ]) .
    $mapBlock .
    Mailer::ctaButton($appUrl . '/app/reservations', 'Voir ma réservation');

echo Mailer::wrapInLayout('Réservation confirmée – Coffice', $content, 'Votre réservation pour ' . $espaceName . ' le ' . $dateDebut . ' est confirmée ✓');
