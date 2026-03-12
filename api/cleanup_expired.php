#!/usr/bin/env php
<?php

/**
 * Cron Job - Nettoyage automatique des données expirées
 *
 * À exécuter quotidiennement (recommandé: 2h du matin)
 * Crontab: 0 2 * * * php /path/to/scripts/cleanup_expired.php
 */

require_once __DIR__ . '/../api/bootstrap.php';

echo "====================================\n";
echo "Coffice - Nettoyage Automatique\n";
echo "Démarrage: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n\n";

$totalDeleted = 0;

try {
    echo "1. Nettoyage tokens password reset expirés...\n";
    $stmt = $db->prepare('DELETE FROM password_resets WHERE expires_at < NOW() OR used_at IS NOT NULL');
    $stmt->execute();
    $deleted = $stmt->rowCount();
    echo "   ✓ $deleted tokens supprimés\n\n";
    $totalDeleted += $deleted;

    Logger::info('Password reset tokens cleaned', ['count' => $deleted]);

    echo "2. Nettoyage réservations annulées anciennes (>90 jours)...\n";
    $stmt = $db->prepare('
        DELETE FROM reservations
        WHERE statut = "annulee"
        AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
    ');
    $stmt->execute();
    $deleted = $stmt->rowCount();
    echo "   ✓ $deleted réservations annulées supprimées\n\n";
    $totalDeleted += $deleted;

    Logger::info('Old cancelled reservations cleaned', ['count' => $deleted]);

    echo "3. Mise à jour statut réservations expirées...\n";
    $stmt = $db->prepare('
        UPDATE reservations
        SET statut = "terminee", updated_at = NOW()
        WHERE statut IN ("confirmee", "en_attente", "en_cours")
        AND date_fin < NOW()
    ');
    $stmt->execute();
    $updated = $stmt->rowCount();
    echo "   ✓ $updated réservations marquées comme terminées\n\n";

    Logger::info('Expired reservations updated', ['count' => $updated]);

    echo "4. Mise à jour statut domiciliations expirées...\n";
    $stmt = $db->prepare('
        UPDATE domiciliations
        SET statut = "expiree", updated_at = NOW()
        WHERE statut = "active"
        AND date_fin < NOW()
    ');
    $stmt->execute();
    $updated = $stmt->rowCount();
    echo "   ✓ $updated domiciliations marquées comme expirées\n\n";

    Logger::info('Expired domiciliations updated', ['count' => $updated]);

    echo "5. Nettoyage notifications anciennes (>180 jours)...\n";
    $stmt = $db->prepare('
        DELETE FROM notifications
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)
    ');
    $stmt->execute();
    $deleted = $stmt->rowCount();
    echo "   ✓ $deleted notifications supprimées\n\n";
    $totalDeleted += $deleted;

    Logger::info('Old notifications cleaned', ['count' => $deleted]);

    echo "6. Nettoyage logs anciens (>30 jours)...\n";
    $stmt = $db->prepare('
        DELETE FROM logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ');
    $stmt->execute();
    $deleted = $stmt->rowCount();
    echo "   ✓ $deleted logs supprimés\n\n";
    $totalDeleted += $deleted;

    Logger::info('Old logs cleaned', ['count' => $deleted]);

    echo "7. Nettoyage rate limits expirés...\n";
    $stmt = $db->prepare('
        DELETE FROM rate_limits
        WHERE expires_at < NOW()
    ');
    $stmt->execute();
    $deleted = $stmt->rowCount();
    echo "   ✓ $deleted rate limits supprimés\n\n";
    $totalDeleted += $deleted;

    Logger::info('Expired rate limits cleaned', ['count' => $deleted]);

    echo "8. Optimisation des tables...\n";
    $tables = ['users', 'reservations', 'domiciliations', 'notifications', 'password_resets', 'logs'];
    foreach ($tables as $table) {
        try {
            $db->exec("OPTIMIZE TABLE $table");
            echo "   ✓ Table $table optimisée\n";
        } catch (Exception $e) {
            echo "   ✗ Erreur optimisation $table: " . $e->getMessage() . "\n";
        }
    }
    echo "\n";

    Logger::info('Database tables optimized');

} catch (Exception $e) {
    echo "ERREUR FATALE: " . $e->getMessage() . "\n";
    Logger::error('Fatal error in cleanup_expired', ['error' => $e->getMessage()]);
    exit(1);
}

echo "====================================\n";
echo "Rapport Final\n";
echo "====================================\n";
echo "Total suppressions: $totalDeleted\n";
echo "Terminé: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n";

Logger::info('Cleanup completed successfully', ['total_deleted' => $totalDeleted]);

exit(0);
