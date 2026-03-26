<?php

/**
 * API Admin: Liste des personnes (users avec compte + contacts sans compte)
 * GET /api/persons/index.php
 * GET /api/persons/index.php?search=q&has_account=true|false|all&crm_statut=prospect
 */

require_once __DIR__ . '/../bootstrap.php';

Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $search      = trim($_GET['search']      ?? '');
    $hasAccount  = $_GET['has_account']      ?? 'all';  // 'true' | 'false' | 'all'
    $crmStatut   = trim($_GET['crm_statut']  ?? '');
    $source      = trim($_GET['source']      ?? '');
    $page        = max(1, (int)($_GET['page']  ?? 1));
    $limit       = min(500, max(1, (int)($_GET['limit'] ?? 20)));
    $offset      = ($page - 1) * $limit;

    $where  = [];
    $params = [];

    if ($search !== '') {
        $where[] = "(p.nom LIKE :s1 OR p.prenom LIKE :s2 OR p.email LIKE :s3
                     OR p.telephone LIKE :s4 OR p.entreprise LIKE :s5
                     OR CONCAT(p.prenom,' ',p.nom) LIKE :s6)";
        $like = '%' . $search . '%';
        $params += [':s1'=>$like,':s2'=>$like,':s3'=>$like,':s4'=>$like,':s5'=>$like,':s6'=>$like];
    }

    if ($hasAccount === 'true') {
        $where[] = "p.role IS NOT NULL";
    } elseif ($hasAccount === 'false') {
        $where[] = "p.role IS NULL";
    }

    if ($crmStatut !== '' && in_array($crmStatut, ['prospect','client','perdu'])) {
        $where[] = "p.crm_statut = :crm_statut";
        $params[':crm_statut'] = $crmStatut;
    }

    $validSources = ['whatsapp','instagram','tiktok','fixe','mobile','physique','email','inscription','google','autre'];
    if ($source !== '' && in_array($source, $validSources)) {
        $where[] = "p.source = :source";
        $params[':source'] = $source;
    }

    $whereClause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);

    $total = (int) $db->prepare("SELECT COUNT(*) FROM persons p $whereClause")
                      ->execute($params) ? $db->query("SELECT COUNT(*) FROM persons p $whereClause")->fetchColumn() : 0;

    // Recompte propre
    $countStmt = $db->prepare("SELECT COUNT(*) FROM persons p $whereClause");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare("
        SELECT p.id, p.nom, p.prenom, p.email, p.telephone, p.role, p.statut,
               p.crm_statut, p.source, p.entreprise, p.profession,
               p.wilaya, p.commune, p.code_parrainage, p.credit, p.absences,
               p.derniere_connexion, p.created_at, p.updated_at,
               (SELECT COUNT(*) FROM reservations r WHERE r.person_id = p.id) AS nb_reservations,
               (SELECT COUNT(*) FROM domiciliations d WHERE d.person_id = p.id) AS nb_domiciliations,
               (SELECT COUNT(*) FROM abonnements_utilisateurs au WHERE au.person_id = p.id) AS nb_abonnements
        FROM persons p
        $whereClause
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
    ");
    foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
    $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $persons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($persons as &$p) {
        $p['hasAccount']       = $p['role'] !== null;
        $p['nb_reservations']  = (int)$p['nb_reservations'];
        $p['nb_domiciliations']= (int)$p['nb_domiciliations'];
        $p['nb_abonnements']   = (int)$p['nb_abonnements'];
        $p['credit']           = (float)($p['credit'] ?? 0);
        $p['absences']         = (int)($p['absences'] ?? 0);
    }
    unset($p);

    Response::success([
        'persons'    => $persons,
        'pagination' => [
            'page'  => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => (int)ceil($total / $limit),
        ],
    ]);

} catch (Exception $e) {
    Logger::error('persons/index error', ['error' => $e->getMessage()]);
    Response::error('Erreur serveur', 500);
}
