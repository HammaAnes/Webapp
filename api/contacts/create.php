<?php
require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        Response::error('Données invalides', 400);
    }

    $validator = new Validator($data);

    $validator->validateRequired($data['nom'] ?? '', 'nom');
    $validator->validateRequired($data['prenom'] ?? '', 'prenom');

    if (empty($data['email']) && empty($data['telephone'])) {
        Response::error('Email ou téléphone requis', 400);
    }

    if (!empty($data['email'])) {
        $validator->validateEmail($data['email'], 'email');
    }

    if (!empty($data['telephone'])) {
        $validator->validatePhone($data['telephone'], 'telephone', false);
    }

    $validSources = ['whatsapp', 'instagram', 'tiktok', 'fixe', 'mobile', 'physique', 'email', 'autre'];
    if (empty($data['source']) || !in_array($data['source'], $validSources)) {
        Response::error('Source invalide', 400);
    }

    if (!$validator->isValid()) {
        Response::error($validator->getFirstError(), 400);
    }

    $db = Database::getInstance()->getConnection();

    if (!empty($data['email'])) {
        $stmt = $db->prepare("SELECT id FROM contacts WHERE email = ? AND id != ?");
        $stmt->execute([$data['email'], '']);
        if ($stmt->fetch()) {
            Response::error('Un contact avec cet email existe déjà', 400);
        }
    }

    $contactId = UuidHelper::generate();

    $query = "
        INSERT INTO contacts (
            id, nom, prenom, email, telephone, entreprise, source, statut, notes, created_by
        ) VALUES (
            :id, :nom, :prenom, :email, :telephone, :entreprise, :source, :statut, :notes, :created_by
        )
    ";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':id' => $contactId,
        ':nom' => trim($data['nom']),
        ':prenom' => trim($data['prenom']),
        ':email' => !empty($data['email']) ? trim($data['email']) : null,
        ':telephone' => !empty($data['telephone']) ? trim($data['telephone']) : null,
        ':entreprise' => !empty($data['entreprise']) ? trim($data['entreprise']) : null,
        ':source' => $data['source'],
        ':statut' => $data['statut'] ?? 'prospect',
        ':notes' => !empty($data['notes']) ? trim($data['notes']) : null,
        ':created_by' => $userId
    ]);

    AuditLogger::log($userId, 'contact_created', 'contacts', $contactId, [
        'nom' => $data['nom'],
        'prenom' => $data['prenom'],
        'source' => $data['source']
    ]);

    $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
    $stmt->execute([$contactId]);
    $contactData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contactData) {
        Response::error('Erreur lors de la récupération du contact créé', 500);
    }

    $contact = [
        'id' => $contactData['id'],
        'nom' => $contactData['nom'],
        'prenom' => $contactData['prenom'],
        'email' => $contactData['email'],
        'telephone' => $contactData['telephone'],
        'entreprise' => $contactData['entreprise'],
        'source' => $contactData['source'],
        'statut' => $contactData['statut'],
        'notes' => $contactData['notes'],
        'userId' => $contactData['user_id'],
        'createdBy' => $contactData['created_by'],
        'createdAt' => $contactData['created_at'],
        'updatedAt' => $contactData['updated_at']
    ];

    Response::success([
        'contact' => $contact,
        'message' => 'Contact créé avec succès'
    ], 201);

} catch (Exception $e) {
    ErrorHandler::logError($e);
    Response::error('Erreur serveur', 500);
}
