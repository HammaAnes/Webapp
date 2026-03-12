<?php

/**
 * Upload Document - Endpoint pour uploader des documents
 * POST /api/documents/upload
 *
 * Multipart form data:
 * - file: Le fichier à uploader
 * - entity_type: Type d'entité (domiciliation, reservation, user)
 * - entity_id: ID de l'entité
 * - type_document: Type de document (facultatif)
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $authUser = Auth::verifyAuth();

    if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        Response::error('Aucun fichier fourni', 400);
        exit;
    }

    $file = $_FILES['file'];
    $entityType = $_POST['entity_type'] ?? null;
    $entityId = $_POST['entity_id'] ?? null;
    $typeDocument = $_POST['type_document'] ?? 'autre';

    if (!$entityType || !$entityId) {
        Response::error('entity_type et entity_id requis', 400);
        exit;
    }

    $allowedTypes = ['domiciliation', 'reservation', 'user'];
    if (!in_array($entityType, $allowedTypes)) {
        Response::error('Type d\'entité invalide', 400);
        exit;
    }

    if (!UuidHelper::isValid($entityId)) {
        Response::error('ID d\'entité invalide', 400);
        exit;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'Le fichier dépasse la limite autorisée',
            UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse la limite du formulaire',
            UPLOAD_ERR_PARTIAL => 'Le fichier n\'a été que partiellement uploadé',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Échec de l\'écriture sur le disque',
            UPLOAD_ERR_EXTENSION => 'Upload arrêté par une extension PHP'
        ];
        Response::error($errors[$file['error']] ?? 'Erreur lors de l\'upload', 400);
        exit;
    }

    $maxSize = env('UPLOAD_MAX_SIZE', 5242880);
    if ($file['size'] > $maxSize) {
        Response::error('Fichier trop volumineux. Limite: ' . ($maxSize / 1048576) . ' MB', 400);
        exit;
    }

    $allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip'
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedMimeTypes)) {
        Response::error('Type de fichier non autorisé', 400);
        exit;
    }

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip'];
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($extension, $allowedExtensions)) {
        Response::error('Extension de fichier non autorisée', 400);
        exit;
    }

    if ($authUser['role'] !== 'admin') {
        if ($entityType === 'domiciliation') {
            $stmt = $db->prepare('SELECT user_id FROM domiciliations WHERE id = ?');
            $stmt->execute([$entityId]);
            $entity = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$entity || $entity['user_id'] !== $authUser['id']) {
                Response::error('Accès non autorisé', 403);
                exit;
            }
        } elseif ($entityType === 'reservation') {
            $stmt = $db->prepare('SELECT user_id FROM reservations WHERE id = ?');
            $stmt->execute([$entityId]);
            $entity = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$entity || $entity['user_id'] !== $authUser['id']) {
                Response::error('Accès non autorisé', 403);
                exit;
            }
        } elseif ($entityType === 'user') {
            if ($entityId !== $authUser['id']) {
                Response::error('Accès non autorisé', 403);
                exit;
            }
        }
    }

    $uploadDir = __DIR__ . '/../uploads/documents/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $originalName = Sanitizer::cleanFilename($file['name']);
    $fileName = UuidHelper::generate() . '.' . $extension;
    $filePath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        Logger::error('Failed to move uploaded file', [
            'user_id' => $authUser['id'],
            'file' => $originalName
        ]);
        Response::error('Erreur lors de la sauvegarde du fichier', 500);
        exit;
    }

    $documentId = UuidHelper::generate();
    $relativePath = 'uploads/documents/' . $fileName;

    $stmt = $db->prepare('
        INSERT INTO documents_uploads
        (id, user_id, entity_type, entity_id, nom_fichier, nom_original, type_fichier, taille, chemin_fichier, type_document)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $stmt->execute([
        $documentId,
        $authUser['id'],
        $entityType,
        $entityId,
        $fileName,
        $originalName,
        $mimeType,
        $file['size'],
        $relativePath,
        $typeDocument
    ]);

    Logger::info('Document uploaded', [
        'document_id' => $documentId,
        'user_id' => $authUser['id'],
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'file_name' => $originalName,
        'size' => $file['size']
    ]);

    Response::success([
        'id' => $documentId,
        'nom_fichier' => $fileName,
        'nom_original' => $originalName,
        'type_fichier' => $mimeType,
        'taille' => $file['size'],
        'chemin_fichier' => $relativePath,
        'created_at' => date('Y-m-d H:i:s')
    ], 'Document uploadé avec succès', 201);

} catch (Exception $e) {
    Logger::error('Error in document upload', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    Response::error('Erreur lors de l\'upload du document', 500);
}