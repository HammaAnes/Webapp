<?php
$appUrl       = env('APP_URL', 'https://coffice.dz');
$prenomClient = htmlspecialchars($reservation['prenom'] ?? '');
$espaceName   = htmlspecialchars($reservation['espace_nom'] ?? 'N/A');
$dateDebut    = date('d/m/Y', strtotime($reservation['date_debut']));
$heureDebut   = date('H:i', strtotime($reservation['date_debut']));
$heureFin     = date('H:i', strtotime($reservation['date_fin']));
$montant      = number_format($reservation['montant_total'] ?? $reservation['prix_total'] ?? 0, 0, ',', ' ') . ' DA';
$raison       = isset($reservation['raison_annulation']) && $reservation['raison_annulation']
    ? htmlspecialchars($reservation['raison_annulation']) : null;
$annuleePar   = ($reservation['annulee_par'] ?? 'user') === 'admin' ? 'notre équipe' : 'vous-même';

$raisonBlock = $raison ? '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
<tr><td style="padding:20px 24px;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:1px;">Motif de l\'annulation</p>
  <p style="margin:0;font-size:14px;color:#7c2d12;line-height:1.6;">' . $raison . '</p>
</td></tr>
</table>' : '';

$content =
    Mailer::hero('❌', 'Réservation annulée', 'Bonjour ' . $prenomClient . ', votre réservation a été annulée par ' . $annuleePar . '.', '#475569') .
    Mailer::infoBox([
        'Espace'  => $espaceName,
        'Date'    => $dateDebut,
        'Horaire' => $heureDebut . ' – ' . $heureFin,
        'Montant' => $montant,
    ]) .
    $raisonBlock .
    '<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 4px;">Vous pouvez effectuer une nouvelle réservation à tout moment.</p>' .
    Mailer::ctaButton($appUrl . '/app/reservations', 'Faire une nouvelle réservation');

echo Mailer::wrapInLayout('Réservation annulée – Coffice', $content, 'Votre réservation du ' . $dateDebut . ' a été annulée');
