<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $db = Database::getInstance()->getConnection();

    $stmtCount = $db->prepare("
        SELECT COUNT(*) as total
        FROM domiciliations
        WHERE statut = 'active'
        AND (date_fin IS NULL OR date_fin >= CURDATE())
    ");
    $stmtCount->execute();
    $countResult = $stmtCount->fetch(PDO::FETCH_ASSOC);

    $stmtCompanies = $db->prepare("
        SELECT raison_sociale, forme_juridique
        FROM domiciliations
        WHERE statut = 'active'
        AND (date_fin IS NULL OR date_fin >= CURDATE())
        AND visible_sur_site = 1
        AND raison_sociale IS NOT NULL
        AND raison_sociale != ''
        ORDER BY created_at DESC
        LIMIT 20
    ");
    $stmtCompanies->execute();
    $companies = $stmtCompanies->fetchAll(PDO::FETCH_ASSOC);

    $formattedCompanies = array_map(function($c) {
        return [
            'company_name' => $c['raison_sociale'],
            'legal_form'   => $c['forme_juridique'] ?? '',
        ];
    }, $companies);

    Response::success([
        'active_count'            => (int)$countResult['total'],
        'entreprises_domiciliees' => (int)$countResult['total'],
        'companies'               => $formattedCompanies,
    ]);
} catch (Exception $e) {
    Response::error($e->getMessage());
}
