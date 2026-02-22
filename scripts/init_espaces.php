<?php

/**
 * Script d'initialisation des espaces
 * Vérifie et crée les espaces s'ils n'existent pas
 */

require_once __DIR__ . '/../api/config/database.php';

try {
    $db = Database::getInstance()->getConnection();

    echo "=== VERIFICATION DES ESPACES ===\n\n";

    // Vérifier si des espaces existent
    $stmt = $db->query("SELECT COUNT(*) as count FROM espaces");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $count = $result['count'];

    echo "Nombre d'espaces dans la base: $count\n\n";

    if ($count > 0) {
        echo "Espaces existants:\n";
        $stmt = $db->query("SELECT id, nom, type, prix_heure, prix_jour, disponible FROM espaces ORDER BY nom");
        $espaces = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($espaces as $espace) {
            echo sprintf(
                "  - %s (%s)\n    ID: %s\n    Prix: %s DA/h, %s DA/j\n    Disponible: %s\n\n",
                $espace['nom'],
                $espace['type'],
                $espace['id'],
                $espace['prix_heure'],
                $espace['prix_jour'],
                $espace['disponible'] ? 'Oui' : 'Non'
            );
        }
        exit(0);
    }

    echo "Aucun espace trouvé. Initialisation...\n\n";

    // Fonction pour générer un UUID v4
    function generateUuid() {
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

    // Espaces à créer
    $espaces = [
        [
            'id' => generateUuid(),
            'nom' => 'Open Space',
            'type' => 'open_space',
            'capacite' => 12,
            'prix_heure' => 0,
            'prix_demi_journee' => 0,
            'prix_jour' => 1200,
            'prix_semaine' => 20000,
            'prix_mois' => 15000,
            'description' => 'Espace de travail collaboratif de 80m² avec 12 postes équipés. Ambiance dynamique et professionnelle.',
            'equipements' => json_encode(["Wi-Fi 50-100 Mbps", "Accès communauté", "Café/thé illimité", "Climatisation", "12 postes de travail", "Prises électriques", "Lumière naturelle"]),
            'image_url' => '/espace-coworking.jpeg'
        ],
        [
            'id' => generateUuid(),
            'nom' => 'Private Booth Aurès',
            'type' => 'box_3',
            'capacite' => 2,
            'prix_heure' => 0,
            'prix_demi_journee' => 0,
            'prix_jour' => 6000,
            'prix_semaine' => 40000,
            'prix_mois' => 45000,
            'description' => 'Box privé 2 places idéal pour duo ou consulting. Isolation phonique et équipement complet.',
            'equipements' => json_encode(["Wi-Fi haut débit", "Table/chaises", "Climatisation", "Insonorisation", "Accès 7h-20h", "Éclairage LED", "Prises USB"]),
            'image_url' => '/booth-aures.jpeg'
        ],
        [
            'id' => generateUuid(),
            'nom' => 'Private Booth Hoggar',
            'type' => 'box_3',
            'capacite' => 2,
            'prix_heure' => 0,
            'prix_demi_journee' => 0,
            'prix_jour' => 6000,
            'prix_semaine' => 40000,
            'prix_mois' => 35000,
            'description' => 'Box privé 2 places confortable et climatisé. Parfait pour concentration et productivité.',
            'equipements' => json_encode(["Wi-Fi haut débit", "Table/chaises", "Climatisation", "Insonorisation", "Accès 7h-20h", "Rangement sécurisé"]),
            'image_url' => '/booth-hoggar.jpeg'
        ],
        [
            'id' => generateUuid(),
            'nom' => 'Private Booth Atlas',
            'type' => 'box_4',
            'capacite' => 4,
            'prix_heure' => 0,
            'prix_demi_journee' => 0,
            'prix_jour' => 10000,
            'prix_semaine' => 65000,
            'prix_mois' => 45000,
            'description' => 'Box privé 4 places spacieux avec écran de présentation. Idéal pour petites équipes.',
            'equipements' => json_encode(["Wi-Fi haut débit", "Table/chaises", "Climatisation", "Écran de présentation", "4 places", "Accès 7h-20h", "Tableau blanc"]),
            'image_url' => '/booth-atlas.jpeg'
        ],
        [
            'id' => generateUuid(),
            'nom' => 'Salle de Réunion Premium',
            'type' => 'salle_reunion',
            'capacite' => 12,
            'prix_heure' => 2500,
            'prix_demi_journee' => 5000,
            'prix_jour' => 12000,
            'prix_semaine' => 0,
            'prix_mois' => 0,
            'description' => 'Salle de réunion premium 35-40m² avec terrasse panoramique et équipement audiovisuel complet.',
            'equipements' => json_encode(["TV 80 pouces", "Système audio", "Tableau blanc", "Terrasse panoramique", "Wi-Fi haut débit", "Eau minérale", "Climatisation", "12 places assises", "Vidéoprojecteur", "Visioconférence"]),
            'image_url' => '/salle-reunion.jpeg'
        ]
    ];

    $stmt = $db->prepare("
        INSERT INTO espaces (id, nom, type, capacite, prix_heure, prix_demi_journee, prix_jour, prix_semaine, prix_mois, description, equipements, image_url, disponible)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ");

    foreach ($espaces as $espace) {
        $stmt->execute([
            $espace['id'],
            $espace['nom'],
            $espace['type'],
            $espace['capacite'],
            $espace['prix_heure'],
            $espace['prix_demi_journee'],
            $espace['prix_jour'],
            $espace['prix_semaine'],
            $espace['prix_mois'],
            $espace['description'],
            $espace['equipements'],
            $espace['image_url']
        ]);

        echo "✓ Créé: {$espace['nom']} (ID: {$espace['id']})\n";
    }

    echo "\n=== INITIALISATION TERMINÉE ===\n";
    echo "Nombre d'espaces créés: " . count($espaces) . "\n";

} catch (PDOException $e) {
    echo "ERREUR PDO: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    exit(1);
}
