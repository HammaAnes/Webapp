<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT COUNT(*) as total
            FROM domiciliations
            WHERE statut = 'active'
            AND (date_fin IS NULL OR date_fin >= CURDATE())
        ");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success([
            'entreprises_domiciliees' => (int)$result['total']
        ]);
    } catch (Exception $e) {
        Response::error($e->getMessage());
    }
} else {
    Response::error('Méthode non autorisée', 405);
}
