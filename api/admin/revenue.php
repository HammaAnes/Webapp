<?php

/**
 * API: Revenu par période
 * GET /api/admin/revenue.php?period=day|week|month|year
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $period = $_GET['period'] ?? 'month';

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Déterminer la clause WHERE selon la période
    switch ($period) {
        case 'day':
            $whereClause = "DATE(created_at) = CURDATE()";
            break;
        case 'week':
            $whereClause = "YEARWEEK(created_at) = YEARWEEK(NOW())";
            break;
        case 'year':
            $whereClause = "YEAR(created_at) = YEAR(NOW())";
            break;
        case 'month':
        default:
            $whereClause = "MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
            break;
    }

    // Revenu total des réservations (montant après réduction)
    $query = "SELECT COALESCE(SUM(montant_total - COALESCE(reduction, 0)), 0) as total
              FROM reservations
              WHERE $whereClause
              AND statut IN ('confirmee', 'terminee')";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $totalRevenue = $stmt->fetch()['total'];

    // Revenu par type de réservation
    $query = "SELECT type_reservation, COALESCE(SUM(montant_total - COALESCE(reduction, 0)), 0) as revenue
              FROM reservations
              WHERE $whereClause
              AND statut IN ('confirmee', 'terminee')
              GROUP BY type_reservation";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $revenueByType = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Revenu par espace
    $query = "SELECT e.nom, COALESCE(SUM(r.montant_total - COALESCE(r.reduction, 0)), 0) as revenue
              FROM reservations r
              JOIN espaces e ON r.espace_id = e.id
              WHERE $whereClause
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
              WHERE $whereClause
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
    Response::serverError();
}
