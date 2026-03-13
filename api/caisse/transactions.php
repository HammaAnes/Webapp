<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/UuidHelper.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;
use Utils\UuidHelper;

$method = $_SERVER['REQUEST_METHOD'];

try {
    $userId = Auth::getUserId();
    if (!$userId) {
        Response::unauthorized('Non authentifié');
    }

    $user = Auth::getUser();
    if ($user['role'] !== 'admin') {
        Response::forbidden('Accès réservé aux administrateurs');
    }

    if ($method === 'GET') {
        $date = $_GET['date'] ?? date('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT
                t.*,
                u.prenom as admin_prenom,
                u.nom as admin_nom
            FROM transactions_caisse t
            LEFT JOIN users u ON t.encaisse_par = u.id
            WHERE DATE(t.created_at) = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$date]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculer les totaux par mode de paiement
        $totauxStmt = $pdo->prepare("
            SELECT
                mode_paiement,
                SUM(montant) as total,
                COUNT(*) as nombre
            FROM transactions_caisse
            WHERE DATE(created_at) = ? AND statut = 'encaisse'
            GROUP BY mode_paiement
        ");
        $totauxStmt->execute([$date]);
        $totaux = $totauxStmt->fetchAll(PDO::FETCH_ASSOC);

        $totalGeneral = array_sum(array_column($totaux, 'total'));

        Response::success([
            'transactions' => $transactions,
            'totaux' => $totaux,
            'total_general' => $totalGeneral
        ]);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['type_transaction'], $data['montant'], $data['mode_paiement'])) {
            Response::badRequest('Données manquantes: type_transaction, montant, mode_paiement requis');
        }

        // Générer numéro de reçu auto (REC-AAAA-XXXX)
        $annee = date('Y');
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM transactions_caisse
            WHERE YEAR(created_at) = ?
        ");
        $countStmt->execute([$annee]);
        $count = $countStmt->fetch(PDO::FETCH_ASSOC);
        $numero = str_pad($count['count'] + 1, 4, '0', STR_PAD_LEFT);
        $numeroRecu = "REC-{$annee}-{$numero}";

        $id = UuidHelper::generate();
        $insertStmt = $pdo->prepare("
            INSERT INTO transactions_caisse
            (id, reservation_id, domiciliation_id, abonnement_utilisateur_id,
             type_transaction, montant, mode_paiement, reference_paiement,
             numero_recu, statut, encaisse_par, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'encaisse', ?, ?)
        ");

        $insertStmt->execute([
            $id,
            $data['reservation_id'] ?? null,
            $data['domiciliation_id'] ?? null,
            $data['abonnement_utilisateur_id'] ?? null,
            $data['type_transaction'],
            $data['montant'],
            $data['mode_paiement'],
            $data['reference_paiement'] ?? null,
            $numeroRecu,
            $userId,
            $data['notes'] ?? null
        ]);

        Response::success([
            'id' => $id,
            'numero_recu' => $numeroRecu,
            'message' => 'Transaction enregistrée avec succès'
        ]);

    } else {
        Response::methodNotAllowed();
    }
} catch (Exception $e) {
    Response::error($e->getMessage());
}
