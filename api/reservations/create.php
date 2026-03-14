<?php

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Methode non autorisee", 405);
}

try {
    $auth = Auth::verifyAuth();
    $authUserId = $auth['id'];
    $authUser = (new Auth())->getUserById($authUserId);

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    error_log("=== RESERVATION CREATE REQUEST ===");
    error_log("Raw input: " . $input);
    error_log("Decoded data: " . json_encode($data));
    error_log("Auth User ID: " . $authUserId);
    error_log("Auth User Role: " . $authUser['role']);

    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg());
        Response::error("Donnees JSON invalides", 400);
    }

    $targetUserId = $data['user_id'] ?? null;
    $targetContactId = $data['contact_id'] ?? null;
    $espaceId = $data['espace_id'] ?? null;
    $dateDebut = $data['date_debut'] ?? null;
    $dateFin = $data['date_fin'] ?? null;
    $participants = isset($data['participants']) ? intval($data['participants']) : 1;
    $notes = isset($data['notes']) ? trim($data['notes']) : '';
    $codePromo = $data['code_promo'] ?? null;

    if ($authUser['role'] === 'admin') {
        if ($targetUserId && $targetContactId) {
            Response::error("Une reservation ne peut etre liee qu'a un utilisateur OU un contact, pas les deux", 400);
        }
        if (!$targetUserId && !$targetContactId) {
            Response::error("Un utilisateur ou un contact est requis pour la reservation", 400);
        }
        $userId = $targetUserId;
        $contactId = $targetContactId;
    } else {
        $userId = $authUserId;
        $contactId = null;

        if (empty($authUser['carte_identite_url'])) {
            Response::error("Vous devez télécharger votre carte d'identité avant d'effectuer une réservation.", 403);
        }
    }

    if (empty($espaceId)) {
        error_log("ERROR: espace_id is empty");
        Response::error("L'espace est requis", 400);
    }

    error_log("Checking espace with ID: " . $espaceId);

    if (empty($dateDebut)) {
        Response::error("La date de debut est requise", 400);
    }

    if (empty($dateFin)) {
        Response::error("La date de fin est requise", 400);
    }

    $dateDebut = str_replace(['T', 'Z'], [' ', ''], $dateDebut);
    $dateDebut = preg_replace('/\.\d{3}$/', '', $dateDebut);
    $dateFin = str_replace(['T', 'Z'], [' ', ''], $dateFin);
    $dateFin = preg_replace('/\.\d{3}$/', '', $dateFin);

    $debut = strtotime($dateDebut);
    $fin = strtotime($dateFin);

    if ($debut === false) {
        Response::error("Format de date de debut invalide: $dateDebut", 400);
    }

    if ($fin === false) {
        Response::error("Format de date de fin invalide: $dateFin", 400);
    }

    if ($fin <= $debut) {
        Response::error("La date de fin doit etre apres la date de debut", 400);
    }

    $debutMysql = date('Y-m-d H:i:s', $debut);
    $finMysql = date('Y-m-d H:i:s', $fin);

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("SELECT id, nom, type, capacite, prix_heure, prix_jour, disponible FROM espaces WHERE id = ?");
    $stmt->execute([$espaceId]);
    $espace = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$espace) {
        error_log("ERROR: Espace not found with ID: " . $espaceId);

        // List available espaces for debugging
        $stmtAll = $db->query("SELECT id, nom FROM espaces LIMIT 10");
        $allEspaces = $stmtAll->fetchAll(PDO::FETCH_ASSOC);
        error_log("Available espaces: " . json_encode($allEspaces));

        Response::error("Espace introuvable avec l'ID: " . $espaceId, 404);
    }

    error_log("Espace found: " . $espace['nom'] . " (" . $espace['id'] . ")");

    if (!$espace['disponible']) {
        Response::error("Cet espace n'est pas disponible", 400);
    }

    if ($participants < 1) {
        $participants = 1;
    }

    if ($participants > intval($espace['capacite'])) {
        $participants = intval($espace['capacite']);
    }

    $stmt = $db->prepare("
        SELECT id FROM reservations
        WHERE espace_id = ?
        AND statut NOT IN ('annulee', 'terminee')
        AND (
            (date_debut < ? AND date_fin > ?)
            OR (date_debut < ? AND date_fin > ?)
            OR (date_debut >= ? AND date_fin <= ?)
        )
        LIMIT 1
    ");
    $stmt->execute([
        $espaceId,
        $finMysql, $debutMysql,
        $finMysql, $debutMysql,
        $debutMysql, $finMysql
    ]);

    if ($stmt->fetch()) {
        Response::error("Ce creneau est deja reserve", 409);
    }

    $heures = ($fin - $debut) / 3600;
    $prixHeure = floatval($espace['prix_heure']);
    $prixJour = floatval($espace['prix_jour']);

    if ($heures <= 4) {
        $montant = ceil($heures) * $prixHeure;
        $type = 'heure';
    } elseif ($heures <= 8) {
        $montant = $prixJour / 2;
        $type = 'demi_journee';
    } elseif ($heures <= 24) {
        $montant = $prixJour;
        $type = 'jour';
    } else {
        $jours = ceil($heures / 24);
        $montant = $jours * $prixJour;
        $type = 'jour';
    }

    $reduction = 0;
    $codePromoId = null;
    if (!empty($codePromo)) {
        $stmt = $db->prepare("
            SELECT id, type_reduction, valeur, montant_minimum, utilisations_max, utilisations_actuelles, date_expiration, actif
            FROM codes_promo
            WHERE code = ? AND actif = 1
        ");
        $stmt->execute([$codePromo]);
        $promo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($promo) {
            $isValid = true;

            if ($promo['date_expiration'] && strtotime($promo['date_expiration']) < time()) {
                $isValid = false;
            }

            if ($promo['utilisations_max'] > 0 && $promo['utilisations_actuelles'] >= $promo['utilisations_max']) {
                $isValid = false;
            }

            if ($promo['montant_minimum'] > 0 && $montant < $promo['montant_minimum']) {
                $isValid = false;
            }

            if ($isValid) {
                $codePromoId = $promo['id'];
                if ($promo['type_reduction'] === 'pourcentage') {
                    $reduction = $montant * ($promo['valeur'] / 100);
                } else {
                    $reduction = min($promo['valeur'], $montant);
                }
                $montant = max(0, $montant - $reduction);
            }
        }
    }

    $id = UuidHelper::generate();

    $stmt = $db->prepare("
        INSERT INTO reservations
        (id, user_id, contact_id, espace_id, date_debut, date_fin, statut, type_reservation, montant_total, montant_paye, participants, notes, code_promo_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'en_attente', ?, ?, 0, ?, ?, ?, NOW())
    ");

    $result = $stmt->execute([
        $id,
        $userId,
        $contactId,
        $espaceId,
        $debutMysql,
        $finMysql,
        $type,
        $montant,
        $participants,
        $notes,
        $codePromoId
    ]);

    if (!$result) {
        $errorInfo = $stmt->errorInfo();
        error_log("Reservation INSERT error: " . json_encode($errorInfo));
        error_log("Reservation data: " . json_encode([
            'id' => $id,
            'user_id' => $userId,
            'espace_id' => $espaceId,
            'date_debut' => $debutMysql,
            'date_fin' => $finMysql,
            'type' => $type,
            'montant' => $montant,
            'participants' => $participants,
            'notes' => $notes,
            'code_promo_id' => $codePromoId
        ]));
        Response::error("Erreur lors de la creation de la reservation: " . ($errorInfo[2] ?? 'inconnue'), 500);
    }

    if ($codePromoId) {
        $db->prepare("UPDATE codes_promo SET utilisations_actuelles = utilisations_actuelles + 1 WHERE id = ?")->execute([$codePromoId]);
    }

    $stmt = $db->prepare("
        SELECT r.*, e.nom as espace_nom, e.type as espace_type,
               u.nom as user_nom, u.prenom as user_prenom, u.email as user_email,
               c.nom as contact_nom, c.prenom as contact_prenom, c.email as contact_email
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN contacts c ON r.contact_id = c.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    try {
        $clientName = '';
        $clientEmail = '';

        if ($userId) {
            $clientName = $reservation['user_prenom'] . ' ' . $reservation['user_nom'];
            $clientEmail = $reservation['user_email'];
        } elseif ($contactId) {
            $clientName = $reservation['contact_prenom'] . ' ' . $reservation['contact_nom'];
            $clientEmail = $reservation['contact_email'] ?? '';
        }

        if ($clientName) {
            AdminNotifier::newReservation($reservation, $clientName, $clientEmail);
        }
    } catch (Exception $notifErr) {
        error_log("Admin notification error: " . $notifErr->getMessage());
    }

    Response::success($reservation, "Reservation creee avec succes", 201);

} catch (PDOException $e) {
    error_log("Reservation create PDO error: " . $e->getMessage());
    error_log("PDO Stack trace: " . $e->getTraceAsString());
    Response::error("Erreur base de donnees: " . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("Reservation create error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    Response::error("Erreur lors de la creation de la reservation: " . $e->getMessage(), 500);
}
