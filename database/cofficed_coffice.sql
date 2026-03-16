-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : lun. 16 mars 2026 à 05:18
-- Version du serveur : 10.11.16-MariaDB
-- Version de PHP : 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `cofficed_coffice`
--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`cofficed`@`localhost` PROCEDURE `cleanup_expired_data` ()   BEGIN
    DECLARE deleted_rate_limits INT;
    DECLARE deleted_logs INT;
    DECLARE deleted_activities INT;
    DECLARE deleted_csrf INT;

    -- Nettoyage des rate limits expirés
    DELETE FROM rate_limits WHERE expires_at < NOW();
    SET deleted_rate_limits = ROW_COUNT();

    -- Nettoyage des logs anciens (> 90 jours)
    DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    SET deleted_logs = ROW_COUNT();

    -- Nettoyage des activités anciennes (> 90 jours)
    DELETE FROM activites WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    SET deleted_activities = ROW_COUNT();

    -- Nettoyage des tokens CSRF expirés
    DELETE FROM csrf_tokens WHERE expires_at < NOW();
    SET deleted_csrf = ROW_COUNT();

    -- Retour des statistiques
    SELECT
        'Cleanup completed' as status,
        deleted_rate_limits as rate_limits_deleted,
        deleted_logs as logs_deleted,
        deleted_activities as activities_deleted,
        deleted_csrf as csrf_tokens_deleted,
        NOW() as cleanup_date;
END$$

CREATE DEFINER=`cofficed`@`localhost` PROCEDURE `cleanup_expired_password_resets` ()   BEGIN
  DELETE FROM password_resets
  WHERE expires_at < NOW()
  OR used_at IS NOT NULL;
END$$

CREATE DEFINER=`cofficed`@`localhost` PROCEDURE `update_expired_subscriptions` ()   BEGIN
    UPDATE abonnements_utilisateurs
    SET statut = 'expire'
    WHERE statut = 'actif'
    AND date_fin < NOW();

    SELECT
        'Subscriptions updated' as status,
        ROW_COUNT() as updated_count,
        NOW() as update_date;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `abonnements`
--

CREATE TABLE `abonnements` (
  `id` char(36) NOT NULL COMMENT 'UUID de l''abonnement',
  `nom` varchar(100) NOT NULL COMMENT 'Nom commercial de l''abonnement',
  `type` varchar(50) NOT NULL COMMENT 'Type d''abonnement (clé unique)',
  `prix` decimal(10,2) NOT NULL COMMENT 'Prix mensuel en DA',
  `prix_avec_domiciliation` decimal(10,2) DEFAULT NULL COMMENT 'Prix avec service de domiciliation',
  `duree_mois` int(11) DEFAULT 1 COMMENT 'Durée en mois',
  `description` text DEFAULT NULL COMMENT 'Description marketing',
  `avantages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Liste des avantages inclus' CHECK (json_valid(`avantages`)),
  `actif` tinyint(1) DEFAULT 1 COMMENT 'Activation/désactivation rapide',
  `statut` enum('actif','inactif','archive') NOT NULL DEFAULT 'actif' COMMENT 'Statut de l''abonnement',
  `ordre` int(11) DEFAULT 0 COMMENT 'Ordre d''affichage',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `credits_mensuels` int(11) DEFAULT 0 COMMENT 'Nombre de crédits mensuels inclus dans le plan',
  `couleur` varchar(50) DEFAULT '' COMMENT 'Couleur affichage du plan (code hex)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Types d''abonnements disponibles';

--
-- Déchargement des données de la table `abonnements`
--

INSERT INTO `abonnements` (`id`, `nom`, `type`, `prix`, `prix_avec_domiciliation`, `duree_mois`, `description`, `avantages`, `actif`, `statut`, `ordre`, `created_at`, `updated_at`, `credits_mensuels`, `couleur`) VALUES
('1205f0ce-f70e-11f0-b5ec-0050560122dd', 'Open Space Mensuel', 'open_space_monthly', 15000.00, 12000.00, 1, 'Accès mensuel dédié à l\'espace de coworking open space', '[\"Acc\\u00e8s open space 8h-18h\",\"Wi-Fi haut d\\u00e9bit\",\"Caf\\u00e9\\/th\\u00e9 inclus\",\"12 postes disponibles\",\"Casier s\\u00e9curis\\u00e9\"]', 1, 'actif', 1, '2026-01-21 22:13:44', '2026-03-10 14:04:13', 0, ''),
('1205f12c-f70e-11f0-b5ec-0050560122dd', 'Hoggar Mensuel', 'booth_hoggar_monthly', 35000.00, NULL, 1, 'Box privé Hoggar 2 places - Location mensuelle exclusive', '[\"Accès 7h-20h\", \"Wi-Fi haut débit\", \"Climatisation\", \"Insonorisation\", \"2 places\", \"Casier sécurisé\", \"Badge d\'accès\"]', 1, 'actif', 11, '2026-01-21 22:13:44', '2026-03-13 21:18:11', 0, ''),
('1205f1af-f70e-11f0-b5ec-0050560122dd', 'Atlas Mensuel', 'booth_atlas_monthly', 45000.00, NULL, 1, 'Box privé Atlas 4 places - Location mensuelle pour équipe', '[\"Accès 7h-20h\", \"Wi-Fi haut débit\", \"Climatisation\", \"Écran présentation\", \"4 places\", \"Rangement équipe\", \"Badge d\'accès\"]', 1, 'actif', 12, '2026-01-21 22:13:44', '2026-01-21 22:13:44', 0, ''),
('1205f26f-f70e-11f0-b5ec-0050560122dd', 'Aurès Mensuel', 'booth_aures_monthly', 45000.00, NULL, 1, 'Box privé Aurès 2 places - Location mensuelle premium', '[\"Accès 7h-20h\", \"Wi-Fi haut débit\", \"Climatisation\", \"Insonorisation\", \"2 places\", \"Mobilier premium\", \"Badge d\'accès\"]', 1, 'actif', 13, '2026-01-21 22:13:44', '2026-01-21 22:13:44', 0, '');

-- --------------------------------------------------------

--
-- Structure de la table `abonnements_utilisateurs`
--

CREATE TABLE `abonnements_utilisateurs` (
  `id` char(36) NOT NULL COMMENT 'UUID de la souscription',
  `user_id` char(36) DEFAULT NULL,
  `abonnement_id` char(36) NOT NULL COMMENT 'Type d''abonnement',
  `date_debut` datetime NOT NULL COMMENT 'Date de début',
  `date_fin` datetime NOT NULL COMMENT 'Date de fin',
  `statut` enum('actif','expire','suspendu','annule') NOT NULL DEFAULT 'actif' COMMENT 'Statut de la souscription',
  `auto_renouvellement` tinyint(1) DEFAULT 0 COMMENT 'Renouvellement automatique',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `credits_restants` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Souscriptions utilisateurs aux abonnements';

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `active_reservations`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `active_reservations` (
`id` char(36)
,`user_id` char(36)
,`espace_id` char(36)
,`nom` varchar(100)
,`prenom` varchar(100)
,`email` varchar(255)
,`espace_nom` varchar(100)
,`espace_type` enum('box_4','box_3','open_space','salle_reunion','poste_informatique')
,`date_debut` datetime
,`date_fin` datetime
,`statut` enum('confirmee','en_attente','en_cours','annulee','terminee')
,`type_reservation` enum('heure','demi_journee','jour','semaine','mois')
,`montant_total` decimal(10,2)
,`reduction` decimal(10,2)
,`participants` int(11)
,`created_at` datetime
);

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `type` varchar(100) NOT NULL COMMENT 'Type d''activité',
  `description` text NOT NULL COMMENT 'Description',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Métadonnées' CHECK (json_valid(`metadata`)),
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Adresse IP',
  `user_agent` text DEFAULT NULL COMMENT 'User agent du navigateur',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `action` varchar(50) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historique des activités utilisateurs';

-- --------------------------------------------------------

--
-- Structure de la table `checkins`
--

CREATE TABLE `checkins` (
  `id` char(36) NOT NULL,
  `reservation_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `heure_arrivee_reelle` datetime NOT NULL,
  `heure_depart_reel` datetime DEFAULT NULL,
  `statut` enum('present','absent','en_cours','parti') NOT NULL DEFAULT 'present',
  `note` text DEFAULT NULL,
  `enregistre_par` char(36) NOT NULL COMMENT 'Admin qui a enregistré',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `clotures_caisse`
--

CREATE TABLE `clotures_caisse` (
  `id` char(36) NOT NULL,
  `date_cloture` date NOT NULL,
  `total_cash` decimal(10,2) DEFAULT 0.00,
  `total_virement` decimal(10,2) DEFAULT 0.00,
  `total_cheque` decimal(10,2) DEFAULT 0.00,
  `total_tpe` decimal(10,2) DEFAULT 0.00,
  `total_general` decimal(10,2) DEFAULT 0.00,
  `nombre_transactions` int(11) DEFAULT 0,
  `cloture_par` char(36) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `codes_promo`
--

CREATE TABLE `codes_promo` (
  `id` char(36) NOT NULL COMMENT 'UUID du code promo',
  `code` varchar(50) NOT NULL COMMENT 'Code promotionnel unique',
  `type` enum('pourcentage','montant_fixe') NOT NULL COMMENT 'Type de réduction',
  `valeur` decimal(10,2) NOT NULL COMMENT 'Valeur de la réduction',
  `date_debut` datetime NOT NULL COMMENT 'Date de début de validité',
  `date_fin` datetime NOT NULL COMMENT 'Date de fin de validité',
  `utilisations_max` int(11) DEFAULT NULL COMMENT 'Nombre max d''utilisations',
  `utilisations_actuelles` int(11) DEFAULT 0 COMMENT 'Nombre d''utilisations actuelles',
  `montant_min` decimal(10,2) DEFAULT 0.00 COMMENT 'Montant minimum requis',
  `description` text DEFAULT NULL COMMENT 'Description du code promo',
  `conditions` text DEFAULT NULL COMMENT 'Conditions d''utilisation',
  `types_application` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Types où le code s''applique' CHECK (json_valid(`types_application`)),
  `actif` tinyint(1) DEFAULT 1 COMMENT 'Activation du code',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Codes promotionnels et réductions';

--
-- Déchargement des données de la table `codes_promo`
--

INSERT INTO `codes_promo` (`id`, `code`, `type`, `valeur`, `date_debut`, `date_fin`, `utilisations_max`, `utilisations_actuelles`, `montant_min`, `description`, `conditions`, `types_application`, `actif`, `created_at`, `updated_at`) VALUES
('be6b2ea7-078c-11f1-b9a2-0050560122dd', 'LANCEMENT', 'pourcentage', 20.00, '2026-02-11 00:00:00', '2027-02-11 00:00:00', 15, 8, 0.00, 'Offre spéciale prévue pour le lancement de @Coffice', NULL, '[\"reservation\"]', 1, '2026-02-11 21:00:50', '2026-03-15 00:37:32');

-- --------------------------------------------------------

--
-- Structure de la table `contacts`
--

CREATE TABLE `contacts` (
  `id` char(36) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `entreprise` varchar(255) DEFAULT NULL,
  `source` enum('whatsapp','instagram','tiktok','fixe','mobile','physique','email','autre') NOT NULL DEFAULT 'autre',
  `statut` enum('prospect','client','perdu') NOT NULL DEFAULT 'prospect',
  `notes` text DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `contact_history`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `contact_history` (
`contact_id` char(36)
,`type` varchar(13)
,`entity_id` char(36)
,`date` datetime /* mariadb-5.3 */
,`description` varchar(214)
,`montant` decimal(10,2)
,`statut` varchar(22)
);

-- --------------------------------------------------------

--
-- Structure de la table `courriers`
--

CREATE TABLE `courriers` (
  `id` char(36) NOT NULL,
  `domiciliation_id` char(36) NOT NULL,
  `type` enum('lettre','colis','recommande','officiel','autre') DEFAULT 'lettre',
  `expediteur` varchar(255) DEFAULT '',
  `description` text DEFAULT NULL,
  `photo_url` text DEFAULT NULL COMMENT 'Photo du courrier uploadée',
  `statut` enum('recu','notifie','en_attente_instruction','recupere','scanne','reexpedier','traite') DEFAULT 'recu',
  `instruction_client` enum('recuperer','scanner','reexpedier') DEFAULT NULL COMMENT 'Choix du client',
  `scan_url` text DEFAULT NULL COMMENT 'URL du scan si demandé',
  `date_reception` datetime DEFAULT current_timestamp(),
  `date_notification` datetime DEFAULT NULL,
  `date_instruction` datetime DEFAULT NULL,
  `date_traitement` datetime DEFAULT NULL,
  `notes_admin` text DEFAULT NULL,
  `retire_par` char(36) DEFAULT NULL COMMENT 'Utilisateur ayant retiré le courrier',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_retrait` datetime DEFAULT NULL COMMENT 'Date de retrait du courrier',
  `adresse_envoi` text DEFAULT NULL COMMENT 'Adresse de réexpédition',
  `numero_suivi` varchar(100) DEFAULT NULL COMMENT 'Numéro de suivi postal',
  `date_envoi` datetime DEFAULT NULL COMMENT 'Date d''envoi de la réexpédition'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `csrf_tokens`
--

CREATE TABLE `csrf_tokens` (
  `id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL COMMENT 'Token CSRF',
  `user_id` char(36) DEFAULT NULL,
  `expires_at` datetime NOT NULL COMMENT 'Expiration',
  `used` tinyint(1) DEFAULT 0 COMMENT 'Token utilisé',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tokens CSRF pour la sécurité';

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `daily_stats`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `daily_stats` (
`date` date
,`total_reservations` bigint(21)
,`revenue` decimal(33,2)
,`confirmed_count` decimal(22,0)
,`cancelled_count` decimal(22,0)
,`avg_amount` decimal(15,6)
,`total_participants` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Structure de la table `documents_uploads`
--

CREATE TABLE `documents_uploads` (
  `id` char(36) NOT NULL COMMENT 'UUID du document',
  `user_id` char(36) DEFAULT NULL,
  `entity_type` enum('domiciliation','user','reservation','autre') NOT NULL COMMENT 'Type d''entité',
  `entity_id` char(36) DEFAULT NULL COMMENT 'ID de l''entité associée',
  `nom_fichier` varchar(255) NOT NULL COMMENT 'Nom du fichier stocké',
  `nom_original` varchar(255) NOT NULL COMMENT 'Nom original',
  `type_fichier` varchar(100) DEFAULT NULL COMMENT 'Type MIME',
  `taille` int(11) DEFAULT NULL COMMENT 'Taille en octets',
  `chemin_fichier` text NOT NULL COMMENT 'Chemin du fichier',
  `type_document` varchar(50) DEFAULT NULL COMMENT 'Type de document (cni, rc, nif, etc.)',
  `status` enum('en_attente','valide','rejete') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de validation du document',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Date de creation (alias uploaded_at)',
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Documents uploadés';

--
-- Déchargement des données de la table `documents_uploads`
--

INSERT INTO `documents_uploads` (`id`, `user_id`, `entity_type`, `entity_id`, `nom_fichier`, `nom_original`, `type_fichier`, `taille`, `chemin_fichier`, `type_document`, `status`, `created_at`, `uploaded_at`) VALUES
('186250fd-75fe-43f7-8450-97fc5c0a6b37', 'be9366a8-0f8f-4559-8f5e-8709660ed8b4', 'user', '368d199e-b27d-4949-adce-69816cc53b12', '544c16d0-d63e-41df-b49f-d5c1dc205312.png', 'dernier.png', 'image/png', 457882, 'uploads/documents/544c16d0-d63e-41df-b49f-d5c1dc205312.png', 'carte_identite', 'en_attente', '2026-03-15 21:03:35', '2026-03-15 21:03:35'),
('1e4f0d27-c1c4-4533-a375-8ab27dc58596', 'be9366a8-0f8f-4559-8f5e-8709660ed8b4', 'user', '368d199e-b27d-4949-adce-69816cc53b12', '93ccf6a5-f6a5-4e77-82e2-7b616c8b356a.png', 'dernier.png', 'image/png', 457882, 'uploads/documents/93ccf6a5-f6a5-4e77-82e2-7b616c8b356a.png', 'carte_identite', 'en_attente', '2026-03-15 20:55:30', '2026-03-15 20:55:30'),
('2af679a2-af37-4ac7-adb5-51d97f3a48e8', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'domiciliation', 'ec0edb18-6c78-4716-ba3d-b84fdffd3feb', '3e0eb1e0-13f5-456e-ac5d-3590f566fa0d.pdf', 'CN_Aghiles.pdf', 'application/pdf', 288313, 'uploads/documents/3e0eb1e0-13f5-456e-ac5d-3590f566fa0d.pdf', 'cni', 'en_attente', '2026-03-15 15:32:22', '2026-03-15 15:32:22'),
('2e0adae4-c7f1-4fce-ae49-18c317a53db7', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', '221b58c0-53ad-4818-9a2e-a451be5e16a4.pdf', 'NIF.pdf', 'application/pdf', 226800, 'uploads/documents/221b58c0-53ad-4818-9a2e-a451be5e16a4.pdf', 'nif', 'en_attente', '2026-03-15 00:50:09', '2026-03-15 00:50:09'),
('37db0c93-9034-46d3-a728-8102bc75330a', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', 'eaddd64e-6b1f-4d38-839c-5121ff042b14.pdf', 'RC_HadCenter_Consulting.pdf', 'application/pdf', 1620687, 'uploads/documents/eaddd64e-6b1f-4d38-839c-5121ff042b14.pdf', 'rc', 'en_attente', '2026-03-15 00:51:07', '2026-03-15 00:51:07'),
('409ad660-649a-402a-9b55-4d44c8972031', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'user', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', '3489cf1b-bca9-4520-8634-d15116d24fe7.png', 'Capture_d___e__cran_2026-03-16_a___04.47.58.png', 'image/png', 1390486, 'uploads/documents/3489cf1b-bca9-4520-8634-d15116d24fe7.png', 'carte_identite', 'en_attente', '2026-03-16 03:49:04', '2026-03-16 03:49:04'),
('46bcc358-c416-4993-bbfc-cc441dd23dec', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'user', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', '7a9d400b-47f3-4b9a-8c7d-d7a79b7c6a62.png', 'Capture_d___e__cran_2026-03-16_a___04.47.58.png', 'image/png', 1390486, 'uploads/documents/7a9d400b-47f3-4b9a-8c7d-d7a79b7c6a62.png', 'carte_identite', 'en_attente', '2026-03-16 03:50:57', '2026-03-16 03:50:57'),
('58bffc6b-cd56-4a32-bc32-f71d143c1b14', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', '7e9ac3bd-0d05-41dd-93c6-fe4cd31eec8f.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/7e9ac3bd-0d05-41dd-93c6-fe4cd31eec8f.pdf', 'carte_identite', 'en_attente', '2026-03-16 01:25:05', '2026-03-16 01:25:05'),
('5dce7be2-7041-49b0-9304-0471de7bf5cf', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', '2e3e6e14-d2d3-4741-881e-ec107e0985af.pdf', 'NIS.pdf', 'application/pdf', 285945, 'uploads/documents/2e3e6e14-d2d3-4741-881e-ec107e0985af.pdf', 'nis', 'en_attente', '2026-03-15 00:50:22', '2026-03-15 00:50:22'),
('65f06aaa-4f67-45cc-a6c8-e1ecbfefecb0', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', '3d10cddb-2361-493a-8fcf-c9350591dcd9.pdf', 'Extrait_de_Naissance.pdf', 'application/pdf', 131861, 'uploads/documents/3d10cddb-2361-493a-8fcf-c9350591dcd9.pdf', 'extrait_naissance', 'en_attente', '2026-03-15 00:44:01', '2026-03-15 00:44:01'),
('6dbec781-75b1-41d4-934d-1e9be4dd8c68', 'be9366a8-0f8f-4559-8f5e-8709660ed8b4', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', '6276146e-2538-419c-8db8-b911e502355f.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/6276146e-2538-419c-8db8-b911e502355f.pdf', 'carte_identite', 'en_attente', '2026-03-16 04:03:06', '2026-03-16 04:03:06'),
('8640a8dd-a54a-4b3e-a223-b1bed4b3b751', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'user', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'fe69ab0c-5d46-4588-bbcc-cc6dd8e2163b.png', 'dernier.png', 'image/png', 457882, 'uploads/documents/fe69ab0c-5d46-4588-bbcc-cc6dd8e2163b.png', 'carte_identite', 'en_attente', '2026-03-15 20:54:37', '2026-03-15 20:54:37'),
('916bead5-4889-41c8-ae1a-e4eea4961f56', 'be9366a8-0f8f-4559-8f5e-8709660ed8b4', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', '4f1560aa-4694-42c6-9a77-8c89546f97d9.png', 'Capture_d___e__cran_2026-03-16_a___04.47.58.png', 'image/png', 1390486, 'uploads/documents/4f1560aa-4694-42c6-9a77-8c89546f97d9.png', 'registre_commerce', 'en_attente', '2026-03-16 04:02:34', '2026-03-16 04:02:34'),
('9869ae36-4f7f-4f3e-b119-0a03b7e95bdc', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', 'ca843672-9584-42c4-82b5-7fdc9a6192c6.pdf', 'Nouveaux_Statuts.pdf', 'application/pdf', 2087383, 'uploads/documents/ca843672-9584-42c4-82b5-7fdc9a6192c6.pdf', 'statuts', 'en_attente', '2026-03-15 00:50:36', '2026-03-15 00:50:36'),
('a6553498-25cc-4305-8081-4a40ab120560', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', '302ad4ea-5c68-477f-bdb6-f0fc6420bb10.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/302ad4ea-5c68-477f-bdb6-f0fc6420bb10.pdf', 'cni', 'en_attente', '2026-03-15 00:44:00', '2026-03-15 00:44:00'),
('af7f77e6-382b-4c70-bc6e-bcf7067603ee', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'domiciliation', 'ec0edb18-6c78-4716-ba3d-b84fdffd3feb', 'd089bb31-3dd9-49ce-be32-99416a3a3c30.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/d089bb31-3dd9-49ce-be32-99416a3a3c30.pdf', 'carte_auto_entrepreneur', 'en_attente', '2026-03-15 15:32:21', '2026-03-15 15:32:21'),
('b040c8c7-014a-439a-b9da-96a8d7aa5468', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'user', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', '5afc883b-0a1d-44fc-a1d8-aea1fd08acb7.png', 'Capture_d___e__cran_2026-03-16_a___04.47.58.png', 'image/png', 1390486, 'uploads/documents/5afc883b-0a1d-44fc-a1d8-aea1fd08acb7.png', 'carte_identite', 'en_attente', '2026-03-16 03:50:28', '2026-03-16 03:50:28'),
('b29e8b35-ac5a-4732-8937-05d1f601dfe3', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', '0e9012d7-1795-42f3-a254-e7a2a7cf6146.pdf', 'C20.pdf', 'application/pdf', 122873, 'uploads/documents/0e9012d7-1795-42f3-a254-e7a2a7cf6146.pdf', 'c20', 'en_attente', '2026-03-15 00:50:16', '2026-03-15 00:50:16'),
('bef3ca78-8bc3-4fce-bda7-638230912f7d', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', '1aed8601-6b44-4e23-8f16-a4c7d8152a90.png', 'dernier.png', 'image/png', 457882, 'uploads/documents/1aed8601-6b44-4e23-8f16-a4c7d8152a90.png', 'carte_identite', 'en_attente', '2026-03-15 22:09:19', '2026-03-15 22:09:19'),
('c9e78e03-951c-4f7b-bd12-ecb615df9a34', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', 'b5f89f8d-2377-437a-91d4-00961d8d3fb7.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/b5f89f8d-2377-437a-91d4-00961d8d3fb7.pdf', 'carte_identite', 'en_attente', '2026-03-16 01:54:55', '2026-03-16 01:54:55'),
('d2c17acc-dc80-45f8-85bd-f79e56a504e4', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', '5421632a-dfad-4482-bcd4-5d93d9b5f2e3.png', 'dernier.png', 'image/png', 457882, 'uploads/documents/5421632a-dfad-4482-bcd4-5d93d9b5f2e3.png', 'carte_identite', 'en_attente', '2026-03-15 10:53:27', '2026-03-15 10:53:27'),
('dceb7305-1abb-4b9b-b770-74a08e5b6a2c', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', '9a6e1f43-650c-4ef9-a0a5-b95c1e1f01ba.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/9a6e1f43-650c-4ef9-a0a5-b95c1e1f01ba.pdf', 'carte_identite', 'en_attente', '2026-03-16 01:54:37', '2026-03-16 01:54:37'),
('ecd9a01e-61f0-4150-ba37-b025558ff8bd', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', '19cb47f1-35a8-4e8d-b4a9-2b486c824f25.pdf', 'CN_Aghiles_bis.pdf', 'application/pdf', 650145, 'uploads/documents/19cb47f1-35a8-4e8d-b4a9-2b486c824f25.pdf', 'carte_identite', 'en_attente', '2026-03-16 01:25:13', '2026-03-16 01:25:13'),
('fd435bb5-9b5a-4357-9551-40c21545e386', '5e9d1072-9003-4c16-bd79-97567726b006', 'user', '5e9d1072-9003-4c16-bd79-97567726b006', 'b8957814-2d94-481e-ac42-2c18c911b755.png', 'dernier.png', 'image/png', 457882, 'uploads/documents/b8957814-2d94-481e-ac42-2c18c911b755.png', 'carte_identite', 'en_attente', '2026-03-16 01:24:44', '2026-03-16 01:24:44'),
('fd722461-4430-4294-a5b6-023eb38ea552', '5e9d1072-9003-4c16-bd79-97567726b006', 'domiciliation', '055f286d-9a3b-4b40-983b-45518432e22a', 'a9743778-08ab-4944-8895-f9f15c84d15a.pdf', 'De__tail_Activite___Incubateur.pdf', 'application/pdf', 93886, 'uploads/documents/a9743778-08ab-4944-8895-f9f15c84d15a.pdf', 'reservation_denomination', 'en_attente', '2026-03-15 00:44:01', '2026-03-15 00:44:01');

-- --------------------------------------------------------

--
-- Structure de la table `domiciliations`
--

CREATE TABLE `domiciliations` (
  `id` char(36) NOT NULL COMMENT 'UUID de la domiciliation',
  `user_id` char(36) DEFAULT NULL,
  `contact_id` char(36) DEFAULT NULL,
  `situation_administrative` enum('en_cours_creation','deja_creee') NOT NULL DEFAULT 'deja_creee',
  `type_structure` enum('societe','auto_entrepreneur') NOT NULL DEFAULT 'societe',
  `raison_sociale` varchar(200) NOT NULL COMMENT 'Raison sociale',
  `forme_juridique` varchar(100) NOT NULL COMMENT 'Forme juridique (SARL, EURL, etc.)',
  `capital` decimal(15,2) DEFAULT NULL COMMENT 'Capital social en DA',
  `numero_bureau` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`numero_bureau` between 1 and 36),
  `reference_contrat_notarie` varchar(100) DEFAULT NULL,
  `date_debut_contrat` date DEFAULT NULL,
  `date_fin_contrat` date DEFAULT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `documents_manquants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Liste des documents manquants avec statut' CHECK (json_valid(`documents_manquants`)),
  `cgu_acceptees` tinyint(1) NOT NULL DEFAULT 0,
  `date_cgu_acceptation` datetime DEFAULT NULL,
  `date_debut_souhaitee` date DEFAULT NULL,
  `activite_principale` varchar(200) DEFAULT NULL COMMENT 'Activité principale',
  `domaine_activite` varchar(200) DEFAULT NULL COMMENT 'Domaine d''activité',
  `nif` varchar(50) DEFAULT NULL COMMENT 'NIF (20 caractères)',
  `nis` varchar(50) DEFAULT NULL COMMENT 'NIS (15 caractères)',
  `registre_commerce` varchar(50) DEFAULT NULL COMMENT 'Numéro de registre de commerce',
  `article_imposition` varchar(50) DEFAULT NULL COMMENT 'Article d''imposition',
  `code_nae` varchar(20) DEFAULT NULL,
  `activite_exercee` varchar(255) DEFAULT NULL,
  `description_activite` text DEFAULT NULL,
  `numero_auto_entrepreneur` varchar(50) DEFAULT NULL COMMENT 'Numéro auto-entrepreneur',
  `date_inscription_auto_entrepreneur` date DEFAULT NULL,
  `wilaya` varchar(100) DEFAULT NULL COMMENT 'Wilaya',
  `commune` varchar(100) DEFAULT NULL COMMENT 'Commune',
  `adresse_actuelle` text DEFAULT NULL COMMENT 'Adresse actuelle',
  `adresse_siege_social` text DEFAULT NULL COMMENT 'Adresse du siège social',
  `coordonnees_fiscales` text DEFAULT NULL COMMENT 'Coordonnées fiscales',
  `coordonnees_administratives` text DEFAULT NULL COMMENT 'Coordonnées administratives',
  `representant_nom` varchar(100) DEFAULT NULL COMMENT 'Nom du représentant légal',
  `representant_prenom` varchar(100) DEFAULT NULL COMMENT 'Prénom du représentant légal',
  `representant_fonction` varchar(100) DEFAULT NULL COMMENT 'Fonction du représentant',
  `representant_telephone` varchar(20) DEFAULT NULL COMMENT 'Téléphone du représentant',
  `representant_email` varchar(255) DEFAULT NULL COMMENT 'Email du représentant',
  `representant_adresse_residence` varchar(500) DEFAULT NULL,
  `representant_ville` varchar(100) DEFAULT NULL,
  `date_creation_entreprise` date DEFAULT NULL COMMENT 'Date de création de l''entreprise',
  `ville_immatriculation` varchar(100) DEFAULT NULL,
  `statut` enum('dossier_preparatoire','en_attente_complements','en_attente_signature','domiciliation_creee','active','refusee','expiree','resiliee') NOT NULL DEFAULT 'dossier_preparatoire',
  `date_debut` datetime DEFAULT NULL COMMENT 'Date de début de service',
  `date_fin` datetime DEFAULT NULL COMMENT 'Date de fin de service',
  `date_validation` datetime DEFAULT NULL COMMENT 'Date de validation du dossier',
  `montant_mensuel` decimal(10,2) DEFAULT NULL COMMENT 'Montant mensuel en DA',
  `mode_paiement` varchar(50) DEFAULT NULL COMMENT 'Mode de paiement (cash, virement, etc.)',
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Documents uploadés' CHECK (json_valid(`documents`)),
  `notes_admin` text DEFAULT NULL COMMENT 'Notes internes admin',
  `commentaire_admin` text DEFAULT NULL COMMENT 'Commentaire administratif',
  `visible_sur_site` tinyint(1) DEFAULT 0 COMMENT 'Affichage public',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `alerte_expiration_envoyee` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Domiciliations d''entreprises avec création admin';

--
-- Déchargement des données de la table `domiciliations`
--

INSERT INTO `domiciliations` (`id`, `user_id`, `contact_id`, `situation_administrative`, `type_structure`, `raison_sociale`, `forme_juridique`, `capital`, `numero_bureau`, `reference_contrat_notarie`, `date_debut_contrat`, `date_fin_contrat`, `options`, `documents_manquants`, `cgu_acceptees`, `date_cgu_acceptation`, `date_debut_souhaitee`, `activite_principale`, `domaine_activite`, `nif`, `nis`, `registre_commerce`, `article_imposition`, `code_nae`, `activite_exercee`, `description_activite`, `numero_auto_entrepreneur`, `date_inscription_auto_entrepreneur`, `wilaya`, `commune`, `adresse_actuelle`, `adresse_siege_social`, `coordonnees_fiscales`, `coordonnees_administratives`, `representant_nom`, `representant_prenom`, `representant_fonction`, `representant_telephone`, `representant_email`, `representant_adresse_residence`, `representant_ville`, `date_creation_entreprise`, `ville_immatriculation`, `statut`, `date_debut`, `date_fin`, `date_validation`, `montant_mensuel`, `mode_paiement`, `documents`, `notes_admin`, `commentaire_admin`, `visible_sur_site`, `created_at`, `updated_at`, `alerte_expiration_envoyee`) VALUES
('055f286d-9a3b-4b40-983b-45518432e22a', '5e9d1072-9003-4c16-bd79-97567726b006', NULL, 'deja_creee', 'societe', 'HadCenter Consulting', 'SARL', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '607710', '12345123451234512345', '123451234512345', '1234512345', '1234512345', '1234512345', '1234512345', NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Haddad', 'Aghiles', 'Gérant', '0557919178', 'a.haddad@coffice.dz', '12345', '12345', NULL, NULL, 'active', NULL, NULL, NULL, 15000.00, NULL, NULL, 'Ceci dit', 'Test', 0, '2026-03-15 00:43:58', '2026-03-16 04:02:02', 0);

-- --------------------------------------------------------

--
-- Structure de la table `espaces`
--

CREATE TABLE `espaces` (
  `id` char(36) NOT NULL COMMENT 'UUID de l''espace',
  `nom` varchar(100) NOT NULL COMMENT 'Nom de l''espace',
  `type` enum('box_4','box_3','open_space','salle_reunion','poste_informatique') NOT NULL COMMENT 'Type d''espace',
  `capacite` int(11) NOT NULL COMMENT 'Capacité maximale de personnes',
  `prix_heure` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par heure en DA',
  `prix_demi_journee` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix demi-journée en DA',
  `prix_jour` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par jour en DA',
  `prix_semaine` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par semaine en DA',
  `prix_mois` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par mois en DA',
  `description` text DEFAULT NULL COMMENT 'Description détaillée',
  `equipements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Liste des équipements disponibles' CHECK (json_valid(`equipements`)),
  `disponible` tinyint(1) DEFAULT 1 COMMENT 'Disponibilité de l''espace',
  `etage` int(11) DEFAULT 4 COMMENT 'Étage (Mohammadia Mall)',
  `image_url` text DEFAULT NULL COMMENT 'URL de l''image principale',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Espaces de coworking disponibles';

--
-- Déchargement des données de la table `espaces`
--

INSERT INTO `espaces` (`id`, `nom`, `type`, `capacite`, `prix_heure`, `prix_demi_journee`, `prix_jour`, `prix_semaine`, `prix_mois`, `description`, `equipements`, `disponible`, `etage`, `image_url`, `created_at`, `updated_at`) VALUES
('1204bb80-f70e-11f0-b5ec-0050560122dd', 'Open Space', 'open_space', 12, 200.00, 700.00, 1200.00, 5000.00, 15000.00, 'Espace de travail collaboratif de 80m² avec 12 postes équipés. Ambiance dynamique et professionnelle.', '[\"Wi-Fi 50-100 Mbps\", \"Accès communauté\", \"Café/thé illimité\", \"Climatisation\", \"12 postes de travail\", \"Prises électriques\", \"Lumière naturelle\"]', 1, 4, '/espace-coworking.jpeg', '2026-01-21 22:13:44', '2026-01-23 04:03:47'),
('1204cc77-f70e-11f0-b5ec-0050560122dd', 'Private Booth Aurès', 'box_4', 4, 1000.00, 3000.00, 5000.00, 15000.00, 45000.00, 'Box privé 2 places idéal pour duo ou consulting. Isolation phonique et équipement complet.', '[\"Wi-Fi haut débit\", \"Table/chaises\", \"Climatisation\", \"Insonorisation\", \"Accès 7h-20h\", \"Éclairage LED\", \"Prises USB\"]', 1, 4, '/booth-aures.jpeg', '2026-01-21 22:13:44', '2026-03-16 02:35:51'),
('1204cd72-f70e-11f0-b5ec-0050560122dd', 'Private Booth Hoggar', 'box_3', 2, 900.00, 2500.00, 5000.00, 15000.00, 35000.00, 'Box privé 2 places confortable et climatisé. Parfait pour concentration et productivité.', '[\"Wi-Fi haut débit\", \"Table/chaises\", \"Climatisation\", \"Insonorisation\", \"Accès 7h-20h\", \"Rangement sécurisé\"]', 1, 4, '/booth-hoggar.jpeg', '2026-01-21 22:13:44', '2026-01-23 04:06:12'),
('1204cdca-f70e-11f0-b5ec-0050560122dd', 'Private Booth Atlas', 'box_4', 4, 1000.00, 3000.00, 5000.00, 20000.00, 45000.00, 'Box privé 4 places spacieux avec écran de présentation. Idéal pour petites équipes.', '[\"Wi-Fi haut débit\", \"Table/chaises\", \"Climatisation\", \"Écran de présentation\", \"4 places\", \"Accès 7h-20h\", \"Tableau blanc\"]', 1, 4, '/booth-atlas.jpeg', '2026-01-21 22:13:44', '2026-01-23 04:07:11'),
('1204ce62-f70e-11f0-b5ec-0050560122dd', 'Salle de Réunion Premium', 'salle_reunion', 12, 2500.00, 7000.00, 12000.00, 50000.00, 0.00, 'Salle de réunion premium 35-40m² avec terrasse panoramique et équipement audiovisuel complet.', '[\"TV 80 pouces\", \"Système audio\", \"Tableau blanc\", \"Terrasse panoramique\", \"Wi-Fi haut débit\", \"Eau minérale\", \"Climatisation\", \"12 places assises\", \"Vidéoprojecteur\", \"Visioconférence\"]', 1, 4, '/salle-reunion.jpeg', '2026-01-21 22:13:44', '2026-01-29 05:53:00');

-- --------------------------------------------------------

--
-- Structure de la table `logs`
--

CREATE TABLE `logs` (
  `id` char(36) NOT NULL,
  `level` enum('info','warning','error','security') NOT NULL COMMENT 'Niveau de log',
  `message` text NOT NULL COMMENT 'Message du log',
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Contexte additionnel' CHECK (json_valid(`context`)),
  `user_id` char(36) DEFAULT NULL COMMENT 'Utilisateur concerné',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Adresse IP',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs système et sécurité';

--
-- Déchargement des données de la table `logs`
--

INSERT INTO `logs` (`id`, `level`, `message`, `context`, `user_id`, `ip_address`, `created_at`) VALUES
('002b05c8-0995-11f1-8466-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.54.246\"}', NULL, '154.241.54.246', '2026-02-14 11:04:58'),
('002b5b92-0995-11f1-8466-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.54.246', '2026-02-14 11:04:58'),
('00483776-0995-11f1-8466-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.54.246\"}', NULL, '154.241.54.246', '2026-02-14 11:04:58'),
('004871da-0995-11f1-8466-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.54.246', '2026-02-14 11:04:58'),
('00d8a2e2-1fb5-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-14 14:49:28'),
('00f6269d-1fb5-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-14 14:49:29'),
('016eb894-06d9-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:34:13'),
('016ef027-06d9-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:34:13'),
('01923588-06d9-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:34:13'),
('01926779-06d9-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:34:13'),
('0301e168-1fcc-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 17:34:11'),
('0303aa52-1fcc-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"7d20adc2-58a1-4e45-94da-9a86036e9ccb\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"PV_-_Huissier_de_Justice.pdf\",\"size\":2035727}', NULL, '154.241.51.36', '2026-03-14 17:34:11'),
('09eb470c-20ed-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:03:06'),
('09ec5592-20ed-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"6dbec781-75b1-41d4-934d-1e9be4dd8c68\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '105.101.26.229', '2026-03-16 04:03:06'),
('0c9aede6-1b54-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"105.101.167.175\"}', NULL, '105.101.167.175', '2026-03-09 01:05:22'),
('0c9b3dfb-1b54-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.101.167.175', '2026-03-09 01:05:22'),
('0cca8a79-1b54-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"105.101.167.175\"}', NULL, '105.101.167.175', '2026-03-09 01:05:22'),
('0ccab7d2-1b54-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.101.167.175', '2026-03-09 01:05:22'),
('0d751384-2009-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:51:07'),
('0d76727e-2009-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"37db0c93-9034-46d3-a728-8102bc75330a\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"RC_HadCenter_Consulting.pdf\",\"size\":1620687}', NULL, '154.241.51.36', '2026-03-15 00:51:07'),
('0d96131e-2009-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:51:08'),
('0ea2d514-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:44:00'),
('0ea3d5aa-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"a6553498-25cc-4305-8081-4a40ab120560\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '154.241.51.36', '2026-03-15 00:44:00'),
('0f38785e-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:44:01'),
('0f38fa8c-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"65f06aaa-4f67-45cc-a6c8-e1ecbfefecb0\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"Extrait_de_Naissance.pdf\",\"size\":131861}', NULL, '154.241.51.36', '2026-03-15 00:44:01'),
('0f930e2d-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:44:01'),
('0f93b46b-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"fd722461-4430-4294-a5b6-023eb38ea552\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"De__tail_Activite___Incubateur.pdf\",\"size\":93886}', NULL, '154.241.51.36', '2026-03-15 00:44:01'),
('102f6680-1b54-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"105.101.167.175\"}', NULL, '105.101.167.175', '2026-03-09 01:05:28'),
('102f921d-1b54-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.101.167.175', '2026-03-09 01:05:28'),
('10758777-1b54-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"105.101.167.175\"}', NULL, '105.101.167.175', '2026-03-09 01:05:29'),
('1075ad57-1b54-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.101.167.175', '2026-03-09 01:05:29'),
('14138750-20eb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:49:04'),
('14149fa9-20eb-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"409ad660-649a-402a-9b55-4d44c8972031\",\"user_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"entity_type\":\"user\",\"entity_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"file_name\":\"Capture_d___e__cran_2026-03-16_a___04.47.58.png\",\"size\":1390486}', NULL, '105.101.26.229', '2026-03-16 03:49:04'),
('1431f0bf-06d8-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:27:35'),
('143222cd-06d8-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:27:35'),
('1457b225-06d8-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:27:35'),
('1457ef90-06d8-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:27:35'),
('16a6cf7a-20db-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 01:54:37'),
('16a80361-20db-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"dceb7305-1abb-4b9b-b770-74a08e5b6a2c\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '105.101.26.229', '2026-03-16 01:54:37'),
('1dcc64fc-200e-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:27:22'),
('1def649f-200e-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:27:22'),
('215f9e85-06d8-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:27:57'),
('21600846-06d8-11f1-b9a2-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.235.131.47', '2026-02-10 23:27:57'),
('216b8ce3-20db-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 01:54:55'),
('216c29c0-20db-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"c9e78e03-951c-4f7b-bd12-ecb615df9a34\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '105.101.26.229', '2026-03-16 01:54:55'),
('2724ec78-1b54-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"105.101.167.175\"}', NULL, '105.101.167.175', '2026-03-09 01:06:07'),
('27251a78-1b54-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.101.167.175', '2026-03-09 01:06:07'),
('2777a83a-1b54-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"105.101.167.175\"}', NULL, '105.101.167.175', '2026-03-09 01:06:07'),
('2777d3f0-1b54-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.101.167.175', '2026-03-09 01:06:07'),
('2874d475-1fa4-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 12:48:53'),
('2891e8a8-1fa4-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 12:48:54'),
('28dd4f10-2084-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 15:32:21'),
('28dea8b4-2084-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"af7f77e6-382b-4c70-bc6e-bcf7067603ee\",\"user_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"entity_type\":\"domiciliation\",\"entity_id\":\"ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '105.100.50.115', '2026-03-15 15:32:21'),
('29277579-2084-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 15:32:22'),
('2927efb5-2084-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"2af679a2-af37-4ac7-adb5-51d97f3a48e8\",\"user_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"entity_type\":\"domiciliation\",\"entity_id\":\"ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"file_name\":\"CN_Aghiles.pdf\",\"size\":288313}', NULL, '105.100.50.115', '2026-03-15 15:32:22'),
('2b45a28c-1fa4-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=46d0051f-890e-42af-b7ad-5000a4095af0\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 12:48:58'),
('2b461b14-1fa4-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"46d0051f-890e-42af-b7ad-5000a4095af0\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"QR_Inscription_Appli.png\"}', NULL, '105.101.159.113', '2026-03-14 12:48:58'),
('2bf9fb8f-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:11:58'),
('2c191983-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:11:59'),
('2e10c347-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 05:59:48'),
('2e26256f-20b1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:54:37'),
('2e273276-20b1-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"8640a8dd-a54a-4b3e-a223-b1bed4b3b751\",\"user_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"entity_type\":\"user\",\"entity_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '105.100.50.115', '2026-03-15 20:54:37'),
('2e2db5a9-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 05:59:48'),
('32930a70-205d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-15 10:53:27'),
('32940665-205d-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"d2c17acc-dc80-45f8-85bd-f79e56a504e4\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '105.99.17.170', '2026-03-15 10:53:27'),
('33429c57-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:12:11'),
('33604b0e-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:12:11'),
('35304f7a-1fac-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 13:46:31'),
('36c1d99a-06d7-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:21:23'),
('36c2312e-06d7-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:21:23'),
('36e63b66-06d7-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:21:23'),
('36e66d7f-06d7-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:21:23'),
('38367612-2084-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 15:32:47'),
('3853cf6c-2084-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 15:32:47'),
('396735f1-1fac-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 13:46:38'),
('39765a16-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:12:21'),
('3dc4ecfa-1fac-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 13:46:45'),
('3de58b7d-1fac-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined function mail()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php\",\"line\":111,\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(38): Mailer::sendWithMailFunction(\'test@gmail.com\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#1 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(122): Mailer::send(\'test@gmail.com\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#2 \\/home\\/cofficed\\/public_html\\/api\\/auth\\/register.php(176): Mailer::sendWelcomeEmail(\'test@gmail.com\', \'Yanelle Benyoun...\')\\n#3 {main}\"}', NULL, '105.101.159.113', '2026-03-14 13:46:45'),
('3de5a8fd-1fac-11f1-81ef-0050560122dd', 'error', 'PHP WARNING: Undefined variable $isProduction', '{\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/bootstrap.php\",\"line\":162,\"type\":\"WARNING\"}', NULL, '105.101.159.113', '2026-03-14 13:46:45'),
('405de15c-1fc7-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 17:00:06'),
('405ecfe7-1fc7-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"171bb1ed-5425-4990-8639-2537d929540f\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '154.241.51.36', '2026-03-14 17:00:06'),
('40ae23bc-1fac-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 13:46:50'),
('453ff3ea-200e-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:28:28'),
('455f3a70-200e-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:28:29'),
('45fb529d-20eb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:50:28'),
('45fc396f-20eb-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"b040c8c7-014a-439a-b9da-96a8d7aa5468\",\"user_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"entity_type\":\"user\",\"entity_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"file_name\":\"Capture_d___e__cran_2026-03-16_a___04.47.58.png\",\"size\":1390486}', NULL, '105.101.26.229', '2026-03-16 03:50:28'),
('484a61a7-07a1-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 23:27:51'),
('484ab080-07a1-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 23:27:51'),
('486ce111-07a1-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 23:27:51'),
('486d16a8-07a1-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 23:27:51'),
('4885ac2d-0854-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 20:49:11'),
('4885fa28-0854-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 20:49:11'),
('48d11324-0854-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 20:49:12'),
('48d14263-0854-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 20:49:12'),
('49ec7664-0799-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 22:30:38'),
('49ecd220-0799-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 22:30:38'),
('4a0b0710-0799-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 22:30:38'),
('4a0b334d-0799-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 22:30:38'),
('4d6572f9-20b1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:55:30'),
('4d66062f-20b1-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"1e4f0d27-c1c4-4533-a375-8ab27dc58596\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"entity_type\":\"user\",\"entity_id\":\"368d199e-b27d-4949-adce-69816cc53b12\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '105.100.50.115', '2026-03-15 20:55:30'),
('4f9c6824-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:52:36'),
('4f9d7d63-1e7f-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"a1f733f0-3658-4745-8be2-f226b488dbdd\",\"file_name\":\"QR_Inscription_Appli.png\",\"size\":83920}', NULL, '154.241.58.179', '2026-03-13 01:52:36'),
('50082255-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:52:37'),
('5008e65f-1e7f-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"1548208d-4abd-4052-bf58-1ee03d1a8d8a\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"a1f733f0-3658-4745-8be2-f226b488dbdd\",\"file_name\":\"4abf2d8f-4248-4856-aa05-070d624ddf8a.png\",\"size\":83829}', NULL, '154.241.58.179', '2026-03-13 01:52:37'),
('50690346-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:52:38'),
('506971da-1e7f-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"f28f00ed-fa6e-42e7-af06-4418e2c208e9\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"a1f733f0-3658-4745-8be2-f226b488dbdd\",\"file_name\":\"QR_GOOGLE_MAPS.png\",\"size\":83829}', NULL, '154.241.58.179', '2026-03-13 01:52:38'),
('52520d40-200a-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:00:12'),
('52701aab-200a-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:00:13'),
('530c7f44-1fbc-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-14 15:41:53'),
('530d843b-1fbc-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"e1fe32d4-5f2b-4dce-ac7c-5e946bda7107\",\"user_id\":\"368d199e-b27d-4949-adce-69816cc53b12\",\"entity_type\":\"domiciliation\",\"entity_id\":\"986de3b3-bca0-4f12-8226-08c835d84a5b\",\"file_name\":\"espace-coworking_copie.jpeg\",\"size\":569079}', NULL, '105.99.17.170', '2026-03-14 15:41:53'),
('535d60f4-1fbc-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-14 15:41:53'),
('535df180-1fbc-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"91345aab-4d78-4594-a1e5-6c67ebac04b3\",\"user_id\":\"368d199e-b27d-4949-adce-69816cc53b12\",\"entity_type\":\"domiciliation\",\"entity_id\":\"986de3b3-bca0-4f12-8226-08c835d84a5b\",\"file_name\":\"booth-aures.jpg\",\"size\":388596}', NULL, '105.99.17.170', '2026-03-14 15:41:53'),
('5396bbe9-0799-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 22:30:54'),
('5397bfad-0799-11f1-b9a2-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '154.241.36.70', '2026-02-11 22:30:54'),
('53b865ae-1fbc-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-14 15:41:54'),
('53b8dd44-1fbc-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"29c2662c-181b-4c9f-9b63-7c2e0e09aa92\",\"user_id\":\"368d199e-b27d-4949-adce-69816cc53b12\",\"entity_type\":\"domiciliation\",\"entity_id\":\"986de3b3-bca0-4f12-8226-08c835d84a5b\",\"file_name\":\"espace-coworking.jpeg\",\"size\":151629}', NULL, '105.99.17.170', '2026-03-14 15:41:54'),
('54507f66-200a-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=37db0c93-9034-46d3-a728-8102bc75330a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:00:16'),
('5495ac7a-200a-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"37db0c93-9034-46d3-a728-8102bc75330a\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"RC_HadCenter_Consulting.pdf\"}', NULL, '154.241.51.36', '2026-03-15 01:00:16'),
('570210d4-20ae-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:34:18'),
('570dc50a-20eb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:50:57'),
('570ea566-20eb-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"46bcc358-c416-4993-bbfc-cc441dd23dec\",\"user_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"entity_type\":\"user\",\"entity_id\":\"9e4bb442-2ac9-4504-81b4-6a20b1e2649e\",\"file_name\":\"Capture_d___e__cran_2026-03-16_a___04.47.58.png\",\"size\":1390486}', NULL, '105.101.26.229', '2026-03-16 03:50:57'),
('571fb999-20ae-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:34:18'),
('57d4ce5c-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:52:50'),
('57f6a759-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:52:50'),
('59eceb7c-1e46-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:04:52'),
('5a0d2630-1e46-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined function mail()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php\",\"line\":111,\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(38): Mailer::sendWithMailFunction(\'wfares.metidji@...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#1 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(122): Mailer::send(\'wfares.metidji@...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#2 \\/home\\/cofficed\\/public_html\\/api\\/auth\\/register.php(176): Mailer::sendWelcomeEmail(\'wfares.metidji@...\', \'fares metidji\')\\n#3 {main}\"}', NULL, '105.98.196.69', '2026-03-12 19:04:53'),
('5a0d47ac-1e46-11f1-81ef-0050560122dd', 'error', 'PHP WARNING: Undefined variable $isProduction', '{\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/bootstrap.php\",\"line\":162,\"type\":\"WARNING\"}', NULL, '105.98.196.69', '2026-03-12 19:04:53'),
('5a7a172c-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:52:55'),
('5a7a87b6-1e7f-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"QR_Inscription_Appli.png\"}', NULL, '154.241.58.179', '2026-03-13 01:52:55'),
('5e8ed2f8-1e46-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:05:00'),
('60349d90-0854-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3a442955-5511-49b1-b3e4-52f625002c7c\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 20:49:51'),
('6034c9d8-0854-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 20:49:51'),
('60539959-0854-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3a442955-5511-49b1-b3e4-52f625002c7c\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 20:49:51'),
('6053cd9f-0854-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 20:49:51'),
('68c45542-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/admin\\/courrier.php?domiciliation_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:17'),
('68e3d68f-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/admin\\/courrier.php?domiciliation_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:17'),
('6980bce8-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:18'),
('69a63f83-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:18'),
('6b97c906-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:22'),
('6b982ae7-20ea-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"C20.pdf\"}', NULL, '105.101.26.229', '2026-03-16 03:44:22'),
('6cb42315-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:01:33'),
('6cb49298-1b7d-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"2ecb2e11-06ad-4f64-b295-d8069fbae716\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"file_name\":\"QR_GOOGLE_MAPS.png\",\"size\":83829}', NULL, '154.241.36.4', '2026-03-09 06:01:33'),
('6d1d09ec-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:01:34'),
('6d1dbf92-1b7d-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"fd20468e-c9cf-49a9-9d90-a865dc10a72b\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"file_name\":\"QR_GOOGLE_MAPS.png\",\"size\":83829}', NULL, '154.241.36.4', '2026-03-09 06:01:34'),
('6d685366-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:01:34'),
('6d68c90a-1b7d-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"c160b41f-b297-43f1-b029-0a0495057d18\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"file_name\":\"QR_GOOGLE_MAPS.png\",\"size\":83829}', NULL, '154.241.36.4', '2026-03-09 06:01:34'),
('6e3ad298-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/update.php?id=b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:26'),
('6e3b0bd7-20ea-11f1-81ef-0050560122dd', 'error', 'Database error in document update', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'statut\' in \'SET\'\"}', NULL, '105.101.26.229', '2026-03-16 03:44:26'),
('6eba482b-20b2-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 21:03:35'),
('6ebaf2fb-20b2-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"186250fd-75fe-43f7-8450-97fc5c0a6b37\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"entity_type\":\"user\",\"entity_id\":\"368d199e-b27d-4949-adce-69816cc53b12\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '105.100.50.115', '2026-03-15 21:03:35'),
('6f90ca80-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:53:30'),
('6fa29499-205d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-15 10:55:10'),
('6fb4aaae-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:53:30'),
('6fbadf79-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/update.php?id=b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:29'),
('6fbb1bdb-20ea-11f1-81ef-0050560122dd', 'error', 'Database error in document update', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'statut\' in \'SET\'\"}', NULL, '105.101.26.229', '2026-03-16 03:44:29'),
('6fc0c5e1-205d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-15 10:55:10'),
('71390852-1e73-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"37.168.24.175\"}', NULL, '37.168.24.175', '2026-03-13 00:27:39'),
('715e0750-1e73-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined function mail()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php\",\"line\":111,\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(38): Mailer::sendWithMailFunction(\'racim.bernaoui1...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#1 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(122): Mailer::send(\'racim.bernaoui1...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#2 \\/home\\/cofficed\\/public_html\\/api\\/auth\\/register.php(176): Mailer::sendWelcomeEmail(\'racim.bernaoui1...\', \'Racim Bernaoui\')\\n#3 {main}\"}', NULL, '37.168.24.175', '2026-03-13 00:27:39'),
('715e2621-1e73-11f1-81ef-0050560122dd', 'error', 'PHP WARNING: Undefined variable $isProduction', '{\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/bootstrap.php\",\"line\":162,\"type\":\"WARNING\"}', NULL, '37.168.24.175', '2026-03-13 00:27:39'),
('721038cd-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:53:34'),
('72108fec-1e7f-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"QR_Inscription_Appli.png\"}', NULL, '154.241.58.179', '2026-03-13 01:53:34'),
('7341840e-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:01:44'),
('735f3302-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:01:44'),
('73816334-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/update.php?id=9869ae36-4f7f-4f3e-b119-0a03b7e95bdc\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:35'),
('73821758-20ea-11f1-81ef-0050560122dd', 'error', 'Database error in document update', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'statut\' in \'SET\'\"}', NULL, '105.101.26.229', '2026-03-16 03:44:35'),
('75005947-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:53:39'),
('7500c200-1e7f-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"1d410f0b-eb7b-438b-850a-0336ec6b8b81\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"QR_Inscription_Appli.png\"}', NULL, '154.241.58.179', '2026-03-13 01:53:39'),
('76c189bc-1e73-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"37.168.24.175\"}', NULL, '37.168.24.175', '2026-03-13 00:27:48'),
('797bc1af-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=37db0c93-9034-46d3-a728-8102bc75330a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:45'),
('79ba76bf-20ea-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"37db0c93-9034-46d3-a728-8102bc75330a\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"RC_HadCenter_Consulting.pdf\"}', NULL, '105.101.26.229', '2026-03-16 03:44:45'),
('79f89525-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=c160b41f-b297-43f1-b029-0a0495057d18\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:01:55'),
('79f8f9be-1b7d-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"c160b41f-b297-43f1-b029-0a0495057d18\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"QR_GOOGLE_MAPS.png\"}', NULL, '154.241.36.4', '2026-03-09 06:01:55'),
('7b8dc95b-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/update.php?id=37db0c93-9034-46d3-a728-8102bc75330a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:44:48'),
('7b8dfe46-20ea-11f1-81ef-0050560122dd', 'error', 'Database error in document update', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'statut\' in \'SET\'\"}', NULL, '105.101.26.229', '2026-03-16 03:44:48'),
('7ca61aaa-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:53:52');
INSERT INTO `logs` (`id`, `level`, `message`, `context`, `user_id`, `ip_address`, `created_at`) VALUES
('7ca61ca3-2010-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:44:20'),
('7ca69061-1e7f-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"f9d50169-f477-4f3b-9cd7-4f67fe8d02e7\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"entity_type\":\"domiciliation\",\"entity_id\":\"a1f733f0-3658-4745-8be2-f226b488dbdd\",\"file_name\":\"4abf2d8f-4248-4856-aa05-070d624ddf8a.png\",\"size\":83829}', NULL, '154.241.58.179', '2026-03-13 01:53:52'),
('7cc95b28-2010-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 01:44:21'),
('7cf56896-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:53:52'),
('7df06df9-07a1-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 23:29:21'),
('7df09b3a-07a1-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 23:29:21'),
('7e20432f-14f8-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.235.132.29\"}', NULL, '105.235.132.29', '2026-02-28 22:54:52'),
('7e212677-14f8-11f1-ba6d-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.235.132.29', '2026-02-28 22:54:52'),
('7e29693d-07a1-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 23:29:21'),
('7e299bc2-07a1-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 23:29:21'),
('7ef4d30e-14f8-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.235.132.29\"}', NULL, '105.235.132.29', '2026-02-28 22:54:54'),
('7ef52e70-14f8-11f1-ba6d-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.235.132.29', '2026-02-28 22:54:54'),
('7f99a52f-14f8-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.235.132.29\"}', NULL, '105.235.132.29', '2026-02-28 22:54:55'),
('7f9a0218-14f8-11f1-ba6d-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.235.132.29', '2026-02-28 22:54:55'),
('822d62c6-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:02:09'),
('822e26e9-1b7d-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"fb643a1f-9365-43d1-9900-c6e2fec2bdc2\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"file_name\":\"HADDAD_M2_BF_Transmission_Disparition.pdf\",\"size\":213074}', NULL, '154.241.36.4', '2026-03-09 06:02:09'),
('825e88e5-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:02:10'),
('82d1bf6b-07a1-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 23:29:29'),
('82d23f15-07a1-11f1-b9a2-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '154.241.36.70', '2026-02-11 23:29:29'),
('851f8c0a-20ae-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:35:35'),
('853c82b4-20ae-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:35:35'),
('86f7bc08-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:54:09'),
('86f868fc-1e7f-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"ff456a6c-4d85-4318-8465-588988f677a4\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"entity_type\":\"domiciliation\",\"entity_id\":\"a1f733f0-3658-4745-8be2-f226b488dbdd\",\"file_name\":\"fedeabd12_gmail.com_20260308_003727_0000.png\",\"size\":704134}', NULL, '154.241.58.179', '2026-03-13 01:54:09'),
('871b42d2-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:54:09'),
('87a632d8-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cdca-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87a7bf33-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204bb80-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87c4d145-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cc77-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87c5f392-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cdca-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87c5f740-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cd72-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87c6038f-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204ce62-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87ca1306-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204bb80-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87e572e2-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204ce62-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87e5ebac-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cd72-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('87e6671c-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cc77-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:09'),
('90384c2e-06d8-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:31:03'),
('9038886b-06d8-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:31:03'),
('905f61a4-06d8-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:31:03'),
('905f93bd-06d8-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.131.47', '2026-02-10 23:31:03'),
('90b0cf28-077d-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3a442955-5511-49b1-b3e4-52f625002c7c\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 19:12:11'),
('90b11f15-077d-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 19:12:11'),
('927f01e3-1e79-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:11:32'),
('92894da2-14f8-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7f3ccbcb-0d23-455c-b6db-32a1c6e9a2ad\",\"ip\":\"105.235.132.29\"}', NULL, '105.235.132.29', '2026-02-28 22:55:27'),
('92898c96-14f8-11f1-ba6d-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '105.235.132.29', '2026-02-28 22:55:27'),
('929e6647-1e79-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined function mail()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php\",\"line\":111,\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(38): Mailer::sendWithMailFunction(\'massylben@gmail...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#1 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(122): Mailer::send(\'massylben@gmail...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#2 \\/home\\/cofficed\\/public_html\\/api\\/auth\\/register.php(176): Mailer::sendWelcomeEmail(\'massylben@gmail...\', \'Massyl Benyoues\')\\n#3 {main}\"}', NULL, '154.241.58.179', '2026-03-13 01:11:32'),
('929e8125-1e79-11f1-81ef-0050560122dd', 'error', 'PHP WARNING: Undefined variable $isProduction', '{\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/bootstrap.php\",\"line\":162,\"type\":\"WARNING\"}', NULL, '154.241.58.179', '2026-03-13 01:11:32'),
('94348651-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/reservations\\/create.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:30'),
('9434b464-20ea-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined method Auth::getUserById()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/reservations\\/create.php\",\"line\":73,\"trace\":\"#0 {main}\"}', NULL, '105.101.26.229', '2026-03-16 03:45:30'),
('95cc12a2-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/reservations\\/create.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:45:32'),
('95cc3c0e-20ea-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined method Auth::getUserById()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/reservations\\/create.php\",\"line\":73,\"trace\":\"#0 {main}\"}', NULL, '105.101.26.229', '2026-03-16 03:45:32'),
('9af7c914-1451-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.60.7\"}', NULL, '154.241.60.7', '2026-02-28 03:00:15'),
('9af81f53-1451-11f1-ba6d-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.60.7', '2026-02-28 03:00:15'),
('9b07ab73-1e93-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:17:53'),
('9b0cd048-1f16-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:55:37'),
('9b27c41c-1e93-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:17:53'),
('9b3090c5-1f16-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:55:37'),
('9c39401b-07be-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 02:57:47'),
('9c39a5ad-07be-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 02:57:47'),
('9c566685-07be-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 02:57:47'),
('9c56972e-07be-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 02:57:47'),
('9d36b501-20bb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 22:09:19'),
('9d37cc5d-20bb-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"bef3ca78-8bc3-4fce-bda7-638230912f7d\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '105.100.50.115', '2026-03-15 22:09:19'),
('9f6772b2-0b2c-11f1-b8aa-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8d0933fd-962f-457c-b189-3f5369ee1b88\",\"ip\":\"154.241.41.35\"}', NULL, '154.241.41.35', '2026-02-16 11:42:50'),
('9f67d658-0b2c-11f1-b8aa-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.41.35', '2026-02-16 11:42:50'),
('9f87222f-0b2c-11f1-b8aa-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8d0933fd-962f-457c-b189-3f5369ee1b88\",\"ip\":\"154.241.41.35\"}', NULL, '154.241.41.35', '2026-02-16 11:42:51'),
('9f8757ab-0b2c-11f1-b8aa-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.41.35', '2026-02-16 11:42:51'),
('9fecf5f2-02cb-11f1-a1cd-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=d1099c36-46ed-4c78-b584-b1ce7784f671\",\"ip\":\"154.241.49.178\"}', NULL, '154.241.49.178', '2026-02-05 19:48:20'),
('9fed3e7e-02cb-11f1-a1cd-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.49.178', '2026-02-05 19:48:20'),
('a16bd261-1e86-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 02:45:00'),
('a16ce0f7-1e86-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"cf950578-a275-420d-a65c-193d7cc0c00a\",\"file_name\":\"cv_guerraiche_hakima__1_.pdf\",\"size\":142712}', NULL, '154.241.58.179', '2026-03-13 02:45:00'),
('a211cb07-2086-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 15:50:04'),
('a230123b-2086-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ec0edb18-6c78-4716-ba3d-b84fdffd3feb\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 15:50:04'),
('a24c15d3-0b2c-11f1-b8aa-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8d0933fd-962f-457c-b189-3f5369ee1b88\",\"ip\":\"154.241.41.35\"}', NULL, '154.241.41.35', '2026-02-16 11:42:55'),
('a24c43c6-0b2c-11f1-b8aa-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.41.35', '2026-02-16 11:42:55'),
('a282ab4a-0b2c-11f1-b8aa-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8d0933fd-962f-457c-b189-3f5369ee1b88\",\"ip\":\"154.241.41.35\"}', NULL, '154.241.41.35', '2026-02-16 11:42:56'),
('a282e2d2-0b2c-11f1-b8aa-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.41.35', '2026-02-16 11:42:56'),
('a3446a3b-06d8-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.235.131.47\"}', NULL, '105.235.131.47', '2026-02-10 23:31:35'),
('a344d770-06d8-11f1-b9a2-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.235.131.47', '2026-02-10 23:31:35'),
('a7fd0c89-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204bb80-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a7fdaf77-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cdca-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a814e455-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cc77-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a82494e7-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cdca-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a824a941-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204bb80-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a824ee7b-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cd72-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a826550a-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204ce62-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a83241f2-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cc77-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a8428def-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204cd72-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('a842fa88-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/reservations\\/availability.php?espace_id=1204ce62-f70e-11f0-b5ec-0050560122dd&date_debut=2026-03-01&date_fin=2026-03-31\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:03'),
('aa816f1d-1e47-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:14:17'),
('aa829e3b-1e47-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"9bd8c9ad-f871-4e2d-8b70-01a91143dfea\",\"user_id\":\"913be781-ae2e-47c5-a0cc-d19bf3be26f9\",\"entity_type\":\"domiciliation\",\"entity_id\":\"3e6711f7-53d4-4c59-9034-da775520f99d\",\"file_name\":\"PFI-10001637.pdf\",\"size\":330054}', NULL, '105.98.196.69', '2026-03-12 19:14:17'),
('ab31b66b-1e47-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:14:18'),
('ab32a254-1e47-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"983e9c0d-8fb4-43f3-949a-a240011969d2\",\"user_id\":\"913be781-ae2e-47c5-a0cc-d19bf3be26f9\",\"entity_type\":\"domiciliation\",\"entity_id\":\"3e6711f7-53d4-4c59-9034-da775520f99d\",\"file_name\":\"PFI-10001637.pdf\",\"size\":330054}', NULL, '105.98.196.69', '2026-03-12 19:14:18'),
('abd92c43-1e47-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:14:19'),
('abd9c99a-1e47-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"352858bf-b3e6-49c9-adbf-297e9adf48c4\",\"user_id\":\"913be781-ae2e-47c5-a0cc-d19bf3be26f9\",\"entity_type\":\"domiciliation\",\"entity_id\":\"3e6711f7-53d4-4c59-9034-da775520f99d\",\"file_name\":\"PFI-10001637.pdf\",\"size\":330054}', NULL, '105.98.196.69', '2026-03-12 19:14:19'),
('acf9e15e-1e46-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7f3ccbcb-0d23-455c-b6db-32a1c6e9a2ad\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:07:12'),
('ad31b61b-0776-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 18:22:52'),
('ad321180-0776-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 18:22:52'),
('ad4e917a-0776-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=7d8b71b8-ac75-44e1-bb3d-b25f0c35df6f\",\"ip\":\"154.241.36.70\"}', NULL, '154.241.36.70', '2026-02-11 18:22:52'),
('ad4ec2a2-0776-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.36.70', '2026-02-11 18:22:52'),
('add6cedc-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:03:23'),
('adf4aa81-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:03:23'),
('af9cdabb-20a9-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:00:59'),
('afba37fd-20a9-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.100.50.115\"}', NULL, '105.100.50.115', '2026-03-15 20:00:59'),
('b32695fc-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:20'),
('b343790a-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:21'),
('b5751aab-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:24'),
('b5755b8d-1f10-11f1-81ef-0050560122dd', 'error', 'Document file not found', '{\"document_id\":\"8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"path\":\"\\/home\\/cofficed\\/public_html\\/api\\/documents\\/..\\/uploads\\/documents\\/cde3d624-9035-46e3-8f9b-c9c99aec25b8.pdf\"}', NULL, '105.101.159.113', '2026-03-13 19:13:24'),
('b59c6285-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:25'),
('b59c9cee-1f10-11f1-81ef-0050560122dd', 'error', 'Document file not found', '{\"document_id\":\"8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"path\":\"\\/home\\/cofficed\\/public_html\\/api\\/documents\\/..\\/uploads\\/documents\\/cde3d624-9035-46e3-8f9b-c9c99aec25b8.pdf\"}', NULL, '105.101.159.113', '2026-03-13 19:13:25'),
('b61bf73c-1e96-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:40:07'),
('b63b5983-1e96-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined function mail()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php\",\"line\":111,\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(38): Mailer::sendWithMailFunction(\'h.m.s.aghiles@g...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#1 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(122): Mailer::send(\'h.m.s.aghiles@g...\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#2 \\/home\\/cofficed\\/public_html\\/api\\/auth\\/register.php(176): Mailer::sendWelcomeEmail(\'h.m.s.aghiles@g...\', \'Aghiles Haddad\')\\n#3 {main}\"}', NULL, '154.241.58.179', '2026-03-13 04:40:07'),
('b63b865f-1e96-11f1-81ef-0050560122dd', 'error', 'PHP WARNING: Undefined variable $isProduction', '{\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/bootstrap.php\",\"line\":162,\"type\":\"WARNING\"}', NULL, '154.241.58.179', '2026-03-13 04:40:07'),
('b6dcde4e-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:27'),
('b6dd1eaf-1f10-11f1-81ef-0050560122dd', 'error', 'Document file not found', '{\"document_id\":\"8b8aaaf4-7883-46ce-9793-142933c9e1e5\",\"path\":\"\\/home\\/cofficed\\/public_html\\/api\\/documents\\/..\\/uploads\\/documents\\/cde3d624-9035-46e3-8f9b-c9c99aec25b8.pdf\"}', NULL, '105.101.159.113', '2026-03-13 19:13:27'),
('b73b0e13-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:03:38'),
('b757a9f6-1b7d-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:03:38'),
('b8133d2b-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/abonnements\\/souscrire.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:30'),
('ba26e557-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/admin\\/courrier.php?domiciliation_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:00:52'),
('ba448fcd-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/admin\\/courrier.php?domiciliation_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:00:53'),
('babcbd7d-1e96-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:40:15'),
('bacb3c45-1e47-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3e6711f7-53d4-4c59-9034-da775520f99d\",\"ip\":\"105.98.196.69\"}', NULL, '105.98.196.69', '2026-03-12 19:14:44'),
('bb534871-1ffa-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 23:08:37'),
('bb546fed-1ffa-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"a01e6241-8ad2-4652-9c75-bfcf1db32293\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '154.241.51.36', '2026-03-14 23:08:37'),
('bbc6a170-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:35'),
('bbc743c2-1f10-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"46d0051f-890e-42af-b7ad-5000a4095af0\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"cf950578-a275-420d-a65c-193d7cc0c00a\",\"file_name\":\"QR_Inscription_Appli.png\",\"size\":83920}', NULL, '105.101.159.113', '2026-03-13 19:13:35'),
('bbe74afe-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:35'),
('bc4e535e-1fe4-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 20:31:09'),
('bc4efb64-1fe4-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"83f68b61-f693-4d79-8528-3e2e7adff5c7\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '154.241.51.36', '2026-03-14 20:31:09'),
('be8d0d95-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=46d0051f-890e-42af-b7ad-5000a4095af0\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:40'),
('be8d6f7c-1f10-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"46d0051f-890e-42af-b7ad-5000a4095af0\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"QR_Inscription_Appli.png\"}', NULL, '105.101.159.113', '2026-03-13 19:13:40'),
('beb5cb16-20ea-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/abonnements\\/souscrire.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:46:41'),
('bee68922-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/admin\\/courrier.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:01:00'),
('bef9ed34-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:16:05'),
('befb2379-1bb1-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"30bcd529-f119-4468-8151-9f10dc0e9ba6\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"file_name\":\"Capture_d___e__cran_2026-03-02_a___06.52.59.png\",\"size\":86126}', NULL, '154.241.36.4', '2026-03-09 12:16:05'),
('bfb7cbfe-1e96-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:40:23'),
('bfc56206-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:16:06'),
('bfc6847b-1bb1-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"c99188df-5da4-413e-8700-4703818b235c\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"file_name\":\"Capture_d___e__cran_2026-03-02_a___06.32.26.png\",\"size\":1393656}', NULL, '154.241.36.4', '2026-03-09 12:16:06'),
('c02f197a-1fbb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-14 15:37:46'),
('c035245a-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:16:07'),
('c0359b69-1bb1-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"69a0c042-506a-4e48-ae21-523c47e331b0\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"file_name\":\"cv_guerraiche_hakima__1_.pdf\",\"size\":142712}', NULL, '154.241.36.4', '2026-03-09 12:16:07'),
('c04e63e0-1fbb-11f1-81ef-0050560122dd', 'error', 'Uncaught Exception: Call to undefined function mail()', '{\"exception\":\"Error\",\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php\",\"line\":111,\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(38): Mailer::sendWithMailFunction(\'aghiles.haddad....\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#1 \\/home\\/cofficed\\/public_html\\/api\\/utils\\/Mailer.php(122): Mailer::send(\'aghiles.haddad....\', \'Bienvenue chez ...\', \'<!DOCTYPE html ...\')\\n#2 \\/home\\/cofficed\\/public_html\\/api\\/auth\\/register.php(176): Mailer::sendWelcomeEmail(\'aghiles.haddad....\', \'Aghiles Haddad\')\\n#3 {main}\"}', NULL, '105.99.17.170', '2026-03-14 15:37:47'),
('c04e78ae-1fbb-11f1-81ef-0050560122dd', 'error', 'PHP WARNING: Undefined variable $isProduction', '{\"file\":\"\\/home\\/cofficed\\/public_html\\/api\\/bootstrap.php\",\"line\":162,\"type\":\"WARNING\"}', NULL, '105.99.17.170', '2026-03-14 15:37:47'),
('c0ab40d1-1e93-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:18:56'),
('c0cb2115-1e93-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 04:18:56'),
('c113cb4e-1c89-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/auth\\/register.php\",\"ip\":\"154.241.63.251\"}', NULL, '154.241.63.251', '2026-03-10 14:02:20'),
('c21e4c08-1b37-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"129.45.70.188\"}', NULL, '129.45.70.188', '2026-03-08 21:42:51'),
('c21f2065-1b37-11f1-81ef-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '129.45.70.188', '2026-03-08 21:42:51'),
('c30820c5-1b37-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"129.45.70.188\"}', NULL, '129.45.70.188', '2026-03-08 21:42:53'),
('c3088e5a-1b37-11f1-81ef-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '129.45.70.188', '2026-03-08 21:42:53'),
('c37b79ef-07bf-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 03:06:02'),
('c37bcbb2-07bf-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 03:06:02'),
('c3b61043-07bf-11f1-b9a2-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.59.179\"}', NULL, '154.241.59.179', '2026-02-12 03:06:03'),
('c3b64533-07bf-11f1-b9a2-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.59.179', '2026-02-12 03:06:03'),
('c3d30d77-1b37-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"129.45.70.188\"}', NULL, '129.45.70.188', '2026-03-08 21:42:54'),
('c3d38247-1b37-11f1-81ef-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '129.45.70.188', '2026-03-08 21:42:54'),
('c7d42fa4-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:16:20'),
('c7f1930c-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:16:20'),
('c811638e-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:55'),
('c811e5a7-1f10-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"7984cf06-f014-4d2a-a983-6dd65bfbc790\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"cf950578-a275-420d-a65c-193d7cc0c00a\",\"file_name\":\"cv_guerraiche_hakima__1_.pdf\",\"size\":142712}', NULL, '105.101.159.113', '2026-03-13 19:13:55'),
('c83c86eb-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:56'),
('ca0dbf93-1f10-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=7984cf06-f014-4d2a-a983-6dd65bfbc790\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 19:13:59'),
('ca0e2e75-1f10-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"7984cf06-f014-4d2a-a983-6dd65bfbc790\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"cv_guerraiche_hakima__1_.pdf\"}', NULL, '105.101.159.113', '2026-03-13 19:13:59'),
('cbec86a3-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:02:08'),
('cc0affd7-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:02:08'),
('d0071ea0-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:01:29'),
('d0250880-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:01:29'),
('d0b4467e-20eb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/admin\\/courrier.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:54:21'),
('d0d3092d-20eb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/admin\\/courrier.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:54:21'),
('d0fe318e-1451-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=ba9e95e6-6d89-481b-8134-f12a62569445\",\"ip\":\"154.241.60.7\"}', NULL, '154.241.60.7', '2026-02-28 03:01:45'),
('d0fe618f-1451-11f1-ba6d-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.60.7', '2026-02-28 03:01:45'),
('d1b06966-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/update.php?id=b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:01:32'),
('d1b0a24b-20ec-11f1-81ef-0050560122dd', 'error', 'Database error in document update', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'statut\' in \'SET\'\"}', NULL, '105.101.26.229', '2026-03-16 04:01:32');
INSERT INTO `logs` (`id`, `level`, `message`, `context`, `user_id`, `ip_address`, `created_at`) VALUES
('d1cb3bac-1c89-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.63.251\"}', NULL, '154.241.63.251', '2026-03-10 14:02:48'),
('d5b46f54-20eb-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/admin\\/courrier.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 03:54:29'),
('d87176c3-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:49:38'),
('d895bc13-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:49:39'),
('d8dc27df-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:56:27'),
('d8fc0035-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:56:27'),
('d9c19bdb-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"PUT\",\"uri\":\"\\/api\\/documents\\/update.php?id=b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:01:45'),
('d9c1dde9-20ec-11f1-81ef-0050560122dd', 'error', 'Database error in document update', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'statut\' in \'SET\'\"}', NULL, '105.101.26.229', '2026-03-16 04:01:45'),
('da3a4a9b-205b-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-15 10:43:49'),
('da581614-205b-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-15 10:43:50'),
('daa7f0c4-1fac-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 13:51:08'),
('dac5a134-1fac-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-14 13:51:09'),
('db16c7af-1fe3-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 20:24:51'),
('dc546d90-1e81-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 02:10:51'),
('dc71d6a5-1e81-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 02:10:52'),
('dd0fab87-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=ff456a6c-4d85-4318-8465-588988f677a4\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:56:34'),
('dd42ce54-1e7f-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"ff456a6c-4d85-4318-8465-588988f677a4\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"fedeabd12_gmail.com_20260308_003727_0000.png\"}', NULL, '154.241.58.179', '2026-03-13 01:56:34'),
('dfc1866f-1fe3-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 20:24:59'),
('dfc276a9-1fe3-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"d85b42ba-9d26-47f1-bcc5-cb49080fb03d\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '154.241.51.36', '2026-03-14 20:24:59'),
('dfdaf501-205b-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=a6553498-25cc-4305-8081-4a40ab120560\",\"ip\":\"105.99.17.170\"}', NULL, '105.99.17.170', '2026-03-15 10:43:59'),
('e0160bcb-205b-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"a6553498-25cc-4305-8081-4a40ab120560\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"CN_Aghiles_bis.pdf\"}', NULL, '105.99.17.170', '2026-03-15 10:43:59'),
('e31e6038-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:49:56'),
('e3bf279b-1f01-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 17:27:19'),
('e3dda560-1f01-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=cf950578-a275-420d-a65c-193d7cc0c00a\",\"ip\":\"105.101.159.113\"}', NULL, '105.101.159.113', '2026-03-13 17:27:20'),
('e5ac34b3-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:05'),
('e5c873e3-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:06'),
('e92dcd66-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:17:16'),
('e94d1eda-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:17:16'),
('e9d72095-20d6-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 01:24:44'),
('e9d88a75-20d6-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"fd435bb5-9b5a-4357-9551-40c21545e386\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '105.101.26.229', '2026-03-16 01:24:44'),
('e9e0b586-1b7e-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:12:13'),
('e9fc9e2e-1b7e-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8c7a9a7e-05a4-444d-803c-29ceb91ea6c0\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 06:12:13'),
('eae68102-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:09'),
('eae735c6-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"2e0adae4-c7f1-4fce-ae49-18c317a53db7\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"NIF.pdf\",\"size\":226800}', NULL, '154.241.51.36', '2026-03-15 00:50:09'),
('eb09e2d8-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:10'),
('ebf60d97-0ddc-11f1-b8aa-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8d0933fd-962f-457c-b189-3f5369ee1b88\",\"ip\":\"154.252.238.171\"}', NULL, '154.252.238.171', '2026-02-19 21:49:53'),
('ebf675d9-0ddc-11f1-b8aa-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.252.238.171', '2026-02-19 21:49:53'),
('ec13cc3e-0ddc-11f1-b8aa-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=8d0933fd-962f-457c-b189-3f5369ee1b88\",\"ip\":\"154.252.238.171\"}', NULL, '154.252.238.171', '2026-02-19 21:49:53'),
('ec13fe26-0ddc-11f1-b8aa-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.252.238.171', '2026-02-19 21:49:53'),
('ec18a5d3-2005-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:28:43'),
('ec1998dd-2005-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"bd331088-1a49-4ffc-b3a7-c42499398feb\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '154.241.51.36', '2026-03-15 00:28:43'),
('ed18a7df-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:03:03'),
('ed370b04-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:03:04'),
('ee1eca39-1c89-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.63.251\"}', NULL, '154.241.63.251', '2026-03-10 14:03:35'),
('ee8ac7d8-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:16'),
('ee8c3caf-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"b29e8b35-ac5a-4732-8937-05d1f601dfe3\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"C20.pdf\",\"size\":122873}', NULL, '154.241.51.36', '2026-03-15 00:50:16'),
('eead1a56-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:16'),
('f0b0e769-1fc8-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 17:12:11'),
('f0b223c1-1fc8-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"9200e3f3-a9cb-450b-aacd-ccde8a264f7a\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"dernier.png\",\"size\":457882}', NULL, '154.241.51.36', '2026-03-14 17:12:11'),
('f1dcc817-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:26'),
('f1f951ec-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:26'),
('f24a8489-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:22'),
('f24b1941-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"5dce7be2-7041-49b0-9304-0471de7bf5cf\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"NIS.pdf\",\"size\":285945}', NULL, '154.241.51.36', '2026-03-15 00:50:22'),
('f26b16c0-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:22'),
('f2a43934-1fc5-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-14 16:50:46'),
('f2a567b9-1fc5-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"f0222786-3d07-434b-979d-bfd16fa0fecf\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"espace-coworking_copie.jpeg\",\"size\":569079}', NULL, '154.241.51.36', '2026-03-14 16:50:46'),
('f4707f3f-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:03:16'),
('f4904688-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:03:16'),
('f5deef4a-1b37-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"129.45.70.188\"}', NULL, '129.45.70.188', '2026-03-08 21:44:18'),
('f5df21f3-1b37-11f1-81ef-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '129.45.70.188', '2026-03-08 21:44:18'),
('f667ef8a-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:34'),
('f6690828-20ec-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"916bead5-4889-41c8-ae1a-e4eea4961f56\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"Capture_d___e__cran_2026-03-16_a___04.47.58.png\",\"size\":1390486}', NULL, '105.101.26.229', '2026-03-16 04:02:34'),
('f67a4a82-20d6-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 01:25:05'),
('f67b416c-20d6-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"58bffc6b-cd56-4a32-bc32-f71d143c1b14\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '105.101.26.229', '2026-03-16 01:25:05'),
('f6864fe5-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:34'),
('f72ab7b0-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:03:20'),
('f748fe7a-1baf-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3879c527-29b4-4935-b4eb-8ec22925f831\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:03:21'),
('f7b9d6c8-20ec-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/download.php?id=916bead5-4889-41c8-ae1a-e4eea4961f56\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 04:02:36'),
('f803bc5f-20ec-11f1-81ef-0050560122dd', 'info', 'Document downloaded', '{\"document_id\":\"916bead5-4889-41c8-ae1a-e4eea4961f56\",\"user_id\":\"be9366a8-0f8f-4559-8f5e-8709660ed8b4\",\"file_name\":\"Capture_d___e__cran_2026-03-16_a___04.47.58.png\"}', NULL, '105.101.26.229', '2026-03-16 04:02:36'),
('f8a9d06b-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:17:42'),
('f8e5e7f0-1bb1-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=06ab5d9e-4f54-4543-a2c0-96564af7f3e6\",\"ip\":\"154.241.36.4\"}', NULL, '154.241.36.4', '2026-03-09 12:17:42'),
('fb066f70-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:36'),
('fb07fd8f-2008-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"9869ae36-4f7f-4f3e-b119-0a03b7e95bdc\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"domiciliation\",\"entity_id\":\"055f286d-9a3b-4b40-983b-45518432e22a\",\"file_name\":\"Nouveaux_Statuts.pdf\",\"size\":2087383}', NULL, '154.241.51.36', '2026-03-15 00:50:36'),
('fb27eaa2-2008-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=055f286d-9a3b-4b40-983b-45518432e22a\",\"ip\":\"154.241.51.36\"}', NULL, '154.241.51.36', '2026-03-15 00:50:37'),
('fb282d0e-20d6-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.101.26.229\"}', NULL, '105.101.26.229', '2026-03-16 01:25:13'),
('fb28c5dd-20d6-11f1-81ef-0050560122dd', 'info', 'Document uploaded', '{\"document_id\":\"ecd9a01e-61f0-4150-ba37-b025558ff8bd\",\"user_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"entity_type\":\"user\",\"entity_id\":\"5e9d1072-9003-4c16-bd79-97567726b006\",\"file_name\":\"CN_Aghiles_bis.pdf\",\"size\":650145}', NULL, '105.101.26.229', '2026-03-16 01:25:13'),
('fc6aa41d-1e79-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3e6711f7-53d4-4c59-9034-da775520f99d\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:14:29'),
('fc8afef5-1e79-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=3e6711f7-53d4-4c59-9034-da775520f99d\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:14:30'),
('fcdea0ba-1268-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.97.42.35\"}', NULL, '105.97.42.35', '2026-02-25 16:42:35'),
('fcdf8c3f-1268-11f1-ba6d-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.97.42.35', '2026-02-25 16:42:35'),
('fd49ad4c-02cb-11f1-a1cd-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=d1099c36-46ed-4c78-b584-b1ce7784f671\",\"ip\":\"154.241.49.178\"}', NULL, '154.241.49.178', '2026-02-05 19:50:56'),
('fd49e8f9-02cb-11f1-a1cd-0050560122dd', 'error', 'Database error in documents list', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'created_at\' in \'ORDER BY\'\"}', NULL, '154.241.49.178', '2026-02-05 19:50:56'),
('fe5657ec-1268-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.97.42.35\"}', NULL, '105.97.42.35', '2026-02-25 16:42:37'),
('fe56ad8c-1268-11f1-ba6d-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.97.42.35', '2026-02-25 16:42:37'),
('ff4e91f5-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:57:31'),
('ff6e1f8b-1e7f-11f1-81ef-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"GET\",\"uri\":\"\\/api\\/documents\\/index.php?entity_type=domiciliation&entity_id=a1f733f0-3658-4745-8be2-f226b488dbdd\",\"ip\":\"154.241.58.179\"}', NULL, '154.241.58.179', '2026-03-13 01:57:31'),
('ffb44483-1268-11f1-ba6d-0050560122dd', 'info', 'API Bootstrap initialized', '{\"method\":\"POST\",\"uri\":\"\\/api\\/documents\\/upload.php\",\"ip\":\"105.97.42.35\"}', NULL, '105.97.42.35', '2026-02-25 16:42:40'),
('ffb4ad11-1268-11f1-ba6d-0050560122dd', 'error', 'Error in document upload', '{\"error\":\"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'type_document\' in \'INSERT INTO\'\",\"trace\":\"#0 \\/home\\/cofficed\\/public_html\\/api\\/documents\\/upload.php(144): PDO->prepare(\'\\\\n        INSERT...\')\\n#1 {main}\"}', NULL, '105.97.42.35', '2026-02-25 16:42:40');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL COMMENT 'UUID de la notification',
  `user_id` char(36) DEFAULT NULL,
  `type` enum('reservation','abonnement','domiciliation','paiement','promo','parrainage','systeme') NOT NULL COMMENT 'Type de notification',
  `titre` varchar(200) NOT NULL COMMENT 'Titre de la notification',
  `message` text NOT NULL COMMENT 'Message complet',
  `lue` tinyint(1) DEFAULT 0 COMMENT 'Notification lue',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Métadonnées additionnelles' CHECK (json_valid(`metadata`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notifications utilisateurs';

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `titre`, `message`, `lue`, `metadata`, `created_at`) VALUES
('7c90769f-853e-4def-9701-5fe876fbf76c', '5e9d1072-9003-4c16-bd79-97567726b006', 'reservation', 'Mise à jour réservation', 'Votre réservation est en cours.', 0, NULL, '2026-03-16 03:57:09');

-- --------------------------------------------------------

--
-- Structure de la table `parrainages`
--

CREATE TABLE `parrainages` (
  `id` char(36) NOT NULL COMMENT 'UUID du parrainage',
  `parrain_id` char(36) DEFAULT NULL,
  `code_parrain` varchar(50) NOT NULL COMMENT 'Code unique du parrain',
  `parraines` int(11) DEFAULT 0 COMMENT 'Nombre de parrainés',
  `recompenses_totales` decimal(10,2) DEFAULT 0.00 COMMENT 'Total des récompenses',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Système de parrainage';

--
-- Déchargement des données de la table `parrainages`
--

INSERT INTO `parrainages` (`id`, `parrain_id`, `code_parrain`, `parraines`, `recompenses_totales`, `created_at`, `updated_at`) VALUES
('07807e1c-f958-449a-92cf-d647dbeb93cb', '368d199e-b27d-4949-adce-69816cc53b12', 'CPF368D19', 0, 0.00, '2026-03-14 15:37:47', '2026-03-14 15:37:47'),
('0b6f2d7b-0ce3-436c-b813-fb3ed3eab336', 'c0fd8976-4355-4c72-bb66-df96d38c9cd8', 'CPFC0FD89', 0, 0.00, '2026-03-02 10:12:14', '2026-03-02 10:12:14'),
('2cdab86b-9ed5-4ac7-9172-9fd671bcb848', '0d71495e-9d4c-465c-987c-cc028c603e15', 'CPF0D7149', 0, 0.00, '2026-02-28 22:51:07', '2026-02-28 22:51:07'),
('6417e9b6-8c1d-4392-8d57-1fefb8e89f14', 'ef21793d-bdc5-44cd-af67-51020bc3c1f4', 'CPFEF2179', 0, 0.00, '2026-03-14 13:46:45', '2026-03-14 13:46:45'),
('68a69e2b-d085-4cf5-b629-98e25563f0ae', '913be781-ae2e-47c5-a0cc-d19bf3be26f9', 'CPF913BE7', 0, 0.00, '2026-03-12 19:04:53', '2026-03-12 19:04:53'),
('89cb8b26-cbb3-47a3-b757-8cff37a56456', '4275c91b-47fb-4257-8e8e-ab76b65e8bbd', 'CPF4275C9', 0, 0.00, '2026-02-16 17:12:04', '2026-02-16 17:12:04'),
('97a46196-a8fd-4fa3-b92c-e6699ff6c1c0', '69b7f677-4c75-4bf4-a9db-13be41aa5053', 'CPF69B7F6', 0, 0.00, '2026-03-08 21:36:47', '2026-03-08 21:36:47'),
('b4322101-98e4-4ff2-9b77-7ef41a432b16', 'ca258be0-0bad-4e5a-84da-9387a6dd3cbb', 'CPFCA258B', 0, 0.00, '2026-03-13 00:27:39', '2026-03-13 00:27:39'),
('e1b38de2-4d3c-494c-9ee7-e058c82c6001', '175775df-b36c-41d7-b776-abb6adb41c47', 'CPF175775', 0, 0.00, '2026-03-08 02:57:57', '2026-03-08 02:57:57'),
('eaca20e3-9d0c-4d74-bd6a-aea73ed24a7e', '9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'CPF9E4BB4', 0, 0.00, '2026-03-13 01:11:32', '2026-03-13 01:11:32'),
('efaadd6f-ec6f-4094-8679-f556c97488e0', '5e9d1072-9003-4c16-bd79-97567726b006', 'CPF5E9D10', 2, 6000.00, '2026-02-11 21:07:12', '2026-03-14 13:46:45'),
('f390cd70-e033-4b8f-b567-873dfe1490aa', '1457e424-78bf-4a7e-b307-1545de20c242', 'CPF1457E4', 0, 0.00, '2026-03-13 04:40:07', '2026-03-13 04:40:07');

-- --------------------------------------------------------

--
-- Structure de la table `parrainages_details`
--

CREATE TABLE `parrainages_details` (
  `id` char(36) NOT NULL COMMENT 'UUID du détail',
  `parrainage_id` char(36) NOT NULL COMMENT 'Parrainage parent',
  `filleul_id` char(36) DEFAULT NULL,
  `recompense_parrain` decimal(10,2) DEFAULT 0.00 COMMENT 'Récompense du parrain',
  `recompense_filleul` decimal(10,2) DEFAULT 0.00 COMMENT 'Récompense du filleul',
  `statut` enum('en_attente','valide','paye') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la récompense',
  `date_inscription` datetime DEFAULT current_timestamp() COMMENT 'Date d''inscription du filleul',
  `date_validation` datetime DEFAULT NULL COMMENT 'Date de validation'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Détails des parrainages';

-- --------------------------------------------------------

--
-- Structure de la table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` char(36) NOT NULL COMMENT 'UUID du reset',
  `user_id` char(36) DEFAULT NULL,
  `email` varchar(255) NOT NULL COMMENT 'Email de l''utilisateur',
  `token` varchar(255) NOT NULL COMMENT 'Token unique de réinitialisation',
  `expires_at` datetime NOT NULL COMMENT 'Date d''expiration du token (1h)',
  `used_at` datetime DEFAULT NULL COMMENT 'Date d''utilisation du token',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Adresse IP de la demande',
  `user_agent` text DEFAULT NULL COMMENT 'User agent de la requête',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Date de création'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tokens de réinitialisation de mot de passe';

-- --------------------------------------------------------

--
-- Structure de la table `rate_limits`
--

CREATE TABLE `rate_limits` (
  `id` int(11) NOT NULL,
  `key_name` varchar(255) NOT NULL COMMENT 'Clé de limitation',
  `attempts` int(11) NOT NULL DEFAULT 0 COMMENT 'Nombre de tentatives',
  `expires_at` datetime NOT NULL COMMENT 'Expiration'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rate limiting pour la sécurité';

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` char(36) NOT NULL COMMENT 'UUID de la réservation',
  `user_id` char(36) DEFAULT NULL,
  `contact_id` char(36) DEFAULT NULL,
  `espace_id` char(36) NOT NULL COMMENT 'Espace réservé',
  `date_debut` datetime NOT NULL COMMENT 'Date et heure de début',
  `date_fin` datetime NOT NULL COMMENT 'Date et heure de fin',
  `statut` enum('confirmee','en_attente','en_cours','annulee','terminee') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la réservation',
  `type_reservation` enum('heure','demi_journee','jour','semaine','mois') NOT NULL DEFAULT 'heure' COMMENT 'Type de période',
  `montant_total` decimal(10,2) NOT NULL COMMENT 'Montant total en DA',
  `reduction` decimal(10,2) DEFAULT 0.00 COMMENT 'Réduction appliquée',
  `code_promo_id` char(36) DEFAULT NULL COMMENT 'Code promo utilisé',
  `montant_paye` decimal(10,2) DEFAULT 0.00 COMMENT 'Montant déjà payé',
  `mode_paiement` varchar(50) DEFAULT NULL COMMENT 'Mode de paiement (cash, carte, etc.)',
  `notes` text DEFAULT NULL COMMENT 'Notes de l''utilisateur',
  `participants` int(11) NOT NULL DEFAULT 1 COMMENT 'Nombre de participants',
  `rappel_envoye` tinyint(1) DEFAULT 0 COMMENT 'Rappel email envoyé (0=non, 1=oui)',
  `annulee_par` char(36) DEFAULT NULL COMMENT 'ID de l''utilisateur ayant annulé',
  `raison_annulation` text DEFAULT NULL COMMENT 'Raison de l''annulation',
  `date_annulation` datetime DEFAULT NULL COMMENT 'Date d''annulation',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `no_show` tinyint(1) DEFAULT 0 COMMENT 'Le client ne s est pas présenté',
  `checkin_id` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `contact_id`, `espace_id`, `date_debut`, `date_fin`, `statut`, `type_reservation`, `montant_total`, `reduction`, `code_promo_id`, `montant_paye`, `mode_paiement`, `notes`, `participants`, `rappel_envoye`, `annulee_par`, `raison_annulation`, `date_annulation`, `created_at`, `updated_at`, `no_show`, `checkin_id`) VALUES
('ed155d26-9b8f-43a8-9b6d-6aacd057737c', '5e9d1072-9003-4c16-bd79-97567726b006', NULL, '1204bb80-f70e-11f0-b5ec-0050560122dd', '2026-03-16 08:30:00', '2026-03-16 12:30:00', 'en_cours', 'heure', 800.00, 0.00, NULL, 0.00, NULL, '', 1, 0, NULL, NULL, NULL, '2026-03-16 01:59:08', '2026-03-16 03:57:09', 0, NULL);

--
-- Déclencheurs `reservations`
--
DELIMITER $$
CREATE TRIGGER `after_reservation_created` AFTER INSERT ON `reservations` FOR EACH ROW BEGIN
    INSERT INTO notifications (id, user_id, type, titre, message, created_at)
    VALUES (
        UUID(),
        NEW.user_id,
        'reservation',
        'Nouvelle réservation',
        CONCAT('Votre réservation pour ', (SELECT nom FROM espaces WHERE id = NEW.espace_id), ' a été créée avec succès.'),
        NOW()
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` char(36) NOT NULL COMMENT 'UUID de la transaction',
  `user_id` char(36) DEFAULT NULL,
  `type` enum('abonnement','reservation','domiciliation','remboursement') NOT NULL COMMENT 'Type de transaction',
  `montant` decimal(10,2) NOT NULL COMMENT 'Montant en DA',
  `statut` enum('en_attente','completee','echouee','remboursee') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la transaction',
  `mode_paiement` varchar(50) DEFAULT NULL COMMENT 'Mode de paiement utilisé',
  `reference` varchar(100) DEFAULT NULL COMMENT 'Référence unique',
  `description` text DEFAULT NULL COMMENT 'Description de la transaction',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Métadonnées additionnelles' CHECK (json_valid(`metadata`)),
  `date_paiement` datetime DEFAULT NULL COMMENT 'Date effective du paiement',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historique des transactions financières';

-- --------------------------------------------------------

--
-- Structure de la table `transactions_caisse`
--

CREATE TABLE `transactions_caisse` (
  `id` char(36) NOT NULL,
  `reservation_id` char(36) DEFAULT NULL,
  `domiciliation_id` char(36) DEFAULT NULL,
  `abonnement_utilisateur_id` char(36) DEFAULT NULL,
  `type_transaction` enum('reservation','domiciliation','abonnement','autre') NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `mode_paiement` enum('cash','virement','cheque','tpe','credit') NOT NULL,
  `reference_paiement` varchar(100) DEFAULT NULL COMMENT 'Num chèque, réf virement...',
  `numero_recu` varchar(50) NOT NULL COMMENT 'REC-2026-0001',
  `statut` enum('encaisse','en_attente','annule','rembourse') NOT NULL DEFAULT 'encaisse',
  `encaisse_par` char(36) NOT NULL COMMENT 'Admin qui a encaissé',
  `cloture_id` char(36) DEFAULT NULL COMMENT 'Lien vers clôture journalière',
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL COMMENT 'UUID de l''utilisateur',
  `email` varchar(255) NOT NULL COMMENT 'Email unique de connexion',
  `password_hash` varchar(255) DEFAULT NULL COMMENT 'Hash bcrypt du mot de passe (NULL pour OAuth)',
  `nom` varchar(100) NOT NULL COMMENT 'Nom de famille',
  `prenom` varchar(100) NOT NULL COMMENT 'Prénom',
  `telephone` varchar(20) DEFAULT NULL COMMENT 'Numéro de téléphone',
  `role` enum('admin','user') NOT NULL DEFAULT 'user' COMMENT 'Rôle utilisateur',
  `statut` enum('actif','inactif','suspendu') NOT NULL DEFAULT 'actif' COMMENT 'Statut du compte',
  `avatar` text DEFAULT NULL COMMENT 'URL ou chemin de l''avatar',
  `profession` varchar(100) DEFAULT NULL COMMENT 'Profession de l''utilisateur',
  `entreprise` varchar(200) DEFAULT NULL COMMENT 'Nom de l''entreprise',
  `adresse` text DEFAULT NULL COMMENT 'Adresse complète',
  `bio` text DEFAULT NULL COMMENT 'Biographie ou présentation',
  `wilaya` varchar(100) DEFAULT NULL COMMENT 'Wilaya (Algérie)',
  `commune` varchar(100) DEFAULT NULL COMMENT 'Commune',
  `type_entreprise` enum('auto_entrepreneur','eurl','sarl','spa','snc','scs','startup','freelance','autre') DEFAULT NULL COMMENT 'Type juridique',
  `nif` varchar(50) DEFAULT NULL COMMENT 'Numéro d''Identification Fiscale (20 caractères)',
  `nis` varchar(50) DEFAULT NULL COMMENT 'Numéro d''Identification Statistique (15 caractères)',
  `registre_commerce` varchar(50) DEFAULT NULL COMMENT 'Numéro de registre de commerce',
  `article_imposition` varchar(50) DEFAULT NULL COMMENT 'Article d''imposition',
  `numero_auto_entrepreneur` varchar(50) DEFAULT NULL COMMENT 'Numéro auto-entrepreneur',
  `raison_sociale` varchar(200) DEFAULT NULL COMMENT 'Raison sociale de l''entreprise',
  `date_creation_entreprise` datetime DEFAULT NULL COMMENT 'Date de création de l''entreprise',
  `capital` decimal(15,2) DEFAULT NULL COMMENT 'Capital de l''entreprise en DA',
  `siege_social` text DEFAULT NULL COMMENT 'Adresse du siège social',
  `activite_principale` varchar(200) DEFAULT NULL COMMENT 'Activité principale',
  `forme_juridique` varchar(100) DEFAULT NULL COMMENT 'Forme juridique complète',
  `credit` decimal(10,2) DEFAULT 0.00 COMMENT 'Crédit disponible (bonus parrainage, promotions)',
  `absences` int(11) DEFAULT 0 COMMENT 'Nombre d''absences enregistrées',
  `banned_until` datetime DEFAULT NULL COMMENT 'Date de fin de suspension',
  `derniere_connexion` datetime DEFAULT NULL COMMENT 'Dernière connexion réussie',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Date de création du compte',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Dernière modification',
  `code_parrainage` varchar(20) DEFAULT NULL COMMENT 'Code unique de parrainage de l''utilisateur',
  `google_id` varchar(255) DEFAULT NULL COMMENT 'Google OAuth ID (sub claim)',
  `carte_identite_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Utilisateurs et profils entreprises';

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `nom`, `prenom`, `telephone`, `role`, `statut`, `avatar`, `profession`, `entreprise`, `adresse`, `bio`, `wilaya`, `commune`, `type_entreprise`, `nif`, `nis`, `registre_commerce`, `article_imposition`, `numero_auto_entrepreneur`, `raison_sociale`, `date_creation_entreprise`, `capital`, `siege_social`, `activite_principale`, `forme_juridique`, `credit`, `absences`, `banned_until`, `derniere_connexion`, `created_at`, `updated_at`, `code_parrainage`, `google_id`, `carte_identite_url`) VALUES
('0d71495e-9d4c-465c-987c-cc028c603e15', 'osmane@ushift.fr', '$2y$12$QEeXo6srRiuAAeCHyhh7leybVMrlPYsuhTFtuhw/7bwaeBuXSddpe', 'Belhadjouri', 'Osmane', '0549136784', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'sarl', NULL, NULL, NULL, NULL, NULL, 'Osconstru', NULL, NULL, NULL, '607702', 'sarl', 0.00, 0, NULL, NULL, '2026-02-28 22:51:07', '2026-02-28 22:54:56', 'CPF0D7149', NULL, NULL),
('1457e424-78bf-4a7e-b307-1545de20c242', 'h.m.s.aghiles@gmail.com', '$2y$12$5.MalLGq/4GMGWOik1avIurvJAQZrnsyGaUrZw3GMYG9GFRU08zP6', 'Haddad', 'Aghiles', '0550000000', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, '2026-03-13 04:40:07', '2026-03-16 04:49:54', 'CPF1457E4', NULL, NULL),
('175775df-b36c-41d7-b776-abb6adb41c47', 'aymenbourahla0@gmail.com', '$2y$12$61T67PhgPKs0BhTZ.UPVneNQMtpFnbNnVle2yxx83.0joc0xABahW', 'bourahla', 'aymen', '+213549391026', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, '2026-03-08 02:57:57', '2026-03-08 02:57:57', 'CPF175775', NULL, NULL),
('368d199e-b27d-4949-adce-69816cc53b12', 'aghiles.haddad.bba@edhec.com', '$2y$12$IPrIN3T9stEdVbExeyZxyuwpQ9gEU2eYG8BNTGRbxrop1.TJ6l8xK', 'Haddad', 'Aghiles', '', 'user', 'actif', NULL, 'test@gmail.com', '', NULL, NULL, NULL, NULL, 'sarl', NULL, NULL, NULL, NULL, NULL, 'benazzouzdjamel2@gmail.com', NULL, NULL, NULL, 'k', 'sarl', 0.00, 0, NULL, '2026-03-14 15:37:58', '2026-03-14 15:37:47', '2026-03-14 15:41:54', 'CPF368D19', NULL, NULL),
('4275c91b-47fb-4257-8e8e-ab76b65e8bbd', 'mohammed.benyahia@travelbeds.dz', '$2y$12$qc6iOtj2.T9i5lx/0h5IDOPZsqcO9Ywg0mXhRtatEkS74K20iMtV.', 'Benyahia', 'Mohammed', '0661111830', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, '2026-02-16 17:12:04', '2026-02-16 17:12:04', 'CPF4275C9', NULL, NULL),
('5e9d1072-9003-4c16-bd79-97567726b006', 'a.haddad@coffice.dz', '$2y$12$RzEUmsuqIEST5g0YhtCv/e/trQ29yHaZeId5MHIgBnRBgBk4e5Pea', 'Haddad', 'Aghiles', '0557919178', 'user', 'actif', NULL, 'Gérant d\'entreprise', 'HadCenter Consulting', 'Résidence Élyssa', '', NULL, NULL, 'sarl', '0022 1610 5046 940', '0 022 1629 00422 58', '22B1050469-00/16', '16296004302', '', 'HadCenter Consulting', '2022-03-09 00:00:00', 100000.00, 'Centre Mohammadia Mall, 4ème étage, bureau 1178', '607710', 'sarl', 6000.00, 0, NULL, '2026-03-16 04:05:55', '2026-02-11 21:07:12', '2026-03-16 04:05:55', 'CPF5E9D10', NULL, 'uploads/documents/6276146e-2538-419c-8db8-b911e502355f.pdf'),
('62adf1fb-a63b-4f42-9a4a-faf8e8f1e03a', 'anesjob70@gmail.com', '$2y$10$.9WPp4So6usu1HDe0ySCbONRvWRh40GBBuOpsKdhwmtmmSG3r7M6S', 'Hamma', 'Abdurahman Anas', '+213791369238', 'user', 'actif', NULL, NULL, 'NightByte', NULL, NULL, '16', 'Birkhadem', 'sarl', '00000000000000', '000000000000000000', '0987654321', '12434556', '', 'nightbyte', '2026-02-25 00:00:00', 100000.00, 'Cité 95 lgt batiment 5 ferme Moubarek Birkhadem,', 'asfasf', 'sarl', 0.00, 0, NULL, '2026-02-27 16:00:19', '2026-01-27 18:07:50', '2026-02-27 16:00:19', 'CPF62ADF1', NULL, NULL),
('69b7f677-4c75-4bf4-a9db-13be41aa5053', 'manylabtk@gmail.com', '$2y$12$OMqyphZaUIh8usPLD2Bg5uZPFz.nGisaGhQ6Goz9mPwOLoNLYhhiu', 'Abbas Terki ', 'Manyl', '+213783832262', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'sarl', NULL, NULL, NULL, NULL, NULL, 'AT COMPANY', NULL, NULL, NULL, '607008', 'sarl', 0.00, 0, NULL, NULL, '2026-03-08 21:36:47', '2026-03-08 21:42:55', 'CPF69B7F6', NULL, NULL),
('913be781-ae2e-47c5-a0cc-d19bf3be26f9', 'wfares.metidji@gmail.com', '$2y$12$6gmvnkr1LTBIunRH/thFH.EsrCxdPcKLkiTyVZqfjbGM4Yf9QUidG', 'metidji', 'fares', '0550000000', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'sarl', NULL, NULL, NULL, NULL, NULL, 'import', NULL, NULL, NULL, '2342342', 'sarl', 0.00, 0, NULL, '2026-03-12 19:16:34', '2026-03-12 19:04:53', '2026-03-12 19:16:34', 'CPF913BE7', NULL, NULL),
('9e4bb442-2ac9-4504-81b4-6a20b1e2649e', 'massylben@gmail.com', '$2y$12$ymMEMEEbwFek.pkogwIGtO/EVof2CfvUfVNBYKyYFmelq0eJX4hsW', 'Benyoues', 'Massyl', '0550000000', 'user', 'actif', NULL, 'gérant', 'shortcutformation', NULL, NULL, NULL, NULL, 'auto_entrepreneur', '42142434124', '123231241\'', '23312321', '', '', 'L\'équipe Coffice - Coworking & Domiciliation', '2022-09-22 00:00:00', 100000.00, 'Benyounes', 'Haddad', 'SARL', 0.00, 0, NULL, '2026-03-16 03:45:58', '2026-03-13 01:11:32', '2026-03-16 03:50:57', 'CPF9E4BB4', NULL, 'uploads/documents/7a9d400b-47f3-4b9a-8c7d-d7a79b7c6a62.png'),
('be9366a8-0f8f-4559-8f5e-8709660ed8b4', 'admin@coffice.dz', '$2y$10$LRX3d6uVoMszkjsbr2a8O.N2UzK10iWMsJFuQfSbMUHqrq8bSXQ4u', 'Admin', 'Coffice', '0550000000', 'admin', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, '2026-03-16 03:51:41', '2026-01-25 09:58:45', '2026-03-16 03:51:41', 'CPFDBD526', NULL, NULL),
('c0fd8976-4355-4c72-bb66-df96d38c9cd8', 'Maitre.seghiour@gmail.com', '$2y$12$kf2ire/x/7pZfNYX87/dSOhlMyAaW8BSuP52h2M7HCCHu74QAn5ku', 'BRAHMI', 'Mohamed', '0661142449', 'user', 'actif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, '2026-03-02 10:12:14', '2026-03-02 10:12:14', 'CPFC0FD89', NULL, NULL),
('ca258be0-0bad-4e5a-84da-9387a6dd3cbb', 'racim.bernaoui1@outlook.fr', '$2y$12$z.IP.rH0ywTQY.2GKa0rousI7l7/qpht5bJvsYQ2WCVZWGCPayyYW', 'Bernaoui', 'Racim', '0749482221', 'user', 'inactif', NULL, 'Maitre Chanteur', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, '2026-03-13 00:28:08', '2026-03-13 00:27:39', '2026-03-13 18:45:14', 'CPFCA258B', NULL, NULL),
('ef21793d-bdc5-44cd-af67-51020bc3c1f4', 'test@gmail.com', '$2y$12$C1fgDAUIiJWuTkuQaUTCYuNoXVG.Dajo/V9p8sg217Ukjr.0UvMGq', 'Benyounes', 'Yanelle', '0782622706', 'user', 'actif', NULL, 'admin@coffice.dz', 'Yanelle Benyounes', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3000.00, 0, NULL, '2026-03-16 02:29:33', '2026-03-14 13:46:45', '2026-03-16 02:29:33', 'CPFEF2179', NULL, NULL);

--
-- Déclencheurs `users`
--
DELIMITER $$
CREATE TRIGGER `audit_users_delete` AFTER DELETE ON `users` FOR EACH ROW BEGIN
    INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id,
        old_values, ip_address, created_at
    )
    VALUES (
        UUID(),
        NULL,
        'DELETE',
        'user',
        OLD.id,
        JSON_OBJECT(
            'nom', OLD.nom,
            'prenom', OLD.prenom,
            'email', OLD.email,
            'role', OLD.role,
            'statut', OLD.statut
        ),
        NULL,
        NOW()
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `audit_users_update` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    IF NOT (OLD.nom <=> NEW.nom AND
            OLD.prenom <=> NEW.prenom AND
            OLD.email <=> NEW.email AND
            OLD.telephone <=> NEW.telephone AND
            OLD.role <=> NEW.role AND
            OLD.statut <=> NEW.statut) THEN

        INSERT INTO audit_logs (
            id, user_id, action, entity_type, entity_id,
            old_values, new_values, ip_address, created_at
        )
        VALUES (
            UUID(),
            NEW.id,
            'UPDATE',
            'user',
            NEW.id,
            JSON_OBJECT(
                'nom', OLD.nom,
                'prenom', OLD.prenom,
                'email', OLD.email,
                'telephone', OLD.telephone,
                'role', OLD.role,
                'statut', OLD.statut
            ),
            JSON_OBJECT(
                'nom', NEW.nom,
                'prenom', NEW.prenom,
                'email', NEW.email,
                'telephone', NEW.telephone,
                'role', NEW.role,
                'statut', NEW.statut
            ),
            NULL,
            NOW()
        );

    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `utilisations_codes_promo`
--

CREATE TABLE `utilisations_codes_promo` (
  `id` char(36) NOT NULL COMMENT 'UUID de l''utilisation',
  `code_promo_id` char(36) NOT NULL COMMENT 'Code promo utilisé',
  `user_id` char(36) DEFAULT NULL,
  `reservation_id` char(36) DEFAULT NULL COMMENT 'Réservation associée',
  `abonnement_id` char(36) DEFAULT NULL COMMENT 'Abonnement associé',
  `domiciliation_id` char(36) DEFAULT NULL COMMENT 'Domiciliation associée',
  `montant_reduction` decimal(10,2) NOT NULL COMMENT 'Montant de la réduction',
  `montant_avant` decimal(10,2) NOT NULL COMMENT 'Montant avant réduction',
  `montant_apres` decimal(10,2) NOT NULL COMMENT 'Montant après réduction',
  `type_utilisation` enum('reservation','abonnement','domiciliation') NOT NULL COMMENT 'Type d''utilisation',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historique d''utilisation des codes promo';

--
-- Déclencheurs `utilisations_codes_promo`
--
DELIMITER $$
CREATE TRIGGER `after_code_promo_used` AFTER INSERT ON `utilisations_codes_promo` FOR EACH ROW BEGIN
    UPDATE codes_promo
    SET utilisations_actuelles = utilisations_actuelles + 1
    WHERE id = NEW.code_promo_id;
END
$$
DELIMITER ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `abonnements`
--
ALTER TABLE `abonnements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_actif` (`actif`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_ordre` (`ordre`);

--
-- Index pour la table `abonnements_utilisateurs`
--
ALTER TABLE `abonnements_utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_abonnement_id` (`abonnement_id`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_user_statut` (`user_id`,`statut`);

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_type` (`user_id`,`type`);

--
-- Index pour la table `checkins`
--
ALTER TABLE `checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `enregistre_par` (`enregistre_par`),
  ADD KEY `idx_reservation_id` (`reservation_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `clotures_caisse`
--
ALTER TABLE `clotures_caisse`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `date_cloture` (`date_cloture`),
  ADD KEY `cloture_par` (`cloture_par`);

--
-- Index pour la table `codes_promo`
--
ALTER TABLE `codes_promo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_actif` (`actif`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_actif_dates` (`actif`,`date_debut`,`date_fin`),
  ADD KEY `idx_codes_promo_actif` (`actif`,`date_fin`),
  ADD KEY `idx_codes_promo_code` (`code`);

--
-- Index pour la table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contacts_email` (`email`),
  ADD KEY `idx_contacts_telephone` (`telephone`),
  ADD KEY `idx_contacts_statut` (`statut`),
  ADD KEY `idx_contacts_source` (`source`),
  ADD KEY `idx_contacts_user_id` (`user_id`),
  ADD KEY `idx_contacts_created_by` (`created_by`),
  ADD KEY `idx_contacts_created_at` (`created_at`);

--
-- Index pour la table `courriers`
--
ALTER TABLE `courriers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_domiciliation` (`domiciliation_id`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `fk_courriers_retire_par` (`retire_par`);

--
-- Index pour la table `csrf_tokens`
--
ALTER TABLE `csrf_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Index pour la table `documents_uploads`
--
ALTER TABLE `documents_uploads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_uploaded_at` (`uploaded_at`),
  ADD KEY `idx_type_document` (`type_document`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_type` (`user_id`,`type_document`),
  ADD KEY `idx_documents_created` (`created_at` DESC);

--
-- Index pour la table `domiciliations`
--
ALTER TABLE `domiciliations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_visible` (`visible_sur_site`),
  ADD KEY `idx_user_statut` (`user_id`,`statut`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_raison_sociale` (`raison_sociale`),
  ADD KEY `idx_nif` (`nif`),
  ADD KEY `idx_nis` (`nis`),
  ADD KEY `idx_domiciliations_admin_filter` (`statut`,`created_at` DESC),
  ADD KEY `idx_domiciliations_user` (`user_id`,`statut`),
  ADD KEY `idx_domiciliations_numero_bureau` (`numero_bureau`,`statut`),
  ADD KEY `idx_domiciliations_situation_type` (`situation_administrative`,`type_structure`),
  ADD KEY `idx_domiciliations_cgu` (`cgu_acceptees`,`date_cgu_acceptation`),
  ADD KEY `idx_domiciliations_contact_id` (`contact_id`),
  ADD KEY `idx_domiciliations_statut` (`statut`,`created_at` DESC);

--
-- Index pour la table `espaces`
--
ALTER TABLE `espaces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_disponible` (`disponible`),
  ADD KEY `idx_capacite` (`capacite`);

--
-- Index pour la table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_level` (`level`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_level_created` (`level`,`created_at`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_lue` (`lue`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_user_lu_created` (`user_id`,`lue`,`created_at`);

--
-- Index pour la table `parrainages`
--
ALTER TABLE `parrainages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_parrain` (`code_parrain`),
  ADD KEY `idx_parrain_id` (`parrain_id`),
  ADD KEY `idx_code_parrain` (`code_parrain`);

--
-- Index pour la table `parrainages_details`
--
ALTER TABLE `parrainages_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_parrainage_id` (`parrainage_id`),
  ADD KEY `idx_filleul_id` (`filleul_id`),
  ADD KEY `idx_parrainage_filleul` (`parrainage_id`,`filleul_id`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_used_at` (`used_at`);

--
-- Index pour la table `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key_name` (`key_name`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_espace_id` (`espace_id`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_date_debut` (`date_debut`),
  ADD KEY `idx_date_fin` (`date_fin`),
  ADD KEY `idx_user_espace` (`user_id`,`espace_id`),
  ADD KEY `idx_user_date_statut` (`user_id`,`date_debut`,`statut`),
  ADD KEY `idx_espace_date_statut` (`espace_id`,`date_debut`,`statut`),
  ADD KEY `idx_annulee_par` (`annulee_par`),
  ADD KEY `idx_code_promo_id` (`code_promo_id`),
  ADD KEY `idx_participants` (`participants`),
  ADD KEY `idx_type_reservation` (`type_reservation`),
  ADD KEY `idx_rappel_envoye` (`rappel_envoye`,`date_debut`,`statut`),
  ADD KEY `idx_reservations_availability` (`espace_id`,`statut`,`date_debut`,`date_fin`),
  ADD KEY `idx_reservations_created_desc` (`created_at` DESC),
  ADD KEY `idx_reservations_user_status` (`user_id`,`statut`,`created_at` DESC),
  ADD KEY `idx_no_show` (`no_show`),
  ADD KEY `idx_checkin_id` (`checkin_id`),
  ADD KEY `idx_reservations_contact_id` (`contact_id`),
  ADD KEY `idx_reservations_user_statut` (`user_id`,`statut`),
  ADD KEY `idx_reservations_espace_dates` (`espace_id`,`date_debut`,`date_fin`),
  ADD KEY `idx_reservations_statut_created` (`statut`,`created_at` DESC);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference` (`reference`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_reference` (`reference`),
  ADD KEY `idx_user_type_statut` (`user_id`,`type`,`statut`),
  ADD KEY `idx_date_paiement` (`date_paiement`);

--
-- Index pour la table `transactions_caisse`
--
ALTER TABLE `transactions_caisse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `encaisse_par` (`encaisse_par`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `domiciliation_id` (`domiciliation_id`),
  ADD KEY `idx_type` (`type_transaction`),
  ADD KEY `idx_mode` (`mode_paiement`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_date` (`created_at`),
  ADD KEY `idx_cloture` (`cloture_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `code_parrainage` (`code_parrainage`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_role_statut` (`role`,`statut`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_credit` (`credit`),
  ADD KEY `idx_wilaya` (`wilaya`),
  ADD KEY `idx_code_parrainage` (`code_parrainage`),
  ADD KEY `idx_google_id` (`google_id`),
  ADD KEY `idx_users_statut` (`statut`),
  ADD KEY `idx_users_role` (`role`,`statut`);

--
-- Index pour la table `utilisations_codes_promo`
--
ALTER TABLE `utilisations_codes_promo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_code_promo_id` (`code_promo_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_reservation_id` (`reservation_id`),
  ADD KEY `idx_abonnement_id` (`abonnement_id`),
  ADD KEY `idx_domiciliation_id` (`domiciliation_id`),
  ADD KEY `idx_type_utilisation` (`type_utilisation`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `csrf_tokens`
--
ALTER TABLE `csrf_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `rate_limits`
--
ALTER TABLE `rate_limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure de la vue `active_reservations`
--
DROP TABLE IF EXISTS `active_reservations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cofficed`@`localhost` SQL SECURITY DEFINER VIEW `active_reservations`  AS SELECT `r`.`id` AS `id`, `r`.`user_id` AS `user_id`, `r`.`espace_id` AS `espace_id`, `u`.`nom` AS `nom`, `u`.`prenom` AS `prenom`, `u`.`email` AS `email`, `e`.`nom` AS `espace_nom`, `e`.`type` AS `espace_type`, `r`.`date_debut` AS `date_debut`, `r`.`date_fin` AS `date_fin`, `r`.`statut` AS `statut`, `r`.`type_reservation` AS `type_reservation`, `r`.`montant_total` AS `montant_total`, `r`.`reduction` AS `reduction`, `r`.`participants` AS `participants`, `r`.`created_at` AS `created_at` FROM ((`reservations` `r` join `users` `u` on(`r`.`user_id` = `u`.`id`)) join `espaces` `e` on(`r`.`espace_id` = `e`.`id`)) WHERE `r`.`statut` in ('confirmee','en_cours') AND `r`.`date_fin` >= current_timestamp() ;

-- --------------------------------------------------------

--
-- Structure de la vue `contact_history`
--
DROP TABLE IF EXISTS `contact_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cofficed`@`localhost` SQL SECURITY DEFINER VIEW `contact_history`  AS SELECT `c`.`id` AS `contact_id`, 'reservation' AS `type`, `r`.`id` AS `entity_id`, `r`.`created_at` AS `date`, concat('Réservation ',`e`.`nom`,' du ',date_format(`r`.`date_debut`,'%d/%m/%Y')) AS `description`, `r`.`montant_total` AS `montant`, `r`.`statut` AS `statut` FROM ((`contacts` `c` left join `reservations` `r` on(`c`.`id` = `r`.`contact_id`)) left join `espaces` `e` on(`r`.`espace_id` = `e`.`id`)) WHERE `r`.`id` is not nullunion allselect `c`.`id` AS `contact_id`,'domiciliation' AS `type`,`d`.`id` AS `entity_id`,`d`.`created_at` AS `date`,concat('Domiciliation ',`d`.`raison_sociale`) AS `description`,NULL AS `montant`,`d`.`statut` AS `statut` from (`contacts` `c` left join `domiciliations` `d` on(`c`.`id` = `d`.`contact_id`)) where `d`.`id` is not null order by `date` desc  ;

-- --------------------------------------------------------

--
-- Structure de la vue `daily_stats`
--
DROP TABLE IF EXISTS `daily_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cofficed`@`localhost` SQL SECURITY DEFINER VIEW `daily_stats`  AS SELECT cast(`reservations`.`created_at` as date) AS `date`, count(0) AS `total_reservations`, sum(`reservations`.`montant_total` - coalesce(`reservations`.`reduction`,0)) AS `revenue`, sum(case when `reservations`.`statut` = 'confirmee' then 1 else 0 end) AS `confirmed_count`, sum(case when `reservations`.`statut` = 'annulee' then 1 else 0 end) AS `cancelled_count`, avg(`reservations`.`montant_total` - coalesce(`reservations`.`reduction`,0)) AS `avg_amount`, sum(`reservations`.`participants`) AS `total_participants` FROM `reservations` GROUP BY cast(`reservations`.`created_at` as date) ;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `abonnements_utilisateurs`
--
ALTER TABLE `abonnements_utilisateurs`
  ADD CONSTRAINT `abonnements_utilisateurs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `abonnements_utilisateurs_ibfk_2` FOREIGN KEY (`abonnement_id`) REFERENCES `abonnements` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `checkins`
--
ALTER TABLE `checkins`
  ADD CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkins_ibfk_3` FOREIGN KEY (`enregistre_par`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `clotures_caisse`
--
ALTER TABLE `clotures_caisse`
  ADD CONSTRAINT `clotures_caisse_ibfk_1` FOREIGN KEY (`cloture_par`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `fk_contact_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_contact_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `courriers`
--
ALTER TABLE `courriers`
  ADD CONSTRAINT `courriers_ibfk_1` FOREIGN KEY (`domiciliation_id`) REFERENCES `domiciliations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_courriers_retire_par` FOREIGN KEY (`retire_par`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `csrf_tokens`
--
ALTER TABLE `csrf_tokens`
  ADD CONSTRAINT `csrf_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_uploads`
--
ALTER TABLE `documents_uploads`
  ADD CONSTRAINT `documents_uploads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `domiciliations`
--
ALTER TABLE `domiciliations`
  ADD CONSTRAINT `domiciliations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_domiciliation_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `parrainages`
--
ALTER TABLE `parrainages`
  ADD CONSTRAINT `parrainages_ibfk_1` FOREIGN KEY (`parrain_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `parrainages_details`
--
ALTER TABLE `parrainages_details`
  ADD CONSTRAINT `parrainages_details_ibfk_1` FOREIGN KEY (`parrainage_id`) REFERENCES `parrainages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parrainages_details_ibfk_2` FOREIGN KEY (`filleul_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservation_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`),
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`espace_id`) REFERENCES `espaces` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `transactions_caisse`
--
ALTER TABLE `transactions_caisse`
  ADD CONSTRAINT `transactions_caisse_ibfk_1` FOREIGN KEY (`encaisse_par`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_caisse_ibfk_2` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_caisse_ibfk_3` FOREIGN KEY (`domiciliation_id`) REFERENCES `domiciliations` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `utilisations_codes_promo`
--
ALTER TABLE `utilisations_codes_promo`
  ADD CONSTRAINT `utilisations_codes_promo_ibfk_1` FOREIGN KEY (`code_promo_id`) REFERENCES `codes_promo` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `utilisations_codes_promo_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `utilisations_codes_promo_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `utilisations_codes_promo_ibfk_4` FOREIGN KEY (`abonnement_id`) REFERENCES `abonnements_utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `utilisations_codes_promo_ibfk_5` FOREIGN KEY (`domiciliation_id`) REFERENCES `domiciliations` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
