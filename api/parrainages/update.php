<?php

/**
 * API: Mise à jour du statut d'un parrainage
 * PATCH /api/parrainages/update.php
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::verifyAuth();

    if ($auth['role'] !== 'admin') {
        Response::error("Accès non autorisé", 403);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $statut = $data['statut'] ?? null;

    if (!$id || !$statut) {
        Response::error("Paramètres manquants (id, statut)", 400);
    }

    $allowedStatuts = ['en_attente', 'valide', 'paye'];
    if (!in_array($statut, $allowedStatuts)) {
        Response::error("Statut invalide. Valeurs acceptées : " . implode(', ', $allowedStatuts), 400);
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT id, statut FROM parrainages_details WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $detail = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$detail) {
        Response::error("Parrainage introuvable", 404);
    }

    $db->beginTransaction();

    $dateValidation = $statut === 'valide' ? ", date_validation = NOW()" : "";
    $query = "UPDATE parrainages_details SET statut = :statut" . $dateValidation . " WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':statut' => $statut, ':id' => $id]);

    $info = null;
    $recompense = 0;

    if ($statut === 'valide' || $statut === 'paye') {
        $stmt = $db->prepare("SELECT recompense_parrain, recompense_filleul, filleul_id, parrainage_id FROM parrainages_details WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && $statut === 'paye' && $detail['statut'] !== 'paye') {
            $parrainage_id      = $row['parrainage_id'];
            $recompense         = (int)$row['recompense_parrain'];
            $recompenseFilleul  = (int)$row['recompense_filleul'];
            $filleulId          = $row['filleul_id'];

            // Récupérer le parrain (id, email, prenom) et le filleul (prenom, nom)
            $infoStmt = $db->prepare("
                SELECT
                    up.id AS parrain_id, up.email AS parrain_email, up.prenom AS parrain_prenom,
                    uf.prenom AS filleul_prenom, uf.nom AS filleul_nom
                FROM parrainages pa
                JOIN parrainages_details pd ON pd.parrainage_id = pa.id AND pd.id = :detail_id
                JOIN persons up ON up.id = pa.parrain_id
                JOIN persons uf ON uf.id = pd.filleul_id
                WHERE pa.id = :pid
                LIMIT 1
            ");
            $infoStmt->execute([':detail_id' => $id, ':pid' => $parrainage_id]);
            $info = $infoStmt->fetch(PDO::FETCH_ASSOC);

            // Créditer le compte du parrain
            if ($info && $recompense > 0) {
                $db->prepare("UPDATE persons SET credit = credit + :amount WHERE id = :uid")
                   ->execute([':amount' => $recompense, ':uid' => $info['parrain_id']]);
            }

            // Créditer le compte du filleul
            if ($filleulId && $recompenseFilleul > 0) {
                $db->prepare("UPDATE persons SET credit = credit + :amount WHERE id = :uid")
                   ->execute([':amount' => $recompenseFilleul, ':uid' => $filleulId]);

                // Notification filleul
                $db->prepare("
                    INSERT INTO notifications (id, person_id, type, titre, message, lue, created_at)
                    VALUES (?, ?, 'parrainage', 'Bonus parrainage crédité !', ?, 0, NOW())
                ")->execute([
                    UuidHelper::generate(),
                    $filleulId,
                    'Votre bonus de parrainage de ' . number_format($recompenseFilleul, 0, ',', ' ') . ' DA a été crédité sur votre compte.',
                ]);
            }

            $db->prepare("UPDATE parrainages SET updated_at = NOW() WHERE id = :pid")
               ->execute([':pid' => $parrainage_id]);
        }
    }

    $db->commit();

    // Envoyer l'email de bonus au parrain (hors transaction)
    if ($info && $recompense > 0) {
        try {
            Mailer::sendParrainageBonus(
                $info['parrain_email'],
                $info['parrain_prenom'],
                $info['filleul_prenom'],
                $info['filleul_nom'],
                $recompense,
                $info['parrain_id']
            );
        } catch (Exception $e) {
            Logger::error('Parrainage bonus email failed', ['error' => $e->getMessage()]);
        }
    }

    Response::success(['message' => 'Statut mis à jour avec succès', 'statut' => $statut]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Parrainages update error: " . $e->getMessage());
    Response::serverError("Erreur lors de la mise à jour");
}
