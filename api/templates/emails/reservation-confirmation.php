<?php
$prenomClient = htmlspecialchars($reservation['prenom'] ?? '');
$espaceName = htmlspecialchars($reservation['espace_nom'] ?? 'N/A');
$dateDebut = date('d/m/Y', strtotime($reservation['date_debut']));
$heureDebut = date('H:i', strtotime($reservation['date_debut']));
$heureFin = date('H:i', strtotime($reservation['date_fin']));
$montant = number_format($reservation['prix_total'] ?? 0, 0, ',', ' ') . ' DA';
$participants = $reservation['nombre_personnes'] ?? $reservation['participants'] ?? 1;
$appUrl = env('APP_URL', 'https://coffice.dz');

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px;">Réservation confirmée!</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenomClient . ', bonne nouvelle! Votre réservation a été confirmée.</p>
' . Mailer::statusBadge('Confirmée', 'success') . '
' . Mailer::infoBox([
    'Espace' => $espaceName,
    'Date' => $dateDebut,
    'Horaire' => $heureDebut . ' – ' . $heureFin,
    'Participants' => $participants . ' personne' . ($participants > 1 ? 's' : ''),
    'Montant' => $montant,
]) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Nous vous attendons au 4ème étage du Mohammadia Mall, Bureau 1178.</p>
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0;">En cas de besoin, contactez-nous au +213 795 38 01 24 ou par e-mail à desk@coffice.dz.</p>
' . Mailer::ctaButton($appUrl . '/app/reservations', 'Voir ma réservation');

echo Mailer::wrapInLayout('Réservation confirmée', $content, 'Votre réservation pour ' . $espaceName . ' est confirmée');
?>
