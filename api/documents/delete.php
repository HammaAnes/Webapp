<?php

/**
 * Delete Document - Supprimer un document
 * DELETE /api/documents/delete
 * Body: { "id": "uuid" }
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $authUser = Auth::verifyAuth();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['id'])) {
        Response::error('ID de document requis', 400);
        exit;
    }

    $documentId = trim($input['id']);

    if (!UuidHelper::isValid($documentId)) {
        Response::error('ID invalide', 400);
        exit;
    }

    $stmt = $db->prepare('
        SELECT d.*
        FROM documents_uploads d
        WHERE d.id = ?
        LIMIT 1
    ');
    $stmt->execute([$documentId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$document) {
        Response::error('Document non trouvé', 404);
        exit;
    }

    if ($authUser['role'] !== 'admin' && $document['user_id'] !== $authUser['id']) {
        Response::error('Accès non autorisé', 403);
        exit;
    }

    $filePath = __DIR__ . '/../' . $document['chemin_fichier'];

    $deleteStmt = $db->prepare('DELETE FROM documents_uploads WHERE id = ?');
    $deleteStmt->execute([$documentId]);

    if (file_exists($filePath)) {
        if (!unlink($filePath)) {
            Logger::warning('Failed to delete document file', [
                'document_id' => $documentId,
                'path' => $filePath
            ]);
        }
    }

    Logger::info('Document deleted', [
        'document_id' => $documentId,
        'user_id' => $authUser['id'],
        'file_name' => $document['nom_original']
    ]);

    Response::success(null, 'Document supprimé avec succès');

} catch (PDOException $e) {
    Logger::error('Database error in document delete', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la suppression du document', 500);
} catch (Exception $e) {
    Logger::error('Error in document delete', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    Response::error('Erreur lors de la suppression', 500);
}
