<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $auth = Auth::requireAdmin();
    $userId = $auth['id'];

    if ($method === 'GET') {

        // ── Mode "jour unique" (comportement existant) ──────────────────────
        if (isset($_GET['date']) && !isset($_GET['all'])) {
            $date = $_GET['date'];

            $stmt = $db->prepare("
                SELECT t.*,
                       u.prenom  AS admin_prenom,
                       u.nom     AS admin_nom,
                       COALESCE(rp.prenom, dp.prenom, ap.prenom) AS client_prenom,
                       COALESCE(rp.nom,    dp.nom,    ap.nom)    AS client_nom
                FROM transactions_caisse t
                LEFT JOIN persons u                 ON t.encaisse_par                = u.id
                LEFT JOIN reservations r            ON t.reservation_id              = r.id
                LEFT JOIN persons rp                ON r.person_id                   = rp.id
                LEFT JOIN domiciliations d          ON t.domiciliation_id            = d.id
                LEFT JOIN persons dp                ON d.person_id                   = dp.id
                LEFT JOIN abonnements_utilisateurs au ON t.abonnement_utilisateur_id = au.id
                LEFT JOIN persons ap                ON au.person_id                  = ap.id
                WHERE DATE(t.created_at) = ?
                ORDER BY t.created_at DESC
            ");
            $stmt->execute([$date]);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $totauxStmt = $db->prepare("
                SELECT mode_paiement, SUM(montant) as total, COUNT(*) as nombre
                FROM transactions_caisse
                WHERE DATE(created_at) = ? AND statut = 'encaisse'
                GROUP BY mode_paiement
            ");
            $totauxStmt->execute([$date]);
            $totaux = $totauxStmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success([
                'transactions'  => $transactions,
                'totaux'        => $totaux,
                'total_general' => array_sum(array_column($totaux, 'total')),
            ]);
        }

        // ── Mode "historique complet" — table `transactions_caisse` ────────
        $dateFrom  = $_GET['date_from'] ?? null;
        $dateTo    = $_GET['date_to']   ?? null;
        $type      = $_GET['type']      ?? null;
        $mode      = $_GET['mode']      ?? null;
        $search    = $_GET['search']    ?? null;
        $page      = max(1, intval($_GET['page']  ?? 1));
        $limit     = min(200, max(1, intval($_GET['limit'] ?? 50)));
        $offset    = ($page - 1) * $limit;

        $where  = [];
        $params = [];

        if ($dateFrom) { $where[] = "DATE(t.created_at) >= ?"; $params[] = $dateFrom; }
        if ($dateTo)   { $where[] = "DATE(t.created_at) <= ?"; $params[] = $dateTo;   }

        $typesValides = ['reservation','domiciliation','abonnement','autre','remboursement','impression','boisson'];
        if ($type && in_array($type, $typesValides)) {
            $where[] = "t.type_transaction = ?"; $params[] = $type;
        }

        $modesValides = ['cash','virement','cheque','tpe','credit'];
        if ($mode && in_array($mode, $modesValides)) {
            $where[] = "t.mode_paiement = ?"; $params[] = $mode;
        }

        if ($search) {
            $where[] = "(t.numero_recu LIKE ? OR t.notes LIKE ? OR t.reference_paiement LIKE ?)";
            $like = '%' . $search . '%';
            $params = array_merge($params, [$like, $like, $like]);
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Comptage total
        $countStmt = $db->prepare("SELECT COUNT(*) FROM transactions_caisse t $whereSql");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Transactions paginées — client résolu via la chaîne de FK
        $stmt = $db->prepare("
            SELECT
                t.id,
                t.type_transaction,
                t.montant,
                t.mode_paiement,
                t.statut,
                t.numero_recu,
                t.reference_paiement,
                t.notes,
                t.created_at,
                COALESCE(rp.prenom, dp.prenom, ap.prenom, pp.prenom) AS client_prenom,
                COALESCE(rp.nom,    dp.nom,    ap.nom,    pp.nom)    AS client_nom
            FROM transactions_caisse t
            LEFT JOIN reservations r              ON t.reservation_id              = r.id
            LEFT JOIN persons rp                  ON r.person_id                   = rp.id
            LEFT JOIN domiciliations d            ON t.domiciliation_id            = d.id
            LEFT JOIN persons dp                  ON d.person_id                   = dp.id
            LEFT JOIN abonnements_utilisateurs au ON t.abonnement_utilisateur_id   = au.id
            LEFT JOIN persons ap                  ON au.person_id                  = ap.id
            LEFT JOIN persons pp                  ON t.person_id                   = pp.id
            $whereSql
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute(array_merge($params, [$limit, $offset]));
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Totaux agrégés par mode de paiement
        $totauxStmt = $db->prepare("
            SELECT mode_paiement, SUM(montant) AS total, COUNT(*) AS nombre
            FROM transactions_caisse t
            $whereSql
            GROUP BY mode_paiement
        ");
        $totauxStmt->execute($params);
        $totaux = $totauxStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'transactions'  => $transactions,
            'totaux'        => $totaux,
            'total_general' => array_sum(array_column($totaux, 'total')),
            'pagination'    => [
                'total'  => $total,
                'page'   => $page,
                'limit'  => $limit,
                'pages'  => (int) ceil($total / $limit),
            ],
        ]);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['type_transaction'], $data['montant'], $data['mode_paiement'])) {
            Response::error('Données manquantes: type_transaction, montant, mode_paiement requis', 400);
        }

        $montant       = floatval($data['montant']);
        $montantAjuste = !empty($data['montant_ajuste']); // true si le desk a modifié le prix calculé
        $notes         = isset($data['notes']) ? trim($data['notes']) : '';

        if ($montant <= 0) {
            Response::error('Le montant doit être supérieur à 0', 400);
        }

        // Note obligatoire si le montant a été ajusté manuellement
        if ($montantAjuste && $notes === '') {
            Response::error('Une justification est requise lorsque le montant est modifié', 400);
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
            $notes !== '' ? $notes : null
        ]);

        // Mettre à jour la réservation liée
        if (!empty($data['reservation_id'])) {
            // Si le montant a été ajusté, on met à jour montant_total pour refléter le prix réel facturé
            if ($montantAjuste) {
                $db->prepare("
                    UPDATE reservations
                    SET montant_total = ?, updated_at = NOW()
                    WHERE id = ?
                ")->execute([$montant, $data['reservation_id']]);
            }
            // montant_paye = ce qui a été encaissé (sans plafonnement car montant_total est maintenant juste)
            $db->prepare("
                UPDATE reservations
                SET montant_paye = COALESCE(montant_paye, 0) + ?
                WHERE id = ?
            ")->execute([$montant, $data['reservation_id']]);
        }

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
