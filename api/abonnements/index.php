<?php

/**
 * API: Liste des abonnements (plans) et souscriptions utilisateurs
 * GET /api/abonnements/index.php                  — liste des plans
 * GET /api/abonnements/index.php?souscriptions=1  — souscriptions de l'utilisateur courant (admin: toutes)
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $db = Database::getInstance()->getConnection();

    if (isset($_GET['souscriptions'])) {
        $auth = Auth::verifyAuth();
        $isAdmin = $auth['role'] === 'admin';

        if ($isAdmin) {
            $query = "
                SELECT au.*,
                       a.nom AS abonnement_nom, a.prix AS abonnement_prix, a.type AS abonnement_type,
                       p.nom AS user_nom, p.prenom AS user_prenom, p.email AS user_email,
                       COALESCE(tc.montant_encaisse, 0) AS montant_encaisse
                FROM abonnements_utilisateurs au
                LEFT JOIN abonnements a ON au.abonnement_id = a.id
                LEFT JOIN persons p ON au.person_id = p.id
                LEFT JOIN (
                    SELECT abonnement_utilisateur_id, SUM(montant) AS montant_encaisse
                    FROM transactions_caisse
                    WHERE statut = 'encaisse'
                    GROUP BY abonnement_utilisateur_id
                ) tc ON tc.abonnement_utilisateur_id = au.id
                ORDER BY au.created_at DESC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute();
        } else {
            $query = "
                SELECT au.*,
                       a.nom AS abonnement_nom, a.prix AS abonnement_prix, a.type AS abonnement_type,
                       a.duree_mois AS abonnement_duree_mois, a.avantages AS abonnement_avantages
                FROM abonnements_utilisateurs au
                LEFT JOIN abonnements a ON au.abonnement_id = a.id
                WHERE au.person_id = :person_id
                ORDER BY au.created_at DESC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':person_id' => $auth['id']]);
        }

        $souscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($souscriptions as &$s) {
            if (!empty($s['abonnement_avantages'])) {
                $s['abonnement_avantages'] = json_decode($s['abonnement_avantages'], true);
            }
        }

        Response::success($souscriptions);
        exit;
    }

    $actif = isset($_GET['actif']) ? (int)$_GET['actif'] : null;
    $statut = isset($_GET['statut']) ? $_GET['statut'] : null;

    $where = [];
    $params = [];

    if ($actif !== null) {
        $where[] = "actif = :actif";
        $params[':actif'] = $actif;
    }

    if ($statut) {
        $where[] = "statut = :statut";
        $params[':statut'] = $statut;
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $query = "SELECT * FROM abonnements $whereClause ORDER BY ordre ASC, created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $abonnements = $stmt->fetchAll();

    foreach ($abonnements as &$abonnement) {
        if (!empty($abonnement['avantages'])) {
            $abonnement['avantages'] = json_decode($abonnement['avantages'], true);
        }
    }

    Response::success($abonnements);

} catch (Exception $e) {
    error_log("Get abonnements error: " . $e->getMessage());
    Response::serverError("Erreur lors de la récupération des abonnements");
}
