<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $database = Database::getInstance();
        $db = $database->getConnection();

        $stmt = $db->prepare("
            SELECT COUNT(*) as total
            FROM domiciliations
            WHERE statut = 'active'
            AND (date_fin IS NULL OR date_fin >= CURDATE())
        ");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $visibleStmt = $db->prepare("
            SELECT raison_sociale, forme_juridique, activite_exercee, activite_principale
            FROM domiciliations
            WHERE statut = 'active'
            AND visible_sur_site = 1
            AND (date_fin IS NULL OR date_fin >= CURDATE())
            ORDER BY date_debut DESC
            LIMIT 20
        ");
        $visibleStmt->execute();
        $entreprises = $visibleStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'entreprises_domiciliees' => (int)$result['total'],
            'entreprises_visibles' => array_map(function($e) {
                return [
                    'raison_sociale' => $e['raison_sociale'],
                    'forme_juridique' => $e['forme_juridique'],
                    'activite' => $e['activite_exercee'] ?? $e['activite_principale'] ?? '',
                ];
            }, $entreprises),
        ]);
    } catch (Exception $e) {
        Response::error($e->getMessage());
    }
} else {
    Response::error('Méthode non autorisée', 405);
}
