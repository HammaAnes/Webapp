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

        $insertStmt->execute([
            $id,
            $userId,
            $abonnementId,
            $dateDebut,
            $dateFin,
            $abonnement['prix'],
            $creditsRestants
        ]);

        Response::success([
            'id' => $id,
            'message' => 'Abonnement souscrit avec succès'
        ]);
    } catch (Exception $e) {
        Response::error($e->getMessage());
    }
} else {
    Response::error('Méthode non autorisée', 405);
}
