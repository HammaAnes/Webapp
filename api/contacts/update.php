<?php
require_once __DIR__ . '/../bootstrap.php';

$auth = new Auth();
$userId = $auth->authenticate();

if (!$userId) {
    Response::error('Non autorisé', 401);
}

$user = $auth->getUserById($userId);
if ($user['role'] !== 'admin') {
    Response::error('Accès refusé - Administrateur uniquement', 403);
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) {
    Response::error('Méthode non autorisée', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        Response::error('Données invalides', 400);
    }

    $contactId = $data['id'] ?? '';
    if (empty($contactId)) {
        Response::error('ID du contact requis', 400);
    }

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
    $stmt->execute([$contactId]);
    $contact = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contact) {
        Response::error('Contact non trouvé', 404);
    }

    $validator = new Validator($data);

    if (isset($data['nom'])) {
        $validator->validateRequired($data['nom'], 'nom');
    }

    if (isset($data['prenom'])) {
        $validator->validateRequired($data['prenom'], 'prenom');
    }

    if (isset($data['email']) && !empty($data['email'])) {
        $validator->validateEmail($data['email'], 'email');

        $stmt = $db->prepare("SELECT id FROM contacts WHERE email = ? AND id != ?");
        $stmt->execute([$data['email'], $contactId]);
        if ($stmt->fetch()) {
            Response::error('Un contact avec cet email existe déjà', 400);
        }
    }

    if (isset($data['telephone']) && !empty($data['telephone'])) {
        $validator->validatePhone($data['telephone'], 'telephone', false);
    }

    if (isset($data['source'])) {
        $validSources = ['whatsapp', 'instagram', 'tiktok', 'fixe', 'mobile', 'physique', 'email', 'autre'];
        if (!in_array($data['source'], $validSources)) {
            Response::error('Source invalide', 400);
        }
    }

    if (isset($data['statut'])) {
        $validStatuts = ['prospect', 'client', 'perdu'];
        if (!in_array($data['statut'], $validStatuts)) {
            Response::error('Statut invalide', 400);
        }
    }

    if (!$validator->isValid()) {
        Response::error($validator->getFirstError(), 400);
    }

    $updates = [];
    $params = [];

    $updateableFields = ['nom', 'prenom', 'email', 'telephone', 'entreprise', 'source', 'statut', 'notes'];

    foreach ($updateableFields as $field) {
        if (array_key_exists($field, $data)) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    if (empty($updates)) {
        Response::error('Aucune donnée à mettre à jour', 400);
    }

    $updates[] = "updated_at = NOW()";
    $params[':id'] = $contactId;

    $query = "UPDATE contacts SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    AuditLogger::log($userId, 'contact_updated', 'contacts', $contactId, $data);

    $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
    $stmt->execute([$contactId]);
    $updatedContact = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$updatedContact) {
        Response::error('Contact non trouvé après mise à jour', 500);
    }

    $contactData = [
        'id' => $updatedContact['id'],
        'nom' => $updatedContact['nom'],
        'prenom' => $updatedContact['prenom'],
        'email' => $updatedContact['email'],
        'telephone' => $updatedContact['telephone'],
        'entreprise' => $updatedContact['entreprise'],
        'source' => $updatedContact['source'],
        'statut' => $updatedContact['statut'],
        'notes' => $updatedContact['notes'],
        'userId' => $updatedContact['user_id'],
        'createdBy' => $updatedContact['created_by'],
        'createdAt' => $updatedContact['created_at'],
        'updatedAt' => $updatedContact['updated_at']
    ];

    Response::success([
        'contact' => $contactData,
        'message' => 'Contact mis à jour avec succès'
    ]);

} catch (Exception $e) {
    ErrorHandler::logError($e);
    Response::error('Erreur serveur', 500);
}
