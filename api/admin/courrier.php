<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/UuidHelper.php';
require_once __DIR__ . '/../utils/Mailer.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;
use Utils\UuidHelper;
use Utils\Mailer;

$method = $_SERVER['REQUEST_METHOD'];

try {
    $userId = Auth::getUserId();
    if (!$userId) {
        Response::unauthorized('Non authentifié');
    }

    $user = Auth::getUser();

    if ($method === 'GET') {
        $domiciliationId = $_GET['domiciliation_id'] ?? null;

        // Vérifier les droits : admin OU propriétaire de la domiciliation
        if ($user['role'] !== 'admin' && $domiciliationId) {
            $checkStmt = $pdo->prepare("SELECT user_id FROM domiciliations WHERE id = ?");
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
        }

        $query .= " ORDER BY c.date_reception DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $courriers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['courriers' => $courriers]);

    } elseif ($method === 'POST') {
        // Admin seulement : enregistrer réception d'un courrier
        if ($user['role'] !== 'admin') {
            Response::forbidden('Accès réservé aux administrateurs');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['domiciliation_id'], $data['type'])) {
            Response::badRequest('Données manquantes: domiciliation_id, type requis');
        }

        $id = UuidHelper::generate();
        $insertStmt = $pdo->prepare("
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

        // Récupérer l'email du client
        $userStmt = $pdo->prepare("
            SELECT u.email, u.prenom, u.nom, d.raison_sociale
            FROM domiciliations d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        ");
        $userStmt->execute([$data['domiciliation_id']]);
        $domiciliation = $userStmt->fetch(PDO::FETCH_ASSOC);

        // Envoyer notification email
        if ($domiciliation) {
            $mailer = new Mailer();
            $html = "
                <h2>Nouveau courrier reçu</h2>
                <p>Bonjour {$domiciliation['prenom']},</p>
                <p>Un nouveau courrier a été reçu pour {$domiciliation['raison_sociale']}.</p>
                <p><strong>Type:</strong> {$data['type']}</p>
                <p><strong>Expéditeur:</strong> " . ($data['expediteur'] ?? 'Non spécifié') . "</p>
                <p>Connectez-vous à votre espace pour donner vos instructions.</p>
            ";
            $mailer->send($domiciliation['email'], 'Nouveau courrier reçu - Coffice', $html);

            // Créer notification in-app
            $notifId = UuidHelper::generate();
            $notifStmt = $pdo->prepare("
                INSERT INTO notifications (id, user_id, type, message, created_at)
                VALUES (?, ?, 'courrier', ?, NOW())
            ");
            $userIdStmt = $pdo->prepare("SELECT user_id FROM domiciliations WHERE id = ?");
            $userIdStmt->execute([$data['domiciliation_id']]);
            $userIdRow = $userIdStmt->fetch(PDO::FETCH_ASSOC);
            if ($userIdRow) {
                $notifStmt->execute([
                    $notifId,
                    $userIdRow['user_id'],
                    "Nouveau courrier reçu pour {$domiciliation['raison_sociale']}"
                ]);
            }
        }

        // Mettre à jour le statut
        $updateStmt = $pdo->prepare("
            UPDATE courriers SET statut = 'notifie', date_notification = NOW() WHERE id = ?
        ");
        $updateStmt->execute([$id]);

        Response::success([
            'id' => $id,
            'message' => 'Courrier enregistré et client notifié'
        ]);

    } elseif ($method === 'PUT') {
        // Client donne son instruction
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['courrier_id'], $data['instruction_client'])) {
            Response::badRequest('Données manquantes: courrier_id, instruction_client requis');
        }

        // Vérifier que le courrier appartient à l'utilisateur
        $checkStmt = $pdo->prepare("
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

        if ($user['role'] !== 'admin' && $courrier['user_id'] !== $userId) {
            Response::forbidden('Accès refusé');
        }

        $updateStmt = $pdo->prepare("
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
        Response::methodNotAllowed();
    }
} catch (Exception $e) {
    Response::error($e->getMessage());
}
