<?php

/**
 * API: Liste des parrainages
 * GET /api/parrainages/index.php?user_id=xxx
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Pagination.php';

try {
    $auth = Auth::verifyAuth();
    $userId = $_GET['user_id'] ?? null;

    $database = Database::getInstance();
    $db = $database->getConnection();

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 50;
    $offset = ($page - 1) * $limit;

    $statut = isset($_GET['statut']) ? $_GET['statut'] : null;

    // Admin: voir tous les parrainages (depuis parrainages_details avec info parrain et filleul)
    if ($auth['role'] === 'admin' && !$userId) {
        $whereConditions = [];
        $params = [];

        if ($statut) {
            $whereConditions[] = "pd.statut = :statut";
            $params[':statut'] = $statut;
        }

        $where = !empty($whereConditions) ? " WHERE " . implode(" AND ", $whereConditions) : "";

        $countQuery = "SELECT COUNT(*) as total FROM parrainages_details pd" . $where;
        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch()['total'];

        $query = "SELECT pd.*,
                         filleul.nom as filleul_nom,
                         filleul.prenom as filleul_prenom,
                         filleul.email as filleul_email,
                         parrain.nom as parrain_nom,
                         parrain.prenom as parrain_prenom,
                         parrain.email as parrain_email,
                         p.parrain_id,
                         p.code_parrain
                  FROM parrainages_details pd
                  LEFT JOIN users filleul ON pd.filleul_id = filleul.id
                  LEFT JOIN parrainages p ON pd.parrainage_id = p.id
                  LEFT JOIN users parrain ON p.parrain_id = parrain.id"
                  . $where .
                  " ORDER BY pd.date_inscription DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = [];
        foreach ($rows as $r) {
            $formatted[] = [
                'id'                => $r['id'],
                'parrainageId'      => $r['parrainage_id'],
                'parrainId'         => $r['parrain_id'] ?? null,
                'parrainNom'        => isset($r['parrain_prenom']) ? trim($r['parrain_prenom'] . ' ' . $r['parrain_nom']) : null,
                'parrainEmail'      => $r['parrain_email'] ?? null,
                'codeParrain'       => $r['code_parrain'] ?? null,
                'filleulId'         => $r['filleul_id'],
                'filleulNom'        => isset($r['filleul_prenom']) ? trim($r['filleul_prenom'] . ' ' . $r['filleul_nom']) : null,
                'filleulEmail'      => $r['filleul_email'] ?? null,
                'recompenseParrain' => (float)($r['recompense_parrain'] ?? 0),
                'recompenseFilleul' => (float)($r['recompense_filleul'] ?? 0),
                'statut'            => $r['statut'] ?? 'en_attente',
                'dateInscription'   => $r['date_inscription'] ?? null,
                'dateValidation'    => $r['date_validation'] ?? null,
            ];
        }

    } else {
        // User: voir ses propres filleuls
        $targetUserId = $userId ?: $auth['id'];

        if ($auth['role'] !== 'admin' && $targetUserId !== $auth['id']) {
            Response::error("Accès non autorisé", 403);
        }

        $whereConditions = ["p.parrain_id = :parrain_id"];
        $params = [':parrain_id' => $targetUserId];

        if ($statut) {
            $whereConditions[] = "pd.statut = :statut";
            $params[':statut'] = $statut;
        }

        $where = " WHERE " . implode(" AND ", $whereConditions);

        $countQuery = "SELECT COUNT(*) as total
                       FROM parrainages_details pd
                       JOIN parrainages p ON pd.parrainage_id = p.id"
                       . $where;
        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch()['total'] ?? 0;

        $query = "SELECT pd.*,
                         filleul.nom as filleul_nom,
                         filleul.prenom as filleul_prenom,
                         filleul.email as filleul_email
                  FROM parrainages_details pd
                  JOIN parrainages p ON pd.parrainage_id = p.id
                  LEFT JOIN users filleul ON pd.filleul_id = filleul.id"
                  . $where .
                  " ORDER BY pd.date_inscription DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = [];
        foreach ($rows as $r) {
            $formatted[] = [
                'id'                => $r['id'],
                'parrainageId'      => $r['parrainage_id'],
                'filleulId'         => $r['filleul_id'],
                'filleulNom'        => isset($r['filleul_prenom']) ? trim($r['filleul_prenom'] . ' ' . $r['filleul_nom']) : null,
                'filleulEmail'      => $r['filleul_email'] ?? null,
                'recompenseParrain' => (float)($r['recompense_parrain'] ?? 0),
                'recompenseFilleul' => (float)($r['recompense_filleul'] ?? 0),
                'statut'            => $r['statut'] ?? 'en_attente',
                'dateInscription'   => $r['date_inscription'] ?? null,
                'dateValidation'    => $r['date_validation'] ?? null,
            ];
        }
    }

    $pagination = Pagination::paginate($totalCount, $page, $limit);

    Response::success([
        'data'       => $formatted,
        'pagination' => $pagination
    ]);

} catch (Exception $e) {
    error_log("Parrainages error: " . $e->getMessage());
    Response::serverError("Erreur lors de la récupération des parrainages");
}
