<?php

/**
 * API Admin: CRUD souscriptions
 * POST   — créer une souscription pour un user ou contact
 * PUT    — modifier une souscription existante
 * DELETE — supprimer une souscription
 */

require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['abonnement_id'])) {
            Response::error('abonnement_id requis', 400);
        }
        $personId = $data['person_id'] ?? $data['user_id'] ?? $data['contact_id'] ?? null;
        if (empty($personId)) {
            Response::error('person_id requis', 400);
        }

        $stmt = $db->prepare("SELECT * FROM abonnements WHERE id = ?");
        $stmt->execute([$data['abonnement_id']]);
        $abonnement = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$abonnement) {
            Response::notFound('Abonnement introuvable');
        }

        $statut         = $data['statut']              ?? 'en_attente';
        $dateDebut      = $data['date_debut']          ?? date('Y-m-d');
        $dateFin        = $data['date_fin']             ?? date('Y-m-d', strtotime('+' . $abonnement['duree_mois'] . ' months', strtotime($dateDebut)));
        $commentaire    = isset($data['commentaire'])   ? trim($data['commentaire'])  : null;
        $entreprise     = isset($data['entreprise'])    ? trim($data['entreprise'])   : null;
        $dateDebutSouhaitee = $data['date_debut_souhaitee'] ?? null;
        $codeAcces      = isset($data['code_acces'])    ? trim($data['code_acces'])   : null;
        if ($codeAcces !== null && !preg_match('/^\d{7}$/', $codeAcces)) {
            Response::error('Le code d\'accès doit être exactement 7 chiffres', 400);
        }

        $validStatuts = ['en_attente', 'actif', 'expire', 'suspendu', 'refuse', 'annule'];
        if (!in_array($statut, $validStatuts)) {
            Response::error('Statut invalide', 400);
        }

        $id = UuidHelper::generate();
        $db->prepare("
            INSERT INTO abonnements_utilisateurs
            (id, person_id, abonnement_id, date_debut, date_fin, statut, commentaire, code_acces, date_debut_souhaitee, entreprise)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ")->execute([
            $id,
            $personId,
            $data['abonnement_id'],
            $dateDebut,
            $dateFin,
            $statut,
            $commentaire,
            $codeAcces,
            $dateDebutSouhaitee,
            $entreprise,
        ]);

        // Quand créée directement comme 'actif', appliquer les mêmes effets que valider-souscription.php
        if ($statut === 'actif') {
            // 1. Transaction caisse
            if (!empty($abonnement['prix']) && floatval($abonnement['prix']) > 0) {
                try {
                    CaisseHelper::insert($db, [
                        'abonnement_utilisateur_id' => $id,
                        'person_id'                 => $personId,
                        'type_transaction'          => 'abonnement',
                        'montant'                   => floatval($abonnement['prix']),
                        'mode_paiement'             => $data['mode_paiement'] ?? 'cash',
                        'statut'                    => 'encaisse',
                        'notes'                     => 'Abonnement ' . ($abonnement['nom'] ?? ''),
                    ]);
                } catch (\Throwable $t) {
                    error_log('admin-souscription: transaction caisse error: ' . $t->getMessage());
                }
            }

            // 2. Réservation calendrier si l'abonnement est lié à un espace
            try {
                $planStmt = $db->prepare("SELECT espace_id FROM abonnements WHERE id = ?");
                $planStmt->execute([$data['abonnement_id']]);
                $plan = $planStmt->fetch(PDO::FETCH_ASSOC);
                if (!empty($plan['espace_id'])) {
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
                        'Abonnement ' . ($abonnement['nom'] ?? ''),
                    ]);
                }
            } catch (\Throwable $calErr) {
                error_log('admin-souscription: création réservation calendrier ignorée: ' . $calErr->getMessage());
            }

            // 3. Notification in-app
            try {
                $notifMsg = 'Votre abonnement ' . ($abonnement['nom'] ?? '') .
                    ' a été activé. Valable jusqu\'au ' . date('d/m/Y', strtotime($dateFin)) . '.';
                $db->prepare("
                    INSERT INTO notifications (id, person_id, type, titre, message, lue, created_at)
                    VALUES (?, ?, 'abonnement', 'Abonnement activé', ?, 0, NOW())
                ")->execute([UuidHelper::generate(), $personId, $notifMsg]);
            } catch (\Throwable $notifErr) {
                error_log('admin-souscription: notification error: ' . $notifErr->getMessage());
            }
        }

        Response::success(['id' => $id], 'Souscription créée');

    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['id'])) {
            Response::error('id requis', 400);
        }

        $stmt = $db->prepare("SELECT id FROM abonnements_utilisateurs WHERE id = ?");
        $stmt->execute([$data['id']]);
        if (!$stmt->fetch()) {
            Response::notFound('Souscription introuvable');
        }

        $fields = [];
        $params = [];

        if (isset($data['statut'])) {
            $fields[] = 'statut = ?';
            $params[] = $data['statut'];
        }
        if (isset($data['date_debut'])) {
            $fields[] = 'date_debut = ?';
            $params[] = $data['date_debut'];
        }
        if (isset($data['date_fin'])) {
            $fields[] = 'date_fin = ?';
            $params[] = $data['date_fin'];
        }
        if (array_key_exists('commentaire', $data)) {
            $fields[] = 'commentaire = ?';
            $params[] = $data['commentaire'] ? trim($data['commentaire']) : null;
        }
        if (array_key_exists('entreprise', $data)) {
            $fields[] = 'entreprise = ?';
            $params[] = $data['entreprise'] ? trim($data['entreprise']) : null;
        }
        if (isset($data['abonnement_id'])) {
            $fields[] = 'abonnement_id = ?';
            $params[] = $data['abonnement_id'];
        }
        if (array_key_exists('code_acces', $data)) {
            $code = $data['code_acces'] ? trim($data['code_acces']) : null;
            if ($code !== null && !preg_match('/^\d{7}$/', $code)) {
                Response::error('Le code d\'accès doit être exactement 7 chiffres', 400);
            }
            $fields[] = 'code_acces = ?';
            $params[] = $code;
        }

        if (empty($fields)) {
            Response::error('Aucun champ à mettre à jour', 400);
        }

        $fields[]  = 'updated_at = NOW()';
        $params[]  = $data['id'];

        $db->prepare("UPDATE abonnements_utilisateurs SET " . implode(', ', $fields) . " WHERE id = ?")
           ->execute($params);

        Response::success(['id' => $data['id']], 'Souscription mise à jour');

    } elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['id'])) {
            Response::error('id requis', 400);
        }

        $stmt = $db->prepare("SELECT id FROM abonnements_utilisateurs WHERE id = ?");
        $stmt->execute([$data['id']]);
        if (!$stmt->fetch()) {
            Response::notFound('Souscription introuvable');
        }

        $db->prepare("DELETE FROM abonnements_utilisateurs WHERE id = ?")->execute([$data['id']]);

        Response::success(null, 'Souscription supprimée');

    } else {
        Response::error('Méthode non autorisée', 405);
    }

} catch (Exception $e) {
    Logger::error('Admin souscription error', ['error' => $e->getMessage()]);
    Response::serverError();
}
