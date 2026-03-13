<?php

/**
 * Admin: Créer un utilisateur
 * POST /api/admin/users-create.php
 * Body: { "email": "...", "nom": "...", "prenom": "...", "telephone": "...", "password": "..." }
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
    exit;
}

try {
    $authUser = Auth::verifyAuth();

    if ($authUser['role'] !== 'admin') {
        Response::error('Accès réservé aux administrateurs', 403);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['nom']) || empty($data['prenom'])) {
        Response::error('Email, nom et prénom requis', 400);
        exit;
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        Response::error('Email invalide', 400);
        exit;
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        Response::error('Cet email est déjà utilisé', 409);
        exit;
    }

    $password = $data['password'] ?? bin2hex(random_bytes(4));
    $password_hash = Auth::hashPassword($password);
    $id = UuidHelper::generate();
    $code_parrainage = 'CPF' . strtoupper(substr($id, 0, 6));

    $stmt = $db->prepare("
        INSERT INTO users (id, email, password_hash, nom, prenom, telephone, profession, entreprise, code_parrainage, role, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'actif')
    ");
    $stmt->execute([
        $id,
        $data['email'],
        $password_hash,
        $data['nom'],
        $data['prenom'],
        $data['telephone'] ?? null,
        $data['profession'] ?? null,
        $data['entreprise'] ?? null,
        $code_parrainage
    ]);

    Logger::info('Admin created user', [
        'admin_id' => $authUser['id'],
        'user_id' => $id,
        'email' => $data['email']
    ]);

    Response::success([
        'id' => $id,
        'email' => $data['email'],
        'nom' => $data['nom'],
        'prenom' => $data['prenom'],
        'telephone' => $data['telephone'] ?? null,
        'temp_password' => $password
    ], 'Utilisateur créé avec succès', 201);

} catch (PDOException $e) {
    Logger::error('Database error creating user', ['error' => $e->getMessage()]);
    Response::error('Erreur lors de la création', 500);
} catch (Exception $e) {
    Logger::error('Error creating user', ['error' => $e->getMessage()]);
    Response::error('Une erreur est survenue', 500);
}
