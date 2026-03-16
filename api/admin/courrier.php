<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $userRole = $auth['role'];

    if ($method === 'GET') {
        $domiciliationId = $_GET['domiciliation_id'] ?? null;

        if ($userRole !== 'admin' && $domiciliationId) {
            $checkStmt = $db->prepare("SELECT user_id FROM domiciliations WHERE id = ?");
            $checkStmt->execute([$domiciliationId]);
            $domiciliation = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$domiciliation || $domiciliation['user_id'] !== $userId) {
                Response::forbidden('Accès refusé');
            }
        }

        $query = "
            SELECT
                c.*,
                d.raison_sociale,
                d.user_id,
                u.email, u.prenom, u.nom
            FROM courriers c
            LEFT JOIN domiciliations d ON c.domiciliation_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE 1=1
        ";
        $params = [];

        if ($domiciliationId) {
            $query .= " AND c.domiciliation_id = ?";
            $params[] = $domiciliationId;
        } elseif ($userRole !== 'admin') {
            $query .= " AND d.user_id = ?";
            $params[] = $userId;
        }

        $query .= " ORDER BY c.date_reception DESC";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $courriers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['courriers' => $courriers]);

    } elseif ($method === 'POST') {
        if ($userRole !== 'admin') {
            Response::forbidden('Accès réservé aux administrateurs');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['domiciliation_id'], $data['type'])) {
            Response::error('Données manquantes: domiciliation_id, type requis', 400);
        }

        $domStmt = $db->prepare("SELECT user_id, raison_sociale FROM domiciliations WHERE id = ?");
        $domStmt->execute([$data['domiciliation_id']]);
        $domRow = $domStmt->fetch(PDO::FETCH_ASSOC);
        if (!$domRow) {
            Response::notFound('Domiciliation introuvable');
        }

        $id = UuidHelper::generate();
        $insertStmt = $db->prepare("
            INSERT INTO courriers
            (id, domiciliation_id, type, expediteur, description, photo_url, statut, date_reception, date_notification, notes_admin)
            VALUES (?, ?, ?, ?, ?, ?, 'notifie', NOW(), NOW(), ?)
        ");
        $insertStmt->execute([
            $id,
            $data['domiciliation_id'],
            $data['type'],
            $data['expediteur'] ?? '',
            $data['description'] ?? null,
            $data['photo_url'] ?? null,
            $data['notes'] ?? $data['notes_admin'] ?? null,
        ]);

        $userStmt = $db->prepare("
            SELECT u.email, u.prenom, u.nom, d.raison_sociale
            FROM domiciliations d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        ");
        $userStmt->execute([$data['domiciliation_id']]);
        $domiciliation = $userStmt->fetch(PDO::FETCH_ASSOC);

        if ($domiciliation && $domiciliation['email']) {
            try {
                Mailer::send(
                    $domiciliation['email'],
                    'Nouveau courrier reçu - Coffice',
                    Mailer::wrapInLayout('Nouveau courrier reçu', "
                        <h2 style='color:#111827;font-size:22px;margin:0 0 16px;'>Nouveau courrier reçu</h2>
                        <p style='color:#4b5563;font-size:15px;line-height:1.6;'>Bonjour {$domiciliation['prenom']},</p>
                        <p style='color:#4b5563;font-size:15px;line-height:1.6;'>Un nouveau courrier a été reçu pour <strong>{$domiciliation['raison_sociale']}</strong>.</p>
                        <p style='color:#4b5563;font-size:15px;line-height:1.6;'><strong>Type :</strong> {$data['type']}</p>
                        <p style='color:#4b5563;font-size:15px;line-height:1.6;'><strong>Expéditeur :</strong> " . ($data['expediteur'] ?? 'Non spécifié') . "</p>
                        <p style='color:#4b5563;font-size:15px;line-height:1.6;'>Connectez-vous à votre espace pour donner vos instructions.</p>
                    ")
                );
            } catch (Exception $e) {
                Logger::warning('Courrier email notification failed', ['error' => $e->getMessage()]);
            }

            try {
                $notifId = UuidHelper::generate();
                $notifStmt = $db->prepare("
                    INSERT INTO notifications (id, user_id, type, titre, message, lue)
                    VALUES (?, ?, 'domiciliation', ?, ?, 0)
                ");
                $notifStmt->execute([
                    $notifId,
                    $domRow['user_id'],
                    'Nouveau courrier reçu',
                    "Un nouveau courrier a été reçu pour {$domiciliation['raison_sociale']}",
                ]);
            } catch (Exception $e) {
                Logger::warning('Courrier notification insert failed', ['error' => $e->getMessage()]);
            }
        }

        Response::success([
            'id' => $id,
            'message' => 'Courrier enregistré et client notifié'
        ]);

    } elseif ($method === 'PUT') {
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data) {
            Response::error('Données invalides', 400);
        }

        $courrierId = $data['courrier_id'] ?? $data['id'] ?? null;
        if (!$courrierId) {
            Response::error('courrier_id ou id requis', 400);
        }

        $checkStmt = $db->prepare("
            SELECT c.*, d.user_id
            FROM courriers c
            LEFT JOIN domiciliations d ON c.domiciliation_id = d.id
            WHERE c.id = ?
        ");
        $checkStmt->execute([$courrierId]);
        $courrier = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$courrier) {
            Response::notFound('Courrier non trouvé');
        }

        if ($userRole !== 'admin' && $courrier['user_id'] !== $userId) {
            Response::forbidden('Accès refusé');
        }

        $action = $data['action'] ?? null;

        if ($action === 'recuperer' || $action === 'marquer_retire') {
            $notesVal = $data['retire_par'] ?? $data['notes'] ?? $data['notes_admin'] ?? null;
            $updateStmt = $db->prepare("
                UPDATE courriers
                SET statut = 'recupere', date_traitement = NOW(), notes_admin = COALESCE(?, notes_admin)
                WHERE id = ?
            ");
            $updateStmt->execute([$notesVal, $courrierId]);
            Response::success(['message' => 'Courrier marqué comme récupéré']);

        } elseif ($action === 'reexpedier' || $action === 'marquer_envoye') {
            $updateStmt = $db->prepare("
                UPDATE courriers
                SET statut = 'reexpedier', instruction_client = 'reexpedier', date_traitement = NOW(), notes_admin = COALESCE(?, notes_admin)
                WHERE id = ?
            ");
            $updateStmt->execute([$data['notes'] ?? $data['notes_admin'] ?? null, $courrierId]);
            Response::success(['message' => 'Courrier marqué pour réexpédition']);

        } elseif ($action === 'scanner') {
            $updateStmt = $db->prepare("
                UPDATE courriers
                SET statut = 'scanne', instruction_client = 'scanner', scan_url = COALESCE(?, scan_url)
                WHERE id = ?
            ");
            $updateStmt->execute([$data['scan_url'] ?? null, $courrierId]);
            Response::success(['message' => 'Scan demandé']);

        } elseif ($action === 'archiver') {
            $updateStmt = $db->prepare("
                UPDATE courriers
                SET statut = 'traite', date_traitement = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([$courrierId]);
            Response::success(['message' => 'Courrier archivé']);

        } elseif ($action === 'instruction_client' || isset($data['instruction_client'])) {
            $instruction = $data['instruction_client'] ?? $data['instruction'] ?? '';
            $updateStmt = $db->prepare("
                UPDATE courriers
                SET instruction_client = ?, statut = 'en_attente_instruction', date_instruction = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([$instruction, $courrierId]);
            Response::success(['message' => 'Instruction enregistrée']);

        } elseif (isset($data['statut'])) {
            $allowedStatuts = ['recu', 'notifie', 'en_attente_instruction', 'recupere', 'scanne', 'reexpedier', 'traite'];
            if (!in_array($data['statut'], $allowedStatuts)) {
                Response::error('Statut invalide', 400);
            }
            $updateStmt = $db->prepare("UPDATE courriers SET statut = ? WHERE id = ?");
            $updateStmt->execute([$data['statut'], $courrierId]);
            Response::success(['message' => 'Statut mis à jour']);

        } elseif (isset($data['notes']) || isset($data['notes_admin'])) {
            $notes = $data['notes_admin'] ?? $data['notes'];
            $updateStmt = $db->prepare("UPDATE courriers SET notes_admin = ? WHERE id = ?");
            $updateStmt->execute([$notes, $courrierId]);
            Response::success(['message' => 'Notes mises à jour']);

        } else {
            Response::error('Action ou champ à mettre à jour requis', 400);
        }

    } else {
        Response::error('Méthode non autorisée', 405);
    }
} catch (Exception $e) {
    Response::error($e->getMessage());
}
