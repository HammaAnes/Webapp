<?php

/**
 * API: Paramètres système admin
 * GET  /api/admin/settings.php          — Lire tous les paramètres
 * POST /api/admin/settings.php          — Sauvegarder une section de paramètres
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Auth.php';
require_once '../utils/Response.php';

try {
    $auth = Auth::requireAdmin();
    $db = Database::getInstance()->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->query(
            "SELECT setting_key, setting_value, setting_section
             FROM system_settings
             ORDER BY setting_section, setting_key"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings = [];
        foreach ($rows as $row) {
            $section = $row['setting_section'] ?? 'general';
            $key     = $row['setting_key'];
            $value   = $row['setting_value'];

            $decoded = json_decode($value, true);
            $settings[$section][$key] = $decoded !== null ? $decoded : $value;
        }

        Response::success($settings);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['section'])) {
            Response::error('Section requise', 400);
            exit;
        }

        $section = $input['section'];
        unset($input['section']);

        $stmt = $db->prepare(
            "INSERT INTO system_settings (setting_key, setting_value, setting_section)
             VALUES (:key, :value, :section)
             ON DUPLICATE KEY UPDATE setting_value = :value, updated_at = NOW()"
        );

        foreach ($input as $key => $value) {
            $stmt->execute([
                ':key'     => $key,
                ':value'   => is_array($value) || is_object($value) ? json_encode($value) : (string) $value,
                ':section' => $section,
            ]);
        }

        Response::success(['message' => 'Paramètres sauvegardés']);
        exit;
    }

    Response::error('Méthode non autorisée', 405);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "system_settings") !== false && strpos($e->getMessage(), "doesn't exist") !== false) {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            Response::success([]);
        } else {
            Response::success(['message' => 'Table non encore créée — paramètres ignorés']);
        }
    } else {
        Response::error('Erreur base de données: ' . $e->getMessage(), 500);
    }
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
