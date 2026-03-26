<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $auth = Auth::requireAdmin();
        $userId = $auth['id'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['checkin_id'])) {
            Response::error('ID de check-in requis', 400);
        }

        $checkinId = $data['checkin_id'];
        $rawDepart = $data['heure_depart_reel'] ?? date('Y-m-d H:i:s');
        try {
            $heureDepart = (new DateTime($rawDepart))->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            $heureDepart = date('Y-m-d H:i:s');
        }

        // Récupère le checkin + réservation + tarifs de l'espace
        $stmt = $db->prepare("
            SELECT
                c.id              AS checkin_id,
                c.heure_arrivee_reelle,
                c.reservation_id,
                r.montant_total   AS montant_resa,
                r.espace_id,
                e.prix_heure,
                e.prix_demi_journee,
                e.prix_jour,
                e.nom             AS espace_nom
            FROM checkins c
            LEFT JOIN reservations r ON c.reservation_id = r.id
            LEFT JOIN espaces      e ON r.espace_id      = e.id
            WHERE c.id = ? AND c.statut = 'en_cours'
        ");
        $stmt->execute([$checkinId]);
        $checkin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$checkin) {
            Response::notFound('Check-in non trouvé ou déjà terminé');
        }

        $db->beginTransaction();

        $db->prepare("
            UPDATE checkins
            SET heure_depart_reel = ?, statut = 'parti'
            WHERE id = ?
        ")->execute([$heureDepart, $checkinId]);

        $db->prepare("
            UPDATE reservations
            SET statut = 'terminee'
            WHERE id = ?
        ")->execute([$checkin['reservation_id']]);

        $db->commit();

        // ── Calcul du prix réel basé sur les heures effectives ───────────────
        $arrivee      = new DateTime($checkin['heure_arrivee_reelle']);
        $depart       = new DateTime($heureDepart);
        $dureeMinutes = max(0, ($depart->getTimestamp() - $arrivee->getTimestamp()) / 60);
        $dureeHeures  = $dureeMinutes / 60;

        $prixHeure      = floatval($checkin['prix_heure']       ?? 0);
        $prixDemiJour   = floatval($checkin['prix_demi_journee'] ?? 0);
        $prixJour       = floatval($checkin['prix_jour']         ?? 0);

        // Règles de tarification progressives
        // < 30 min → arrondi à 30 min (demi-heure minimum)
        // 30 min – 4h → heures pleines × prix_heure
        // 4h – 7h → prix demi-journée (si dispo) sinon horaire
        // > 7h → prix journée (si dispo) sinon horaire
        $heuresFacturees = ceil($dureeHeures * 2) / 2; // arrondi à 0,5h supérieure
        $heuresFacturees = max(0.5, $heuresFacturees);

        if ($dureeHeures <= 4) {
            $prixCalcule  = $heuresFacturees * $prixHeure;
            $detailCalcul = round($heuresFacturees, 1) . 'h × ' . number_format($prixHeure, 0, ',', ' ') . ' DA/h';
        } elseif ($dureeHeures <= 7 && $prixDemiJour > 0) {
            $prixCalcule  = $prixDemiJour;
            $detailCalcul = 'Demi-journée forfait';
        } elseif ($prixJour > 0) {
            $prixCalcule  = $prixJour;
            $detailCalcul = 'Journée forfait';
        } else {
            $prixCalcule  = $heuresFacturees * $prixHeure;
            $detailCalcul = round($heuresFacturees, 1) . 'h × ' . number_format($prixHeure, 0, ',', ' ') . ' DA/h';
        }

        $prixCalcule = round($prixCalcule, 2);

        Response::success([
            'message'        => 'Check-out enregistré avec succès',
            'duree_minutes'  => round($dureeMinutes),
            'duree_heures'   => round($dureeHeures, 2),
            'prix_calcule'   => $prixCalcule,
            'detail_calcul'  => $detailCalcul,
            'heure_arrivee'  => $checkin['heure_arrivee_reelle'],
            'heure_depart'   => $heureDepart,
        ]);

    } catch (Exception $e) {
        if (isset($db) && $db->inTransaction()) {
            $db->rollBack();
        }
        Response::error($e->getMessage());
    }
} else {
    Response::error('Méthode non autorisée', 405);
}
