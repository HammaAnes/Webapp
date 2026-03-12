<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/UuidHelper.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;
use Utils\UuidHelper;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $userId = Auth::getUserId();
        if (!$userId) {
            Response::unauthorized('Non authentifié');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['abonnement_id'])) {
            Response::badRequest('ID d\'abonnement requis');
        }

        $abonnementId = $data['abonnement_id'];

        $stmt = $pdo->prepare("SELECT * FROM abonnements WHERE id = ? AND actif = 1");
        $stmt->execute([$abonnementId]);
        $abonnement = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$abonnement) {
            Response::notFound('Abonnement non trouvé ou inactif');
        }

        $checkStmt = $pdo->prepare("
            SELECT id FROM abonnements_utilisateurs
            WHERE user_id = ? AND statut = 'actif'
            LIMIT 1
        ");
        $checkStmt->execute([$userId]);
        if ($checkStmt->fetch()) {
            Response::badRequest('Vous avez déjà un abonnement actif');
        }

        $dateDebut = date('Y-m-d');
        $interval = '+' . $abonnement['duree_mois'] . ' months';
        $dateFin = date('Y-m-d', strtotime($interval, strtotime($dateDebut)));

        $id = UuidHelper::generate();
        $insertStmt = $pdo->prepare("
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
    Response::methodNotAllowed();
}
