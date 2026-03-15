<?php
$nomEntreprise = htmlspecialchars($domiciliation['nom_entreprise'] ?? $domiciliation['raison_sociale'] ?? 'N/A');
$appUrl = env('APP_URL', 'https://coffice.dz');

$isSuccess = in_array($status, ['domiciliation_creee', 'active']);
$isDanger  = in_array($status, ['refusee', 'resiliee']);
$variant = $isSuccess ? 'success' : ($isDanger ? 'danger' : 'warning');

$infoRows = ['Raison sociale' => $nomEntreprise, 'Statut' => htmlspecialchars($status_label)];

if (!empty($domiciliation['date_debut'])) {
    $infoRows['Date de début'] = date('d/m/Y', strtotime($domiciliation['date_debut']));
}
if (!empty($domiciliation['duree_mois'])) {
    $infoRows['Durée'] = htmlspecialchars($domiciliation['duree_mois']) . ' mois';
}

if ($isSuccess) {
    $title = $status === 'active' ? 'Domiciliation activée !' : 'Domiciliation créée !';
    $intro = $status === 'active'
        ? 'Bonjour, bonne nouvelle ! Votre domiciliation commerciale est maintenant active.'
        : 'Bonjour, bonne nouvelle ! Votre domiciliation commerciale a été créée avec succès.';
    $infoRows['Adresse'] = 'Mohammadia Mall, 4ème ét., Bureau 1178, Alger';
    $outro = '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Vous pouvez d&eacute;sormais utiliser l\'adresse de Coffice comme si&egrave;ge social de votre entreprise.</p>';
} elseif ($isDanger) {
    $title = 'Demande de domiciliation refusée';
    $intro = 'Bonjour, nous sommes au regret de vous informer que votre demande de domiciliation n\'a pas pu être acceptée.';
    $motif = $domiciliation['raison_rejet'] ?? $domiciliation['commentaire_admin'] ?? '';
    $outro = '';
    if ($motif) {
        $outro .= '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:20px 0;"><tr><td style="padding:16px 20px;font-size:14px;color:#991b1b;"><strong>Motif&nbsp;:</strong> ' . htmlspecialchars($motif) . '</td></tr></table>';
    }
    $outro .= '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 0;">Pour toute question, contactez-nous au +213 795 38 01 24 ou &agrave; desk@coffice.dz.</p>';
} else {
    $title = 'Mise à jour de votre domiciliation';
    $intro = 'Bonjour, le statut de votre demande de domiciliation a été mis à jour.';
    $outro = '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 0;">Notre &eacute;quipe traite votre dossier. Vous serez notifi&eacute;(e) &agrave; chaque &eacute;tape.</p>';
}

$content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px;">' . htmlspecialchars($title) . '</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">' . htmlspecialchars($intro) . '</p>
' . Mailer::statusBadge($status_label, $variant) . '
' . Mailer::infoBox($infoRows) . '
' . $outro . '
' . Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Voir les détails');

echo Mailer::wrapInLayout($title, $content, 'Domiciliation – ' . $status_label);
?>
