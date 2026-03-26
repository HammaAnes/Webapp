<?php
/**
 * CRON — Alertes automatiques quotidiennes
 *
 * Planifier dans cPanel : 0 7 * * *  (tous les jours à 7h)
 * URL cPanel : https://coffice.dz/api/admin/cron-alertes.php?secret=CRON_SECRET
 *
 * Tâches :
 *  1. Abonnements expirant dans 7j ou 1j   → notif in-app + email rappel
 *  2. Abonnements expirés hier               → passage statut 'expire' + notif
 *  3. Domiciliations expirant dans 30j ou 7j → notif in-app + email rappel
 *  4. Réservations de demain                 → email rappel J-1
 */

require_once __DIR__ . '/../bootstrap.php';

// ─── Authentification cron ────────────────────────────────────────────────────
$cronSecret = env('CRON_SECRET', '');
$providedSecret = $_GET['secret'] ?? $_SERVER['HTTP_X_CRON_SECRET'] ?? '';

if ($cronSecret && $providedSecret !== $cronSecret) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$results = [
    'abonnements_rappels'    => 0,
    'abonnements_expires'    => 0,
    'domiciliations_rappels' => 0,
    'reservations_rappels'   => 0,
    'errors'                 => [],
];

$today    = date('Y-m-d');
$tomorrow = date('Y-m-d', strtotime('+1 day'));
$in7days  = date('Y-m-d', strtotime('+7 days'));
$in30days = date('Y-m-d', strtotime('+30 days'));

// ─── Helper : insérer une notification sans doublon ───────────────────────────
function insertNotifIfAbsent(PDO $db, string $personId, string $type, string $titre, string $message, string $dedupeKey): bool
{
    $check = $db->prepare("
        SELECT COUNT(*) FROM notifications
        WHERE person_id = ? AND type = ? AND titre = ?
          AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)
    ");
    $check->execute([$personId, $type, $titre]);
    if ((int) $check->fetchColumn() > 0) {
        return false;
    }

    $id = UuidHelper::generate();
    $db->prepare("
        INSERT INTO notifications (id, person_id, type, titre, message, lue)
        VALUES (?, ?, ?, ?, ?, 0)
    ")->execute([$id, $personId, $type, $titre, $message]);
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ABONNEMENTS — rappels expirant dans 7j et 1j
// ═══════════════════════════════════════════════════════════════════════════════
try {
    $stmtAbo = $db->prepare("
        SELECT au.id, au.person_id, au.date_fin,
               a.nom AS abonnement_nom, a.prix,
               p.email, p.prenom, p.nom
        FROM abonnements_utilisateurs au
        JOIN abonnements a ON au.abonnement_id = a.id
        JOIN persons p ON au.person_id = p.id
        WHERE au.statut = 'actif'
          AND DATE(au.date_fin) IN (?, ?)
    ");
    $stmtAbo->execute([$in7days, $tomorrow]);
    $aboRows = $stmtAbo->fetchAll(PDO::FETCH_ASSOC);

    foreach ($aboRows as $row) {
        $dateFin = new DateTime($row['date_fin']);
        $now     = new DateTime();
        $jours   = (int) $now->diff($dateFin)->days + 1;

        $titre   = "Votre abonnement expire " . ($jours <= 1 ? "demain" : "dans {$jours} jours");
        $message = "Votre abonnement {$row['abonnement_nom']} arrive à échéance le " . $dateFin->format('d/m/Y') . ". Renouvelez-le pour continuer à profiter de Coffice.";

        $inserted = insertNotifIfAbsent($db, $row['person_id'], 'abonnement', $titre, $message, "abo-expiration-{$row['id']}-{$today}");

        if ($inserted) {
            try {
                Mailer::sendAbonnementExpiration($row['email'], [
                    'prenom'         => $row['prenom'],
                    'plan_nom'       => $row['abonnement_nom'],
                    'prix_mensuel'   => $row['prix'],
                    'date_fin'       => $dateFin->format('d/m/Y'),
                    'jours_restants' => $jours,
                ]);
            } catch (Exception $e) {
                $results['errors'][] = "Email abo expiration {$row['person_id']}: " . $e->getMessage();
            }
            $results['abonnements_rappels']++;
        }
    }
} catch (Exception $e) {
    $results['errors'][] = "Section abonnements rappels: " . $e->getMessage();
    Logger::error('cron-alertes: abonnements rappels', ['error' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ABONNEMENTS — passer en 'expire' et notifier
// ═══════════════════════════════════════════════════════════════════════════════
try {
    $stmtExpired = $db->prepare("
        SELECT au.id, au.person_id, au.date_fin,
               a.nom AS abonnement_nom,
               p.email, p.prenom
        FROM abonnements_utilisateurs au
        JOIN abonnements a ON au.abonnement_id = a.id
        JOIN persons p ON au.person_id = p.id
        WHERE au.statut = 'actif'
          AND DATE(au.date_fin) < CURDATE()
    ");
    $stmtExpired->execute();
    $expiredRows = $stmtExpired->fetchAll(PDO::FETCH_ASSOC);

    if (count($expiredRows) > 0) {
        $db->prepare("
            UPDATE abonnements_utilisateurs
            SET statut = 'expire'
            WHERE statut = 'actif' AND DATE(date_fin) < CURDATE()
        ")->execute();

        // Terminer les réservations calendrier liées (abonnement_couvert = 1)
        foreach ($expiredRows as $expRow) {
            try {
                $db->prepare("
                    UPDATE reservations
                    SET statut = 'terminee', updated_at = NOW()
                    WHERE person_id = ? AND abonnement_couvert = 1
                      AND statut NOT IN ('annulee', 'terminee')
                      AND date_debut >= (SELECT date_debut FROM abonnements_utilisateurs WHERE id = ?)
                ")->execute([$expRow['person_id'], $expRow['id']]);
            } catch (Exception $resErr) {
                $results['errors'][] = "Calendar reservation close abo {$expRow['id']}: " . $resErr->getMessage();
            }
        }
    }

    foreach ($expiredRows as $row) {
        insertNotifIfAbsent(
            $db,
            $row['person_id'],
            'abonnement',
            'Abonnement expiré',
            "Votre abonnement {$row['abonnement_nom']} a expiré. Souscrivez un nouveau forfait pour continuer à profiter de Coffice.",
            "abo-expire-{$row['id']}-{$today}"
        );
        $results['abonnements_expires']++;
    }
} catch (Exception $e) {
    $results['errors'][] = "Section abonnements expirés: " . $e->getMessage();
    Logger::error('cron-alertes: abonnements expirés', ['error' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DOMICILIATIONS — rappels expirant dans 30j et 7j
// ═══════════════════════════════════════════════════════════════════════════════
try {
    $stmtDom = $db->prepare("
        SELECT d.id, d.person_id, d.raison_sociale, d.date_fin,
               p.email, p.prenom
        FROM domiciliations d
        JOIN persons p ON d.person_id = p.id
        WHERE d.statut = 'active'
          AND DATE(d.date_fin) IN (?, ?)
    ");
    $stmtDom->execute([$in30days, $in7days]);
    $domRows = $stmtDom->fetchAll(PDO::FETCH_ASSOC);

    foreach ($domRows as $row) {
        $dateFin = new DateTime($row['date_fin']);
        $now     = new DateTime();
        $jours   = (int) $now->diff($dateFin)->days + 1;

        $titre   = "Votre domiciliation expire dans {$jours} jours";
        $message = "Le contrat de domiciliation de {$row['raison_sociale']} expire le " . $dateFin->format('d/m/Y') . ". Contactez-nous pour le renouveler.";

        $inserted = insertNotifIfAbsent($db, $row['person_id'], 'domiciliation', $titre, $message, "dom-expiration-{$row['id']}-{$today}");

        if ($inserted) {
            try {
                Mailer::sendDomiciliationExpiration($row['email'], [
                    'prenom'         => $row['prenom'],
                    'raison_sociale' => $row['raison_sociale'],
                    'date_fin'       => $dateFin->format('d/m/Y'),
                    'jours_restants' => $jours,
                ]);
            } catch (Exception $e) {
                $results['errors'][] = "Email dom expiration {$row['person_id']}: " . $e->getMessage();
            }
            $results['domiciliations_rappels']++;
        }
    }
} catch (Exception $e) {
    $results['errors'][] = "Section domiciliations rappels: " . $e->getMessage();
    Logger::error('cron-alertes: domiciliations', ['error' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. RÉSERVATIONS — rappel J-1
// ═══════════════════════════════════════════════════════════════════════════════
try {
    $stmtRes = $db->prepare("
        SELECT r.id, r.person_id, r.date_debut, r.date_fin,
               r.participants,
               e.nom AS espace_nom,
               p.email, p.prenom, p.nom
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        JOIN persons p ON r.person_id = p.id
        WHERE r.statut = 'confirmee'
          AND DATE(r.date_debut) = ?
    ");
    $stmtRes->execute([$tomorrow]);
    $resRows = $stmtRes->fetchAll(PDO::FETCH_ASSOC);

    foreach ($resRows as $row) {
        $heure   = date('H:i', strtotime($row['date_debut']));
        $titre   = 'Rappel : réservation demain à ' . $heure;
        $message = "Votre réservation à l'espace {$row['espace_nom']} est prévue demain à {$heure}.";

        insertNotifIfAbsent($db, $row['person_id'], 'reservation', $titre, $message, "res-rappel-{$row['id']}-{$today}");

        try {
            Mailer::sendReservationReminder($row['email'], [
                'prenom'       => $row['prenom'],
                'espace_nom'   => $row['espace_nom'],
                'date_debut'   => $row['date_debut'],
                'date_fin'     => $row['date_fin'],
                'participants' => $row['participants'],
            ]);
        } catch (Exception $e) {
            $results['errors'][] = "Email res rappel {$row['id']}: " . $e->getMessage();
        }
        $results['reservations_rappels']++;
    }
} catch (Exception $e) {
    $results['errors'][] = "Section réservations rappels: " . $e->getMessage();
    Logger::error('cron-alertes: réservations', ['error' => $e->getMessage()]);
}

// ─── Réponse ──────────────────────────────────────────────────────────────────
Logger::info('cron-alertes terminé', $results);

$hasErrors = count($results['errors']) > 0;
http_response_code($hasErrors ? 207 : 200);
header('Content-Type: application/json');
echo json_encode([
    'success' => !$hasErrors,
    'date'    => $today,
    'results' => $results,
]);
