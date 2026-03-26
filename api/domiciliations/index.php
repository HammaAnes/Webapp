<?php

/**
 * API: Liste des demandes de domiciliation
 * GET /api/domiciliations/index.php
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::verifyAuth();

    $database = Database::getInstance();
    $db = $database->getConnection();

    // Si un ID est fourni, retourner une seule domiciliation
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = $_GET['id'];

        if ($auth['role'] === 'admin') {
            $query = "SELECT d.*, p.email, p.nom, p.prenom, p.telephone
                      FROM domiciliations d
                      LEFT JOIN persons p ON d.person_id = p.id
                      WHERE d.id = :id";
        } else {
            $query = "SELECT * FROM domiciliations WHERE id = :id AND person_id = :person_id";
        }

        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($auth['role'] !== 'admin') {
            $stmt->bindParam(':person_id', $auth['id']);
        }
        $stmt->execute();
        $domiciliation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$domiciliation) {
            Response::notFound('Domiciliation introuvable');
        }

        Response::success(['data' => $domiciliation]);
    }

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
        $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $query = "SELECT d.*, p.email, p.nom, p.prenom, p.telephone
                  FROM domiciliations d
                  LEFT JOIN persons p ON d.person_id = p.id";

        if (!empty($whereConditions)) {
            $query .= " WHERE " . implode(" AND ", $whereConditions);
        }

        $query .= " ORDER BY d.date_debut_contrat DESC, d.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    } else {
        // Requête de comptage pour user
        $countQuery = "SELECT COUNT(*) as total FROM domiciliations WHERE person_id = :person_id";
        $params = [':person_id' => $auth['id']];

        if ($statut) {
            $countQuery .= " AND statut = :statut";
            $params[':statut'] = $statut;
        }

        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Requête des données
        $query = "SELECT * FROM domiciliations WHERE person_id = :person_id";

        if ($statut) {
            $query .= " AND statut = :statut";
        }

        $query .= " ORDER BY date_debut_contrat DESC, created_at DESC LIMIT :limit OFFSET :offset";

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
