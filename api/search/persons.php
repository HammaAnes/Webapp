<?php

/**
 * API Admin: Recherche unifiée de personnes (users + contacts)
 * GET /api/search/persons.php?q=xxx&limit=15
 *
 * Retourne une liste unifiée pour alimenter les selects de l'admin
 * (souscriptions, réservations, etc.)
 */

require_once __DIR__ . '/../bootstrap.php';

Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
}

$q     = isset($_GET['q']) ? trim($_GET['q']) : '';
$limit = isset($_GET['limit']) ? min(30, max(1, intval($_GET['limit']))) : 15;

if (strlen($q) < 2) {
    Response::success(['persons' => []]);
}

try {
    $like = '%' . $q . '%';

    $stmt = $db->prepare("
        SELECT id, nom, prenom, email, telephone,
               CASE WHEN role IS NOT NULL THEN 'user' ELSE 'contact' END AS type
        FROM persons
        WHERE nom LIKE :s1 OR prenom LIKE :s2 OR email LIKE :s3 OR telephone LIKE :s4
        ORDER BY nom, prenom
        LIMIT :limit
    ");
    $stmt->bindValue(':s1', $like);
    $stmt->bindValue(':s2', $like);
    $stmt->bindValue(':s3', $like);
    $stmt->bindValue(':s4', $like);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $persons = array_map(fn($r) => [
        'id'        => $r['id'],
        'nom'       => $r['nom']       ?? '',
        'prenom'    => $r['prenom']    ?? '',
        'email'     => $r['email']     ?? '',
        'telephone' => $r['telephone'] ?? '',
        'type'      => $r['type'],
    ], $rows);

    Response::success(['persons' => $persons]);

} catch (Exception $e) {
    Logger::error('search/persons error', ['error' => $e->getMessage()]);
    Response::error('Erreur serveur: ' . $e->getMessage(), 500);
}
