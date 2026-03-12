<?php

/**
 * Download Document - Télécharger un document
 * GET /api/documents/download?id=uuid
 */

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

try {
    $authUser = Auth::verifyAuth();

    if (!isset($_GET['id']) || empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de document requis']);
        exit;
    }

    $documentId = trim($_GET['id']);

    if (!UuidHelper::isValid($documentId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID invalide']);
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
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Document non trouvé']);
        exit;
    }

    if ($authUser['role'] !== 'admin') {
        if ($document['entity_type'] === 'domiciliation') {
            $checkStmt = $db->prepare('SELECT user_id FROM domiciliations WHERE id = ?');
            $checkStmt->execute([$document['entity_id']]);
            $entity = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$entity || $entity['user_id'] !== $authUser['id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Accès non autorisé']);
                exit;
            }
        } elseif ($document['entity_type'] === 'reservation') {
            $checkStmt = $db->prepare('SELECT user_id FROM reservations WHERE id = ?');
            $checkStmt->execute([$document['entity_id']]);
            $entity = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$entity || $entity['user_id'] !== $authUser['id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Accès non autorisé']);
                exit;
            }
        } elseif ($document['entity_type'] === 'user') {
            if ($document['user_id'] !== $authUser['id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Accès non autorisé']);
                exit;
            }
        }
    }

    $filePath = __DIR__ . '/../' . $document['chemin_fichier'];

    if (!file_exists($filePath)) {
        Logger::error('Document file not found', [
            'document_id' => $documentId,
            'path' => $filePath
        ]);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Fichier introuvable']);
        exit;
    }

    header('Content-Description: File Transfer');
    header('Content-Type: ' . $document['type_fichier']);
    header('Content-Disposition: attachment; filename="' . $document['nom_original'] . '"');
    header('Content-Length: ' . $document['taille']);
    header('Cache-Control: must-revalidate');
    header('Pragma: public');

    readfile($filePath);

    Logger::info('Document downloaded', [
        'document_id' => $documentId,
        'user_id' => $authUser['id'],
        'file_name' => $document['nom_original']
    ]);

    exit;

} catch (Exception $e) {
    Logger::error('Error in document download', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur lors du téléchargement']);
    exit;
}
