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

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $dateCloture = $data['date_cloture'] ?? date('Y-m-d');

        // Vérifier qu'il n'y a pas déjà une clôture pour cette date
        $checkStmt = $pdo->prepare("SELECT id FROM clotures_caisse WHERE date_cloture = ?");
        $checkStmt->execute([$dateCloture]);
        if ($checkStmt->fetch()) {
            Response::badRequest('Une clôture existe déjà pour cette date');
        }

        // Calculer les totaux
        $totauxStmt = $pdo->prepare("
            SELECT
                SUM(CASE WHEN mode_paiement = 'cash' THEN montant ELSE 0 END) as total_cash,
                SUM(CASE WHEN mode_paiement = 'virement' THEN montant ELSE 0 END) as total_virement,
                SUM(CASE WHEN mode_paiement = 'cheque' THEN montant ELSE 0 END) as total_cheque,
                SUM(CASE WHEN mode_paiement = 'tpe' THEN montant ELSE 0 END) as total_tpe,
                SUM(montant) as total_general,
                COUNT(*) as nombre_transactions
            FROM transactions_caisse
            WHERE DATE(created_at) = ? AND statut = 'encaisse'
        ");
        $totauxStmt->execute([$dateCloture]);
        $totaux = $totauxStmt->fetch(PDO::FETCH_ASSOC);

        $pdo->beginTransaction();

        // Créer la clôture
        $clotureId = UuidHelper::generate();
        $insertStmt = $pdo->prepare("
            INSERT INTO clotures_caisse
            (id, date_cloture, total_cash, total_virement, total_cheque, total_tpe,
             total_general, nombre_transactions, cloture_par, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insertStmt->execute([
            $clotureId,
            $dateCloture,
            $totaux['total_cash'] ?? 0,
            $totaux['total_virement'] ?? 0,
            $totaux['total_cheque'] ?? 0,
            $totaux['total_tpe'] ?? 0,
            $totaux['total_general'] ?? 0,
            $totaux['nombre_transactions'] ?? 0,
            $userId,
            $data['notes'] ?? null
        ]);

        // Lier les transactions à la clôture
        $updateStmt = $pdo->prepare("
            UPDATE transactions_caisse
            SET cloture_id = ?
            WHERE DATE(created_at) = ? AND statut = 'encaisse'
        ");
        $updateStmt->execute([$clotureId, $dateCloture]);

        $pdo->commit();

        Response::success([
            'id' => $clotureId,
            'totaux' => $totaux,
            'message' => 'Clôture enregistrée avec succès'
        ]);

    } elseif ($method === 'GET') {
        // Liste des clôtures
        $stmt = $pdo->prepare("
            SELECT
                c.*,
                u.prenom as admin_prenom,
                u.nom as admin_nom
            FROM clotures_caisse c
            LEFT JOIN users u ON c.cloture_par = u.id
            ORDER BY c.date_cloture DESC
            LIMIT 30
        ");
        $stmt->execute();
        $clotures = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['clotures' => $clotures]);

    } else {
        Response::methodNotAllowed();
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    Response::error($e->getMessage());
}
