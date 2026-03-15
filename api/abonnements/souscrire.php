<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $auth = Auth::verifyAuth();
        $userId = $auth['id'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['abonnement_id'])) {
            Response::error('ID d\'abonnement requis', 400);
        }

        $abonnementId = $data['abonnement_id'];

        $stmt = $db->prepare("SELECT * FROM abonnements WHERE id = ? AND actif = 1");
        $stmt->execute([$abonnementId]);
        $abonnement = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$abonnement) {
            Response::notFound('Abonnement non trouvé ou inactif');
        }

        $checkStmt = $db->prepare("
            SELECT id FROM abonnements_utilisateurs
            WHERE user_id = ? AND statut = 'actif'
            LIMIT 1
        ");
        $checkStmt->execute([$userId]);
        if ($checkStmt->fetch()) {
            Response::error('Vous avez déjà un abonnement actif', 400);
        }

        $dateDebut = date('Y-m-d');
        $interval = '+' . $abonnement['duree_mois'] . ' months';
        $dateFin = date('Y-m-d', strtotime($interval, strtotime($dateDebut)));

        $id = UuidHelper::generate();
        $insertStmt = $db->prepare("
            INSERT INTO abonnements_utilisateurs
            (id, user_id, abonnement_id, date_debut, date_fin, montant_paye, statut, credits_restants)
            VALUES (?, ?, ?, ?, ?, ?, 'actif', ?)
        ");

        $creditsRestants = $abonnement['credits_mensuels'] ?? 0;
        $prixAbonnement = floatval($abonnement['prix'] ?? 0);

        $db->beginTransaction();

        $insertStmt->execute([
            $id,
            $userId,
            $abonnementId,
            $dateDebut,
            $dateFin,
            $prixAbonnement,
            $creditsRestants
        ]);

        $transactionId = UuidHelper::generate();
        $transStmt = $db->prepare("
            INSERT INTO transactions
            (id, user_id, type, montant, statut, mode_paiement, reference, description, date_paiement)
            VALUES (?, ?, 'abonnement', ?, 'en_attente', 'cash', ?, ?, NOW())
        ");
        $transStmt->execute([
            $transactionId,
            $userId,
            $prixAbonnement,
            'ABO-' . date('YmdHis') . '-' . substr($id, 0, 8),
            'Souscription ' . ($abonnement['nom'] ?? 'Abonnement') . ' du ' . $dateDebut . ' au ' . $dateFin,
        ]);

        $notifId = UuidHelper::generate();
        $notifStmt = $db->prepare("
            INSERT INTO notifications (id, user_id, type, titre, message, lue)
            VALUES (?, ?, 'abonnement', 'Abonnement souscrit', ?, 0)
        ");
        $notifStmt->execute([
            $notifId,
            $userId,
            'Votre abonnement ' . ($abonnement['nom'] ?? '') . ' est actif jusqu\'au ' . date('d/m/Y', strtotime($dateFin)) . '.',
        ]);

        $db->commit();

        try {
            $userStmt = $db->prepare("SELECT prenom, nom, email FROM users WHERE id = ?");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $montant = number_format($prixAbonnement, 0, ',', ' ') . ' DA';
                AdminNotifier::newSubscription(
                    $user['prenom'] . ' ' . $user['nom'],
                    $user['email'],
                    $abonnement['nom'] ?? 'Abonnement',
                    $montant
                );
            }
        } catch (Exception $notifErr) {
            error_log("Admin notification error: " . $notifErr->getMessage());
        }

        Response::success([
            'id' => $id,
            'transaction_id' => $transactionId,
            'message' => 'Abonnement souscrit avec succès'
        ]);
    } catch (Exception $e) {
        if (isset($db) && $db->inTransaction()) {
            $db->rollBack();
        }
        Response::error($e->getMessage());
    }
} else {
    Response::error('Méthode non autorisée', 405);
}
