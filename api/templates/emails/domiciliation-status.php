<?php
$appUrl        = env('APP_URL', 'https://coffice.dz');
$nomEntreprise = htmlspecialchars($domiciliation['nom_entreprise'] ?? $domiciliation['raison_sociale'] ?? 'N/A');
$isSuccess     = in_array($status, ['domiciliation_creee', 'active']);
$isDanger      = in_array($status, ['refusee', 'resiliee']);
$isWaiting     = in_array($status, ['en_attente_complements', 'en_attente_signature']);

$variant   = $isSuccess ? 'success' : ($isDanger ? 'danger' : 'warning');
$infoRows  = ['Entreprise' => $nomEntreprise, 'Statut' => htmlspecialchars($status_label)];

if (!empty($domiciliation['date_debut'])) {
    $infoRows['Date de début'] = date('d/m/Y', strtotime($domiciliation['date_debut']));
}
if (!empty($domiciliation['duree_mois'])) {
    $infoRows['Durée'] = htmlspecialchars($domiciliation['duree_mois']) . ' mois';
}

if ($isSuccess) {
    $emoji   = $status === 'active' ? '🏢' : '🎉';
    $heroTitle = $status === 'active' ? 'Domiciliation activée !' : 'Domiciliation créée !';
    $heroSub   = $status === 'active'
        ? 'Votre adresse commerciale est désormais active.'
        : 'Votre domiciliation a été créée avec succès.';
    $heroBg    = '#059669';
    $infoRows['Adresse'] = 'Mohammadia Mall, 4ème ét., Bureau 1178, Alger';
    $extra = '<p style="font-size:15px;line-height:1.7;color:#374151;margin:20px 0 0;">Vous pouvez désormais utiliser l\'adresse de Coffice comme siège social de votre entreprise.</p>';
} elseif ($isDanger) {
    $emoji     = '❌';
    $heroTitle = 'Demande non retenue';
    $heroSub   = 'Bonjour, votre demande de domiciliation n\'a pas pu aboutir.';
    $heroBg    = '#dc2626';
    $motif     = $domiciliation['motif_refus'] ?? $domiciliation['commentaire_admin'] ?? '';
    $extra     = $motif ? '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
<tr><td style="padding:20px 24px;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Motif</p>
  <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">' . htmlspecialchars($motif) . '</p>
</td></tr>
</table>
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0;">Pour toute question, contactez-nous au +213 795 38 01 24 ou à l\'adresse <a href="mailto:desk@coffice.dz" style="color:#0284c7;">desk@coffice.dz</a>.</p>' : '';
} elseif ($isWaiting) {
    $emoji     = '📋';
    $heroTitle = 'Action requise sur votre dossier';
    $heroSub   = 'Bonjour, votre dossier nécessite votre attention.';
    $heroBg    = '#0284c7';
    $extra     = '<p style="font-size:15px;line-height:1.7;color:#374151;margin:20px 0 0;">Notre équipe traite votre dossier. Vous serez notifié·e à chaque étape.</p>';
} else {
    $emoji     = '🔄';
    $heroTitle = 'Mise à jour de votre domiciliation';
    $heroSub   = 'Le statut de votre domiciliation a été mis à jour.';
    $heroBg    = '#64748b';
    $extra     = '<p style="font-size:15px;line-height:1.7;color:#374151;margin:20px 0 0;">Notre équipe traite votre dossier. Vous serez notifié·e à chaque étape.</p>';
}

$content =
    Mailer::hero($emoji, $heroTitle, $heroSub, $heroBg) .
    Mailer::statusBadge($status_label, $variant) .
    Mailer::infoBox($infoRows) .
    $extra .
    Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Voir les détails');

echo Mailer::wrapInLayout($heroTitle . ' – Coffice', $content, 'Domiciliation – ' . $status_label . ' · ' . $nomEntreprise);
