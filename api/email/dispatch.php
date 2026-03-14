<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $userRole = $auth['role'];
    $userEmail = $auth['email'];

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['type'])) {
        Response::error('Le champ "type" est requis', 400);
        exit;
    }

    $type = $input['type'];
    $data = $input['data'] ?? [];
    $appUrl = env('APP_URL', 'https://coffice.dz');
    $adminEmail = env('MAIL_ADMIN', 'desk@coffice.dz');

    $results = [];

    switch ($type) {
        case 'reservation_created':
            $results[] = sendReservationCreated($data, $userEmail, $appUrl);
            $results[] = sendAdminNotification('Nouvelle réservation', $data, $adminEmail, $appUrl);
            break;

        case 'reservation_confirmed':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendReservationConfirmed($data, $to, $appUrl);
            $results[] = sendAdminNotification('Réservation confirmée', $data, $adminEmail, $appUrl);
            break;

        case 'reservation_cancelled':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendReservationCancelled($data, $to, $appUrl);
            $results[] = sendAdminNotification('Réservation annulée', $data, $adminEmail, $appUrl);
            break;

        case 'domiciliation_submitted':
            $results[] = sendDomiciliationSubmitted($data, $userEmail, $appUrl);
            $results[] = sendAdminNotification('Nouvelle demande de domiciliation', $data, $adminEmail, $appUrl);
            break;

        case 'domiciliation_status_update':
            $to = $data['user_email'] ?? $userEmail;
            $statut = $data['statut'] ?? '';
            $statusLabel = $data['statut_label'] ?? $statut;
            $domData = [
                'nom_entreprise' => $data['raison_sociale'] ?? '',
                'raison_sociale' => $data['raison_sociale'] ?? '',
                'date_debut' => $data['date_debut'] ?? null,
                'duree_mois' => $data['duree_mois'] ?? null,
                'commentaire_admin' => $data['commentaire'] ?? null,
                'raison_rejet' => $data['commentaire'] ?? null,
                'montant_mensuel' => $data['montant_mensuel'] ?? null,
            ];
            $results[] = sendDomiciliationStatus($statut, $statusLabel, $domData, $to, $appUrl);
            $results[] = sendAdminNotification('Domiciliation – ' . $statusLabel, $data, $adminEmail, $appUrl);
            break;

        case 'courrier_recu':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendTemplateEmail('courrier-recu', $data, $to, 'Nouveau courrier reçu – ' . ($data['raison_sociale'] ?? ''), 'courrier_recu', $userId);
            break;

        case 'abonnement_expiration':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendTemplateEmail('abonnement-expiration', $data, $to, 'Votre abonnement expire bientôt', 'abonnement_expiration', $userId);
            break;

        case 'domiciliation_expiration':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendTemplateEmail('domiciliation-expiration', $data, $to, 'Votre domiciliation expire bientôt', 'domiciliation_expiration', $userId);
            break;

        case 'parrainage_bonus':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendTemplateEmail('parrainage-bonus', $data, $to, 'Bonus de parrainage débloqué !', 'parrainage_bonus', $userId);
            break;

        case 'code_promo_attribue':
            $to = $data['user_email'] ?? $userEmail;
            $results[] = sendTemplateEmail('code-promo-attribue', $data, $to, 'Un code promo pour vous – ' . ($data['code_promo'] ?? ''), 'code_promo_attribue', $userId);
            break;

        case 'user_registered':
            $results[] = sendAdminNotification('Nouvel utilisateur inscrit', $data, $adminEmail, $appUrl);
            break;

        case 'subscription_created':
            $results[] = sendAdminNotification('Nouvel abonnement souscrit', $data, $adminEmail, $appUrl);
            break;

        default:
            Response::error('Type d\'email inconnu: ' . $type, 400);
            exit;
    }

    $allSent = true;
    $errors = [];
    foreach ($results as $r) {
        if (!$r['success']) {
            $allSent = false;
            $errors[] = $r['error'] ?? 'Envoi échoué';
        }
    }

    if ($allSent) {
        Response::success(['sent' => count($results)], 'Emails envoyés avec succès');
    } else {
        $sentCount = count(array_filter($results, fn($r) => $r['success']));
        Response::success([
            'sent' => $sentCount,
            'failed' => count($results) - $sentCount,
            'warnings' => $errors
        ], $sentCount > 0 ? 'Emails partiellement envoyés' : 'Échec de l\'envoi');
    }

} catch (Exception $e) {
    Logger::error('Email dispatch error', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de l\'envoi des emails', 500);
}

function sendReservationCreated(array $data, string $to, string $appUrl): array
{
    $prenom = htmlspecialchars($data['prenom'] ?? '');
    $espace = htmlspecialchars($data['espace_name'] ?? '');
    $dateDebut = htmlspecialchars($data['date_debut'] ?? '');
    $heureDebut = htmlspecialchars($data['heure_debut'] ?? '');
    $heureFin = htmlspecialchars($data['heure_fin'] ?? '');
    $duree = htmlspecialchars($data['duree'] ?? '');
    $participants = (int)($data['participants'] ?? 1);
    $montant = number_format((float)($data['montant'] ?? 0), 0, ',', ' ') . ' DA';

    $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Réservation enregistrée</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', votre réservation a bien été enregistrée et est en attente de confirmation.</p>
' . Mailer::infoBox([
        'Espace' => $espace,
        'Date' => $dateDebut,
        'Horaire' => $heureDebut . ' – ' . $heureFin,
        'Durée' => $duree,
        'Participants' => $participants . ' personne' . ($participants > 1 ? 's' : ''),
    ]) . '
' . Mailer::highlightBox($montant, 'Montant estimé') . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Vous recevrez une confirmation par e-mail dès que votre réservation sera validée par notre équipe.</p>
' . Mailer::ctaButton($appUrl . '/app/reservations', 'Voir mes réservations');

    $subject = 'Réservation enregistrée – ' . $espace;
    $html = Mailer::wrapInLayout('Réservation enregistrée', $content, 'Votre réservation pour ' . $espace . ' a été enregistrée');

    return sendMail($to, $subject, $html);
}

function sendReservationConfirmed(array $data, string $to, string $appUrl): array
{
    $prenom = htmlspecialchars($data['prenom'] ?? '');
    $espace = htmlspecialchars($data['espace_name'] ?? '');
    $dateDebut = htmlspecialchars($data['date_debut'] ?? '');
    $heureDebut = htmlspecialchars($data['heure_debut'] ?? '');
    $heureFin = htmlspecialchars($data['heure_fin'] ?? '');
    $participants = (int)($data['participants'] ?? 1);
    $montant = number_format((float)($data['montant'] ?? 0), 0, ',', ' ') . ' DA';

    $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Réservation confirmée&nbsp;!</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', bonne nouvelle&nbsp;! Votre réservation a été confirmée.</p>
' . Mailer::statusBadge('Confirmée', 'success') . '
' . Mailer::infoBox([
        'Espace' => $espace,
        'Date' => $dateDebut,
        'Horaire' => $heureDebut . ' – ' . $heureFin,
        'Participants' => $participants . ' personne' . ($participants > 1 ? 's' : ''),
        'Montant' => $montant,
    ]) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Nous vous attendons au 4ème étage du Mohammadia Mall, Bureau 1178.</p>
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0;">En cas de besoin, contactez-nous au +213 795 38 01 24 ou par e-mail à desk@coffice.dz.</p>
' . Mailer::ctaButton($appUrl . '/app/reservations', 'Voir ma réservation');

    $subject = 'Réservation confirmée – ' . $espace;
    $html = Mailer::wrapInLayout('Réservation confirmée', $content, 'Votre réservation pour ' . $espace . ' est confirmée');

    return sendMail($to, $subject, $html);
}

function sendReservationCancelled(array $data, string $to, string $appUrl): array
{
    $prenom = htmlspecialchars($data['prenom'] ?? '');
    $espace = htmlspecialchars($data['espace_name'] ?? '');
    $dateDebut = htmlspecialchars($data['date_debut'] ?? '');
    $heureDebut = htmlspecialchars($data['heure_debut'] ?? '');
    $heureFin = htmlspecialchars($data['heure_fin'] ?? '');
    $montant = number_format((float)($data['montant'] ?? 0), 0, ',', ' ') . ' DA';
    $raison = $data['raison'] ?? '';

    $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Réservation annulée</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', votre réservation a été annulée.</p>
' . Mailer::statusBadge('Annulée', 'danger') . '
' . Mailer::infoBox([
        'Espace' => $espace,
        'Date' => $dateDebut,
        'Horaire' => $heureDebut . ' – ' . $heureFin,
        'Montant' => $montant,
    ]);

    if ($raison) {
        $content .= '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:20px 0;"><tr><td style="padding:16px 20px;font-size:14px;color:#991b1b;"><strong>Motif&nbsp;:</strong> ' . htmlspecialchars($raison) . '</td></tr></table>';
    }

    $content .= '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Si vous souhaitez effectuer une nouvelle réservation, accédez à votre espace personnel.</p>
' . Mailer::ctaButton($appUrl . '/app/reservations', 'Nouvelle réservation', true);

    $subject = 'Réservation annulée – ' . $espace;
    $html = Mailer::wrapInLayout('Réservation annulée', $content, 'Votre réservation pour ' . $espace . ' a été annulée');

    return sendMail($to, $subject, $html);
}

function sendDomiciliationSubmitted(array $data, string $to, string $appUrl): array
{
    $prenom = htmlspecialchars($data['prenom'] ?? '');
    $raisonSociale = htmlspecialchars($data['raison_sociale'] ?? '');
    $formeJuridique = htmlspecialchars($data['forme_juridique'] ?? '—');

    $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Demande de domiciliation reçue</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">Bonjour ' . $prenom . ', votre demande de domiciliation commerciale a bien été enregistrée.</p>
' . Mailer::statusBadge('En cours de traitement', 'warning') . '
' . Mailer::infoBox([
        'Raison sociale' => $raisonSociale,
        'Forme juridique' => $formeJuridique,
        'Adresse de domiciliation' => 'Mohammadia Mall, 4ème étage, Bureau 1178, Alger',
    ]) . '
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Notre équipe va examiner votre dossier dans les meilleurs délais. Vous serez notifié(e) à chaque étape de la progression.</p>
<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0;">Pour toute question, contactez-nous au +213 795 38 01 24 ou à desk@coffice.dz.</p>
' . Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Suivre ma demande');

    $subject = 'Demande de domiciliation enregistrée – ' . $raisonSociale;
    $html = Mailer::wrapInLayout('Demande de domiciliation', $content, 'Votre demande de domiciliation pour ' . $raisonSociale . ' a été enregistrée');

    return sendMail($to, $subject, $html);
}

function sendDomiciliationStatus(string $statut, string $statusLabel, array $domData, string $to, string $appUrl): array
{
    $isSuccess = in_array($statut, ['validee', 'active', 'domiciliation_creee']);
    $isDanger = in_array($statut, ['rejetee', 'refusee', 'resiliee']);
    $variant = $isSuccess ? 'success' : ($isDanger ? 'danger' : 'warning');
    $nomEntreprise = htmlspecialchars($domData['nom_entreprise'] ?? $domData['raison_sociale'] ?? 'N/A');

    $infoRows = ['Raison sociale' => $nomEntreprise, 'Statut' => htmlspecialchars($statusLabel)];

    if (!empty($domData['date_debut'])) {
        $infoRows['Date de début'] = htmlspecialchars($domData['date_debut']);
    }
    if (!empty($domData['montant_mensuel'])) {
        $infoRows['Montant mensuel'] = number_format((float)$domData['montant_mensuel'], 0, ',', ' ') . ' DA';
    }

    if ($isSuccess) {
        $title = 'Domiciliation ' . ($statut === 'active' ? 'activée' : 'validée') . ' !';
        $intro = 'Bonne nouvelle ! Votre domiciliation commerciale a été ' . ($statut === 'active' ? 'activée' : 'validée') . '.';
        $infoRows['Adresse'] = 'Mohammadia Mall, 4ème ét., Bureau 1178, Alger';
        $outro = '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 4px;">Vous pouvez désormais utiliser l\'adresse de Coffice comme siège social de votre entreprise.</p>';
    } elseif ($isDanger) {
        $title = 'Demande de domiciliation refusée';
        $intro = 'Nous sommes au regret de vous informer que votre demande de domiciliation n\'a pas pu être acceptée.';
        $motif = $domData['commentaire_admin'] ?? $domData['raison_rejet'] ?? '';
        $outro = '';
        if ($motif) {
            $outro .= '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:20px 0;"><tr><td style="padding:16px 20px;font-size:14px;color:#991b1b;"><strong>Motif&nbsp;:</strong> ' . htmlspecialchars($motif) . '</td></tr></table>';
        }
        $outro .= '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 0;">Pour toute question, contactez-nous au +213 795 38 01 24 ou à desk@coffice.dz.</p>';
    } else {
        $title = 'Mise à jour de votre domiciliation';
        $intro = 'Le statut de votre demande de domiciliation a été mis à jour.';
        $outro = '<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:16px 0 0;">Notre équipe traite votre dossier. Vous serez notifié(e) à chaque étape.</p>';
    }

    $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">' . htmlspecialchars($title) . '</h2>
<p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 8px;">' . htmlspecialchars($intro) . '</p>
' . Mailer::statusBadge($statusLabel, $variant) . '
' . Mailer::infoBox($infoRows) . '
' . $outro . '
' . Mailer::ctaButton($appUrl . '/app/mon-espace?tab=domiciliation', 'Voir les détails');

    $subject = 'Domiciliation – ' . $statusLabel;
    $html = Mailer::wrapInLayout($title, $content, 'Domiciliation – ' . $statusLabel);

    return sendMail($to, $subject, $html);
}

function sendAdminNotification(string $title, array $data, string $adminEmail, string $appUrl): array
{
    $userName = htmlspecialchars($data['prenom'] ?? '');
    $userEmailAddr = htmlspecialchars($data['user_email'] ?? '');

    $infoRows = ['Utilisateur' => $userName, 'E-mail' => $userEmailAddr];

    if (!empty($data['espace_name'])) $infoRows['Espace'] = htmlspecialchars($data['espace_name']);
    if (!empty($data['date_debut'])) $infoRows['Date'] = htmlspecialchars($data['date_debut']);
    if (!empty($data['heure_debut']) && !empty($data['heure_fin'])) $infoRows['Horaire'] = htmlspecialchars($data['heure_debut'] . ' – ' . $data['heure_fin']);
    if (!empty($data['montant'])) $infoRows['Montant'] = number_format((float)$data['montant'], 0, ',', ' ') . ' DA';
    if (!empty($data['raison_sociale'])) $infoRows['Raison sociale'] = htmlspecialchars($data['raison_sociale']);
    if (!empty($data['statut_label'])) $infoRows['Statut'] = htmlspecialchars($data['statut_label']);
    if (!empty($data['commentaire'])) $infoRows['Commentaire'] = htmlspecialchars($data['commentaire']);

    $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">' . htmlspecialchars($title) . '</h2>
<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">Notification automatique du système Coffice</p>
' . Mailer::infoBox($infoRows) . '
' . Mailer::ctaButton($appUrl . '/erp', 'Accéder au tableau de bord', true);

    $subject = '[Admin] ' . $title . ' – ' . $userName;
    $html = Mailer::wrapInLayout($title, $content, $title . ' : ' . $userName);

    return sendMail($adminEmail, $subject, $html);
}

function sendMail(string $to, string $subject, string $html, string $type = 'custom', ?string $userId = null): array
{
    try {
        $result = Mailer::send($to, $subject, $html, null, $type, $userId);
        if ($result) {
            return ['success' => true];
        }
        Logger::warning('Email send returned false', ['to' => $to, 'subject' => $subject]);
        return ['success' => false, 'error' => 'Envoi échoué pour ' . $to];
    } catch (Exception $e) {
        Logger::error('Email send exception', ['to' => $to, 'error' => $e->getMessage()]);
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function sendTemplateEmail(string $template, array $data, string $to, string $subject, string $type, ?string $userId = null): array
{
    $templatePath = __DIR__ . '/../templates/emails/' . $template . '.php';

    if (!file_exists($templatePath)) {
        Logger::warning('Template not found: ' . $template);
        return ['success' => false, 'error' => 'Template introuvable: ' . $template];
    }

    ob_start();
    extract($data);
    require $templatePath;
    $html = ob_get_clean();

    return sendMail($to, $subject, $html, $type, $userId);
}
