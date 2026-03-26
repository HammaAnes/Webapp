<?php

/**
 * API: Valider ou refuser une souscription d'abonnement
 * POST /api/abonnements/valider-souscription.php
 * Admin uniquement
 */

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $auth = Auth::requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id'])) {
        Response::error('ID de souscription requis', 400);
    }

    $nouveauStatut = $data['statut'] ?? null;
    $statutsValides = ['actif', 'refuse', 'annule', 'suspendu'];
    if (!in_array($nouveauStatut, $statutsValides)) {
        Response::error("Statut invalide (valeurs: actif, refuse, annule, suspendu)", 400);
    }

    $souscriptionId = $data['id'];
    $commentaire    = isset($data['commentaire']) ? trim($data['commentaire']) : null;
    $codeAcces      = isset($data['code_acces']) ? trim($data['code_acces']) : null;
    // Validation du code : 7 chiffres exactement
    if ($codeAcces !== null && !preg_match('/^\d{7}$/', $codeAcces)) {
        Response::error('Le code d\'accès doit être exactement 7 chiffres', 400);
    }

    $stmt = $db->prepare("
        SELECT au.*, a.nom as abonnement_nom, a.prix as abonnement_prix, a.duree_mois
        FROM abonnements_utilisateurs au
        JOIN abonnements a ON au.abonnement_id = a.id
        WHERE au.id = ?
    ");
    $stmt->execute([$souscriptionId]);
    $souscription = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$souscription) {
        Response::notFound('Souscription introuvable');
    }

    if ($souscription['statut'] !== 'en_attente') {
        Response::error("Cette souscription n'est plus en attente (statut actuel : {$souscription['statut']})", 400);
    }

    $personId = $souscription['person_id'] ?? null;

    $db->beginTransaction();

    if ($nouveauStatut === 'actif') {
        $dateDebut = !empty($souscription['date_debut_souhaitee'])
            ? $souscription['date_debut_souhaitee']
            : date('Y-m-d');
        $dateFin = date('Y-m-d', strtotime('+' . $souscription['duree_mois'] . ' months', strtotime($dateDebut)));

        $db->prepare("
            UPDATE abonnements_utilisateurs
            SET statut = 'actif', date_debut = ?, date_fin = ?, code_acces = ?
            WHERE id = ?
        ")->execute([$dateDebut, $dateFin, $codeAcces, $souscriptionId]);

        // Marquer la transaction caisse en attente liée à cet abonnement
        $db->prepare("
            UPDATE transactions_caisse
            SET statut = 'encaisse'
            WHERE abonnement_utilisateur_id = ? AND statut = 'en_attente'
            ORDER BY created_at DESC
            LIMIT 1
        ")->execute([$souscriptionId]);

        // Si le plan est lié à un espace (migration appliquée), créer une réservation calendrier
        try {
            $planStmt = $db->prepare("SELECT espace_id FROM abonnements WHERE id = ?");
            $planStmt->execute([$souscription['abonnement_id']]);
            $plan = $planStmt->fetch(PDO::FETCH_ASSOC);

            if (!empty($plan['espace_id']) && $personId) {
                $resId = UuidHelper::generate();
                $db->prepare("
                    INSERT INTO reservations
                        (id, person_id, espace_id, date_debut, date_fin,
                         statut, type_reservation, montant_total, montant_paye,
                         notes, abonnement_couvert, created_at)
                    VALUES (?, ?, ?, ?, ?, 'confirmee', 'mois', 0, 0, ?, 1, NOW())
                ")->execute([
                    $resId,
                    $personId,
                    $plan['espace_id'],
                    $dateDebut . ' 07:00:00',
                    $dateFin . ' 23:59:59',
                    'Abonnement ' . ($souscription['abonnement_nom'] ?? ''),
                ]);
            }
        } catch (\Throwable $calErr) {
            // Migration espace_id non encore appliquée — on continue sans créer la réservation
            error_log('valider-souscription: création réservation calendrier ignorée: ' . $calErr->getMessage());
        }

        $messageNotif = 'Votre abonnement ' . $souscription['abonnement_nom'] .
            ' a été activé. Valable jusqu\'au ' . date('d/m/Y', strtotime($dateFin)) . '.';
        $titreNotif = 'Abonnement activé';
    } else {
        $db->prepare("
            UPDATE abonnements_utilisateurs
            SET statut = ?, commentaire = ?
            WHERE id = ?
        ")->execute([$nouveauStatut, $commentaire, $souscriptionId]);

        $messageNotif = 'Votre demande d\'abonnement ' . $souscription['abonnement_nom'] .
            ' a été refusée.' . ($commentaire ? ' Motif : ' . $commentaire : '');
        $titreNotif = 'Abonnement refusé';
    }

    if ($personId) {
        $db->prepare("
            INSERT INTO notifications (id, person_id, type, titre, message, lue, created_at)
            VALUES (?, ?, 'abonnement', ?, ?, 0, NOW())
        ")->execute([UuidHelper::generate(), $personId, $titreNotif, $messageNotif]);
    }

    $db->commit();

    // Email notification (non bloquant)
    if ($personId) {
        try {
            $row = $db->prepare("SELECT prenom, nom, email FROM persons WHERE id = ?");
            $row->execute([$personId]);
            $p = $row->fetch(PDO::FETCH_ASSOC);
            if (!empty($p['email'])) {
                $emailData = array_merge($souscription, [
                    'prenom'     => $p['prenom'],
                    'nom'        => $p['nom'],
                    'motif'      => $commentaire,
                    'code_acces' => $codeAcces,
                    'date_debut' => $dateDebut ?? null,
                    'date_fin'   => $dateFin   ?? null,
                ]);
                if ($nouveauStatut === 'actif') {
                    Mailer::sendAbonnementValide($p['email'], $emailData);
                } else {
                    Mailer::sendAbonnementRefuse($p['email'], $emailData);
                }
            }
        } catch (Exception $emailErr) {
            Logger::warning('Email notification error on subscription validation', ['error' => $emailErr->getMessage()]);
        }
    }

    Response::success(['id' => $souscriptionId, 'statut' => $nouveauStatut], 'Souscription mise à jour avec succès');

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    Logger::error('Subscription validation error', ['error' => $e->getMessage()]);
    Response::serverError();
}
