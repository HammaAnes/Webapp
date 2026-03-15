<?php
require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();
$userId = $auth['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        EmailQueue::ensureUserPreferences($userId);

        $stmt = $db->prepare('SELECT * FROM email_preferences WHERE user_id = ?');
        $stmt->execute([$userId]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$prefs) {
            Response::error('Préférences introuvables', 404);
            exit;
        }

        Response::success([
            'email_transactionnel' => (bool)$prefs['email_transactionnel'],
            'email_rappels'        => (bool)$prefs['email_rappels'],
            'email_marketing'      => (bool)$prefs['email_marketing'],
            'email_systeme'        => (bool)$prefs['email_systeme'],
            'unsubscribe_token'    => $prefs['unsubscribe_token'],
        ], 'Préférences email');
    } catch (Exception $e) {
        Logger::error('email/preferences GET error', ['error' => $e->getMessage()]);
        Response::error('Erreur serveur', 500);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        EmailQueue::ensureUserPreferences($userId);

        $allowed = ['email_rappels', 'email_marketing', 'email_systeme'];
        $updates = [];
        $params  = [];

        foreach ($allowed as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[]  = (int)(bool)$input[$field];
            }
        }

        $updates[] = 'email_transactionnel = 1';

        if (empty($updates)) {
            Response::error('Aucune préférence à mettre à jour', 400);
            exit;
        }

        $params[] = $userId;
        $db->prepare('UPDATE email_preferences SET ' . implode(', ', $updates) . ' WHERE user_id = ?')
           ->execute($params);

        Response::success([], 'Préférences mises à jour');
    } catch (Exception $e) {
        Logger::error('email/preferences PUT error', ['error' => $e->getMessage()]);
        Response::error('Erreur lors de la mise à jour', 500);
    }
    exit;
}

Response::error('Méthode non autorisée', 405);
