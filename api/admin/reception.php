<?php
/**
 * Dashboard Réception — Endpoint agrégé
 * Retourne en un seul appel toutes les données du tableau de bord accueil.
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    Auth::requireAdmin();

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Méthode non autorisée', 405);
    }

    $today     = date('Y-m-d');
    $todayStart = $today . ' 00:00:00';
    $todayEnd   = $today . ' 23:59:59';
    $now        = date('Y-m-d H:i:s');
    $in30days   = date('Y-m-d', strtotime('+30 days'));

    // ─── 1. Réservations du jour ─────────────────────────────────────────────
    $stmtRes = $db->prepare("
        SELECT
            r.id,
            r.date_debut,
            r.date_fin,
            r.statut,
            r.participants,
            r.notes,
            r.espace_id,
            p.prenom  AS user_prenom,
            p.nom     AS user_nom,
            p.email   AS user_email,
            e.nom     AS espace_nom,
            e.type    AS espace_type
        FROM reservations r
        LEFT JOIN persons p ON r.person_id = p.id
        LEFT JOIN espaces e ON r.espace_id = e.id
        WHERE r.date_debut >= ? AND r.date_debut <= ?
        ORDER BY r.date_debut ASC
    ");
    $stmtRes->execute([$todayStart, $todayEnd]);
    $reservationsJour = $stmtRes->fetchAll(PDO::FETCH_ASSOC);

    // ─── 2. Espaces ──────────────────────────────────────────────────────────
    $stmtEsp = $db->prepare("
        SELECT id, nom, type, capacite, disponible, description
        FROM espaces
        WHERE disponible = 1
        ORDER BY nom ASC
    ");
    $stmtEsp->execute();
    $espaces = $stmtEsp->fetchAll(PDO::FETCH_ASSOC);

    // ─── 3. Abonnements en attente ───────────────────────────────────────────
    $stmtAbo = $db->prepare("
        SELECT
            au.id,
            au.statut,
            au.created_at,
            p.prenom  AS user_prenom,
            p.nom     AS user_nom,
            p.email   AS user_email,
            a.nom     AS abonnement_nom,
            a.prix    AS abonnement_prix
        FROM abonnements_utilisateurs au
        LEFT JOIN persons     p ON au.person_id      = p.id
        LEFT JOIN abonnements a ON au.abonnement_id  = a.id
        WHERE au.statut = 'en_attente'
        ORDER BY au.created_at ASC
    ");
    $stmtAbo->execute();
    $abonnementsEnAttente = $stmtAbo->fetchAll(PDO::FETCH_ASSOC);

    // ─── 4. Domiciliations expirantes (30 prochains jours) ──────────────────
    $stmtDom = $db->prepare("
        SELECT
            d.id,
            d.raison_sociale,
            d.date_fin,
            d.statut,
            p.prenom AS user_prenom,
            p.nom    AS user_nom,
            p.email  AS user_email
        FROM domiciliations d
        LEFT JOIN persons p ON d.person_id = p.id
        WHERE d.statut = 'active'
          AND d.date_fin >= ?
          AND d.date_fin <= ?
        ORDER BY d.date_fin ASC
    ");
    $stmtDom->execute([$today, $in30days]);
    $domiciliationsExpirantes = $stmtDom->fetchAll(PDO::FETCH_ASSOC);

    // ─── 5. Courriers non traités ────────────────────────────────────────────
    $stmtCourrier = $db->prepare("
        SELECT
            c.id,
            c.type,
            c.expediteur,
            c.statut,
            c.date_reception,
            d.raison_sociale
        FROM courriers c
        LEFT JOIN domiciliations d ON c.domiciliation_id = d.id
        WHERE c.statut NOT IN ('recupere', 'reexpedier', 'traite', 'scanne')
        ORDER BY c.date_reception DESC
        LIMIT 50
    ");
    $stmtCourrier->execute();
    $courriersNonTraites = $stmtCourrier->fetchAll(PDO::FETCH_ASSOC);

    // ─── 6. Caisse du jour ───────────────────────────────────────────────────
    $stmtCaisseTotal = $db->prepare("
        SELECT
            SUM(montant)  AS total,
            COUNT(*)      AS nb_transactions
        FROM transactions_caisse
        WHERE DATE(created_at) = ? AND statut = 'encaisse'
    ");
    $stmtCaisseTotal->execute([$today]);
    $caisseRow = $stmtCaisseTotal->fetch(PDO::FETCH_ASSOC);

    $stmtCaisseDetail = $db->prepare("
        SELECT
            mode_paiement,
            SUM(montant) AS total,
            COUNT(*)     AS nombre
        FROM transactions_caisse
        WHERE DATE(created_at) = ? AND statut = 'encaisse'
        GROUP BY mode_paiement
    ");
    $stmtCaisseDetail->execute([$today]);
    $caisseParMode = $stmtCaisseDetail->fetchAll(PDO::FETCH_ASSOC);

    $caisseJour = [
        'total'           => (float) ($caisseRow['total'] ?? 0),
        'nb_transactions' => (int)   ($caisseRow['nb_transactions'] ?? 0),
        'total_general'   => (float) ($caisseRow['total'] ?? 0),
        'totaux'          => $caisseParMode,
    ];

    // ─── Réponse ─────────────────────────────────────────────────────────────
    Response::success([
        'reservations_jour'         => $reservationsJour,
        'espaces'                   => $espaces,
        'abonnements_en_attente'    => $abonnementsEnAttente,
        'domiciliations_expirantes' => $domiciliationsExpirantes,
        'courriers_non_traites'     => $courriersNonTraites,
        'caisse_jour'               => $caisseJour,
        'meta'                      => [
            'generated_at' => $now,
            'date'         => $today,
        ],
    ]);

} catch (Exception $e) {
    Response::error($e->getMessage());
}
