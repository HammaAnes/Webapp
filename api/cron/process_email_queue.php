#!/usr/bin/env php
<?php

/**
 * Cron — Traitement de la file d'attente emails
 *
 * Recommandé : toutes les 5 minutes
 * Crontab: * /5 * * * * php /path/to/api/cron/process_email_queue.php
 */

require_once __DIR__ . '/../../api/bootstrap.php';

$start = microtime(true);
echo "====================================\n";
echo "Coffice — Email Queue Processor\n";
echo "Démarrage: " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n\n";

try {
    $results = EmailQueue::processPending(30);

    echo "Emails traités : {$results['processed']}\n";
    echo "Envoyés        : {$results['sent']}\n";
    echo "Échoués        : {$results['failed']}\n";

    Logger::info('email_queue_processed', $results);
} catch (Exception $e) {
    echo "ERREUR FATALE: " . $e->getMessage() . "\n";
    Logger::error('email_queue_fatal_error', ['error' => $e->getMessage()]);
    exit(1);
}

$elapsed = round(microtime(true) - $start, 2);
echo "\nTerminé en {$elapsed}s — " . date('Y-m-d H:i:s') . "\n";
echo "====================================\n";

exit(0);
