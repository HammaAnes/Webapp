<?php
$appUrl        = env('APP_URL', 'https://coffice.dz');
$prenomClient  = htmlspecialchars($souscription['prenom'] ?? $souscription['user_prenom'] ?? '');
$nomAbonnement = htmlspecialchars($souscription['abonnement_nom'] ?? $souscription['nom'] ?? 'Abonnement');
$dateDebut     = isset($souscription['date_debut']) ? date('d/m/Y', strtotime($souscription['date_debut'])) : date('d/m/Y');
$dateFin       = isset($souscription['date_fin']) ? date('d/m/Y', strtotime($souscription['date_fin'])) : '—';
$montant       = number_format($souscription['prix'] ?? $souscription['montant'] ?? 0, 0, ',', ' ') . ' DA/mois';

$perksBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
<tr><td style="padding:20px 24px;">
  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">Inclus dans votre abonnement</p>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:3px 0;font-size:13px;color:#166534;">✓ &nbsp; Accès aux espaces de travail partagés</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#166534;">✓ &nbsp; Réservations prioritaires</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#166534;">✓ &nbsp; Support dédié</td></tr>
  </table>
</td></tr>
</table>';

// Bloc code d'accès serrure (affiché uniquement si un code est fourni)
$codeAcces  = $souscription['code_acces'] ?? null;
$codeBlock  = '';
if (!empty($codeAcces)) {
    $codeDisplay   = htmlspecialchars($codeAcces) . '#';
    $dateFinSerrure = isset($souscription['date_fin']) ? date('d/m/Y', strtotime($souscription['date_fin'])) : $dateFin;
    $codeBlock = '
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;">
<tr><td style="padding:24px;">
  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">🔐 Votre code d\'accès Coffice</p>
  <p style="margin:0 0 16px;font-size:13px;color:#1e40af;">Saisissez ce code sur le pavé numérique de la serrure d\'entrée :</p>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:16px;background:#1d4ed8;border-radius:10px;">
        <span style="font-size:32px;font-weight:900;letter-spacing:8px;color:#ffffff;font-family:monospace;">' . $codeDisplay . '</span>
      </td>
    </tr>
  </table>
  <p style="margin:16px 0 4px;font-size:12px;color:#3b82f6;text-align:center;">Valable jusqu\'au ' . $dateFinSerrure . ' · Ne le communiquez pas</p>
</td></tr>
</table>';
}

$content =
    Mailer::hero('🎉', 'Abonnement ' . $nomAbonnement . ' activé !', 'Bonjour ' . $prenomClient . ', votre abonnement est maintenant actif.', '#059669') .
    Mailer::statusBadge('Actif', 'success') .
    Mailer::infoBox([
        'Formule' => $nomAbonnement,
        'Début'   => $dateDebut,
        'Fin'     => $dateFin,
        'Tarif'   => $montant,
    ]) .
    $codeBlock .
    $perksBlock .
    Mailer::ctaButton($appUrl . '/app/reservations', 'Réserver un espace maintenant');

echo Mailer::wrapInLayout('Abonnement activé – Coffice', $content, 'Votre abonnement ' . $nomAbonnement . ' est actif — profitez-en !');
