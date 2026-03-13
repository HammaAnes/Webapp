<?php
require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');

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

$contactId = $_GET['id'] ?? '';

if (empty($contactId)) {
    Response::error('ID du contact requis', 400);
}

try {
    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("
        SELECT
            c.*,
            u.nom as user_nom,
            u.prenom as user_prenom,
            u.email as user_email,
            admin.nom as created_by_nom,
            admin.prenom as created_by_prenom
        FROM contacts c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users admin ON c.created_by = admin.id
        WHERE c.id = ?
    ");
    $stmt->execute([$contactId]);
    $contact = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contact) {
        Response::error('Contact non trouvé', 404);
    }

    $stmtReservations = $db->prepare("
        SELECT
            r.id,
            r.date_debut,
            r.date_fin,
            r.montant_total,
            r.statut,
            r.created_at,
            e.nom as espace_nom,
            e.type as espace_type
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.contact_id = ?
        ORDER BY r.date_debut DESC
    ");
    $stmtReservations->execute([$contactId]);
    $reservations = $stmtReservations->fetchAll(PDO::FETCH_ASSOC);

    $stmtDomiciliations = $db->prepare("
        SELECT
            id,
            raison_sociale,
            statut,
            created_at
        FROM domiciliations
        WHERE contact_id = ?
        ORDER BY created_at DESC
    ");
    $stmtDomiciliations->execute([$contactId]);
    $domiciliations = $stmtDomiciliations->fetchAll(PDO::FETCH_ASSOC);

    $history = [];

    foreach ($reservations as $reservation) {
        $history[] = [
            'type' => 'reservation',
            'entityId' => $reservation['id'],
            'date' => $reservation['created_at'],
            'description' => 'Réservation ' . $reservation['espace_nom'] . ' du ' . date('d/m/Y', strtotime($reservation['date_debut'])),
            'montant' => (float)$reservation['montant_total'],
            'statut' => $reservation['statut']
        ];
    }

    foreach ($domiciliations as $domiciliation) {
        $history[] = [
            'type' => 'domiciliation',
            'entityId' => $domiciliation['id'],
            'date' => $domiciliation['created_at'],
            'description' => 'Domiciliation ' . $domiciliation['raison_sociale'],
            'montant' => null,
            'statut' => $domiciliation['statut']
        ];
    }

    usort($history, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });

    $contactData = [
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
        'createdAt' => $contact['created_at'],
        'updatedAt' => $contact['updated_at'],
        'history' => $history,
        'stats' => [
            'nbReservations' => count($reservations),
            'nbDomiciliations' => count($domiciliations),
            'totalRevenue' => array_sum(array_column($reservations, 'montant_total'))
        ]
    ];

    Response::success($contactData);

} catch (Exception $e) {
    ErrorHandler::logError($e);
    Response::error('Erreur serveur', 500);
}
