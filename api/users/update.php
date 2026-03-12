<?php

/**
 * API: Mettre à jour un utilisateur
 * PUT /api/users/update.php?id=xxx
 * POST /api/users/update.php?id=xxx (alternative)
 */
function debugLog($message, $data = null) {
    $logFile = __DIR__ . '/../../debug_update.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    if ($data !== null) {
        $logMessage .= "\n" . print_r($data, true);
    }
    $logMessage .= "\n================\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

// Charger .env pour APP_ENV
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ($key !== '' && !isset($_ENV[$key])) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

try {
    $auth = Auth::verifyAuth();

    // Récupérer l'ID depuis query params
    $userId = $_GET['id'] ?? null;

    if (!$userId) {
        Response::error("ID utilisateur manquant", 400);
    }

    // Un utilisateur peut mettre à jour ses propres infos, ou l'admin peut tout modifier
    if ($auth['role'] !== 'admin' && $auth['id'] !== $userId) {
        Response::error("Accès refusé", 403);
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);
    debugLog("📥 Raw input", $rawInput);
    debugLog("📦 Parsed data", $data);

    if (!$data) {
        Response::error("Données manquantes ou JSON invalide", 400);
    }

    $db = Database::getInstance()->getConnection();

    // Construire dynamiquement la requête UPDATE
    // Mapping camelCase -> snake_case
    $fieldMapping = [
        'nom' => 'nom',
        'prenom' => 'prenom',
        'telephone' => 'telephone',
        'profession' => 'profession',
        'entreprise' => 'entreprise',
        'adresse' => 'adresse',
        'bio' => 'bio',
        'wilaya' => 'wilaya',
        'commune' => 'commune',
        'avatar' => 'avatar',
        // Accepter à la fois camelCase ET snake_case
        'typeEntreprise' => 'type_entreprise',
        'type_entreprise' => 'type_entreprise',
        'nif' => 'nif',
        'nis' => 'nis',
        'registreCommerce' => 'registre_commerce',
        'registre_commerce' => 'registre_commerce',
        'articleImposition' => 'article_imposition',
        'article_imposition' => 'article_imposition',
        'numeroAutoEntrepreneur' => 'numero_auto_entrepreneur',
        'numero_auto_entrepreneur' => 'numero_auto_entrepreneur',
        'raisonSociale' => 'raison_sociale',
        'raison_sociale' => 'raison_sociale',
        'dateCreationEntreprise' => 'date_creation_entreprise',
        'date_creation_entreprise' => 'date_creation_entreprise',
        'capital' => 'capital',
        'siegeSocial' => 'siege_social',
        'siege_social' => 'siege_social',
        'activitePrincipale' => 'activite_principale',
        'activite_principale' => 'activite_principale',
        'formeJuridique' => 'forme_juridique',
        'forme_juridique' => 'forme_juridique'
    ];

    // L'admin peut aussi changer le rôle et le statut
    if ($auth['role'] === 'admin') {
        $fieldMapping['role'] = 'role';
        $fieldMapping['statut'] = 'statut';
    }

    $updates = [];
    $params = [':id' => $userId];

    foreach ($fieldMapping as $camelField => $dbField) {
        if (property_exists($data, $camelField)) {
            $value = $data->$camelField;

            if ($dbField === 'date_creation_entreprise' && $value) {
                $timestamp = strtotime($value);
                if ($timestamp === false) {
                    $value = null;
                } else {
                    $value = date('Y-m-d H:i:s', $timestamp);
                }
            }

            if ($dbField === 'capital' && $value !== null && $value !== '') {
                $value = floatval($value);
            }

            $paramName = $dbField;
            $updates[] = "$dbField = :$paramName";
            $params[":$paramName"] = $value;
        }
    }

    if (empty($updates)) {
        Response::error("Aucune donnée à mettre à jour", 400);
    }

    $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";

    debugLog("🔍 Requête SQL", $query);
    debugLog("📊 Paramètres", $params);
    
    $stmt = $db->prepare($query);

    if (!$stmt) {
        error_log("Prepare failed: " . print_r($db->errorInfo(), true));
        throw new Exception("Erreur de préparation de la requête");
    }

    $checkStmt = $db->prepare("SELECT id FROM users WHERE id = :id");
    $checkStmt->execute([':id' => $userId]);
    if (!$checkStmt->fetch()) {
        Response::error("Utilisateur non trouvé", 404);
    }

    $result = $stmt->execute($params);

    if (!$result) {
        error_log("Execute failed: " . print_r($stmt->errorInfo(), true));
        throw new Exception("Erreur d'exécution de la requête: " . implode(', ', $stmt->errorInfo()));
    }
    
    debugLog("✅ Mise à jour réussie", ['userId' => $userId]);

    Response::success(['id' => $userId], "Utilisateur mis à jour avec succès");

} catch (Exception $e) {
    error_log("User update error: " . $e->getMessage());
    error_log("User update trace: " . $e->getTraceAsString());
    error_log("APP_ENV value: " . ($_ENV['APP_ENV'] ?? 'not set'));

    $isDev = ($_ENV['APP_ENV'] ?? 'production') === 'development';

    if ($isDev) {
        Response::error("Mise à jour utilisateur échouée: " . $e->getMessage(), 500);
    } else {
        Response::serverError("Erreur lors de la mise à jour");
    }
}
