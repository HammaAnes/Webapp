<?php

/**
 * API Admin: Désactiver / supprimer une personne
 * DELETE /api/persons/delete.php?id=xxx
 *
 * Si la personne a un compte → désactivation (statut = inactif)
 * Si c'est un contact sans compte → suppression physique
 */

require_once __DIR__ . '/../bootstrap.php';

Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Méthode non autorisée', 405);
}

try {
    $personId = $_GET['id'] ?? null;
    if (!$personId) Response::error('ID manquant', 400);

    $stmt = $db->prepare("SELECT id, role, email FROM persons WHERE id = ?");
    $stmt->execute([$personId]);
    $person = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$person) Response::error('Personne non trouvée', 404);

    if ($person['role'] !== null) {
        // User avec compte → désactivation douce
        $db->prepare("UPDATE persons SET statut = 'inactif', updated_at = NOW() WHERE id = ?")
           ->execute([$personId]);
        Response::success(['id' => $personId], 'Compte désactivé');
    } else {
        // Contact sans compte → suppression physique
        $db->prepare("DELETE FROM persons WHERE id = ? AND role IS NULL")
           ->execute([$personId]);
        Response::success(['id' => $personId], 'Contact supprimé');
    }

} catch (Exception $e) {
    Logger::error('persons/delete error', ['error' => $e->getMessage()]);
    Response::error('Erreur serveur', 500);
}
