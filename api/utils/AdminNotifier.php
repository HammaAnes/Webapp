<?php

class AdminNotifier
{
    public static function notify(string $title, array $infoRows, string $dashboardPath = '/erp'): void
    {
        try {
            $adminEmail = env('MAIL_ADMIN', 'desk@coffice.dz');
            $appUrl = env('APP_URL', 'https://coffice.dz');

            $content = '
<h2 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">' . htmlspecialchars($title) . '</h2>
<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">Notification automatique du syst&egrave;me Coffice</p>
' . Mailer::infoBox($infoRows) . '
' . Mailer::ctaButton($appUrl . $dashboardPath, 'Acc&eacute;der au tableau de bord', true);

            $subject = '[Admin] ' . $title;
            $html = Mailer::wrapInLayout($title, $content, $title);

            Mailer::send($adminEmail, $subject, $html);
        } catch (Exception $e) {
            Logger::error('Admin notification failed', [
                'title' => $title,
                'error' => $e->getMessage()
            ]);
        }
    }

    public static function newReservation(array $reservation, string $userName, string $userEmail): void
    {
        $montant = number_format((float)($reservation['montant_total'] ?? 0), 0, ',', ' ') . ' DA';
        $rows = [
            'Utilisateur' => $userName,
            'E-mail' => $userEmail,
            'Espace' => $reservation['espace_nom'] ?? $reservation['espace_name'] ?? '',
            'Date' => isset($reservation['date_debut']) ? date('d/m/Y', strtotime($reservation['date_debut'])) : '',
            'Horaire' => isset($reservation['date_debut']) && isset($reservation['date_fin'])
                ? date('H:i', strtotime($reservation['date_debut'])) . ' - ' . date('H:i', strtotime($reservation['date_fin']))
                : '',
            'Montant' => $montant,
        ];

        self::notify('Nouvelle reservation', $rows, '/erp/reservations');
    }

    public static function reservationCancelled(array $reservation, string $userName, string $userEmail): void
    {
        $rows = [
            'Utilisateur' => $userName,
            'E-mail' => $userEmail,
            'Espace' => $reservation['espace_nom'] ?? $reservation['espace_name'] ?? '',
            'Date' => isset($reservation['date_debut']) ? date('d/m/Y', strtotime($reservation['date_debut'])) : '',
            'Montant' => number_format((float)($reservation['montant_total'] ?? 0), 0, ',', ' ') . ' DA',
        ];

        self::notify('Reservation annulee', $rows, '/erp/reservations');
    }

    public static function newDomiciliation(string $raisonSociale, string $userName, string $userEmail): void
    {
        $rows = [
            'Utilisateur' => $userName,
            'E-mail' => $userEmail,
            'Raison sociale' => $raisonSociale,
        ];

        self::notify('Nouvelle demande de domiciliation', $rows, '/erp/domiciliations');
    }

    public static function newUser(string $userName, string $userEmail): void
    {
        $rows = [
            'Nom' => $userName,
            'E-mail' => $userEmail,
        ];

        self::notify('Nouvel utilisateur inscrit', $rows, '/erp/users');
    }

    public static function newSubscription(string $userName, string $userEmail, string $planName, string $montant): void
    {
        $rows = [
            'Utilisateur' => $userName,
            'E-mail' => $userEmail,
            'Plan' => $planName,
            'Montant' => $montant,
        ];

        self::notify('Nouvel abonnement souscrit', $rows, '/erp/abonnements');
    }

    public static function documentUploaded(string $userName, string $userEmail, string $entityType, string $typeDocument, string $fileName): void
    {
        $typeLabels = [
            'domiciliation' => 'Dossier domiciliation',
            'reservation'   => 'Réservation',
            'user'          => 'Profil utilisateur',
        ];

        $rows = [
            'Utilisateur'    => $userName,
            'E-mail'         => $userEmail,
            'Dossier'        => $typeLabels[$entityType] ?? $entityType,
            'Type document'  => $typeDocument,
            'Fichier'        => $fileName,
        ];

        self::notify('Nouveau document déposé', $rows, '/erp/domiciliations');
    }

    public static function courrierInstruction(string $raisonSociale, string $userEmail, string $instruction, string $expediteur, string $typeCourrier): void
    {
        $instrLabels = [
            'reexpedier' => 'Réexpédier',
            'scanner'    => 'Scanner & envoyer',
            'garder'     => 'Garder en attente',
            'jeter'      => 'Jeter',
        ];

        $rows = [
            'Entreprise'  => $raisonSociale,
            'E-mail'      => $userEmail,
            'Courrier'    => trim($typeCourrier . ($expediteur ? ' — ' . $expediteur : '')),
            'Instruction' => $instrLabels[$instruction] ?? $instruction,
        ];

        self::notify('Instruction courrier reçue', $rows, '/erp/courriers');
    }

    public static function dossierUpdated(string $userName, string $userEmail, string $raisonSociale): void
    {
        $rows = [
            'Utilisateur'  => $userName,
            'E-mail'       => $userEmail,
            'Dossier'      => $raisonSociale,
        ];

        self::notify('Dossier domiciliation mis à jour', $rows, '/erp/domiciliations');
    }
}
