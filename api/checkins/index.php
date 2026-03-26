<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $auth = Auth::requireAdmin();

        $date = $_GET['date'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT
                c.*,
                r.date_debut,
                r.date_fin,
                r.participants,
                e.nom as espace_nom,
                p.prenom,
                p.nom,
                admin.prenom as admin_prenom,
                admin.nom as admin_nom
            FROM checkins c
            LEFT JOIN reservations r ON c.reservation_id = r.id
            LEFT JOIN espaces e ON r.espace_id = e.id
            LEFT JOIN persons p ON c.person_id = p.id
            LEFT JOIN persons admin ON c.enregistre_par = admin.id
            WHERE DATE(c.heure_arrivee_reelle) = ?
            ORDER BY c.heure_arrivee_reelle DESC
        ");
        $stmt->execute([$date]);
        $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $presencesStmt = $db->prepare("
            SELECT COALESCE(SUM(r.participants), 0) as total
            FROM checkins c
            LEFT JOIN reservations r ON c.reservation_id = r.id
            WHERE c.statut = 'en_cours'
              AND DATE(c.heure_arrivee_reelle) = CURDATE()
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
    Response::error('Méthode non autorisée', 405);
}
