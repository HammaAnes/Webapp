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

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Méthode non autorisée', 405);
}

$contactId = $_GET['id'] ?? '';

if (empty($contactId)) {
    Response::error('ID du contact requis', 400);
}

try {
    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
    $stmt->execute([$contactId]);
    $contact = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contact) {
        Response::error('Contact non trouvé', 404);
    }

    $stmtReservations = $db->prepare("SELECT COUNT(*) as count FROM reservations WHERE contact_id = ?");
    $stmtReservations->execute([$contactId]);
    $hasReservations = $stmtReservations->fetch(PDO::FETCH_ASSOC)['count'] > 0;

    $stmtDomiciliations = $db->prepare("SELECT COUNT(*) as count FROM domiciliations WHERE contact_id = ?");
    $stmtDomiciliations->execute([$contactId]);
    $hasDomiciliations = $stmtDomiciliations->fetch(PDO::FETCH_ASSOC)['count'] > 0;

    if ($hasReservations || $hasDomiciliations) {
        Response::error('Impossible de supprimer un contact avec des réservations ou domiciliations associées', 400);
    }

    $stmt = $db->prepare("DELETE FROM contacts WHERE id = ?");
    $stmt->execute([$contactId]);

    AuditLogger::log($userId, 'contact_deleted', 'contacts', $contactId, [
        'nom' => $contact['nom'],
        'prenom' => $contact['prenom']
    ]);

    Response::success(['message' => 'Contact supprimé avec succès']);

} catch (Exception $e) {
    ErrorHandler::logError($e);
    Response::error('Erreur serveur', 500);
}
