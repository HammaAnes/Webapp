<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $auth      = Auth::verifyAuth();
    $userId    = $auth['id'];
    $userRole  = $auth['role'];
    $userEmail = $auth['email'];

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['to']) || empty($data['subject']) || empty($data['html'])) {
        Response::error('Données manquantes: to, subject, html requis', 400);
        exit;
    }

    if (!filter_var($data['to'], FILTER_VALIDATE_EMAIL)) {
        Response::error('Adresse email invalide', 400);
        exit;
    }

    if ($userRole !== 'admin') {
        $allowedRecipients = array_unique([
            $userEmail,
            Mailer::getAdminEmail(),
            Mailer::getFromEmail(),
        ]);
        if (!in_array($data['to'], $allowedRecipients, true)) {
            Response::error('Envoi non autorisé vers cette adresse', 403);
            exit;
        }
    }

    $result = Mailer::send(
        $data['to'],
        $data['subject'],
        $data['html'],
        null,
        'custom',
        $userId
    );

    if ($result) {
        Response::success(['message' => 'Email envoyé avec succès']);
    } else {
        Response::error('Erreur lors de l\'envoi de l\'email', 500);
    }
} catch (Exception $e) {
    Logger::error('email/send.php error', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de l\'envoi de l\'email', 500);
}
