<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $userId = Auth::getUserId();
        if (!$userId) {
            Response::unauthorized('Non authentifié');
        }

        $user = Auth::getUser();
        if ($user['role'] !== 'admin') {
            Response::forbidden('Accès réservé aux administrateurs');
        }

        $date = $_GET['date'] ?? date('Y-m-d');

        // Récupérer tous les check-ins du jour
        $stmt = $pdo->prepare("
            SELECT
                c.*,
                r.date_debut,
                r.date_fin,
                r.participants,
                e.nom as espace_nom,
                u.prenom,
                u.nom,
                admin.prenom as admin_prenom,
                admin.nom as admin_nom
            FROM checkins c
            LEFT JOIN reservations r ON c.reservation_id = r.id
            LEFT JOIN espaces e ON r.espace_id = e.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users admin ON c.enregistre_par = admin.id
            WHERE DATE(c.heure_arrivee_reelle) = ?
            ORDER BY c.heure_arrivee_reelle DESC
        ");
        $stmt->execute([$date]);
        $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Compter les présences actuelles
        $presencesStmt = $pdo->prepare("
            SELECT COALESCE(SUM(r.participants), 0) as total
            FROM checkins c
            LEFT JOIN reservations r ON c.reservation_id = r.id
            WHERE c.statut = 'en_cours'
        ");
        $presencesStmt->execute();
        $presences = $presencesStmt->fetch(PDO::FETCH_ASSOC);

        Response::success([
            'checkins' => $checkins,
            'presences_actuelles' => (int)$presences['total']
        ]);
    } catch (Exception $e) {
        Response::error($e->getMessage());
    }
} else {
    Response::methodNotAllowed();
}
