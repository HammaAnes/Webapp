<?php

/**
 * Règles métier configurables de Coffice
 * Toutes les constantes métier qui ne doivent pas être hardcodées dans le code.
 * Modifier ce fichier pour ajuster les règles sans changer la logique.
 */

return [

    // =====================================================
    // PARRAINAGE
    // =====================================================

    'parrainage' => [
        'prefixe_code'      => 'CPF',
        'bonus_filleul_da'  => 3000,
        'bonus_parrain_da'  => 3000,
    ],

    // =====================================================
    // RESERVATIONS
    // =====================================================

    'reservation' => [
        'seuil_heure_demi_journee' => 4,
        'seuil_demi_journee_journee' => 8,
        'duree_max_jours' => 365,
    ],

    // =====================================================
    // DOMICILIATION
    // =====================================================

    'domiciliation' => [
        'montant_mensuel_defaut' => 12000,
        'numero_bureau_min' => 1,
        'numero_bureau_max' => 60,
        'adresse_siege' => 'Mohammadia Mall, 4ème étage, Bureau 1178, Alger',
        'formes_juridiques_valides' => [
            'SARL', 'EURL', 'SPA', 'SNC', 'SCS',
            'auto_entrepreneur', 'freelance', 'autre'
        ],
        'transitions_statut_autorisees' => [
            'dossier_preparatoire'   => ['en_attente_complements', 'en_attente_signature', 'refusee'],
            'en_attente_complements' => ['en_attente_signature', 'refusee'],
            'en_attente_signature'   => ['domiciliation_creee', 'refusee'],
            'domiciliation_creee'    => ['active', 'en_attente_complements', 'refusee'],
            'active'                 => ['resiliee', 'expiree'],
            'refusee'                => [],
            'expiree'                => [],
            'resiliee'               => [],
        ],
    ],

    // =====================================================
    // AUTHENTIFICATION & SÉCURITÉ
    // =====================================================

    'auth' => [
        'password_min_length' => 8,
        'access_token_ttl_hours' => 1,
        'refresh_token_ttl_days' => 30,
        'max_login_attempts' => 5,
        'lockout_minutes' => 15,
    ],

    // =====================================================
    // DOCUMENTS
    // =====================================================

    'documents' => [
        'taille_max_octets' => 10485760,
        'types_autorises' => [
            'image/jpeg', 'image/jpg', 'image/png',
            'image/webp', 'application/pdf'
        ],
        'extensions_autorisees' => [
            'jpg', 'jpeg', 'png', 'webp', 'pdf'
        ],
    ],

    // =====================================================
    // NIF / NIS
    // =====================================================

    'identifiants_fiscaux' => [
        'nif_longueur' => 20,
        'nis_longueur' => 15,
        'registre_longueur_max' => 30,
        'raison_sociale_longueur_max' => 200,
    ],

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    'notifications' => [
        'rappel_reservation_heures_avant' => 24,
    ],

];
