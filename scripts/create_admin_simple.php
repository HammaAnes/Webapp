<?php

/**
 * Script simplifié de création d'administrateur
 * Sans dépendances - Utilise uniquement MySQLi
 * Usage: php scripts/create_admin_simple.php
 */

$SCRIPT_ACTIVE = false;
if (!$SCRIPT_ACTIVE) {
    die("Script desactive pour des raisons de securite. Supprimez ce fichier.\n");
}

echo "\n╔══════════════════════════════════════════╗\n";
echo "║   CRÉATION ADMIN - COFFICE COWORKING    ║\n";
echo "╚══════════════════════════════════════════╝\n\n";

// Charger les variables d'environnement
$envFile = __DIR__ . '/../.env';
$envVars = [];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }

        list($key, $value) = explode('=', $line, 2);
        $envVars[trim($key)] = trim($value);
    }
}

// Configuration de la base de données
$host = $envVars['DB_HOST'] ?? 'localhost';
$port = $envVars['DB_PORT'] ?? '3306';
$db_name = $envVars['DB_NAME'] ?? 'cofficed_coffice';
$username = $envVars['DB_USER'] ?? 'cofficed_user';
$password = $envVars['DB_PASSWORD'] ?? '';

// Identifiants admin par défaut
$email = "admin@coffice.dz";
$admin_password = "Admin@Coffice2025";
$nom = "Admin";
$prenom = "Coffice";
$telephone = "0550000000";

try {
    // Connexion avec MySQLi
    $conn = new mysqli($host, $username, $password, $db_name, (int)$port);

    if ($conn->connect_error) {
        throw new Exception("Erreur de connexion: " . $conn->connect_error);
    }

    $conn->set_charset("utf8mb4");

    // Vérifier si l'email existe déjà
    $stmt = $conn->prepare("SELECT id, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $existing = $result->fetch_assoc();
    $stmt->close();

    if ($existing) {
        if ($existing['role'] === 'admin') {
            echo "✅ Un admin existe déjà avec cet email: $email\n";
            echo "   Utilisez ce compte pour vous connecter.\n\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "Email: $email\n";
            echo "Mot de passe: $admin_password\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "\n🔐 Connectez-vous sur /connexion\n\n";
            $conn->close();
            exit(0);
        }

        // Promouvoir l'utilisateur existant
        $stmt = $conn->prepare("UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("s", $existing['id']);
        $stmt->execute();
        $stmt->close();

        echo "✅ Utilisateur promu en administrateur!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Email: $email\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "\n🔐 Connectez-vous sur /connexion\n\n";
        $conn->close();
        exit(0);
    }

    // Générer un UUID simple
    function generateUuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    // Hasher le mot de passe
    $password_hash = password_hash($admin_password, PASSWORD_BCRYPT);

    // Générer l'ID
    $user_id = generateUuid();

    // Insérer l'admin
    $stmt = $conn->prepare("INSERT INTO users (id, email, password_hash, nom, prenom, telephone, role, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, 'admin', 'actif', NOW())");
    $stmt->bind_param("ssssss", $user_id, $email, $password_hash, $nom, $prenom, $telephone);

    if (!$stmt->execute()) {
        throw new Exception("Erreur lors de la création: " . $stmt->error);
    }
    $stmt->close();

    // Créer le code de parrainage
    $code_parrain = 'ADMIN' . strtoupper(substr(str_replace('-', '', $user_id), 0, 6));
    $parrainage_id = generateUuid();

    $stmt = $conn->prepare("INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales, created_at) VALUES (?, ?, ?, 0, 0, NOW())");
    $stmt->bind_param("sss", $parrainage_id, $user_id, $code_parrain);
    $stmt->execute();
    $stmt->close();

    echo "✅ Administrateur créé avec succès!\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "Email: $email\n";
    echo "Mot de passe: $admin_password\n";
    echo "Nom: $nom $prenom\n";
    echo "Code parrainage: $code_parrain\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "\n🔐 Connectez-vous sur /connexion\n";
    echo "\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!\n\n";

    $conn->close();

} catch (Exception $e) {
    echo "\n❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}
