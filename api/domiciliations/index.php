<?php
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');
error_reporting(E_ALL);

/**
 * API: Liste des demandes de domiciliation
 * GET /api/domiciliations/index.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/Pagination.php';

try {
    $auth = Auth::verifyAuth();
    error_log("AUTH OK: " . json_encode($auth));

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Paramètres de pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
    $offset = ($page - 1) * $limit;

    // Filtres optionnels
    $statut = isset($_GET['statut']) ? $_GET['statut'] : null;

    // Admin voit tout, user voit seulement les siennes
    if ($auth['role'] === 'admin') {
        // Requête de comptage
        $countQuery = "SELECT COUNT(*) as total FROM domiciliations";
        $whereConditions = [];
        $params = [];

        if ($statut) {
            $whereConditions[] = "statut = :statut";
            $params[':statut'] = $statut;
        }

        if (!empty($whereConditions)) {
            $countQuery .= " WHERE " . implode(" AND ", $whereConditions);
        }

        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch()['total'];

        // Requête des données avec pagination
        $query = "SELECT d.*, u.email, u.nom, u.prenom
                  FROM domiciliations d
                  LEFT JOIN users u ON d.user_id = u.id";

        if (!empty($whereConditions)) {
            $query .= " WHERE " . implode(" AND ", $whereConditions);
        }

        $query .= " ORDER BY d.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    } else {
        // Requête de comptage pour user
        $countQuery = "SELECT COUNT(*) as total FROM domiciliations WHERE user_id = :user_id";
        $params = [':user_id' => $auth['id']];

        if ($statut) {
            $countQuery .= " AND statut = :statut";
            $params[':statut'] = $statut;
        }

        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch()['total'];

        // Requête des données
        $query = "SELECT * FROM domiciliations WHERE user_id = :user_id";

        if ($statut) {
            $query .= " AND statut = :statut";
        }

        $query .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    }

    $stmt->execute();
    $domiciliations = $stmt->fetchAll();

    // Réponse avec pagination
    $pagination = Pagination::paginate($totalCount, $page, $limit);

    Response::success([
        'data' => $domiciliations,
        'pagination' => $pagination
    ]);

} catch (Exception $e) {
    error_log("Get domiciliations error: " . $e->getMessage());
    Response::serverError();
}
