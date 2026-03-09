-- =====================================================
-- COFFICE - Schema MySQL Complet v3.1.0
-- Application de Coworking - Mohammadia Mall, Alger
-- Date: 2026-01-21
-- Description: Schema MySQL optimisé avec fonctionnalités admin complètes
-- =====================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+01:00";
SET NAMES utf8mb4;

-- =====================================================
-- SUPPRESSION DES TABLES EXISTANTES (fresh install)
-- =====================================================

DROP TABLE IF EXISTS utilisations_codes_promo;
DROP TABLE IF EXISTS parrainages_details;
DROP TABLE IF EXISTS parrainages;
DROP TABLE IF EXISTS codes_promo;
DROP TABLE IF EXISTS documents_uploads;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS domiciliations;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS abonnements_utilisateurs;
DROP TABLE IF EXISTS abonnements;
DROP TABLE IF EXISTS espaces;
DROP TABLE IF EXISTS csrf_tokens;
DROP TABLE IF EXISTS activites;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS users;

-- Suppression des vues
DROP VIEW IF EXISTS active_reservations;
DROP VIEW IF EXISTS daily_stats;

-- Suppression des procédures
DROP PROCEDURE IF EXISTS calculate_occupancy_rate;
DROP PROCEDURE IF EXISTS cleanup_expired_data;

-- =====================================================
-- TABLE: users
-- Gestion complète des utilisateurs et profils entreprises
-- =====================================================
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de l\'utilisateur',
  email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email unique de connexion',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom de famille',
  prenom VARCHAR(100) NOT NULL COMMENT 'Prénom',
  telephone VARCHAR(20) COMMENT 'Numéro de téléphone',
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT 'Rôle utilisateur',
  statut ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif' COMMENT 'Statut du compte',
  avatar TEXT COMMENT 'URL ou chemin de l\'avatar',
  profession VARCHAR(100) COMMENT 'Profession de l\'utilisateur',
  entreprise VARCHAR(200) COMMENT 'Nom de l\'entreprise',
  adresse TEXT COMMENT 'Adresse complète',
  bio TEXT COMMENT 'Biographie ou présentation',
  wilaya VARCHAR(100) COMMENT 'Wilaya (Algérie)',
  commune VARCHAR(100) COMMENT 'Commune',

  -- Informations entreprise détaillées
  type_entreprise ENUM('auto_entrepreneur', 'eurl', 'sarl', 'spa', 'snc', 'scs', 'startup', 'freelance', 'autre') COMMENT 'Type juridique',
  nif VARCHAR(50) COMMENT 'Numéro d\'Identification Fiscale (20 caractères)',
  nis VARCHAR(50) COMMENT 'Numéro d\'Identification Statistique (15 caractères)',
  registre_commerce VARCHAR(50) COMMENT 'Numéro de registre de commerce',
  article_imposition VARCHAR(50) COMMENT 'Article d\'imposition',
  numero_auto_entrepreneur VARCHAR(50) COMMENT 'Numéro auto-entrepreneur',
  raison_sociale VARCHAR(200) COMMENT 'Raison sociale de l\'entreprise',
  date_creation_entreprise DATETIME COMMENT 'Date de création de l\'entreprise',
  capital DECIMAL(15,2) COMMENT 'Capital de l\'entreprise en DA',
  siege_social TEXT COMMENT 'Adresse du siège social',
  activite_principale VARCHAR(200) COMMENT 'Activité principale',
  forme_juridique VARCHAR(100) COMMENT 'Forme juridique complète',

  -- Parrainage et crédit
  credit DECIMAL(10,2) DEFAULT 0 COMMENT 'Crédit disponible (bonus parrainage, promotions)',

  -- Sécurité et gestion
  absences INT DEFAULT 0 COMMENT 'Nombre d\'absences enregistrées',
  banned_until DATETIME COMMENT 'Date de fin de suspension',
  derniere_connexion DATETIME COMMENT 'Dernière connexion réussie',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création du compte',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Dernière modification',

  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_role_statut (role, statut),
  INDEX idx_created_at (created_at),
  INDEX idx_credit (credit),
  INDEX idx_wilaya (wilaya)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Utilisateurs et profils entreprises';

-- =====================================================
-- TABLE: espaces
-- Espaces de coworking avec tarification complète
-- =====================================================
CREATE TABLE espaces (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de l\'espace',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom de l\'espace',
  type ENUM('box_4', 'box_3', 'open_space', 'salle_reunion', 'poste_informatique') NOT NULL COMMENT 'Type d\'espace',
  capacite INT NOT NULL COMMENT 'Capacité maximale de personnes',

  -- Tarification multi-période
  prix_heure DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Prix par heure en DA',
  prix_demi_journee DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Prix demi-journée en DA',
  prix_jour DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Prix par jour en DA',
  prix_semaine DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Prix par semaine en DA',
  prix_mois DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Prix par mois en DA',

  description TEXT COMMENT 'Description détaillée',
  equipements JSON COMMENT 'Liste des équipements disponibles',
  disponible BOOLEAN DEFAULT TRUE COMMENT 'Disponibilité de l\'espace',
  etage INT DEFAULT 4 COMMENT 'Étage (Mohammadia Mall)',
  image_url TEXT COMMENT 'URL de l\'image principale',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_type (type),
  INDEX idx_disponible (disponible),
  INDEX idx_capacite (capacite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Espaces de coworking disponibles';

-- =====================================================
-- TABLE: abonnements
-- Types d'abonnements gérés par les admins
-- =====================================================
CREATE TABLE abonnements (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de l\'abonnement',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom commercial de l\'abonnement',
  type VARCHAR(50) NOT NULL COMMENT 'Type d\'abonnement (clé unique)',
  prix DECIMAL(10,2) NOT NULL COMMENT 'Prix mensuel en DA',
  prix_avec_domiciliation DECIMAL(10,2) COMMENT 'Prix avec service de domiciliation',
  duree_mois INT DEFAULT 1 COMMENT 'Durée en mois',
  description TEXT COMMENT 'Description marketing',
  avantages JSON COMMENT 'Liste des avantages inclus',
  actif BOOLEAN DEFAULT TRUE COMMENT 'Activation/désactivation rapide',
  statut ENUM('actif', 'inactif', 'archive') NOT NULL DEFAULT 'actif' COMMENT 'Statut de l\'abonnement',
  ordre INT DEFAULT 0 COMMENT 'Ordre d\'affichage',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_actif (actif),
  INDEX idx_statut (statut),
  INDEX idx_type (type),
  INDEX idx_ordre (ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Types d\'abonnements disponibles';

-- =====================================================
-- TABLE: abonnements_utilisateurs
-- Souscriptions actives aux abonnements
-- =====================================================
CREATE TABLE abonnements_utilisateurs (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la souscription',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur abonné',
  abonnement_id CHAR(36) NOT NULL COMMENT 'Type d\'abonnement',
  date_debut DATETIME NOT NULL COMMENT 'Date de début',
  date_fin DATETIME NOT NULL COMMENT 'Date de fin',
  statut ENUM('actif', 'expire', 'suspendu', 'annule') NOT NULL DEFAULT 'actif' COMMENT 'Statut de la souscription',
  auto_renouvellement BOOLEAN DEFAULT FALSE COMMENT 'Renouvellement automatique',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (abonnement_id) REFERENCES abonnements(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_abonnement_id (abonnement_id),
  INDEX idx_statut (statut),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_user_statut (user_id, statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Souscriptions utilisateurs aux abonnements';

-- =====================================================
-- TABLE: reservations
-- Réservations d'espaces avec gestion complète
-- =====================================================
CREATE TABLE reservations (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la réservation',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur réservant',
  espace_id CHAR(36) NOT NULL COMMENT 'Espace réservé',
  date_debut DATETIME NOT NULL COMMENT 'Date et heure de début',
  date_fin DATETIME NOT NULL COMMENT 'Date et heure de fin',
  statut ENUM('confirmee', 'en_attente', 'en_cours', 'annulee', 'terminee') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la réservation',

  -- Types de réservation
  type_reservation ENUM('heure', 'demi_journee', 'jour', 'semaine', 'mois') NOT NULL DEFAULT 'heure' COMMENT 'Type de période',

  -- Montants et paiement
  montant_total DECIMAL(10,2) NOT NULL COMMENT 'Montant total en DA',
  reduction DECIMAL(10,2) DEFAULT 0 COMMENT 'Réduction appliquée',
  code_promo_id CHAR(36) COMMENT 'Code promo utilisé',
  montant_paye DECIMAL(10,2) DEFAULT 0 COMMENT 'Montant déjà payé',
  mode_paiement VARCHAR(50) COMMENT 'Mode de paiement (cash, carte, etc.)',

  notes TEXT COMMENT 'Notes de l\'utilisateur',
  participants INT NOT NULL DEFAULT 1 COMMENT 'Nombre de participants',

  -- Gestion des annulations
  annulee_par CHAR(36) COMMENT 'ID de l\'utilisateur ayant annulé',
  raison_annulation TEXT COMMENT 'Raison de l\'annulation',
  date_annulation DATETIME COMMENT 'Date d\'annulation',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_espace_id (espace_id),
  INDEX idx_statut (statut),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_date_debut (date_debut),
  INDEX idx_date_fin (date_fin),
  INDEX idx_user_espace (user_id, espace_id),
  INDEX idx_user_date_statut (user_id, date_debut, statut),
  INDEX idx_espace_date_statut (espace_id, date_debut, statut),
  INDEX idx_annulee_par (annulee_par),
  INDEX idx_code_promo_id (code_promo_id),
  INDEX idx_participants (participants),
  INDEX idx_type_reservation (type_reservation),

  CONSTRAINT chk_participants_positive CHECK (participants > 0),
  CONSTRAINT chk_dates_coherentes CHECK (date_fin > date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Réservations d\'espaces';

-- =====================================================
-- TABLE: domiciliations
-- Domiciliations d'entreprises avec création admin
-- =====================================================
CREATE TABLE domiciliations (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la domiciliation',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur propriétaire',

  -- Informations entreprise complètes
  raison_sociale VARCHAR(200) NOT NULL COMMENT 'Raison sociale',
  forme_juridique VARCHAR(100) NOT NULL COMMENT 'Forme juridique (SARL, EURL, etc.)',
  capital DECIMAL(15,2) COMMENT 'Capital social en DA',
  activite_principale VARCHAR(200) COMMENT 'Activité principale',
  domaine_activite VARCHAR(200) COMMENT 'Domaine d\'activité',

  -- Identification fiscale et administrative
  nif VARCHAR(50) COMMENT 'NIF (20 caractères)',
  nis VARCHAR(50) COMMENT 'NIS (15 caractères)',
  registre_commerce VARCHAR(50) COMMENT 'Numéro de registre de commerce',
  article_imposition VARCHAR(50) COMMENT 'Article d\'imposition',
  numero_auto_entrepreneur VARCHAR(50) COMMENT 'Numéro auto-entrepreneur',

  -- Coordonnées
  wilaya VARCHAR(100) COMMENT 'Wilaya',
  commune VARCHAR(100) COMMENT 'Commune',
  adresse_actuelle TEXT COMMENT 'Adresse actuelle',
  adresse_siege_social TEXT COMMENT 'Adresse du siège social',
  coordonnees_fiscales TEXT COMMENT 'Coordonnées fiscales',
  coordonnees_administratives TEXT COMMENT 'Coordonnées administratives',

  -- Représentant légal
  representant_nom VARCHAR(100) COMMENT 'Nom du représentant légal',
  representant_prenom VARCHAR(100) COMMENT 'Prénom du représentant légal',
  representant_fonction VARCHAR(100) COMMENT 'Fonction du représentant',
  representant_telephone VARCHAR(20) COMMENT 'Téléphone du représentant',
  representant_email VARCHAR(255) COMMENT 'Email du représentant',

  -- Dates et statut avec workflow complet
  date_creation_entreprise DATE COMMENT 'Date de création de l\'entreprise',
  situation_administrative ENUM('en_cours_creation', 'deja_creee') NOT NULL DEFAULT 'deja_creee' COMMENT 'Situation administrative',
  type_structure ENUM('societe', 'auto_entrepreneur') NOT NULL DEFAULT 'societe' COMMENT 'Type de structure',
  code_nae VARCHAR(20) NULL COMMENT 'Code NAE activité',
  activite_exercee VARCHAR(255) NULL COMMENT 'Activité exercée',
  description_activite TEXT NULL COMMENT 'Description activité',
  ville_immatriculation VARCHAR(100) NULL COMMENT 'Ville immatriculation',
  date_inscription_auto_entrepreneur DATE NULL COMMENT 'Date inscription auto-entrepreneur',
  representant_adresse_residence VARCHAR(500) NULL COMMENT 'Adresse résidence représentant',
  representant_ville VARCHAR(100) NULL COMMENT 'Ville représentant',
  numero_bureau TINYINT UNSIGNED NULL CHECK (numero_bureau BETWEEN 1 AND 36) COMMENT 'Numéro de bureau attribué',
  reference_contrat_notarie VARCHAR(100) NULL COMMENT 'Référence contrat notarié',
  date_debut_contrat DATE NULL COMMENT 'Date début contrat',
  date_fin_contrat DATE NULL COMMENT 'Date fin contrat',
  options JSON NULL COMMENT 'Options de domiciliation',
  cgu_acceptees TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'CGU acceptées',
  date_cgu_acceptation DATETIME NULL COMMENT 'Date acceptation CGU',
  date_debut_souhaitee DATE NULL COMMENT 'Date début souhaitée',
  statut ENUM('dossier_preparatoire', 'en_attente_signature', 'domiciliation_creee', 'en_attente_complements', 'active', 'refusee', 'expiree', 'resiliee') NOT NULL DEFAULT 'dossier_preparatoire' COMMENT 'Statut de la demande',
  date_debut DATETIME COMMENT 'Date de début de service',
  date_fin DATETIME COMMENT 'Date de fin de service',

  -- Paiement et gestion
  montant_mensuel DECIMAL(10,2) COMMENT 'Montant mensuel en DA',
  mode_paiement VARCHAR(50) COMMENT 'Mode de paiement (cash, virement, etc.)',
  documents JSON COMMENT 'Documents uploadés',
  notes_admin TEXT COMMENT 'Notes internes admin',
  commentaire_admin TEXT COMMENT 'Commentaire administratif',
  date_validation DATETIME COMMENT 'Date de validation du dossier',
  visible_sur_site BOOLEAN DEFAULT FALSE COMMENT 'Affichage public',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_statut (statut),
  INDEX idx_visible (visible_sur_site),
  INDEX idx_user_statut (user_id, statut),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_raison_sociale (raison_sociale),
  INDEX idx_nif (nif),
  INDEX idx_nis (nis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Domiciliations d\'entreprises avec création admin';

-- =====================================================
-- TABLE: transactions
-- Historique des transactions financières
-- =====================================================
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la transaction',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur concerné',
  type ENUM('abonnement', 'reservation', 'domiciliation', 'remboursement') NOT NULL COMMENT 'Type de transaction',
  montant DECIMAL(10,2) NOT NULL COMMENT 'Montant en DA',
  statut ENUM('en_attente', 'completee', 'echouee', 'remboursee') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la transaction',
  mode_paiement VARCHAR(50) COMMENT 'Mode de paiement utilisé',
  reference VARCHAR(100) UNIQUE COMMENT 'Référence unique',
  description TEXT COMMENT 'Description de la transaction',
  metadata JSON COMMENT 'Métadonnées additionnelles',
  date_paiement DATETIME COMMENT 'Date effective du paiement',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_statut (statut),
  INDEX idx_reference (reference),
  INDEX idx_user_type_statut (user_id, type, statut),
  INDEX idx_date_paiement (date_paiement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des transactions financières';

-- =====================================================
-- TABLE: codes_promo
-- Codes promotionnels et réductions
-- =====================================================
CREATE TABLE codes_promo (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du code promo',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Code promotionnel unique',
  type ENUM('pourcentage', 'montant_fixe') NOT NULL COMMENT 'Type de réduction',
  type_reduction ENUM('pourcentage', 'montant_fixe') NOT NULL DEFAULT 'pourcentage' COMMENT 'Type de reduction (alias backend)',
  valeur DECIMAL(10,2) NOT NULL COMMENT 'Valeur de la réduction',
  date_debut DATETIME NOT NULL COMMENT 'Date de début de validité',
  date_fin DATETIME NOT NULL COMMENT 'Date de fin de validité',
  date_expiration DATETIME NULL COMMENT 'Date expiration (alias backend de date_fin)',
  utilisations_max INT COMMENT 'Nombre max d\'utilisations',
  utilisations_actuelles INT DEFAULT 0 COMMENT 'Nombre d\'utilisations actuelles',
  montant_min DECIMAL(10,2) DEFAULT 0 COMMENT 'Montant minimum requis',
  montant_minimum DECIMAL(10,2) DEFAULT 0 COMMENT 'Montant minimum requis (alias backend)',
  description TEXT COMMENT 'Description du code promo',
  conditions TEXT COMMENT 'Conditions d\'utilisation',
  types_application JSON COMMENT 'Types où le code s\'applique',
  actif BOOLEAN DEFAULT TRUE COMMENT 'Activation du code',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_actif (actif),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_actif_dates (actif, date_debut, date_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Codes promotionnels et réductions';

-- =====================================================
-- TABLE: utilisations_codes_promo
-- Historique d'utilisation des codes promo
-- =====================================================
CREATE TABLE utilisations_codes_promo (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de l\'utilisation',
  code_promo_id CHAR(36) NOT NULL COMMENT 'Code promo utilisé',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur',
  reservation_id CHAR(36) COMMENT 'Réservation associée',
  abonnement_id CHAR(36) COMMENT 'Abonnement associé',
  domiciliation_id CHAR(36) COMMENT 'Domiciliation associée',
  montant_reduction DECIMAL(10,2) NOT NULL COMMENT 'Montant de la réduction',
  montant_avant DECIMAL(10,2) NOT NULL COMMENT 'Montant avant réduction',
  montant_apres DECIMAL(10,2) NOT NULL COMMENT 'Montant après réduction',
  type_utilisation ENUM('reservation', 'abonnement', 'domiciliation') NOT NULL COMMENT 'Type d\'utilisation',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (code_promo_id) REFERENCES codes_promo(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
  FOREIGN KEY (abonnement_id) REFERENCES abonnements_utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE SET NULL,

  INDEX idx_code_promo_id (code_promo_id),
  INDEX idx_user_id (user_id),
  INDEX idx_reservation_id (reservation_id),
  INDEX idx_abonnement_id (abonnement_id),
  INDEX idx_domiciliation_id (domiciliation_id),
  INDEX idx_type_utilisation (type_utilisation),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique d\'utilisation des codes promo';

-- =====================================================
-- TABLE: parrainages
-- Système de parrainage
-- =====================================================
CREATE TABLE parrainages (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du parrainage',
  parrain_id CHAR(36) NOT NULL COMMENT 'Utilisateur parrain',
  code_parrain VARCHAR(50) UNIQUE NOT NULL COMMENT 'Code unique du parrain',
  parraines INT DEFAULT 0 COMMENT 'Nombre de parrainés',
  recompenses_totales DECIMAL(10,2) DEFAULT 0 COMMENT 'Total des récompenses',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parrain_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_parrain_id (parrain_id),
  INDEX idx_code_parrain (code_parrain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Système de parrainage';

-- =====================================================
-- TABLE: parrainages_details
-- Détails des parrainages
-- =====================================================
CREATE TABLE parrainages_details (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du détail',
  parrainage_id CHAR(36) NOT NULL COMMENT 'Parrainage parent',
  filleul_id CHAR(36) NOT NULL COMMENT 'Utilisateur parrainé',
  recompense_parrain DECIMAL(10,2) DEFAULT 0 COMMENT 'Récompense du parrain',
  recompense_filleul DECIMAL(10,2) DEFAULT 0 COMMENT 'Récompense du filleul',
  statut ENUM('en_attente', 'valide', 'paye') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la récompense',
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date d\'inscription du filleul',
  date_validation DATETIME COMMENT 'Date de validation',

  FOREIGN KEY (parrainage_id) REFERENCES parrainages(id) ON DELETE CASCADE,
  FOREIGN KEY (filleul_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_parrainage_id (parrainage_id),
  INDEX idx_filleul_id (filleul_id),
  INDEX idx_parrainage_filleul (parrainage_id, filleul_id),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Détails des parrainages';

-- =====================================================
-- TABLE: notifications
-- Système de notifications utilisateurs
-- =====================================================
CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la notification',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur destinataire',
  type ENUM('reservation', 'abonnement', 'domiciliation', 'paiement', 'promo', 'parrainage', 'systeme') NOT NULL COMMENT 'Type de notification',
  titre VARCHAR(200) NOT NULL COMMENT 'Titre de la notification',
  message TEXT NOT NULL COMMENT 'Message complet',
  lue BOOLEAN DEFAULT FALSE COMMENT 'Notification lue',
  metadata JSON COMMENT 'Métadonnées additionnelles',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_lue (lue),
  INDEX idx_type (type),
  INDEX idx_user_lu_created (user_id, lue, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notifications utilisateurs';

-- =====================================================
-- TABLE: documents_uploads
-- Gestion des documents uploadés
-- =====================================================
CREATE TABLE documents_uploads (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du document',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur ayant uploadé',
  entity_type ENUM('domiciliation', 'user', 'reservation', 'autre') NOT NULL COMMENT 'Type d\'entité',
  entity_id CHAR(36) COMMENT 'ID de l\'entité associée',
  nom_fichier VARCHAR(255) NOT NULL COMMENT 'Nom du fichier stocké',
  nom_original VARCHAR(255) NOT NULL COMMENT 'Nom original',
  type_fichier VARCHAR(100) COMMENT 'Type MIME',
  taille INT COMMENT 'Taille en octets',
  chemin_fichier TEXT NOT NULL COMMENT 'Chemin du fichier',
  type_document VARCHAR(50) COMMENT 'Type de document (cni, rc, nif, etc.)',
  status ENUM('en_attente', 'valide', 'rejete') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de validation',

  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de creation',

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_uploaded_at (uploaded_at),
  INDEX idx_type_document (type_document),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Documents uploadés';

-- =====================================================
-- TABLES TECHNIQUES
-- =====================================================

-- Table: rate_limits (Protection contre les abus)
CREATE TABLE rate_limits (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL COMMENT 'Clé de limitation',
  attempts INT NOT NULL DEFAULT 0 COMMENT 'Nombre de tentatives',
  expires_at DATETIME NOT NULL COMMENT 'Expiration',

  UNIQUE KEY key_name (key_name),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting pour la sécurité';

-- Table: logs (Journalisation système)
CREATE TABLE logs (
  id CHAR(36) PRIMARY KEY,
  level ENUM('info','warning','error','security') NOT NULL COMMENT 'Niveau de log',
  message TEXT NOT NULL COMMENT 'Message du log',
  context JSON DEFAULT NULL COMMENT 'Contexte additionnel',
  user_id CHAR(36) DEFAULT NULL COMMENT 'Utilisateur concerné',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_level (level),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_level_created (level, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs système et sécurité';

-- Table: activites (Audit trail)
CREATE TABLE activites (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur actif',
  type VARCHAR(100) NOT NULL COMMENT 'Type d\'activité',
  description TEXT NOT NULL COMMENT 'Description',
  metadata JSON DEFAULT NULL COMMENT 'Métadonnées',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',
  user_agent TEXT COMMENT 'User agent du navigateur',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_user_type (user_id, type),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des activités utilisateurs';

-- Table: csrf_tokens (Protection CSRF)
CREATE TABLE csrf_tokens (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE COMMENT 'Token CSRF',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur',
  expires_at DATETIME NOT NULL COMMENT 'Expiration',
  used BOOLEAN DEFAULT FALSE COMMENT 'Token utilisé',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens CSRF pour la sécurité';

-- =====================================================
-- VUES MATERIALISEES
-- =====================================================

-- Vue: Réservations actives
CREATE VIEW active_reservations AS
SELECT
    r.id,
    r.user_id,
    r.espace_id,
    u.nom,
    u.prenom,
    u.email,
    e.nom as espace_nom,
    e.type as espace_type,
    r.date_debut,
    r.date_fin,
    r.statut,
    r.type_reservation,
    r.montant_total,
    r.reduction,
    r.participants,
    r.created_at
FROM reservations r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN espaces e ON r.espace_id = e.id
WHERE r.statut IN ('confirmee', 'en_cours')
AND r.date_fin >= NOW();

-- Vue: Statistiques quotidiennes
CREATE VIEW daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_reservations,
    SUM(montant_total - COALESCE(reduction, 0)) as revenue,
    SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as confirmed_count,
    SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as cancelled_count,
    AVG(montant_total - COALESCE(reduction, 0)) as avg_amount,
    SUM(participants) as total_participants
FROM reservations
GROUP BY DATE(created_at);

-- =====================================================
-- PROCEDURES STOCKEES
-- =====================================================

DELIMITER $$

-- Procédure: Calcul du taux d'occupation
CREATE PROCEDURE calculate_occupancy_rate(
    IN p_date_debut DATE,
    IN p_date_fin DATE
)
BEGIN
    SELECT
        DATE(r.date_debut) as date,
        COUNT(DISTINCT r.espace_id) as espaces_occupes,
        (SELECT COUNT(*) FROM espaces WHERE disponible = TRUE) as total_espaces,
        ROUND((COUNT(DISTINCT r.espace_id) * 100.0) /
              (SELECT COUNT(*) FROM espaces WHERE disponible = TRUE), 2) as taux_occupation,
        COUNT(*) as nombre_reservations,
        SUM(r.montant_total - COALESCE(r.reduction, 0)) as revenue_journalier
    FROM reservations r
    WHERE r.statut IN ('confirmee', 'en_cours')
    AND DATE(r.date_debut) BETWEEN p_date_debut AND p_date_fin
    GROUP BY DATE(r.date_debut)
    ORDER BY date;
END$$

-- Procédure: Nettoyage des données expirées
CREATE PROCEDURE cleanup_expired_data()
BEGIN
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

-- Procédure: Mise à jour des abonnements expirés
CREATE PROCEDURE update_expired_subscriptions()
BEGIN
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

-- =====================================================
-- DONNEES INITIALES
-- =====================================================

-- Espaces de coworking avec tarification complète
INSERT INTO espaces (id, nom, type, capacite, prix_heure, prix_demi_journee, prix_jour, prix_semaine, prix_mois, description, equipements, image_url) VALUES
(UUID(), 'Open Space', 'open_space', 12, 0, 0, 1200, 20000, 15000,
 'Espace de travail collaboratif de 80m² avec 12 postes équipés. Ambiance dynamique et professionnelle.',
 '["Wi-Fi 50-100 Mbps", "Accès communauté", "Café/thé illimité", "Climatisation", "12 postes de travail", "Prises électriques", "Lumière naturelle"]',
 '/espace-coworking.jpeg'),

(UUID(), 'Private Booth Aurès', 'box_3', 2, 0, 0, 6000, 40000, 45000,
 'Box privé 2 places idéal pour duo ou consulting. Isolation phonique et équipement complet.',
 '["Wi-Fi haut débit", "Table/chaises", "Climatisation", "Insonorisation", "Accès 7h-20h", "Éclairage LED", "Prises USB"]',
 '/booth-aures.jpeg'),

(UUID(), 'Private Booth Hoggar', 'box_3', 2, 0, 0, 6000, 40000, 35000,
 'Box privé 2 places confortable et climatisé. Parfait pour concentration et productivité.',
 '["Wi-Fi haut débit", "Table/chaises", "Climatisation", "Insonorisation", "Accès 7h-20h", "Rangement sécurisé"]',
 '/booth-hoggar.jpeg'),

(UUID(), 'Private Booth Atlas', 'box_4', 4, 0, 0, 10000, 65000, 45000,
 'Box privé 4 places spacieux avec écran de présentation. Idéal pour petites équipes.',
 '["Wi-Fi haut débit", "Table/chaises", "Climatisation", "Écran de présentation", "4 places", "Accès 7h-20h", "Tableau blanc"]',
 '/booth-atlas.jpeg'),

(UUID(), 'Salle de Réunion Premium', 'salle_reunion', 12, 2500, 5000, 12000, 0, 0,
 'Salle de réunion premium 35-40m² avec terrasse panoramique et équipement audiovisuel complet.',
 '["TV 80 pouces", "Système audio", "Tableau blanc", "Terrasse panoramique", "Wi-Fi haut débit", "Eau minérale", "Climatisation", "12 places assises", "Vidéoprojecteur", "Visioconférence"]',
 '/salle-reunion.jpeg');

-- Types d'abonnements standard
INSERT INTO abonnements (id, nom, type, prix, prix_avec_domiciliation, duree_mois, description, avantages, actif, statut, ordre) VALUES
(UUID(), 'Solo', 'solo', 14000, NULL, 1,
 'Formule idéale pour freelances et indépendants débutant dans le coworking',
 '["Accès open space 8h-18h", "Wi-Fi 50 Mbps", "Accès communauté", "Café/thé inclus", "Casier personnel", "Impression basique"]',
 TRUE, 'actif', 1),

(UUID(), 'Pro', 'pro', 32000, NULL, 1,
 'Formule complète pour startups et consultants professionnels',
 '["Accès tous espaces 7h-20h", "Wi-Fi 100 Mbps", "Salle réunion 2h/mois", "-25% services additionnels", "Accès communauté", "Impression illimitée", "Domiciliation facultative"]',
 TRUE, 'actif', 2),

(UUID(), 'Executive', 'entreprise', 55000, NULL, 1,
 'Formule premium pour entreprises et PME exigeantes',
 '["Accès illimité 24/7", "Wi-Fi illimité", "Domiciliation INCLUSE", "-40% services additionnels", "Support prioritaire", "Salle réunion 5h/mois", "Boite postale", "Standard téléphonique"]',
 TRUE, 'actif', 3),

(UUID(), 'Open Space Mensuel', 'open_space_monthly', 15000, NULL, 1,
 'Accès mensuel dédié à l\'espace de coworking open space',
 '["Accès open space 8h-18h", "Wi-Fi haut débit", "Café/thé inclus", "12 postes disponibles", "Casier sécurisé", "Événements networking"]',
 TRUE, 'actif', 10),

(UUID(), 'Hoggar Mensuel', 'booth_hoggar_monthly', 35000, NULL, 1,
 'Box privé Hoggar 2 places - Location mensuelle exclusive',
 '["Accès 7h-20h", "Wi-Fi haut débit", "Climatisation", "Insonorisation", "2 places", "Casier sécurisé", "Badge d\'accès"]',
 TRUE, 'actif', 11),

(UUID(), 'Atlas Mensuel', 'booth_atlas_monthly', 45000, NULL, 1,
 'Box privé Atlas 4 places - Location mensuelle pour équipe',
 '["Accès 7h-20h", "Wi-Fi haut débit", "Climatisation", "Écran présentation", "4 places", "Rangement équipe", "Badge d\'accès"]',
 TRUE, 'actif', 12),

(UUID(), 'Aurès Mensuel', 'booth_aures_monthly', 45000, NULL, 1,
 'Box privé Aurès 2 places - Location mensuelle premium',
 '["Accès 7h-20h", "Wi-Fi haut débit", "Climatisation", "Insonorisation", "2 places", "Mobilier premium", "Badge d\'accès"]',
 TRUE, 'actif', 13);

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER $$

-- Trigger: Auto-incrément du compteur de codes promo utilisés
CREATE TRIGGER after_code_promo_used
AFTER INSERT ON utilisations_codes_promo
FOR EACH ROW
BEGIN
    UPDATE codes_promo
    SET utilisations_actuelles = utilisations_actuelles + 1
    WHERE id = NEW.code_promo_id;
END$$

-- Trigger: Création automatique d'une notification pour nouvelle réservation
CREATE TRIGGER after_reservation_created
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    INSERT INTO notifications (id, user_id, type, titre, message, created_at)
    VALUES (
        UUID(),
        NEW.user_id,
        'reservation',
        'Nouvelle réservation',
        CONCAT('Votre réservation pour ', (SELECT nom FROM espaces WHERE id = NEW.espace_id), ' a été créée avec succès.'),
        NOW()
    );
END$$

DELIMITER ;

-- =====================================================
-- ACTIVATION DES CONTRAINTES
-- =====================================================

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- VERIFICATION ET STATS
-- =====================================================

SELECT '=========================================' as '';
SELECT 'Base de données Coffice créée avec succès!' as message;
SELECT '=========================================' as '';
SELECT CONCAT('Espaces créés: ', COUNT(*)) as info FROM espaces;
SELECT CONCAT('Abonnements créés: ', COUNT(*)) as info FROM abonnements;
SELECT '=========================================' as '';
SELECT 'Schema MySQL v3.1.0' as version;
SELECT 'Prêt pour la production' as status;
SELECT 'Fonctionnalités admin complètes activées' as features;
SELECT CONCAT('Date: ', NOW()) as timestamp;
SELECT '=========================================' as '';

-- =====================================================
-- FIN DU SCHEMA
-- =====================================================
