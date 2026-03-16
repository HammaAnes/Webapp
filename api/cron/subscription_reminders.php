#!/usr/bin/env php
<?php

/**
 * Cron — Rappels d'expiration d'abonnements
 *
 * Recommandé : quotidiennement à 8h
 * Crontab: 0 8 * * * php /path/to/api/cron/subscription_reminders.php
 */

require_once __DIR__ . '/../bootstrap.php';

echo "====================================\n";
echo "Coffice — Rappels Abonnements\n";
echo "Démarrage: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n\n";

$queued = 0;
$errors = 0;

$windows = [
    ['days' => 7,  'label' => 'J-7'],
    ['days' => 1,  'label' => 'J-1'],
];

try {
    foreach ($windows as $window) {
        $targetDate = date('Y-m-d', strtotime('+' . $window['days'] . ' days'));

        $stmt = $db->prepare("
            SELECT
                ua.*,
                u.email, u.prenom, u.nom,
                a.nom AS plan_nom, a.prix AS prix_mensuel
            FROM abonnements_utilisateurs ua
            INNER JOIN users u ON ua.user_id = u.id
            INNER JOIN abonnements a ON ua.abonnement_id = a.id
            WHERE ua.statut = 'actif'
              AND DATE(ua.date_fin) = ?
        ");
        $stmt->execute([$targetDate]);
        $abonnements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "Abonnements expirant {$window['label']} (" . date('d/m/Y', strtotime($targetDate)) . ") : " . count($abonnements) . "\n";

        foreach ($abonnements as $ab) {
            try {
                $type = 'abonnement_expiration_' . $window['days'] . 'j';
                $subject = 'Votre abonnement Coffice expire ' . ($window['days'] === 1 ? 'demain' : 'dans ' . $window['days'] . ' jours');

                $queueId = EmailQueue::enqueue(
                    $type,
                    $ab['email'],
                    $subject,
                    'abonnement-expiration',
                    [
                        'prenom'       => $ab['prenom'],
                        'nom'          => $ab['nom'],
                        'plan_nom'     => $ab['plan_nom'],
                        'prix_mensuel' => $ab['prix_mensuel'],
                        'date_fin'     => date('d/m/Y', strtotime($ab['date_fin'])),
                        'jours_restants' => $window['days'],
                    ],
                    $ab['user_id'],
                    2
                );

                if ($queueId) {
                    echo "  [+] {$ab['email']} — {$ab['plan_nom']} ({$window['label']})\n";
                    $queued++;
                } else {
                    echo "  [~] {$ab['email']} — ignoré (doublon ou préférences)\n";
                }
            } catch (Exception $e) {
                echo "  [!] {$ab['email']} — erreur: " . $e->getMessage() . "\n";
                $errors++;
            }
        }
    }
} catch (Exception $e) {
    echo "ERREUR FATALE: " . $e->getMessage() . "\n";
    Logger::error('subscription_reminders_fatal_error', ['error' => $e->getMessage()]);
    exit(1);
}

echo "\n====================================\n";
echo "Rappels enqueués : $queued\n";
echo "Erreurs          : $errors\n";
echo "Terminé: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n";

exit($errors > 0 ? 1 : 0);
