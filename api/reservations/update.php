<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $isAdmin = $auth['role'] === 'admin';

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data || empty($data['id'])) {
        Response::error("ID reservation requis", 400);
    }

    $id = $data['id'];

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("
        SELECT r.*, e.prix_heure, e.prix_jour
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        Response::error("Reservation introuvable", 404);
    }

    if (!$isAdmin && $reservation['user_id'] !== $userId) {
        Response::error("Acces refuse", 403);
    }

    $updates = [];
    $params = [];

    if ($isAdmin && isset($data['statut'])) {
        $validStatuts = ['en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee'];
        if (in_array($data['statut'], $validStatuts)) {
            $updates[] = "statut = ?";
            $params[] = $data['statut'];
        }
    }

    if ($isAdmin && isset($data['montant_paye'])) {
        $updates[] = "montant_paye = ?";
        $params[] = floatval($data['montant_paye']);
    }

    if ($isAdmin && isset($data['mode_paiement'])) {
        $updates[] = "mode_paiement = ?";
        $params[] = $data['mode_paiement'];
    }

    if (isset($data['participants'])) {
        $updates[] = "participants = ?";
        $params[] = intval($data['participants']);
    }

    if (isset($data['notes'])) {
        $updates[] = "notes = ?";
        $params[] = trim($data['notes']);
    }

    if (empty($updates)) {
        Response::error("Aucune donnee a mettre a jour", 400);
    }

    $params[] = $id;
    $sql = "UPDATE reservations SET " . implode(", ", $updates) . " WHERE id = ?";

    $stmt = $db->prepare($sql);
    $result = $stmt->execute($params);

    if (!$result) {
        Response::error("Erreur lors de la mise a jour", 500);
    }

    $stmt = $db->prepare("
        SELECT r.*, e.nom as espace_nom, e.type as espace_type
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    Response::success($updated, "Reservation mise a jour");

} catch (Exception $e) {
    error_log("Erreur reservation update: " . $e->getMessage());
    Response::error("Erreur serveur", 500);
}
