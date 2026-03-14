#!/usr/bin/env php
<?php

/**
 * Cron — Rappels d'expiration de domiciliations
 *
 * Recommandé : quotidiennement à 8h30
 * Crontab: 30 8 * * * php /path/to/api/cron/domiciliation_reminders.php
 */

require_once __DIR__ . '/../../api/bootstrap.php';

echo "====================================\n";
echo "Coffice — Rappels Domiciliations\n";
echo "Démarrage: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n\n";

$queued = 0;
$errors = 0;

$windows = [
    ['days' => 30, 'label' => 'J-30'],
    ['days' => 7,  'label' => 'J-7'],
];

try {
    foreach ($windows as $window) {
        $targetDate = date('Y-m-d', strtotime('+' . $window['days'] . ' days'));

        $stmt = $db->prepare("
            SELECT
                d.*,
                u.email, u.prenom, u.nom
            FROM domiciliations d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.statut = 'active'
              AND DATE(d.date_fin) = ?
        ");
        $stmt->execute([$targetDate]);
        $domiciliations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "Domiciliations expirant {$window['label']} (" . date('d/m/Y', strtotime($targetDate)) . ") : " . count($domiciliations) . "\n";

        foreach ($domiciliations as $dom) {
            try {
                $type = 'domiciliation_reminder_' . $window['days'] . 'j';
                $subject = 'Votre domiciliation Coffice expire ' . ($window['days'] <= 7 ? 'dans ' . $window['days'] . ' jours' : 'dans 30 jours');

                $queueId = EmailQueue::enqueue(
                    $type,
                    $dom['email'],
                    $subject,
                    'domiciliation-expiration',
                    [
                        'prenom'         => $dom['prenom'],
                        'nom'            => $dom['nom'],
                        'raison_sociale' => $dom['raison_sociale'] ?? $dom['nom_entreprise'] ?? '',
                        'date_fin'       => date('d/m/Y', strtotime($dom['date_fin'])),
                        'jours_restants' => $window['days'],
                    ],
                    $dom['user_id'],
                    2
                );

                if ($queueId) {
                    echo "  [+] {$dom['email']} — {$dom['raison_sociale']} ({$window['label']})\n";
                    $queued++;
                } else {
                    echo "  [~] {$dom['email']} — ignoré (doublon ou préférences)\n";
                }
            } catch (Exception $e) {
                echo "  [!] {$dom['email']} — erreur: " . $e->getMessage() . "\n";
                $errors++;
            }
        }
    }
} catch (Exception $e) {
    echo "ERREUR FATALE: " . $e->getMessage() . "\n";
    Logger::error('domiciliation_reminders_fatal_error', ['error' => $e->getMessage()]);
    exit(1);
}

echo "\n====================================\n";
echo "Rappels enqueués : $queued\n";
echo "Erreurs          : $errors\n";
echo "Terminé: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n";

exit($errors > 0 ? 1 : 0);
