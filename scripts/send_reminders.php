#!/usr/bin/env php
<?php

/**
 * Cron Job - Envoi de rappels automatiques pour les réservations
 *
 * À exécuter quotidiennement (recommandé: 9h du matin)
 * Crontab: 0 9 * * * php /path/to/scripts/send_reminders.php
 */

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/utils/Mailer.php';

echo "====================================\n";
echo "Coffice - Envoi de Rappels Automatiques\n";
echo "Démarrage: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n\n";

$sent = 0;
$errors = 0;

try {
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    $tomorrowEnd = date('Y-m-d 23:59:59', strtotime('+1 day'));

    $stmt = $db->prepare('
        SELECT r.*,
               u.email, u.nom, u.prenom,
               e.nom as espace_nom
        FROM reservations r
        INNER JOIN users u ON r.user_id = u.id
        INNER JOIN espaces e ON r.espace_id = e.id
        WHERE r.statut IN ("confirmee", "en_attente")
        AND r.date_debut >= ?
        AND r.date_debut <= ?
        AND r.rappel_envoye = 0
    ');

    $stmt->execute([$tomorrow, $tomorrowEnd]);
    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Réservations trouvées: " . count($reservations) . "\n\n";

    foreach ($reservations as $reservation) {
        echo "Traitement réservation #" . substr($reservation['id'], 0, 8) . "...\n";
        echo "  Utilisateur: {$reservation['prenom']} {$reservation['nom']} ({$reservation['email']})\n";
        echo "  Espace: {$reservation['espace_nom']}\n";
        echo "  Date: " . date('d/m/Y H:i', strtotime($reservation['date_debut'])) . "\n";

        try {
            $emailSent = Mailer::sendReservationReminder(
                $reservation['email'],
                $reservation
            );

            if ($emailSent) {
                $updateStmt = $db->prepare('
                    UPDATE reservations
                    SET rappel_envoye = 1, updated_at = NOW()
                    WHERE id = ?
                ');
                $updateStmt->execute([$reservation['id']]);

                $notificationId = UuidHelper::generate();
                $notificationStmt = $db->prepare('
                    INSERT INTO notifications
                    (id, user_id, titre, message, type, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                ');
                $notificationStmt->execute([
                    $notificationId,
                    $reservation['user_id'],
                    'Rappel: Réservation demain',
                    'Votre réservation pour ' . $reservation['espace_nom'] . ' commence demain à ' . date('H:i', strtotime($reservation['date_debut'])),
                    'reservation'
                ]);

                echo "  ✓ Rappel envoyé avec succès\n\n";
                $sent++;

                Logger::info('Reminder sent', [
                    'reservation_id' => $reservation['id'],
                    'user_id' => $reservation['user_id'],
                    'email' => $reservation['email']
                ]);
            } else {
                echo "  ✗ Échec de l'envoi\n\n";
                $errors++;

                Logger::error('Failed to send reminder', [
                    'reservation_id' => $reservation['id'],
                    'email' => $reservation['email']
                ]);
            }
        } catch (Exception $e) {
            echo "  ✗ Erreur: " . $e->getMessage() . "\n\n";
            $errors++;

            Logger::error('Exception while sending reminder', [
                'reservation_id' => $reservation['id'],
                'error' => $e->getMessage()
            ]);
        }

        usleep(500000);
    }

} catch (Exception $e) {
    echo "ERREUR FATALE: " . $e->getMessage() . "\n";
    Logger::error('Fatal error in send_reminders', ['error' => $e->getMessage()]);
    exit(1);
}

echo "====================================\n";
echo "Rapport Final\n";
echo "====================================\n";
echo "Réservations traitées: " . count($reservations ?? []) . "\n";
echo "Rappels envoyés: $sent\n";
echo "Erreurs: $errors\n";
echo "Terminé: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n";

exit($errors > 0 ? 1 : 0);
