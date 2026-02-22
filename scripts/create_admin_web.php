<?php
/**
 * Script Web de création d'administrateur
 * À exécuter via navigateur: http://votre-domaine.com/scripts/create_admin_web.php
 *
 * ⚠️ SUPPRIMER CE FICHIER APRÈS UTILISATION
 */

// Sécurité: désactiver après première utilisation
$SCRIPT_ACTIVE = false; // Mettre à false après utilisation

if (!$SCRIPT_ACTIVE) {
    die("❌ Script désactivé pour des raisons de sécurité. Supprimez ce fichier.");
}

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

// Configuration
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

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Création Admin - Coffice</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #1a202c;
            font-size: 28px;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: #718096;
            text-align: center;
            margin-bottom: 30px;
        }
        .result {
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .success {
            background: #f0fdf4;
            border: 2px solid #86efac;
            color: #166534;
        }
        .error {
            background: #fef2f2;
            border: 2px solid #fca5a5;
            color: #991b1b;
        }
        .info {
            background: #eff6ff;
            border: 2px solid #93c5fd;
            color: #1e40af;
        }
        .credentials {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials h3 {
            color: #1f2937;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .cred-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .cred-item:last-child { border-bottom: none; }
        .cred-label { font-weight: 600; color: #4b5563; }
        .cred-value {
            color: #1f2937;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .warning {
            background: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: #92400e;
            font-weight: 600;
        }
        .icon {
            display: inline-block;
            margin-right: 8px;
            font-size: 20px;
        }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Création Administrateur</h1>
        <p class="subtitle">Coffice Coworking</p>

        <?php
        try {
            // Connexion à la base de données
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
                    echo '<div class="result info">';
                    echo '<span class="icon">✅</span> Un administrateur existe déjà avec cet email';
                    echo '</div>';

                    echo '<div class="credentials">';
                    echo '<h3>Identifiants Existants</h3>';
                    echo '<div class="cred-item"><span class="cred-label">Email:</span><span class="cred-value">' . htmlspecialchars($email) . '</span></div>';
                    echo '<div class="cred-item"><span class="cred-label">Mot de passe:</span><span class="cred-value">' . htmlspecialchars($admin_password) . '</span></div>';
                    echo '</div>';

                    echo '<a href="/" class="btn">Aller à la page de connexion</a>';

                    $conn->close();
                    exit;
                }

                // Promouvoir l'utilisateur existant
                $stmt = $conn->prepare("UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = ?");
                $stmt->bind_param("s", $existing['id']);
                $stmt->execute();
                $stmt->close();

                echo '<div class="result success">';
                echo '<span class="icon">✅</span> Utilisateur promu en administrateur';
                echo '</div>';

                echo '<div class="credentials">';
                echo '<h3>Vos Identifiants</h3>';
                echo '<div class="cred-item"><span class="cred-label">Email:</span><span class="cred-value">' . htmlspecialchars($email) . '</span></div>';
                echo '</div>';

                echo '<a href="/" class="btn">Aller à la page de connexion</a>';

                $conn->close();
                exit;
            }

            // Générer un UUID
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

            echo '<div class="result success">';
            echo '<span class="icon">✅</span> Administrateur créé avec succès !';
            echo '</div>';

            echo '<div class="credentials">';
            echo '<h3>Vos Identifiants</h3>';
            echo '<div class="cred-item"><span class="cred-label">Email:</span><span class="cred-value">' . htmlspecialchars($email) . '</span></div>';
            echo '<div class="cred-item"><span class="cred-label">Mot de passe:</span><span class="cred-value">' . htmlspecialchars($admin_password) . '</span></div>';
            echo '<div class="cred-item"><span class="cred-label">Nom:</span><span class="cred-value">' . htmlspecialchars($nom . ' ' . $prenom) . '</span></div>';
            echo '<div class="cred-item"><span class="cred-label">Code parrainage:</span><span class="cred-value">' . htmlspecialchars($code_parrain) . '</span></div>';
            echo '</div>';

            echo '<div class="warning">';
            echo '<span class="icon">⚠️</span> IMPORTANT: Changez le mot de passe après la première connexion !';
            echo '</div>';

            echo '<a href="/" class="btn">Aller à la page de connexion</a>';

            $conn->close();

        } catch (Exception $e) {
            echo '<div class="result error">';
            echo '<span class="icon">❌</span> Erreur: ' . htmlspecialchars($e->getMessage());
            echo '</div>';

            echo '<div class="info" style="margin-top: 20px;">';
            echo '<strong>Vérifiez:</strong><br>';
            echo '1. Que la base de données existe<br>';
            echo '2. Que les identifiants dans le fichier .env sont corrects<br>';
            echo '3. Que l\'utilisateur MySQL a les permissions nécessaires';
            echo '</div>';
        }
?>

        <div class="warning" style="margin-top: 30px;">
            <span class="icon">🗑️</span> SUPPRIMEZ CE FICHIER après utilisation pour des raisons de sécurité !
        </div>
    </div>
</body>
</html>
