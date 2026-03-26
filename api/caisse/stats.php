<?php
require_once __DIR__ . '/../bootstrap.php';

try {
    Auth::requireAdmin();

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Méthode non autorisée', 405);
        exit;
    }

    $period = $_GET['period'] ?? 'month'; // day|week|month|all

    switch ($period) {
        case 'day':
            $whereClause     = "DATE(created_at) = CURDATE()";
            $wherePrevClause = "DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
            break;
        case 'week':
            $whereClause     = "created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            $wherePrevClause = "created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            break;
        case 'all':
            $whereClause     = "1=1";
            $wherePrevClause = "1=0";
            break;
        case 'month':
        default:
            $whereClause     = "MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
            $wherePrevClause = "MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))";
            break;
    }

    $baseWhere     = "statut = 'encaisse' AND $whereClause";
    $basePrevWhere = "statut = 'encaisse' AND $wherePrevClause";

    // ─── Global KPIs ─────────────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT
            COUNT(*)        AS nb_transactions,
            COALESCE(SUM(montant), 0)  AS total,
            COALESCE(AVG(montant), 0)  AS moyenne
        FROM transactions_caisse
        WHERE $baseWhere
    ");
    $kpis = $stmt->fetch(PDO::FETCH_ASSOC);

    // Previous period for comparison
    $stmtPrev = $db->query("
        SELECT COALESCE(SUM(montant), 0) AS total, COUNT(*) AS nb
        FROM transactions_caisse
        WHERE $basePrevWhere
    ");
    $prev = $stmtPrev->fetch(PDO::FETCH_ASSOC);

    $totalDiff = $prev['total'] > 0
        ? round((($kpis['total'] - $prev['total']) / $prev['total']) * 100, 1)
        : null;

    // ─── By payment mode ─────────────────────────────────────────────────────
    $stmtMode = $db->query("
        SELECT mode_paiement, COUNT(*) AS nb, COALESCE(SUM(montant), 0) AS total
        FROM transactions_caisse
        WHERE $baseWhere
        GROUP BY mode_paiement
        ORDER BY total DESC
    ");
    $byMode = $stmtMode->fetchAll(PDO::FETCH_ASSOC);

    // ─── By transaction type ─────────────────────────────────────────────────
    $stmtType = $db->query("
        SELECT type_transaction, COUNT(*) AS nb, COALESCE(SUM(montant), 0) AS total
        FROM transactions_caisse
        WHERE $baseWhere
        GROUP BY type_transaction
        ORDER BY total DESC
    ");
    $byType = $stmtType->fetchAll(PDO::FETCH_ASSOC);

    // ─── 30-day trend ────────────────────────────────────────────────────────
    $stmtTrend = $db->query("
        SELECT
            DATE(created_at) AS date,
            COUNT(*)         AS nb,
            COALESCE(SUM(montant), 0) AS total
        FROM transactions_caisse
        WHERE statut = 'encaisse'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $trend = $stmtTrend->fetchAll(PDO::FETCH_ASSOC);

    // Fill missing days with 0
    $trendByDate = [];
    foreach ($trend as $row) {
        $trendByDate[$row['date']] = ['nb' => (int)$row['nb'], 'total' => (float)$row['total']];
    }
    $trendFull = [];
    for ($i = 29; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i days"));
        $trendFull[] = [
            'date'  => $d,
            'nb'    => $trendByDate[$d]['nb'] ?? 0,
            'total' => $trendByDate[$d]['total'] ?? 0,
        ];
    }

    Response::success([
        'period'      => $period,
        'kpis'        => [
            'total'          => (float) $kpis['total'],
            'nb_transactions'=> (int)   $kpis['nb_transactions'],
            'moyenne'        => (float) $kpis['moyenne'],
            'prev_total'     => (float) $prev['total'],
            'prev_nb'        => (int)   $prev['nb'],
            'evolution_pct'  => $totalDiff,
        ],
        'by_mode' => array_map(fn($r) => [
            'mode'  => $r['mode_paiement'],
            'nb'    => (int)   $r['nb'],
            'total' => (float) $r['total'],
        ], $byMode),
        'by_type' => array_map(fn($r) => [
            'type'  => $r['type_transaction'],
            'nb'    => (int)   $r['nb'],
            'total' => (float) $r['total'],
        ], $byType),
        'trend' => $trendFull,
    ], 'Statistiques caisse');

} catch (Exception $e) {
    Logger::error('caisse/stats.php error', ['error' => $e->getMessage()]);
    Response::error('Erreur statistiques caisse', 500);
}
