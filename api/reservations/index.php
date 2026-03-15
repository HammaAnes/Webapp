<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $isAdmin = $auth['role'] === 'admin';

    $db = Database::getInstance()->getConnection();

    $espaceId = $_GET['espace_id'] ?? null;
    $dateDebut = $_GET['date_debut'] ?? null;
    $dateFin = $_GET['date_fin'] ?? null;
    $includeBlocages = isset($_GET['include_blocages']) && $_GET['include_blocages'] === 'true';

    $params = [];

    if ($isAdmin) {
        $query = "
            SELECT r.*,
                   e.nom as espace_nom,
                   e.type as espace_type,
                   e.prix_heure,
                   e.prix_jour,
                   u.nom as user_nom,
                   u.prenom as user_prenom,
                   u.email as user_email,
                   c.nom as contact_nom,
                   c.prenom as contact_prenom,
                   c.email as contact_email,
                   c.telephone as contact_telephone
            FROM reservations r
            JOIN espaces e ON r.espace_id = e.id
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN contacts c ON r.contact_id = c.id
            WHERE 1=1
        ";
    } elseif ($espaceId) {
        $query = "
            SELECT r.id,
                   r.espace_id,
                   r.date_debut,
                   r.date_fin,
                   r.statut,
                   r.participants,
                   r.type_reservation,
                   CASE WHEN r.user_id = ? THEN r.montant_total ELSE NULL END as montant_total,
                   CASE WHEN r.user_id = ? THEN r.notes ELSE NULL END as notes,
                   e.nom as espace_nom,
                   e.type as espace_type,
                   e.prix_heure,
                   e.prix_jour
            FROM reservations r
            JOIN espaces e ON r.espace_id = e.id
            WHERE 1=1
        ";
        $params[] = $userId;
        $params[] = $userId;
    } else {
        $query = "
            SELECT r.*,
                   e.nom as espace_nom,
                   e.type as espace_type,
                   e.prix_heure,
                   e.prix_jour
            FROM reservations r
            JOIN espaces e ON r.espace_id = e.id
            WHERE r.user_id = ?
        ";
        $params[] = $userId;
    }

    if ($espaceId) {
        $query .= " AND r.espace_id = ?";
        $params[] = $espaceId;
    }

    if ($dateDebut) {
        $query .= " AND r.date_fin >= ?";
        $params[] = $dateDebut . ' 00:00:00';
    }

    if ($dateFin) {
        $query .= " AND r.date_debut <= ?";
        $params[] = $dateFin . ' 23:59:59';
    }

    $query .= " ORDER BY r.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($includeBlocages && $espaceId) {
        $blocageParams = [$espaceId];
        $blocageQuery = "
            SELECT id, espace_id, date_debut, date_fin, type, motif, statut
            FROM blocages_espaces
            WHERE espace_id = ?
            AND statut NOT IN ('annule', 'termine')
        ";
        if ($dateDebut) {
            $blocageQuery .= " AND date_fin >= ?";
            $blocageParams[] = $dateDebut . ' 00:00:00';
        }
        if ($dateFin) {
            $blocageQuery .= " AND date_debut <= ?";
            $blocageParams[] = $dateFin . ' 23:59:59';
        }
        $stmtBlocages = $db->prepare($blocageQuery);
        $stmtBlocages->execute($blocageParams);
        $blocages = $stmtBlocages->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['reservations' => $reservations, 'blocages' => $blocages]);
    } else {
        Response::success($reservations);
    }

} catch (Exception $e) {
    error_log("Erreur reservations index: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
