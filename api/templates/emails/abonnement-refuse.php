<?php
$appUrl        = env('APP_URL', 'https://coffice.dz');
$prenomClient  = htmlspecialchars($souscription['prenom'] ?? $souscription['user_prenom'] ?? '');
$nomAbonnement = htmlspecialchars($souscription['abonnement_nom'] ?? $souscription['nom'] ?? 'Abonnement');
$motif         = isset($souscription['motif']) && $souscription['motif'] ? htmlspecialchars($souscription['motif']) : null;

$motifBlock = $motif ? '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
<tr><td style="padding:20px 24px;">
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Motif du refus</p>
  <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">' . $motif . '</p>
</td></tr>
</table>' : '';

$content =
    Mailer::hero('📋', 'Demande d\'abonnement non retenue', 'Bonjour ' . $prenomClient . ', nous avons examiné votre demande pour l\'abonnement ' . $nomAbonnement . '.', '#475569') .
    Mailer::statusBadge('Refusée', 'danger') .
    Mailer::infoBox(['Formule demandée' => $nomAbonnement]) .
    $motifBlock .
    '<p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 6px;">Si vous souhaitez en savoir plus ou soumettre une nouvelle demande, notre équipe reste disponible.</p>
<p style="font-size:14px;color:#64748b;margin:0 0 4px;">📞 +213 795 38 01 24 &nbsp;·&nbsp; ✉️ <a href="mailto:desk@coffice.dz" style="color:#0284c7;">desk@coffice.dz</a></p>' .
    Mailer::ctaButton($appUrl . '/app/abonnements', 'Voir les formules disponibles', true);

echo Mailer::wrapInLayout('Demande d\'abonnement – Coffice', $content, 'Votre demande d\'abonnement ' . $nomAbonnement . ' — réponse de Coffice');
