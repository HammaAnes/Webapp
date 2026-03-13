<?php
require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$auth = new Auth();
$userId = $auth->authenticate();

if (!$userId) {
    Response::error('Non autorisé', 401);
}

$user = $auth->getUserById($userId);
if ($user['role'] !== 'admin') {
    Response::error('Accès refusé - Administrateur uniquement', 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $db = Database::getInstance()->getConnection();

    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;

    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $statut = isset($_GET['statut']) ? trim($_GET['statut']) : '';
    $source = isset($_GET['source']) ? trim($_GET['source']) : '';

    $where = [];
    $params = [];

    if ($search !== '') {
        $where[] = "(c.nom LIKE :search OR c.prenom LIKE :search OR c.email LIKE :search OR c.telephone LIKE :search OR c.entreprise LIKE :search)";
        $params[':search'] = "%$search%";
    }

    if ($statut !== '' && in_array($statut, ['prospect', 'client', 'perdu'])) {
        $where[] = "c.statut = :statut";
        $params[':statut'] = $statut;
    }

    if ($source !== '' && in_array($source, ['whatsapp', 'instagram', 'tiktok', 'fixe', 'mobile', 'physique', 'email', 'autre'])) {
        $where[] = "c.source = :source";
        $params[':source'] = $source;
    }

    $whereClause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);

    $countQuery = "SELECT COUNT(*) as total FROM contacts c $whereClause";
    $stmt = $db->prepare($countQuery);
    $stmt->execute($params);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    $query = "
        SELECT
            c.*,
            u.nom as user_nom,
            u.prenom as user_prenom,
            u.email as user_email,
            admin.nom as created_by_nom,
            admin.prenom as created_by_prenom,
            (SELECT COUNT(*) FROM reservations r WHERE r.contact_id = c.id) as nb_reservations,
            (SELECT COUNT(*) FROM domiciliations d WHERE d.contact_id = c.id) as nb_domiciliations
        FROM contacts c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users admin ON c.created_by = admin.id
        $whereClause
        ORDER BY c.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $contacts = array_map(function($contact) {
        return [
            'id' => $contact['id'],
            'nom' => $contact['nom'],
            'prenom' => $contact['prenom'],
            'email' => $contact['email'],
            'telephone' => $contact['telephone'],
            'entreprise' => $contact['entreprise'],
            'source' => $contact['source'],
            'statut' => $contact['statut'],
            'notes' => $contact['notes'],
            'userId' => $contact['user_id'],
            'user' => $contact['user_id'] ? [
                'nom' => $contact['user_nom'],
                'prenom' => $contact['user_prenom'],
                'email' => $contact['user_email']
            ] : null,
            'createdBy' => $contact['created_by'],
            'createdByName' => $contact['created_by_nom'] . ' ' . $contact['created_by_prenom'],
            'nbReservations' => (int)$contact['nb_reservations'],
            'nbDomiciliations' => (int)$contact['nb_domiciliations'],
            'createdAt' => $contact['created_at'],
            'updatedAt' => $contact['updated_at']
        ];
    }, $contacts);

    Response::success([
        'contacts' => $contacts,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => (int)ceil($total / $limit)
        ]
    ]);

} catch (Exception $e) {
    ErrorHandler::logError($e);
    Response::error('Erreur serveur', 500);
}
