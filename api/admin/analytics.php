<?php
/**
 * Analytics agrégées — BLOC 6
 * GET /api/admin/analytics.php?period=month
 * period: day | week | month | year
 *
 * Retourne toutes les métriques du rapport en un seul appel SQL.
 */

require_once __DIR__ . '/../bootstrap.php';
Auth::requireAdmin();

$period = $_GET['period'] ?? 'month';
if (!in_array($period, ['day', 'week', 'month', 'year'])) {
    $period = 'month';
}

// ─── Plages de dates ──────────────────────────────────────────────────────────
function getPeriodBounds(string $period): array {
    $now = new DateTime();
    switch ($period) {
        case 'day':
            $start = (clone $now)->setTime(0, 0, 0);
            $end   = (clone $now)->setTime(23, 59, 59);
            $prevStart = (clone $start)->modify('-1 day');
            $prevEnd   = (clone $end)->modify('-1 day');
            break;
        case 'week':
            $start = (clone $now)->modify('monday this week')->setTime(0, 0, 0);
            $end   = (clone $now)->modify('sunday this week')->setTime(23, 59, 59);
            $prevStart = (clone $start)->modify('-7 days');
            $prevEnd   = (clone $end)->modify('-7 days');
            break;
        case 'year':
            $start = (new DateTime('first day of january ' . $now->format('Y')))->setTime(0, 0, 0);
            $end   = (new DateTime('last day of december ' . $now->format('Y')))->setTime(23, 59, 59);
            $prevStart = (clone $start)->modify('-1 year');
            $prevEnd   = (clone $end)->modify('-1 year');
            break;
        default: // month
            $start = (new DateTime('first day of this month'))->setTime(0, 0, 0);
            $end   = (new DateTime('last day of this month'))->setTime(23, 59, 59);
            $prevStart = (clone $start)->modify('-1 month');
            $prevEnd   = (clone $end)->modify('-1 month');
    }
    return [
        'start'     => $start->format('Y-m-d H:i:s'),
        'end'       => $end->format('Y-m-d H:i:s'),
        'prevStart' => $prevStart->format('Y-m-d H:i:s'),
        'prevEnd'   => $prevEnd->format('Y-m-d H:i:s'),
    ];
}

$bounds = getPeriodBounds($period);
$s  = $bounds['start'];
$e  = $bounds['end'];
$ps = $bounds['prevStart'];
$pe = $bounds['prevEnd'];

// ─── Helper KPI réservations ──────────────────────────────────────────────────
function fetchReservationKpis(PDO $db, string $start, string $end): array {
    $stmt = $db->prepare("
        SELECT
            COUNT(*) AS nb_total,
            SUM(CASE WHEN statut != 'annulee' THEN 1 ELSE 0 END) AS nb_valides,
            SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) AS nb_annulations,
            SUM(CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 0 THEN montant_total ELSE 0 END) AS revenue,
            SUM(CASE WHEN statut = 'annulee' THEN montant_total ELSE 0 END) AS revenue_lost,
            SUM(CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 1 THEN 1 ELSE 0 END) AS nb_abonnement_couvert,
            SUM(
                CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 0
                THEN TIMESTAMPDIFF(MINUTE, date_debut, date_fin) / 60.0
                ELSE 0 END
            ) AS heures_reservees
        FROM reservations
        WHERE created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$start, $end]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
}

function fetchReservationStatusBreakdown(PDO $db, string $start, string $end): array {
    $stmt = $db->prepare("
        SELECT statut, COUNT(*) AS cnt
        FROM reservations
        WHERE created_at BETWEEN ? AND ?
        GROUP BY statut
    ");
    $stmt->execute([$start, $end]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result = ['confirmee' => 0, 'en_attente' => 0, 'en_cours' => 0, 'terminee' => 0, 'annulee' => 0];
    foreach ($rows as $row) {
        if (isset($result[$row['statut']])) {
            $result[$row['statut']] = (int) $row['cnt'];
        }
    }
    return $result;
}

try {
    // ─── 1. KPIs réservations période courante ────────────────────────────────
    $kpi  = fetchReservationKpis($db, $s, $e);
    $pkpi = fetchReservationKpis($db, $ps, $pe);

    $nbValides     = (int)   ($kpi['nb_valides'] ?? 0);
    $nbAnnulations = (int)   ($kpi['nb_annulations'] ?? 0);
    $nbTotal       = (int)   ($kpi['nb_total'] ?? 0);
    $revenueRes    = (float) ($kpi['revenue'] ?? 0);
    $hoursBooked   = round((float) ($kpi['heures_reservees'] ?? 0), 1);
    $avgTicket     = $nbValides > 0 ? round($revenueRes / $nbValides, 0) : 0;
    $confirmRate   = $nbTotal > 0 ? round(($nbValides / $nbTotal) * 100, 1) : 0;
    $cancelRate    = $nbTotal > 0 ? round(($nbAnnulations / $nbTotal) * 100, 1) : 0;

    $prevNbValides  = (int)   ($pkpi['nb_valides'] ?? 0);
    $prevRevenueRes = (float) ($pkpi['revenue'] ?? 0);

    // ─── 2. Revenus abonnements période ──────────────────────────────────────
    $stmtAboRev = $db->prepare("
        SELECT COALESCE(SUM(montant), 0) AS revenue
        FROM transactions_caisse
        WHERE type_transaction = 'abonnement'
          AND statut = 'encaisse'
          AND created_at BETWEEN ? AND ?
    ");
    $stmtAboRev->execute([$s, $e]);
    $revenueAbo = (float) ($stmtAboRev->fetchColumn() ?? 0);

    $stmtAboRevPrev = $db->prepare("
        SELECT COALESCE(SUM(montant), 0) AS revenue
        FROM transactions_caisse
        WHERE type_transaction = 'abonnement'
          AND statut = 'encaisse'
          AND created_at BETWEEN ? AND ?
    ");
    $stmtAboRevPrev->execute([$ps, $pe]);
    $prevRevenueAbo = (float) ($stmtAboRevPrev->fetchColumn() ?? 0);

    // ─── 3. Revenus domiciliations période ───────────────────────────────────
    $stmtDomRev = $db->prepare("
        SELECT COALESCE(SUM(montant), 0) AS revenue
        FROM transactions_caisse
        WHERE type_transaction = 'domiciliation'
          AND statut = 'encaisse'
          AND created_at BETWEEN ? AND ?
    ");
    $stmtDomRev->execute([$s, $e]);
    $revenueDom = (float) ($stmtDomRev->fetchColumn() ?? 0);

    $stmtDomRevPrev = $db->prepare("
        SELECT COALESCE(SUM(montant), 0) AS revenue
        FROM transactions_caisse
        WHERE type_transaction = 'domiciliation'
          AND statut = 'encaisse'
          AND created_at BETWEEN ? AND ?
    ");
    $stmtDomRevPrev->execute([$ps, $pe]);
    $prevRevenueDom = (float) ($stmtDomRevPrev->fetchColumn() ?? 0);

    // ─── Revenus caisse — types non comptabilisés par ailleurs
    // (impression, boisson, autre, remboursement)
    $stmtCaisseRev = $db->prepare("
        SELECT COALESCE(SUM(montant), 0) AS revenue
        FROM transactions_caisse
        WHERE statut = 'encaisse'
          AND type_transaction NOT IN ('reservation', 'abonnement', 'domiciliation')
          AND created_at BETWEEN ? AND ?
    ");
    $stmtCaisseRev->execute([$s, $e]);
    $revenueCaisse = (float) ($stmtCaisseRev->fetchColumn() ?? 0);

    $revenueTotal     = $revenueRes + $revenueAbo + $revenueDom + $revenueCaisse;
    $prevRevenueTotal = $prevRevenueRes + $prevRevenueAbo + $prevRevenueDom;

    // ─── 4. Nouveaux utilisateurs ─────────────────────────────────────────────
    $stmtUsers = $db->prepare("
        SELECT COUNT(*) FROM persons WHERE role IS NOT NULL AND created_at BETWEEN ? AND ?
    ");
    $stmtUsers->execute([$s, $e]);
    $nbNewUsers = (int) $stmtUsers->fetchColumn();

    $stmtUsersPrev = $db->prepare("
        SELECT COUNT(*) FROM persons WHERE role IS NOT NULL AND created_at BETWEEN ? AND ?
    ");
    $stmtUsersPrev->execute([$ps, $pe]);
    $prevNbNewUsers = (int) $stmtUsersPrev->fetchColumn();

    // ─── 5. Taux d'occupation ─────────────────────────────────────────────────
    $stmtEspaces = $db->query("SELECT COUNT(*) FROM espaces WHERE disponible = 1");
    $nbEspaces = (int) $stmtEspaces->fetchColumn();

    // Heures ouverture par jour : 10h (8h-18h), calcul sur la période
    $start_dt = new DateTime($s);
    $end_dt   = new DateTime($e);
    $nbJours  = max(1, (int) $start_dt->diff($end_dt)->days + 1);
    $heuresCapacite = $nbEspaces * $nbJours * 10; // 10h/jour
    $occupancyRate = $heuresCapacite > 0 ? min(100, round(($hoursBooked / $heuresCapacite) * 100, 1)) : 0;

    // RevPAR et rev/heure
    $revpar       = $heuresCapacite > 0 ? round($revenueTotal / $heuresCapacite, 0) : 0;
    $revenuePerHour = $hoursBooked > 0 ? round($revenueRes / $hoursBooked, 0) : 0;

    // ─── 6. Tendance revenus (courbe) ─────────────────────────────────────────
    // Choisir le regroupement selon la période
    $trendRows = [];
    if ($period === 'day') {
        // Par heure
        $stmtTrend = $db->prepare("
            SELECT DATE_FORMAT(created_at, '%H:00') AS label,
                   SUM(CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 0 THEN montant_total ELSE 0 END) AS revenue,
                   COUNT(CASE WHEN statut != 'annulee' THEN 1 END) AS nb
            FROM reservations
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(created_at, '%H')
            ORDER BY DATE_FORMAT(created_at, '%H')
        ");
    } elseif ($period === 'week') {
        // Par jour de la semaine
        $stmtTrend = $db->prepare("
            SELECT DATE_FORMAT(created_at, '%a %d') AS label,
                   SUM(CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 0 THEN montant_total ELSE 0 END) AS revenue,
                   COUNT(CASE WHEN statut != 'annulee' THEN 1 END) AS nb
            FROM reservations
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        ");
    } elseif ($period === 'year') {
        // Par mois
        $stmtTrend = $db->prepare("
            SELECT DATE_FORMAT(created_at, '%b %Y') AS label,
                   SUM(CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 0 THEN montant_total ELSE 0 END) AS revenue,
                   COUNT(CASE WHEN statut != 'annulee' THEN 1 END) AS nb
            FROM reservations
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY DATE_FORMAT(created_at, '%Y-%m')
        ");
    } else {
        // Par jour du mois
        $stmtTrend = $db->prepare("
            SELECT DATE_FORMAT(created_at, '%d/%m') AS label,
                   SUM(CASE WHEN statut IN ('confirmee','en_cours','terminee') AND abonnement_couvert = 0 THEN montant_total ELSE 0 END) AS revenue,
                   COUNT(CASE WHEN statut != 'annulee' THEN 1 END) AS nb
            FROM reservations
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        ");
    }
    $stmtTrend->execute([$s, $e]);
    $trendRows = $stmtTrend->fetchAll(PDO::FETCH_ASSOC);
    $revenueTrend = array_map(fn($r) => [
        'label'   => $r['label'],
        'revenue' => (float) $r['revenue'],
        'count'   => (int)   $r['nb'],
    ], $trendRows);

    // ─── 7. Performance par espace ────────────────────────────────────────────
    $stmtSpace = $db->prepare("
        SELECT e.nom AS name,
               COUNT(r.id) AS reservations,
               COALESCE(SUM(CASE WHEN r.statut IN ('confirmee','en_cours','terminee') AND r.abonnement_couvert = 0 THEN r.montant_total ELSE 0 END), 0) AS revenue
        FROM espaces e
        LEFT JOIN reservations r ON r.espace_id = e.id
            AND r.created_at BETWEEN ? AND ?
        WHERE e.disponible = 1
        GROUP BY e.id, e.nom
        ORDER BY revenue DESC
    ");
    $stmtSpace->execute([$s, $e]);
    $spaceRows = $stmtSpace->fetchAll(PDO::FETCH_ASSOC);
    $totalSpaceRevenue = array_sum(array_column($spaceRows, 'revenue'));
    $spacePerformance = array_map(fn($r) => [
        'name'         => $r['name'],
        'reservations' => (int)   $r['reservations'],
        'revenue'      => (float) $r['revenue'],
        'percentage'   => $totalSpaceRevenue > 0 ? round(($r['revenue'] / $totalSpaceRevenue) * 100) : 0,
    ], $spaceRows);

    // ─── 8. Statut des réservations ───────────────────────────────────────────
    $statusBreakdown = fetchReservationStatusBreakdown($db, $s, $e);

    // ─── 9. Top 10 clients ────────────────────────────────────────────────────
    $stmtTop = $db->prepare("
        SELECT
            p.id, p.prenom, p.nom, p.email,
            COUNT(r.id) AS reservation_count,
            COALESCE(SUM(CASE WHEN r.statut IN ('confirmee','en_cours','terminee') AND r.abonnement_couvert = 0 THEN r.montant_total ELSE 0 END), 0) AS total_spent
        FROM reservations r
        LEFT JOIN persons p ON r.person_id = p.id
        WHERE r.created_at BETWEEN ? AND ?
          AND r.statut != 'annulee'
          AND r.person_id IS NOT NULL
        GROUP BY p.id, p.prenom, p.nom, p.email
        ORDER BY total_spent DESC
        LIMIT 10
    ");
    $stmtTop->execute([$s, $e]);
    $topClients = array_map(fn($r) => [
        'id'               => $r['id'],
        'prenom'           => $r['prenom'],
        'nom'              => $r['nom'],
        'email'            => $r['email'],
        'reservationCount' => (int)   $r['reservation_count'],
        'totalSpent'       => (float) $r['total_spent'],
    ], $stmtTop->fetchAll(PDO::FETCH_ASSOC));

    // ─── 10. Modes de paiement (transactions_caisse) ─────────────────────────
    $stmtPay = $db->prepare("
        SELECT mode_paiement,
               COUNT(*) AS cnt,
               SUM(montant) AS amount
        FROM transactions_caisse
        WHERE statut = 'encaisse'
          AND created_at BETWEEN ? AND ?
        GROUP BY mode_paiement
        ORDER BY amount DESC
    ");
    $stmtPay->execute([$s, $e]);
    $payRows = $stmtPay->fetchAll(PDO::FETCH_ASSOC);
    $LABELS = ['cash' => 'Espèces', 'tpe' => 'TPE / CB', 'virement' => 'Virement', 'cheque' => 'Chèque'];
    $paymentMethods = array_map(fn($r) => [
        'name'   => $LABELS[$r['mode_paiement']] ?? ucfirst($r['mode_paiement']),
        'count'  => (int)   $r['cnt'],
        'amount' => (float) $r['amount'],
    ], $payRows);

    // ─── 11. Abonnements & domiciliations actifs ──────────────────────────────
    $stmtAboActif = $db->query("SELECT COUNT(*) FROM abonnements_utilisateurs WHERE statut = 'actif'");
    $aboActifCount = (int) $stmtAboActif->fetchColumn();

    $stmtDomActif = $db->query("SELECT COUNT(*) FROM domiciliations WHERE statut = 'active'");
    $domActifCount = (int) $stmtDomActif->fetchColumn();

    // ─── Calcul variations ────────────────────────────────────────────────────
    $pct = fn($cur, $prev) => $prev > 0 ? round((($cur - $prev) / $prev) * 100) : ($cur > 0 ? 100 : 0);

    Response::success([
        'period' => $period,
        'range'  => ['start' => $s, 'end' => $e],

        'kpi' => [
            'revenue_total'           => $revenueTotal,
            'revenue_reservations'    => $revenueRes,
            'revenue_abonnements'     => $revenueAbo,
            'revenue_domiciliations'  => $revenueDom,
            'revenue_caisse'          => $revenueCaisse,
            'nb_reservations'         => $nbValides,
            'nb_annulations'          => $nbAnnulations,
            'nb_new_users'            => $nbNewUsers,
            'occupancy_rate'          => $occupancyRate,
            'avg_ticket'              => (float) $avgTicket,
            'confirmation_rate'       => $confirmRate,
            'cancellation_rate'       => $cancelRate,
            'hours_booked'            => $hoursBooked,
            'revenue_lost'            => (float) ($kpi['revenue_lost'] ?? 0),
            'revpar'                  => (float) $revpar,
            'revenue_per_hour'        => (float) $revenuePerHour,
            'abo_actif_count'         => $aboActifCount,
            'dom_actif_count'         => $domActifCount,
        ],

        'variations' => [
            'revenue_total'    => $pct($revenueTotal, $prevRevenueTotal),
            'nb_reservations'  => $pct($nbValides, $prevNbValides),
            'nb_new_users'     => $pct($nbNewUsers, $prevNbNewUsers),
        ],

        'revenue_trend'    => $revenueTrend,
        'space_performance'=> $spacePerformance,
        'status_breakdown' => $statusBreakdown,
        'top_clients'      => $topClients,
        'payment_methods'  => $paymentMethods,
    ]);

} catch (Exception $e) {
    Logger::error('analytics error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    Response::error('Erreur analytics: ' . $e->getMessage(), 500);
}
