<?php

/**
 * Update Document - Mettre à jour le statut d'un document
 * PUT /api/documents/update.php?id=uuid
 * Body: { "status": "valide|rejete|en_attente" }
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $authUser = Auth::verifyAuth();

    if ($authUser['role'] !== 'admin') {
        Response::error('Accès réservé aux administrateurs', 403);
        exit;
    }

    $documentId = $_GET['id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$documentId && isset($input['id'])) {
        $documentId = $input['id'];
    }

    if (!$documentId) {
        Response::error('ID de document requis', 400);
        exit;
    }

    if (!UuidHelper::isValid($documentId)) {
        Response::error('ID invalide', 400);
        exit;
    }

    $stmt = $db->prepare('SELECT * FROM documents_uploads WHERE id = ? LIMIT 1');
    $stmt->execute([$documentId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$document) {
        Response::error('Document non trouvé', 404);
        exit;
    }

    $updates = [];
    $params = [];

    $statusKey = isset($input['status']) ? 'status' : (isset($input['statut']) ? 'statut' : null);
    if ($statusKey) {
        $allowed = ['en_attente', 'valide', 'rejete'];
        if (!in_array($input[$statusKey], $allowed)) {
            Response::error('Statut invalide. Valeurs autorisées: ' . implode(', ', $allowed), 400);
            exit;
        }
        $updates[] = 'status = ?';
        $params[] = $input[$statusKey];
    }

    if (empty($updates)) {
        Response::error('Aucune donnée à mettre à jour', 400);
        exit;
    }

    $params[] = $documentId;
    $sql = 'UPDATE documents_uploads SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    Logger::info('Document updated', [
        'document_id' => $documentId,
        'admin_id' => $authUser['id'],
        'changes' => $input
    ]);

    Response::success(null, 'Document mis à jour avec succès');

} catch (PDOException $e) {
    Logger::error('Database error in document update', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la mise à jour du document', 500);
} catch (Exception $e) {
    Logger::error('Error in document update', ['error' => $e->getMessage()]);
    Response::error('Une erreur est survenue', 500);
}
