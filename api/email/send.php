<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Mailer.php';
require_once __DIR__ . '/../config/cors.php';

use Utils\Auth;
use Utils\Response;
use Utils\Mailer;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $userId = Auth::getUserId();
        if (!$userId) {
            Response::unauthorized('Non authentifié');
        }

        $user = Auth::getUser();

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['to'], $data['subject'], $data['html'])) {
            Response::badRequest('Données manquantes: to, subject, html requis');
        }

        if ($user['role'] !== 'admin') {
            Response::forbidden('Seuls les administrateurs peuvent envoyer des emails');
        }

        $mailer = new Mailer();
        $result = $mailer->send(
            $data['to'],
            $data['subject'],
            $data['html']
        );

        if ($result) {
            Response::success(['message' => 'Email envoyé avec succès']);
        } else {
            Response::error('Erreur lors de l\'envoi de l\'email');
        }
    } catch (Exception $e) {
        Response::error($e->getMessage());
    }
} else {
    Response::methodNotAllowed();
}
