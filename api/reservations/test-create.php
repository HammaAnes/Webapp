<?php

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';
require_once '../utils/UuidHelper.php';

header('Content-Type: application/json');

$debugInfo = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'extensions' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
    ],
];

try {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $debugInfo['auth_header_present'] = !empty($authHeader);

    if (empty($authHeader)) {
        echo json_encode([
            'success' => false,
            'error' => 'No authorization header',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $auth = Auth::verifyAuth();
    $userId = $auth['id'];
    $debugInfo['user_id'] = $userId;
    $debugInfo['user_email'] = $auth['email'] ?? 'N/A';

    $input = file_get_contents("php://input");
    $debugInfo['raw_input'] = $input;

    $data = json_decode($input, true);
    $debugInfo['json_decode_error'] = json_last_error_msg();
    $debugInfo['parsed_data'] = $data;

    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $espaceId = $data['espace_id'] ?? null;
    $dateDebut = $data['date_debut'] ?? null;
    $dateFin = $data['date_fin'] ?? null;
    $participants = isset($data['participants']) ? intval($data['participants']) : 1;
    $notes = isset($data['notes']) ? trim($data['notes']) : '';

    $debugInfo['validation'] = [
        'espace_id' => $espaceId,
        'date_debut' => $dateDebut,
        'date_fin' => $dateFin,
        'participants' => $participants,
        'notes_length' => strlen($notes),
    ];

    if (empty($espaceId)) {
        echo json_encode([
            'success' => false,
            'error' => 'Espace ID is required',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    if (empty($dateDebut) || empty($dateFin)) {
        echo json_encode([
            'success' => false,
            'error' => 'Dates are required',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $dateDebut = str_replace(['T', 'Z'], [' ', ''], $dateDebut);
    $dateDebut = preg_replace('/\.\d{3}$/', '', $dateDebut);
    $dateFin = str_replace(['T', 'Z'], [' ', ''], $dateFin);
    $dateFin = preg_replace('/\.\d{3}$/', '', $dateFin);

    $debugInfo['dates_cleaned'] = [
        'debut' => $dateDebut,
        'fin' => $dateFin,
    ];

    $debut = strtotime($dateDebut);
    $fin = strtotime($dateFin);

    $debugInfo['dates_parsed'] = [
        'debut_timestamp' => $debut,
        'fin_timestamp' => $fin,
        'debut_valid' => $debut !== false,
        'fin_valid' => $fin !== false,
    ];

    if ($debut === false || $fin === false) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid date format',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $debutMysql = date('Y-m-d H:i:s', $debut);
    $finMysql = date('Y-m-d H:i:s', $fin);

    $debugInfo['dates_mysql'] = [
        'debut' => $debutMysql,
        'fin' => $finMysql,
    ];

    $db = Database::getInstance()->getConnection();
    $debugInfo['database_connected'] = true;

    $stmt = $db->prepare("SELECT id, nom, type, capacite, prix_heure, prix_jour, disponible FROM espaces WHERE id = ?");
    $stmt->execute([$espaceId]);
    $espace = $stmt->fetch(PDO::FETCH_ASSOC);

    $debugInfo['espace_found'] = $espace !== false;
    $debugInfo['espace_data'] = $espace ?: null;

    if (!$espace) {
        echo json_encode([
            'success' => false,
            'error' => 'Space not found',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    if (!$espace['disponible']) {
        echo json_encode([
            'success' => false,
            'error' => 'Space not available',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
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

    $conflict = $stmt->fetch();
    $debugInfo['conflict_check'] = [
        'has_conflict' => $conflict !== false,
        'conflict_id' => $conflict ? $conflict['id'] : null,
    ];

    if ($conflict) {
        echo json_encode([
            'success' => false,
            'error' => 'Time slot already reserved',
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
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

    $debugInfo['pricing'] = [
        'heures' => $heures,
        'prix_heure' => $prixHeure,
        'prix_jour' => $prixJour,
        'type' => $type,
        'montant' => $montant,
    ];

    $id = UuidHelper::generate();
    $debugInfo['reservation_id'] = $id;

    $stmt = $db->prepare("
        INSERT INTO reservations
        (id, user_id, espace_id, date_debut, date_fin, statut, type_reservation, montant_total, montant_paye, participants, notes, created_at)
        VALUES (?, ?, ?, ?, ?, 'en_attente', ?, ?, 0, ?, ?, NOW())
    ");

    $insertParams = [
        $id,
        $userId,
        $espaceId,
        $debutMysql,
        $finMysql,
        $type,
        $montant,
        $participants,
        $notes
    ];

    $debugInfo['insert_params'] = $insertParams;

    $result = $stmt->execute($insertParams);
    $debugInfo['insert_result'] = $result;

    if (!$result) {
        $errorInfo = $stmt->errorInfo();
        $debugInfo['insert_error'] = $errorInfo;

        echo json_encode([
            'success' => false,
            'error' => 'Insert failed: ' . ($errorInfo[2] ?? 'unknown'),
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $stmt = $db->prepare("
        SELECT r.*, e.nom as espace_nom, e.type as espace_type
        FROM reservations r
        JOIN espaces e ON r.espace_id = e.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    $debugInfo['reservation_retrieved'] = $reservation !== false;

    echo json_encode([
        'success' => true,
        'message' => 'Reservation created successfully',
        'data' => $reservation,
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    $debugInfo['pdo_exception'] = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ];

    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $debugInfo['exception'] = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ];

    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage(),
        'debug' => $debugInfo
    ], JSON_PRETTY_PRINT);
}
