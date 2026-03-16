<?php

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Methode non autorisee", 405);
}

function countWorkingDaysBetween(int $startTs, int $endTs): int {
    $count = 0;
    $cur = strtotime(date('Y-m-d', $startTs));
    $endDay = strtotime(date('Y-m-d', $endTs));
    while ($cur <= $endDay) {
        $dow = (int)date('N', $cur);
        if ($dow != 5 && $dow != 6) {
            $count++;
        }
        $cur += 86400;
    }
    return $count;
}

function computeReservationPrice(array $tarifs, int $debut, int $fin, array $rules): array {
    $seuilDemiJ = (int)$rules['reservation']['seuil_heure_demi_journee'];
    $seuilJour  = (int)$rules['reservation']['seuil_demi_journee_journee'];

    $prixHeure    = floatval($tarifs['prix_heure'] ?? 0);
    $prixDemiJour = floatval($tarifs['prix_demi_journee'] ?? 0);
    $prixJour     = floatval($tarifs['prix_jour'] ?? 0);
    $prixSemaine  = floatval($tarifs['prix_semaine'] ?? 0);
    $prixMois     = floatval($tarifs['prix_mois'] ?? 0);

    $heures  = ($fin - $debut) / 3600;
    $calDays = (strtotime(date('Y-m-d', $fin)) - strtotime(date('Y-m-d', $debut))) / 86400 + 1;

    if ($calDays <= 1) {
        if ($heures <= $seuilDemiJ) {
            $montant = ceil($heures) * $prixHeure;
            $type = 'heure';
        } elseif ($heures <= $seuilJour) {
            $montant = $prixDemiJour > 0 ? $prixDemiJour : ($prixJour / 2);
            $type = 'demi_journee';
        } else {
            $montant = $prixJour;
            $type = 'jour';
        }
    } else {
        $workingDays = countWorkingDaysBetween($debut, $fin);

        if ($calDays >= 28 && $prixMois > 0) {
            $mois = max(1, (int)round($calDays / 30));
            $montant = $mois * $prixMois;
            $type = 'mois';
        } elseif ($workingDays >= 5 && $prixSemaine > 0) {
            $semaines = (int)floor($workingDays / 5);
            $joursRestants = $workingDays - ($semaines * 5);
            $montant = $semaines * $prixSemaine + $joursRestants * $prixJour;
            $type = 'semaine';
        } else {
            $montant = $workingDays * $prixJour;
            $type = 'jour';
        }
    }

    return ['montant' => $montant, 'type' => $type];
}

try {
    $auth = Auth::verifyAuth();
    $authUserId = $auth['id'];

    $stmtUser = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmtUser->execute([$authUserId]);
    $authUser = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$authUser) {
        Response::error("Utilisateur introuvable", 404);
    }

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        Response::error("Donnees JSON invalides", 400);
    }

    $targetUserId = $data['user_id'] ?? null;
    $targetContactId = $data['contact_id'] ?? null;
    $espaceId = $data['espace_id'] ?? null;
    $dateDebut = $data['date_debut'] ?? null;
    $dateFin = $data['date_fin'] ?? null;
    $participants = max(1, isset($data['participants']) ? intval($data['participants']) : 1);
    $notes = isset($data['notes']) ? trim($data['notes']) : '';
    $codePromo = $data['code_promo'] ?? null;
    $statutDemande = $data['statut'] ?? null;

    $db = Database::getInstance()->getConnection();

    $allowedStatuts = ['en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee'];
    if ($authUser['role'] === 'admin') {
        if ($targetUserId && $targetContactId) {
            Response::error("Une reservation ne peut etre liee qu'a un utilisateur OU un contact, pas les deux", 400);
        }
        if (!$targetUserId && !$targetContactId) {
            Response::error("Un utilisateur ou un contact est requis pour la reservation", 400);
        }
        $userId = $targetUserId;
        $contactId = $targetContactId;
        $statutInitial = ($statutDemande && in_array($statutDemande, $allowedStatuts)) ? $statutDemande : 'en_attente';
    } else {
        $userId = $authUserId;
        $contactId = null;
        $statutInitial = 'en_attente';

        $stmtCni = $db->prepare("SELECT id FROM documents_uploads WHERE user_id = ? AND type_document = 'carte_identite' LIMIT 1");
        $stmtCni->execute([$authUserId]);
        $hasCarteIdentite = $stmtCni->fetch() !== false;
        if (!$hasCarteIdentite && empty($authUser['carte_identite_url'])) {
            Response::error("Veuillez télécharger votre carte d'identité avant d'effectuer une réservation. Rendez-vous dans votre profil.", 403);
        }
    }

    if (empty($espaceId)) {
        Response::error("L'espace est requis", 400);
    }

    if (empty($dateDebut)) {
        Response::error("La date de debut est requise", 400);
    }

    if (empty($dateFin)) {
        Response::error("La date de fin est requise", 400);
    }

    function parseInputDate(string $input): string {
        if (preg_match('/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $input)) {
            $dt = new DateTime($input);
            $dt->setTimezone(new DateTimeZone('Africa/Algiers'));
            return $dt->format('Y-m-d H:i:s');
        }
        $clean = str_replace(['T', 'Z'], [' ', ''], $input);
        $clean = preg_replace('/\.\d{3}$/', '', $clean);
        return trim($clean);
    }

    $dateDebut = parseInputDate($dateDebut);
    $dateFin   = parseInputDate($dateFin);

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

    $debutDow = (int)date('N', $debut);
    $finDow   = (int)date('N', $fin);
    if ($debutDow == 5 || $debutDow == 6) {
        Response::error("Coffice est fermé le vendredi et le samedi", 400);
    }
    if ($finDow == 5 || $finDow == 6) {
        Response::error("La date de fin tombe un jour de fermeture (vendredi ou samedi)", 400);
    }

    $debutHour    = (int)date('H', $debut);
    $debutMinute  = (int)date('i', $debut);
    $finHour      = (int)date('H', $fin);
    $finMinute    = (int)date('i', $fin);
    $debutMinutes = $debutHour * 60 + $debutMinute;
    $finMinutes   = $finHour * 60 + $finMinute;
    $OPEN_MINUTES  = 8 * 60 + 30;
    $CLOSE_MINUTES = 18 * 60 + 30;

    if ($debutMinutes < $OPEN_MINUTES) {
        Response::error("L'heure de début ne peut pas être avant 08:30", 400);
    }
    if ($finMinutes > $CLOSE_MINUTES) {
        Response::error("L'heure de fin ne peut pas être après 18:30", 400);
    }

    $debutMysql = date('Y-m-d H:i:s', $debut);
    $finMysql   = date('Y-m-d H:i:s', $fin);

    $stmt = $db->prepare("SELECT id, nom, type, capacite, disponible FROM espaces WHERE id = ?");
    $stmt->execute([$espaceId]);
    $espace = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$espace) {
        Response::error("Espace introuvable", 404);
    }

    if (!$espace['disponible']) {
        Response::error("Cet espace n'est pas disponible", 400);
    }

    $capacite = intval($espace['capacite']);
    if ($participants > $capacite) {
        Response::error("Le nombre de participants ($participants) depasse la capacite maximale de l'espace ($capacite places)", 400);
    }

    if (!($authUser['role'] === 'admin')) {
        $now = new DateTime('now', new DateTimeZone('Africa/Algiers'));
        $debutDt = new DateTime($debutMysql, new DateTimeZone('Africa/Algiers'));
        if ($debutDt < $now) {
            Response::error("La date de debut ne peut pas etre dans le passe", 400);
        }
    }

    $isOpenSpace = strtolower($espace['type']) === 'open_space';

    $rules = require __DIR__ . '/../config/business-rules.php';

    $stmtTarifs = $db->prepare("SELECT prix_heure, prix_demi_journee, prix_jour, prix_semaine, prix_mois FROM espaces WHERE id = ?");
    $stmtTarifs->execute([$espaceId]);
    $tarifs = $stmtTarifs->fetch(PDO::FETCH_ASSOC);

    $priceResult = computeReservationPrice($tarifs, $debut, $fin, $rules);
    $montant     = $priceResult['montant'];
    $type        = $priceResult['type'];

    if ($isOpenSpace) {
        $montant *= $participants;
    }

    $reduction = 0;
    $codePromoId = null;
    $montantAvantReduction = $montant;

    $db->beginTransaction();

    if ($isOpenSpace) {
        $stmtAvail = $db->prepare("
            SELECT COALESCE(SUM(GREATEST(COALESCE(participants, 1), 1)), 0) as seats_taken
            FROM reservations
            WHERE espace_id = ?
            AND statut NOT IN ('annulee', 'terminee')
            AND date_debut < ?
            AND date_fin > ?
            FOR UPDATE
        ");
        $stmtAvail->execute([$espaceId, $finMysql, $debutMysql]);
        $rowAvail = $stmtAvail->fetch(PDO::FETCH_ASSOC);
        $seatsTaken = intval($rowAvail['seats_taken'] ?? 0);

        if ($seatsTaken + $participants > $capacite) {
            $db->rollBack();
            $seatsLeft = max(0, $capacite - $seatsTaken);
            if ($seatsLeft === 0) {
                Response::error("L'Open Space est complet sur ce creneau (0 place disponible)", 409);
            } else {
                Response::error("Seulement $seatsLeft place(s) disponible(s) sur ce creneau (vous en demandez $participants)", 409);
            }
        }
    } else {
        $stmtAvail = $db->prepare("
            SELECT id FROM reservations
            WHERE espace_id = ?
            AND statut NOT IN ('annulee', 'terminee')
            AND date_debut < ?
            AND date_fin > ?
            FOR UPDATE
            LIMIT 1
        ");
        $stmtAvail->execute([$espaceId, $finMysql, $debutMysql]);
        if ($stmtAvail->fetch()) {
            $db->rollBack();
            Response::error("Ce creneau est deja reserve", 409);
        }
    }

    if (!empty($codePromo)) {
        $stmt = $db->prepare("
            SELECT id, type, valeur, montant_min, utilisations_max, utilisations_actuelles, utilisations_par_user, date_fin, actif
            FROM codes_promo
            WHERE code = ? AND actif = 1
            FOR UPDATE
        ");
        $stmt->execute([$codePromo]);
        $promo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($promo) {
            $isValid = true;

            if ($promo['date_fin'] && strtotime($promo['date_fin']) < time()) {
                $isValid = false;
            }

            if ($promo['utilisations_max'] > 0 && $promo['utilisations_actuelles'] >= $promo['utilisations_max']) {
                $isValid = false;
            }

            if ($promo['montant_min'] > 0 && $montant < $promo['montant_min']) {
                $isValid = false;
            }

            if ($isValid && $userId && !empty($promo['utilisations_par_user']) && intval($promo['utilisations_par_user']) > 0) {
                $userUsageStmt = $db->prepare("
                    SELECT COUNT(*) as cnt FROM utilisations_codes_promo
                    WHERE code_promo_id = ? AND user_id = ?
                ");
                $userUsageStmt->execute([$promo['id'], $userId]);
                $userUsageRow = $userUsageStmt->fetch(PDO::FETCH_ASSOC);
                if (intval($userUsageRow['cnt']) >= intval($promo['utilisations_par_user'])) {
                    $isValid = false;
                }
            }

            if ($isValid) {
                $codePromoId = $promo['id'];
                if ($promo['type'] === 'pourcentage') {
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW())
    ");

    $result = $stmt->execute([
        $id,
        $userId,
        $contactId,
        $espaceId,
        $debutMysql,
        $finMysql,
        $statutInitial,
        $type,
        $montant,
        $participants,
        $notes,
        $codePromoId
    ]);

    if (!$result) {
        $db->rollBack();
        $errorInfo = $stmt->errorInfo();
        Logger::error('Reservation INSERT error', ['sql_error' => $errorInfo[2] ?? 'unknown']);
        Response::error("Erreur lors de la creation de la reservation", 500);
    }

    if ($codePromoId) {
        $montantAvant = $montantAvantReduction;
        $db->prepare("
            INSERT INTO utilisations_codes_promo (id, code_promo_id, user_id, reservation_id, montant_reduction, montant_avant, montant_apres, type_utilisation, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'reservation', NOW())
        ")->execute([UuidHelper::generate(), $codePromoId, $userId, $id, $reduction, $montantAvant, $montant]);
        $db->prepare("UPDATE codes_promo SET utilisations_actuelles = utilisations_actuelles + 1 WHERE id = ?")->execute([$codePromoId]);
    }

    $db->commit();

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
        Logger::warn('Admin notification error', ['error' => $notifErr->getMessage()]);
    }

    Response::success($reservation, "Reservation creee avec succes", 201);

} catch (PDOException $e) {
    Logger::error('Reservation create PDO error', ['error' => $e->getMessage()]);
    Response::error("Erreur base de donnees", 500);
} catch (Exception $e) {
    Logger::error('Reservation create error', ['error' => $e->getMessage()]);
    Response::error("Erreur lors de la creation de la reservation", 500);
}
