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

        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT * FROM abonnements WHERE id = ? AND actif = 1");
        $stmt->execute([$abonnementId]);
        $abonnement = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$abonnement) {
            Response::notFound('Abonnement non trouvé ou inactif');
        }

        $commentaire = isset($data['commentaire']) ? trim($data['commentaire']) : null;
        $dateDebutSouhaitee = isset($data['date_debut_souhaitee']) ? $data['date_debut_souhaitee'] : null;
        $entreprise = isset($data['entreprise']) ? trim($data['entreprise']) : null;

        $dateDebut = date('Y-m-d');
        $interval = '+' . $abonnement['duree_mois'] . ' months';
        $dateFin = date('Y-m-d', strtotime($interval, strtotime($dateDebut)));

        $prixAbonnement = floatval($abonnement['prix'] ?? 0);

        $db->beginTransaction();

        $checkStmt = $db->prepare("
            SELECT id FROM abonnements_utilisateurs
            WHERE person_id = ? AND statut = 'actif' AND date_fin > CURDATE()
            LIMIT 1
            FOR UPDATE
        ");
        $checkStmt->execute([$userId]);
        if ($checkStmt->fetch()) {
            $db->rollBack();
            Response::error('Vous avez déjà un abonnement actif', 400);
        }

        $id = UuidHelper::generate();
        $insertStmt = $db->prepare("
            INSERT INTO abonnements_utilisateurs
            (id, person_id, abonnement_id, date_debut, date_fin, statut, commentaire, date_debut_souhaitee, entreprise)
            VALUES (?, ?, ?, ?, ?, 'en_attente', ?, ?, ?)
        ");

        $insertStmt->execute([
            $id,
            $userId,
            $abonnementId,
            $dateDebut,
            $dateFin,
            $commentaire,
            $dateDebutSouhaitee,
            $entreprise
        ]);

        CaisseHelper::insert($db, [
            'abonnement_utilisateur_id' => $id,
            'person_id'                 => $userId,
            'type_transaction'          => 'abonnement',
            'montant'                   => $prixAbonnement,
            'mode_paiement'             => 'cash',
            'statut'                    => 'en_attente',
            'notes'                     => 'Souscription ' . ($abonnement['nom'] ?? 'Abonnement') . ' du ' . $dateDebut . ' au ' . $dateFin,
        ]);

        $notifId = UuidHelper::generate();
        $notifStmt = $db->prepare("
            INSERT INTO notifications (id, person_id, type, titre, message, lue)
            VALUES (?, ?, 'abonnement', 'Abonnement souscrit', ?, 0)
        ");
        $notifStmt->execute([
            $notifId,
            $userId,
            'Votre demande d\'abonnement ' . ($abonnement['nom'] ?? '') . ' a bien été reçue et est en attente de validation.',
        ]);

        $db->commit();

        try {
            $userStmt = $db->prepare("SELECT prenom, nom, email FROM persons WHERE id = ?");
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
            'id'      => $id,
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
