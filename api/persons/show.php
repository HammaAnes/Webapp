<?php

/**
 * API: Détail d'une personne
 * GET /api/persons/show.php?id=xxx
 */

require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();

try {
    $personId = $_GET['id'] ?? null;
    if (!$personId) Response::error('ID manquant', 400);

    // Accès : soi-même ou admin
    if ($auth['role'] !== 'admin' && $auth['id'] !== $personId) {
        Response::error('Accès refusé', 403);
    }

    $stmt = $db->prepare("
        SELECT p.*,
               cp.nom AS created_by_nom, cp.prenom AS created_by_prenom
        FROM persons p
        LEFT JOIN persons cp ON cp.id = p.created_by
        WHERE p.id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $personId]);
    $p = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$p) Response::error('Personne non trouvée', 404);

    // Historique réservations
    $reservations = $db->prepare("
        SELECT r.id, r.date_debut, r.date_fin, r.statut, r.montant_total, r.mode_paiement,
               e.nom AS espace_nom
        FROM reservations r
        LEFT JOIN espaces e ON e.id = r.espace_id
        WHERE r.person_id = :id
        ORDER BY r.date_debut DESC
        LIMIT 20
    ");
    $reservations->execute([':id' => $personId]);

    // Abonnements
    $abonnements = $db->prepare("
        SELECT au.id, au.statut, au.date_debut, au.date_fin, a.nom AS abonnement_nom, a.prix
        FROM abonnements_utilisateurs au
        LEFT JOIN abonnements a ON a.id = au.abonnement_id
        WHERE au.person_id = :id
        ORDER BY au.created_at DESC
    ");
    $abonnements->execute([':id' => $personId]);

    // Domiciliations
    $domiciliations = $db->prepare("
        SELECT id, raison_sociale, statut, date_debut, date_fin, montant_mensuel
        FROM domiciliations
        WHERE person_id = :id
        ORDER BY created_at DESC
    ");
    $domiciliations->execute([':id' => $personId]);

    $p['hasAccount']      = $p['role'] !== null;
    $p['credit']          = (float)($p['credit'] ?? 0);
    $p['absences']        = (int)($p['absences'] ?? 0);
    $p['createdByName']   = trim(($p['created_by_nom'] ?? '') . ' ' . ($p['created_by_prenom'] ?? ''));

    Response::success([
        'person'        => $p,
        'reservations'  => $reservations->fetchAll(PDO::FETCH_ASSOC),
        'abonnements'   => $abonnements->fetchAll(PDO::FETCH_ASSOC),
        'domiciliations'=> $domiciliations->fetchAll(PDO::FETCH_ASSOC),
    ]);

} catch (Exception $e) {
    Logger::error('persons/show error', ['error' => $e->getMessage()]);
    Response::error('Erreur serveur', 500);
}
