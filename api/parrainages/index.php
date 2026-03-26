<?php

/**
 * API: Liste des parrainages
 * GET /api/parrainages/index.php?person_id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Pagination.php';

try {
    $auth = Auth::verifyAuth();
    $userId = $_GET['person_id'] ?? $_GET['user_id'] ?? null;

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Paramètres de pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
    $offset = ($page - 1) * $limit;

    // Filtres
    $statut = isset($_GET['statut']) ? $_GET['statut'] : null;

    // Admin peut voir tous les parrainages
    if ($auth['role'] === 'admin' && !$userId) {
        $whereConditions = [];
        $params = [];

        if ($statut) {
            $whereConditions[] = "pd.statut = :statut";
            $params[':statut'] = $statut;
        }

        $whereClause = !empty($whereConditions) ? " WHERE " . implode(" AND ", $whereConditions) : "";

        $countQuery = "SELECT COUNT(*) as total FROM parrainages_details pd" . $whereClause;
        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch()['total'];

        $query = "SELECT pd.*,
                         uf.nom AS nom, uf.prenom AS prenom, uf.email AS email,
                         up.nom AS parrain_nom, up.prenom AS parrain_prenom, up.email AS parrain_email,
                         p.parrain_id AS parrain_id, p.code_parrain
                  FROM parrainages_details pd
                  LEFT JOIN persons uf ON pd.filleul_id = uf.id
                  LEFT JOIN parrainages p ON pd.parrainage_id = p.id
                  LEFT JOIN persons up ON p.parrain_id = up.id"
                  . $whereClause
                  . " ORDER BY pd.date_inscription DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    } else {
        // User voit uniquement ses parrainages
        $targetUserId = $userId ?: $auth['id'];

        // Vérifier l'autorisation
        if ($auth['role'] !== 'admin' && $targetUserId !== $auth['id']) {
            Response::error("Accès non autorisé", 403);
        }

        // Comptage basé sur parrainages_details
        $countQuery = "SELECT COUNT(*) as total
                       FROM parrainages_details pd
                       WHERE pd.parrainage_id = (
                         SELECT id FROM parrainages WHERE parrain_id = :parrain_id LIMIT 1
                       )";
        $params = [':parrain_id' => $targetUserId];

        if ($statut) {
            $countQuery .= " AND pd.statut = :statut";
            $params[':statut'] = $statut;
        }

        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch()['total'] ?? 0;

        // Données avec détails des filleuls
        $query = "SELECT pd.*, u.nom, u.prenom, u.email, u.created_at as date_inscription_filleul
                  FROM parrainages_details pd
                  LEFT JOIN persons u ON pd.filleul_id = u.id
                  WHERE pd.parrainage_id = (
                    SELECT id FROM parrainages WHERE parrain_id = :parrain_id LIMIT 1
                  )";

        if ($statut) {
            $query .= " AND pd.statut = :statut";
        }

        $query .= " ORDER BY pd.date_inscription DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    }

    $stmt->execute();
    $parrainages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convertir en camelCase pour le frontend
    $parrainagesFormatted = [];
    foreach ($parrainages as $p) {
        $parrainagesFormatted[] = [
            'id' => $p['id'],
            'parrainageId' => $p['parrainage_id'] ?? null,
            'parrainId' => $p['parrain_id'] ?? null,
            'parrainNom' => isset($p['parrain_prenom']) && isset($p['parrain_nom'])
                ? $p['parrain_prenom'] . ' ' . $p['parrain_nom']
                : null,
            'parrainEmail' => $p['parrain_email'] ?? null,
            'filleulId' => $p['filleul_id'] ?? null,
            'filleulNom' => isset($p['nom']) && isset($p['prenom']) ? $p['prenom'] . ' ' . $p['nom'] : null,
            'filleulEmail' => $p['email'] ?? null,
            'recompenseParrain' => (float)($p['recompense_parrain'] ?? 0),
            'recompenseFilleul' => (float)($p['recompense_filleul'] ?? 0),
            'statut' => $p['statut'] ?? 'en_attente',
            'dateInscription' => $p['date_inscription'] ?? $p['date_inscription_filleul'] ?? null,
            'dateValidation' => $p['date_validation'] ?? null
        ];
    }
    $parrainages = $parrainagesFormatted;

    // Réponse avec pagination
    $pagination = Pagination::paginate($totalCount, $page, $limit);

    Response::success([
        'data' => $parrainages,
        'pagination' => $pagination
    ]);

} catch (Exception $e) {
    error_log("Parrainages error: " . $e->getMessage());
    Response::serverError("Erreur lors de la récupération des parrainages");
}
