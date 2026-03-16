<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $auth = Auth::requireAdmin();
    $userId = $auth['id'];

    if ($method === 'GET') {
        $date = $_GET['date'] ?? date('Y-m-d');

        $stmt = $db->prepare("
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

        $totauxStmt = $db->prepare("
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
            Response::error('Données manquantes: type_transaction, montant, mode_paiement requis', 400);
        }

        $montant = floatval($data['montant']);
        if ($montant <= 0) {
            Response::error('Le montant doit être supérieur à 0', 400);
        }

        $typesValides = ['reservation', 'domiciliation', 'abonnement', 'autre', 'remboursement', 'impression', 'boisson'];
        if (!in_array($data['type_transaction'], $typesValides)) {
            Response::error('Type de transaction invalide', 400);
        }

        $modesValides = ['cash', 'virement', 'cheque', 'tpe', 'credit'];
        if (!in_array($data['mode_paiement'], $modesValides)) {
            Response::error('Mode de paiement invalide', 400);
        }

        $id = UuidHelper::generate();
        $annee = date('Y');

        $db->beginTransaction();

        $countStmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM transactions_caisse
            WHERE YEAR(created_at) = ?
            FOR UPDATE
        ");
        $countStmt->execute([$annee]);
        $count = $countStmt->fetch(PDO::FETCH_ASSOC);
        $numero = str_pad($count['count'] + 1, 4, '0', STR_PAD_LEFT);
        $numeroRecu = "REC-{$annee}-{$numero}";

        $insertStmt = $db->prepare("
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
            $montant,
            $data['mode_paiement'],
            $data['reference_paiement'] ?? null,
            $numeroRecu,
            $userId,
            isset($data['notes']) ? trim($data['notes']) : null
        ]);

        $db->commit();

        Response::success([
            'id' => $id,
            'numero_recu' => $numeroRecu,
            'message' => 'Transaction enregistrée avec succès'
        ]);

    } else {
        Response::error('Méthode non autorisée', 405);
    }
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error($e->getMessage());
}
