<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $auth = Auth::requireAdmin();
    $userId = $auth['id'];

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $dateCloture = $data['date_cloture'] ?? date('Y-m-d');

        $db->beginTransaction();

        $checkStmt = $db->prepare("SELECT id FROM clotures_caisse WHERE date_cloture = ? FOR UPDATE");
        $checkStmt->execute([$dateCloture]);
        if ($checkStmt->fetch()) {
            $db->rollBack();
            Response::error('Une clôture existe déjà pour cette date', 400);
        }

        $totauxStmt = $db->prepare("
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

        $clotureId = UuidHelper::generate();
        $insertStmt = $db->prepare("
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

        $db->commit();

        Response::success([
            'id' => $clotureId,
            'totaux' => $totaux,
            'message' => 'Clôture enregistrée avec succès'
        ]);

    } elseif ($method === 'GET') {
        $stmt = $db->prepare("
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
        Response::error('Méthode non autorisée', 405);
    }
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    Response::error($e->getMessage());
}
