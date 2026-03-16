<?php

/**
 * Cron: Expire domiciliations whose date_fin_contrat has passed
 * Run daily: 0 2 * * * php /path/to/api/cron/expire_domiciliations.php
 */

define('CRON_CONTEXT', true);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/UuidHelper.php';
require_once __DIR__ . '/../utils/Mailer.php';

$startTime = microtime(true);
$log = [];

function cron_log(string $msg): void {
    global $log;
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg;
    $log[] = $line;
    echo $line . PHP_EOL;
}

try {
    cron_log('expire_domiciliations: start');

    $database = Database::getInstance();
    $db = $database->getConnection();

    $findStmt = $db->prepare("
        SELECT d.id, d.user_id, d.raison_sociale, u.email, u.prenom, u.nom
        FROM domiciliations d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.statut = 'active'
          AND d.date_fin_contrat IS NOT NULL
          AND DATE(d.date_fin_contrat) < CURDATE()
    ");
    $findStmt->execute();
    $toExpire = $findStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($toExpire)) {
        cron_log('expire_domiciliations: no domiciliations to expire');
    } else {
        cron_log('expire_domiciliations: found ' . count($toExpire) . ' to expire');

        $updateStmt = $db->prepare("
            UPDATE domiciliations
            SET statut = 'expiree', date_expiration = NOW(), updated_at = NOW()
            WHERE id = :id
        ");

        $notifStmt = $db->prepare("
            INSERT INTO notifications (id, user_id, type, titre, message, lue, created_at)
            VALUES (:id, :user_id, 'domiciliation', :titre, :message, 0, NOW())
        ");

        foreach ($toExpire as $dom) {
            try {
                $updateStmt->bindParam(':id', $dom['id']);
                $updateStmt->execute();

                $notifId = UuidHelper::generate();
                $titre = 'Domiciliation expirée';
                $message = 'Votre domiciliation ' . ($dom['raison_sociale'] ?: '') . ' a expiré. Contactez-nous pour un renouvellement.';
                $notifStmt->bindParam(':id', $notifId);
                $notifStmt->bindParam(':user_id', $dom['user_id']);
                $notifStmt->bindParam(':titre', $titre);
                $notifStmt->bindParam(':message', $message);
                $notifStmt->execute();

                if (!empty($dom['email'])) {
                    try {
                        Mailer::sendDomiciliationStatus($dom['email'], 'expiree', [
                            'raison_sociale' => $dom['raison_sociale'] ?: '',
                            'id' => $dom['id'],
                            'prenom' => $dom['prenom'] ?: '',
                            'nom' => $dom['nom'] ?: '',
                        ]);
                    } catch (Exception $mailErr) {
                        cron_log('expire_domiciliations: email failed for id=' . $dom['id'] . ' — ' . $mailErr->getMessage());
                    }
                }

                cron_log('expire_domiciliations: expired id=' . $dom['id'] . ' (' . $dom['raison_sociale'] . ')');
            } catch (Exception $e) {
                cron_log('expire_domiciliations: ERROR on id=' . $dom['id'] . ' — ' . $e->getMessage());
            }
        }

        cron_log('expire_domiciliations: done, expired ' . count($toExpire) . ' domiciliation(s)');
    }

    $elapsed = round((microtime(true) - $startTime) * 1000);
    cron_log('expire_domiciliations: finished in ' . $elapsed . 'ms');

} catch (Exception $e) {
    $msg = 'expire_domiciliations: FATAL — ' . $e->getMessage();
    cron_log($msg);
    error_log($msg);
    exit(1);
}
