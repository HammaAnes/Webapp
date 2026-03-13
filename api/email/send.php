<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $auth = Auth::verifyAuth();
        $userId = $auth['id'];
        $userRole = $auth['role'];
        $userEmail = $auth['email'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['to'], $data['subject'], $data['html'])) {
            Response::error('Données manquantes: to, subject, html requis', 400);
        }

        if ($userRole !== 'admin') {
            $allowedRecipients = [
                $userEmail,
                'desk@coffice.dz',
                env('MAIL_FROM_ADDRESS', 'noreply@coffice.dz')
            ];
            if (!in_array($data['to'], $allowedRecipients)) {
                Response::forbidden('Envoi non autorisé vers cette adresse');
            }
        }

        $result = Mailer::send(
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
    Response::error('Méthode non autorisée', 405);
}
