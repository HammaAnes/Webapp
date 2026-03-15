<?php

/**
 * List Documents - Lister les documents
 * GET /api/documents/index?entity_type=domiciliation&entity_id=uuid
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $authUser = Auth::verifyAuth();

    $entityType = $_GET['entity_type'] ?? null;
    $entityId = $_GET['entity_id'] ?? null;

    $query = 'SELECT * FROM documents_uploads WHERE 1=1';
    $params = [];

    if ($authUser['role'] !== 'admin') {
        $query .= ' AND user_id = ?';
        $params[] = $authUser['id'];
    }

    if ($entityType) {
        $query .= ' AND entity_type = ?';
        $params[] = $entityType;
    }

    if ($entityId) {
        if (!UuidHelper::isValid($entityId)) {
            Response::error('ID d\'entité invalide', 400);
            exit;
        }
        $query .= ' AND entity_id = ?';
        $params[] = $entityId;
    }

    $query .= ' ORDER BY COALESCE(created_at, uploaded_at) DESC';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($documents as &$doc) {
        $doc['download_url'] = env('APP_URL', 'https://coffice.dz') . '/api/documents/download?id=' . $doc['id'];
        $doc['taille_formatte'] = formatFileSize($doc['taille']);
    }

    Response::success([
        'documents' => $documents,
        'total' => count($documents)
    ]);

} catch (PDOException $e) {
    Logger::error('Database error in documents list', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la récupération des documents', 500);
} catch (Exception $e) {
    Logger::error('Error in documents list', ['error' => $e->getMessage()]);
    Response::error('Une erreur est survenue', 500);
}

function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}