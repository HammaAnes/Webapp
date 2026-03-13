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

        $id = UuidHelper::generate();
        $insertStmt = $db->prepare("
            INSERT INTO courriers
            (id, domiciliation_id, type, expediteur, description, photo_url, statut, date_reception)
            VALUES (?, ?, ?, ?, ?, ?, 'recu', NOW())
        ");
        $insertStmt->execute([
            $id,
            $data['domiciliation_id'],
            $data['type'],
            $data['expediteur'] ?? '',
            $data['description'] ?? '',
            $data['photo_url'] ?? null
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

            $userIdStmt = $db->prepare("SELECT user_id FROM domiciliations WHERE id = ?");
            $userIdStmt->execute([$data['domiciliation_id']]);
            $userIdRow = $userIdStmt->fetch(PDO::FETCH_ASSOC);
            if ($userIdRow) {
                $notifId = UuidHelper::generate();
                $notifStmt = $db->prepare("
                    INSERT INTO notifications (id, user_id, type, message, created_at)
                    VALUES (?, ?, 'courrier', ?, NOW())
                ");
                $notifStmt->execute([
                    $notifId,
                    $userIdRow['user_id'],
                    "Nouveau courrier reçu pour {$domiciliation['raison_sociale']}"
                ]);
            }
        }

        $updateStmt = $db->prepare("
            UPDATE courriers SET statut = 'notifie', date_notification = NOW() WHERE id = ?
        ");
        $updateStmt->execute([$id]);

        Response::success([
            'id' => $id,
            'message' => 'Courrier enregistré et client notifié'
        ]);

    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['courrier_id'], $data['instruction_client'])) {
            Response::error('Données manquantes: courrier_id, instruction_client requis', 400);
        }

        $checkStmt = $db->prepare("
            SELECT c.*, d.user_id
            FROM courriers c
            LEFT JOIN domiciliations d ON c.domiciliation_id = d.id
            WHERE c.id = ?
        ");
        $checkStmt->execute([$data['courrier_id']]);
        $courrier = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$courrier) {
            Response::notFound('Courrier non trouvé');
        }

        if ($userRole !== 'admin' && $courrier['user_id'] !== $userId) {
            Response::forbidden('Accès refusé');
        }

        $updateStmt = $db->prepare("
            UPDATE courriers
            SET instruction_client = ?, statut = 'en_attente_instruction', date_instruction = NOW()
            WHERE id = ?
        ");
        $updateStmt->execute([
            $data['instruction_client'],
            $data['courrier_id']
        ]);

        Response::success(['message' => 'Instruction enregistrée']);

    } else {
        Response::error('Méthode non autorisée', 405);
    }
} catch (Exception $e) {
    Response::error($e->getMessage());
}
