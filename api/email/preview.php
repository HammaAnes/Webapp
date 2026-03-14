<?php
require_once __DIR__ . '/../bootstrap.php';

$auth = Auth::verifyAuth();
if ($auth['role'] !== 'admin') {
    Response::error('Accès réservé aux administrateurs', 403);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

$template = $_GET['template'] ?? '';
$appUrl = env('APP_URL', 'https://coffice.dz');

$fixturesByTemplate = [
    'welcome' => [
        'name' => 'Amina Benali', 'email' => 'amina@example.com',
        'code_parrainage' => 'AMINA2026', 'login_url' => $appUrl . '/app',
    ],
    'reservation-confirmation' => [
        'reservation' => [
            'espace_nom' => 'Box Privée Atlas', 'date_debut' => date('Y-m-d 09:00:00', strtotime('+1 day')),
            'date_fin'   => date('Y-m-d 12:00:00', strtotime('+1 day')), 'participants' => 2,
            'montant' => 4500, 'statut' => 'confirmee',
        ],
    ],
    'reservation-reminder' => [
        'reservation' => [
            'espace_nom' => 'Open Space', 'date_debut' => date('Y-m-d 14:00:00', strtotime('+1 day')),
            'date_fin'   => date('Y-m-d 17:00:00', strtotime('+1 day')), 'participants' => 1,
        ],
    ],
    'domiciliation-status' => [
        'status' => 'active', 'status_label' => 'Active',
        'domiciliation' => [
            'nom_entreprise' => 'TechStart SARL', 'raison_sociale' => 'TechStart SARL',
            'date_debut'     => date('d/m/Y'), 'montant_mensuel' => 12000,
        ],
    ],
    'password-reset' => [
        'name' => 'Karim Hadj', 'reset_url' => $appUrl . '/reset-password?token=demo', 'expires_in' => '1 heure',
    ],
    'courrier-recu' => [
        'prenom' => 'Amina', 'expediteur' => 'CNAS Alger', 'type_courrier' => 'Courrier administratif',
        'date_reception' => date('d/m/Y'), 'raison_sociale' => 'TechStart SARL',
    ],
    'abonnement-expiration' => [
        'prenom' => 'Karim', 'plan_nom' => 'Pro', 'prix_mensuel' => 15000,
        'date_fin' => date('d/m/Y', strtotime('+7 days')), 'jours_restants' => 7,
    ],
    'domiciliation-expiration' => [
        'prenom' => 'Amina', 'raison_sociale' => 'TechStart SARL',
        'date_fin' => date('d/m/Y', strtotime('+30 days')), 'jours_restants' => 30,
    ],
    'parrainage-bonus' => [
        'prenom' => 'Karim', 'filleul_prenom' => 'Sonia', 'filleul_nom' => 'Kaci', 'bonus_montant' => 3000,
    ],
    'code-promo-attribue' => [
        'prenom' => 'Amina', 'code_promo' => 'WELCOME20', 'reduction' => '20', 'type_reduction' => 'pourcentage',
        'date_expiration' => date('d/m/Y', strtotime('+30 days')),
        'description' => 'Bienvenue chez Coffice ! Profitez de 20% de réduction sur votre première réservation.',
    ],
];

$validTemplates = array_keys($fixturesByTemplate);

if (!$template || !in_array($template, $validTemplates)) {
    Response::success([
        'templates' => $validTemplates,
    ], 'Templates disponibles');
    exit;
}

try {
    $data = $fixturesByTemplate[$template];
    $templatePath = __DIR__ . '/../templates/emails/' . $template . '.php';

    if (!file_exists($templatePath)) {
        Response::error('Template introuvable: ' . $template, 404);
        exit;
    }

    ob_start();
    extract($data);
    require $templatePath;
    $html = ob_get_clean();

    header('Content-Type: text/html; charset=UTF-8');
    echo $html;
    exit;
} catch (Exception $e) {
    Logger::error('email/preview.php error', ['error' => $e->getMessage(), 'template' => $template]);
    Response::error('Erreur lors de la génération du preview', 500);
}
