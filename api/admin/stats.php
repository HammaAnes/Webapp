<?php

/**
 * API: Statistiques administrateur
 * GET /api/admin/stats.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();

    $db = Database::getInstance()->getConnection();

    // Requête optimisée unique pour toutes les statistiques
    $query = "
        SELECT
            -- Utilisateurs
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM users WHERE statut = 'actif') as active_users,
            (SELECT COUNT(*) FROM users WHERE statut = 'actif' AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)) as last_month_active_users,

            -- Réservations
            (SELECT COUNT(*) FROM reservations WHERE DATE(created_at) = CURDATE()) as today_reservations,
            (SELECT COUNT(*) FROM reservations WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as yesterday_reservations,
            (SELECT COUNT(*) FROM reservations WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as month_reservations,

            -- Revenus
            (SELECT COALESCE(SUM(montant_total - COALESCE(reduction, 0)), 0)
             FROM reservations
             WHERE MONTH(created_at) = MONTH(NOW())
             AND YEAR(created_at) = YEAR(NOW())
             AND statut IN ('confirmee', 'terminee')) as month_revenue,

            (SELECT COALESCE(SUM(montant_total - COALESCE(reduction, 0)), 0)
             FROM reservations
             WHERE MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
             AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
             AND statut IN ('confirmee', 'terminee')) as last_month_revenue,

            -- Abonnements
            (SELECT COUNT(*) FROM abonnements_utilisateurs WHERE statut = 'actif' AND date_fin > NOW()) as active_subscriptions,

            -- Domiciliations
            (SELECT COUNT(*) FROM domiciliations WHERE statut = 'en_attente') as pending_domiciliations,

            -- Espaces et occupation
            (SELECT COUNT(*) FROM espaces) as total_spaces,
            (SELECT COUNT(DISTINCT espace_id) FROM reservations
             WHERE DATE(date_debut) <= CURDATE()
             AND DATE(date_fin) >= CURDATE()
             AND statut IN ('confirmee', 'en_cours')) as occupied_spaces,

            (SELECT COUNT(DISTINCT espace_id) FROM reservations
             WHERE DATE(date_debut) <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH))
             AND DATE(date_fin) >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
             AND statut IN ('confirmee', 'en_cours', 'terminee')) as last_month_occupied_spaces
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Calculs dérivés
    $usersGrowth = $stats['last_month_active_users'] > 0
        ? round((($stats['active_users'] - $stats['last_month_active_users']) / $stats['last_month_active_users']) * 100, 1)
        : 0;

    $revenueGrowth = $stats['last_month_revenue'] > 0
        ? round((($stats['month_revenue'] - $stats['last_month_revenue']) / $stats['last_month_revenue']) * 100, 1)
        : 0;

    $reservationsGrowth = (int)($stats['today_reservations'] - $stats['yesterday_reservations']);

    $occupancyRate = $stats['total_spaces'] > 0
        ? round(($stats['occupied_spaces'] / $stats['total_spaces']) * 100, 2)
        : 0;

    $lastMonthOccupancyRate = $stats['total_spaces'] > 0
        ? round(($stats['last_month_occupied_spaces'] / $stats['total_spaces']) * 100, 2)
        : 0;

    $occupancyGrowth = $lastMonthOccupancyRate > 0
        ? round($occupancyRate - $lastMonthOccupancyRate, 1)
        : 0;

    Response::success([
        'users' => [
            'total' => (int)$stats['total_users'],
            'active' => (int)$stats['active_users'],
            'growth' => $usersGrowth
        ],
        'reservations' => [
            'today' => (int)$stats['today_reservations'],
            'month' => (int)$stats['month_reservations'],
            'growth' => $reservationsGrowth
        ],
        'revenue' => [
            'month' => (float)$stats['month_revenue'],
            'growth' => $revenueGrowth
        ],
        'subscriptions' => [
            'active' => (int)$stats['active_subscriptions']
        ],
        'domiciliations' => [
            'pending' => (int)$stats['pending_domiciliations']
        ],
        'occupancy' => [
            'rate' => $occupancyRate,
            'occupied' => (int)$stats['occupied_spaces'],
            'total' => (int)$stats['total_spaces'],
            'growth' => $occupancyGrowth
        ]
    ]);

} catch (Exception $e) {
    error_log("Get admin stats error: " . $e->getMessage());
    Response::serverError();
}
