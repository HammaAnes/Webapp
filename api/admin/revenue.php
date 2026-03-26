<?php

/**
 * API: Revenu par période
 * GET /api/admin/revenue.php?period=day|week|month|year
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::requireAdmin();

    $period = $_GET['period'] ?? 'month';

    // Déterminer la clause WHERE selon la période
    // $whereClause    = sans alias (requêtes sur reservations seul)
    // $whereClauseR   = avec alias r. (requêtes JOIN avec espaces)
    // $whereClauseAbo = avec alias au. (requêtes JOIN abonnements_utilisateurs)
    switch ($period) {
        case 'day':
            $whereClause    = "DATE(created_at) = CURDATE()";
            $whereClauseR   = "DATE(r.created_at) = CURDATE()";
            $whereClauseAbo = "DATE(au.created_at) = CURDATE()";
            break;
        case 'week':
            $whereClause    = "YEARWEEK(created_at) = YEARWEEK(NOW())";
            $whereClauseR   = "YEARWEEK(r.created_at) = YEARWEEK(NOW())";
            $whereClauseAbo = "YEARWEEK(au.created_at) = YEARWEEK(NOW())";
            break;
        case 'year':
            $whereClause    = "YEAR(created_at) = YEAR(NOW())";
            $whereClauseR   = "YEAR(r.created_at) = YEAR(NOW())";
            $whereClauseAbo = "YEAR(au.created_at) = YEAR(NOW())";
            break;
        case 'month':
        default:
            $whereClause    = "MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
            $whereClauseR   = "MONTH(r.created_at) = MONTH(NOW()) AND YEAR(r.created_at) = YEAR(NOW())";
            $whereClauseAbo = "MONTH(au.created_at) = MONTH(NOW()) AND YEAR(au.created_at) = YEAR(NOW())";
            break;
    }

    // Revenu total des réservations (montant après réduction)
    $query = "SELECT COALESCE(SUM(montant_total), 0) as total
              FROM reservations
              WHERE $whereClause
              AND statut IN ('confirmee', 'terminee')
              AND (abonnement_couvert IS NULL OR abonnement_couvert = 0)";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $totalRevenue = $stmt->fetch()['total'];

    // Revenu par type de réservation
    $query = "SELECT type_reservation, COALESCE(SUM(montant_total), 0) as revenue
              FROM reservations
              WHERE $whereClause
              AND statut IN ('confirmee', 'terminee')
              GROUP BY type_reservation";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $revenueByType = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Revenu par espace
    $query = "SELECT e.nom, COALESCE(SUM(r.montant_total), 0) as revenue
              FROM reservations r
              JOIN espaces e ON r.espace_id = e.id
              WHERE $whereClauseR
              AND r.statut IN ('confirmee', 'terminee')
              GROUP BY e.id, e.nom
              ORDER BY revenue DESC
              LIMIT 10";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $revenueBySpace = $stmt->fetchAll();

    // Revenu des abonnements (depuis transactions ou calculé depuis abonnements_utilisateurs)
    $query = "SELECT COALESCE(SUM(a.prix), 0) as total
              FROM abonnements_utilisateurs au
              JOIN abonnements a ON au.abonnement_id = a.id
              WHERE $whereClauseAbo
              AND au.statut = 'actif'";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $subscriptionRevenue = $stmt->fetch()['total'];

    Response::success([
        'period' => $period,
        'total' => (float)$totalRevenue,
        'subscriptions' => (float)$subscriptionRevenue,
        'byType' => $revenueByType,
        'bySpace' => $revenueBySpace,
        'grandTotal' => (float)($totalRevenue + $subscriptionRevenue)
    ]);

} catch (Exception $e) {
    error_log("Get revenue error: " . $e->getMessage());
    Response::error('Erreur revenue: ' . $e->getMessage(), 500);
}
