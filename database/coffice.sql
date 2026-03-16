-- =====================================================
-- COFFICE - Schema MySQL Complet v4.2.0
-- Application de Coworking - Mohammadia Mall, Alger
-- Date: 2026-03-16
-- Serveur: MariaDB 10.11.16
-- Miroir exact de la base de production cofficed_coffice
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
DROP TABLE IF EXISTS transactions_caisse;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS courriers;
DROP TABLE IF EXISTS checkins;
DROP TABLE IF EXISTS clotures_caisse;
DROP TABLE IF EXISTS domiciliations;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS abonnements_utilisateurs;
DROP TABLE IF EXISTS abonnements;
DROP TABLE IF EXISTS espaces;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS csrf_tokens;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;

-- Suppression des vues
DROP VIEW IF EXISTS active_reservations;
DROP VIEW IF EXISTS daily_stats;
DROP VIEW IF EXISTS contact_history;

-- Suppression des procedures
DROP PROCEDURE IF EXISTS cleanup_expired_data;
DROP PROCEDURE IF EXISTS cleanup_expired_password_resets;
DROP PROCEDURE IF EXISTS update_expired_subscriptions;

-- =====================================================
-- TABLE: users
-- Gestion complete des utilisateurs et profils entreprises
-- =====================================================
CREATE TABLE users (
  id CHAR(36) NOT NULL COMMENT 'UUID de l''utilisateur',
  email VARCHAR(255) NOT NULL COMMENT 'Email unique de connexion',
  password_hash VARCHAR(255) DEFAULT NULL COMMENT 'Hash bcrypt du mot de passe (NULL pour OAuth)',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom de famille',
  prenom VARCHAR(100) NOT NULL COMMENT 'Prenom',
  telephone VARCHAR(20) DEFAULT NULL COMMENT 'Numero de telephone',
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT 'Role utilisateur',
  statut ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif' COMMENT 'Statut du compte',
  avatar TEXT DEFAULT NULL COMMENT 'URL ou chemin de l''avatar',
  profession VARCHAR(100) DEFAULT NULL COMMENT 'Profession de l''utilisateur',
  entreprise VARCHAR(200) DEFAULT NULL COMMENT 'Nom de l''entreprise',
  adresse TEXT DEFAULT NULL COMMENT 'Adresse complete',
  bio TEXT DEFAULT NULL COMMENT 'Biographie ou presentation',
  wilaya VARCHAR(100) DEFAULT NULL COMMENT 'Wilaya (Algerie)',
  commune VARCHAR(100) DEFAULT NULL COMMENT 'Commune',

  -- Informations entreprise detaillees
  type_entreprise ENUM('auto_entrepreneur', 'eurl', 'sarl', 'spa', 'snc', 'scs', 'startup', 'freelance', 'autre') DEFAULT NULL COMMENT 'Type juridique',
  nif VARCHAR(50) DEFAULT NULL COMMENT 'Numero d''Identification Fiscale (20 caracteres)',
  nis VARCHAR(50) DEFAULT NULL COMMENT 'Numero d''Identification Statistique (15 caracteres)',
  registre_commerce VARCHAR(50) DEFAULT NULL COMMENT 'Numero de registre de commerce',
  article_imposition VARCHAR(50) DEFAULT NULL COMMENT 'Article d''imposition',
  numero_auto_entrepreneur VARCHAR(50) DEFAULT NULL COMMENT 'Numero auto-entrepreneur',
  raison_sociale VARCHAR(200) DEFAULT NULL COMMENT 'Raison sociale de l''entreprise',
  date_creation_entreprise DATETIME DEFAULT NULL COMMENT 'Date de creation de l''entreprise',
  capital DECIMAL(15,2) DEFAULT NULL COMMENT 'Capital de l''entreprise en DA',
  siege_social TEXT DEFAULT NULL COMMENT 'Adresse du siege social',
  activite_principale VARCHAR(200) DEFAULT NULL COMMENT 'Activite principale',
  forme_juridique VARCHAR(100) DEFAULT NULL COMMENT 'Forme juridique complete',

  -- Parrainage et credit
  credit DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Credit disponible (bonus parrainage, promotions)',

  -- Securite et gestion
  absences INT(11) DEFAULT 0 COMMENT 'Nombre d''absences enregistrees',
  banned_until DATETIME DEFAULT NULL COMMENT 'Date de fin de suspension',
  derniere_connexion DATETIME DEFAULT NULL COMMENT 'Derniere connexion reussie',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de creation du compte',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Derniere modification',

  -- Colonnes ajoutees (migrations)
  code_parrainage VARCHAR(20) DEFAULT NULL COMMENT 'Code unique de parrainage de l''utilisateur',
  google_id VARCHAR(255) DEFAULT NULL COMMENT 'Google OAuth ID (sub claim)',
  carte_identite_url TEXT DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY code_parrainage (code_parrainage),
  KEY idx_email (email),
  KEY idx_role (role),
  KEY idx_role_statut (role, statut),
  KEY idx_created_at (created_at),
  KEY idx_credit (credit),
  KEY idx_wilaya (wilaya),
  KEY idx_code_parrainage (code_parrainage),
  KEY idx_google_id (google_id),
  KEY idx_users_statut (statut),
  KEY idx_users_role (role, statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Utilisateurs et profils entreprises';

-- =====================================================
-- TABLE: espaces
-- Espaces de coworking avec tarification complete
-- =====================================================
CREATE TABLE espaces (
  id CHAR(36) NOT NULL COMMENT 'UUID de l''espace',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom de l''espace',
  type ENUM('box_4', 'box_3', 'open_space', 'salle_reunion', 'poste_informatique') NOT NULL COMMENT 'Type d''espace',
  capacite INT(11) NOT NULL COMMENT 'Capacite maximale de personnes',

  -- Tarification multi-periode
  prix_heure DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par heure en DA',
  prix_demi_journee DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix demi-journee en DA',
  prix_jour DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par jour en DA',
  prix_semaine DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par semaine en DA',
  prix_mois DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix par mois en DA',

  description TEXT DEFAULT NULL COMMENT 'Description detaillee',
  equipements LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Liste des equipements disponibles' CHECK (json_valid(equipements)),
  disponible TINYINT(1) DEFAULT 1 COMMENT 'Disponibilite de l''espace',
  etage INT(11) DEFAULT 4 COMMENT 'Etage (Mohammadia Mall)',
  image_url TEXT DEFAULT NULL COMMENT 'URL de l''image principale',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_type (type),
  KEY idx_disponible (disponible),
  KEY idx_capacite (capacite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Espaces de coworking disponibles';

-- =====================================================
-- TABLE: abonnements
-- Types d'abonnements geres par les admins
-- =====================================================
CREATE TABLE abonnements (
  id CHAR(36) NOT NULL COMMENT 'UUID de l''abonnement',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom commercial de l''abonnement',
  type VARCHAR(50) NOT NULL COMMENT 'Type d''abonnement (cle unique)',
  prix DECIMAL(10,2) NOT NULL COMMENT 'Prix mensuel en DA',
  prix_avec_domiciliation DECIMAL(10,2) DEFAULT NULL COMMENT 'Prix avec service de domiciliation',
  duree_mois INT(11) DEFAULT 1 COMMENT 'Duree en mois',
  description TEXT DEFAULT NULL COMMENT 'Description marketing',
  avantages LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Liste des avantages inclus' CHECK (json_valid(avantages)),
  actif TINYINT(1) DEFAULT 1 COMMENT 'Activation/desactivation rapide',
  statut ENUM('actif', 'inactif', 'archive') NOT NULL DEFAULT 'actif' COMMENT 'Statut de l''abonnement',
  ordre INT(11) DEFAULT 0 COMMENT 'Ordre d''affichage',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Colonnes ajoutees (migrations)
  credits_mensuels INT(11) DEFAULT 0 COMMENT 'Nombre de credits mensuels inclus dans le plan',
  couleur VARCHAR(50) DEFAULT '' COMMENT 'Couleur affichage du plan (code hex)',

  PRIMARY KEY (id),
  KEY idx_actif (actif),
  KEY idx_statut (statut),
  KEY idx_type (type),
  KEY idx_ordre (ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Types d''abonnements disponibles';

-- =====================================================
-- TABLE: abonnements_utilisateurs
-- Souscriptions actives aux abonnements
-- =====================================================
CREATE TABLE abonnements_utilisateurs (
  id CHAR(36) NOT NULL COMMENT 'UUID de la souscription',
  user_id CHAR(36) DEFAULT NULL,
  abonnement_id CHAR(36) NOT NULL COMMENT 'Type d''abonnement',
  date_debut DATETIME NOT NULL COMMENT 'Date de debut',
  date_fin DATETIME NOT NULL COMMENT 'Date de fin',
  statut ENUM('actif', 'expire', 'suspendu', 'annule') NOT NULL DEFAULT 'actif' COMMENT 'Statut de la souscription',
  auto_renouvellement TINYINT(1) DEFAULT 0 COMMENT 'Renouvellement automatique',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Colonnes ajoutees (migrations)
  credits_restants DECIMAL(10,2) DEFAULT 0.00,

  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_abonnement_id (abonnement_id),
  KEY idx_statut (statut),
  KEY idx_dates (date_debut, date_fin),
  KEY idx_user_statut (user_id, statut),

  CONSTRAINT abonnements_utilisateurs_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT abonnements_utilisateurs_ibfk_2 FOREIGN KEY (abonnement_id) REFERENCES abonnements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Souscriptions utilisateurs aux abonnements';

-- =====================================================
-- TABLE: contacts
-- CRM contacts
-- =====================================================
CREATE TABLE contacts (
  id CHAR(36) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  telephone VARCHAR(20) DEFAULT NULL,
  entreprise VARCHAR(255) DEFAULT NULL,
  source ENUM('whatsapp', 'instagram', 'tiktok', 'fixe', 'mobile', 'physique', 'email', 'autre') NOT NULL DEFAULT 'autre',
  statut ENUM('prospect', 'client', 'perdu') NOT NULL DEFAULT 'prospect',
  notes TEXT DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_contacts_email (email),
  KEY idx_contacts_telephone (telephone),
  KEY idx_contacts_statut (statut),
  KEY idx_contacts_source (source),
  KEY idx_contacts_user_id (user_id),
  KEY idx_contacts_created_by (created_by),
  KEY idx_contacts_created_at (created_at),

  CONSTRAINT fk_contact_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: reservations
-- Reservations d'espaces avec gestion complete
-- =====================================================
CREATE TABLE reservations (
  id CHAR(36) NOT NULL COMMENT 'UUID de la reservation',
  user_id CHAR(36) DEFAULT NULL,
  contact_id CHAR(36) DEFAULT NULL,
  espace_id CHAR(36) NOT NULL COMMENT 'Espace reserve',
  date_debut DATETIME NOT NULL COMMENT 'Date et heure de debut',
  date_fin DATETIME NOT NULL COMMENT 'Date et heure de fin',
  statut ENUM('confirmee', 'en_attente', 'en_cours', 'annulee', 'terminee', 'no_show') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la reservation',

  -- Types de reservation
  type_reservation ENUM('heure', 'demi_journee', 'jour', 'semaine', 'mois') NOT NULL DEFAULT 'heure' COMMENT 'Type de periode',

  -- Montants et paiement
  montant_total DECIMAL(10,2) NOT NULL COMMENT 'Montant total en DA',
  reduction DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Reduction appliquee',
  code_promo_id CHAR(36) DEFAULT NULL COMMENT 'Code promo utilise',
  montant_paye DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Montant deja paye',
  mode_paiement VARCHAR(50) DEFAULT NULL COMMENT 'Mode de paiement (cash, carte, etc.)',

  notes TEXT DEFAULT NULL COMMENT 'Notes de l''utilisateur',
  participants INT(11) NOT NULL DEFAULT 1 COMMENT 'Nombre de participants',
  rappel_envoye TINYINT(1) DEFAULT 0 COMMENT 'Rappel email envoye (0=non, 1=oui)',

  -- Gestion des annulations
  annulee_par CHAR(36) DEFAULT NULL COMMENT 'ID de l''utilisateur ayant annule',
  raison_annulation TEXT DEFAULT NULL COMMENT 'Raison de l''annulation',
  date_annulation DATETIME DEFAULT NULL COMMENT 'Date d''annulation',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Colonnes ajoutees (migrations)
  no_show TINYINT(1) DEFAULT 0 COMMENT 'Le client ne s est pas presente',
  checkin_id CHAR(36) DEFAULT NULL,

  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_espace_id (espace_id),
  KEY idx_statut (statut),
  KEY idx_dates (date_debut, date_fin),
  KEY idx_date_debut (date_debut),
  KEY idx_date_fin (date_fin),
  KEY idx_user_espace (user_id, espace_id),
  KEY idx_user_date_statut (user_id, date_debut, statut),
  KEY idx_espace_date_statut (espace_id, date_debut, statut),
  KEY idx_annulee_par (annulee_par),
  KEY idx_code_promo_id (code_promo_id),
  KEY idx_participants (participants),
  KEY idx_type_reservation (type_reservation),
  KEY idx_rappel_envoye (rappel_envoye, date_debut, statut),
  KEY idx_reservations_availability (espace_id, statut, date_debut, date_fin),
  KEY idx_reservations_created_desc (created_at DESC),
  KEY idx_reservations_user_status (user_id, statut, created_at DESC),
  KEY idx_no_show (no_show),
  KEY idx_checkin_id (checkin_id),
  KEY idx_reservations_contact_id (contact_id),
  KEY idx_reservations_user_statut (user_id, statut),
  KEY idx_reservations_espace_dates (espace_id, date_debut, date_fin),
  KEY idx_reservations_statut_created (statut, created_at DESC),

  CONSTRAINT reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT reservations_ibfk_2 FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservation_contact FOREIGN KEY (contact_id) REFERENCES contacts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Reservations d''espaces';

-- =====================================================
-- TABLE: domiciliations
-- Domiciliations d'entreprises avec creation admin
-- =====================================================
CREATE TABLE domiciliations (
  id CHAR(36) NOT NULL COMMENT 'UUID de la domiciliation',
  user_id CHAR(36) DEFAULT NULL,
  contact_id CHAR(36) DEFAULT NULL,

  -- Situation et type
  situation_administrative ENUM('en_cours_creation', 'deja_creee') NOT NULL DEFAULT 'deja_creee',
  type_structure ENUM('societe', 'auto_entrepreneur') NOT NULL DEFAULT 'societe',

  -- Informations entreprise completes
  raison_sociale VARCHAR(200) NOT NULL COMMENT 'Raison sociale',
  forme_juridique VARCHAR(100) NOT NULL COMMENT 'Forme juridique (SARL, EURL, etc.)',
  capital DECIMAL(15,2) DEFAULT NULL COMMENT 'Capital social en DA',
  numero_bureau TINYINT(3) UNSIGNED DEFAULT NULL CHECK (numero_bureau BETWEEN 1 AND 36),
  reference_contrat_notarie VARCHAR(100) DEFAULT NULL,
  date_debut_contrat DATE DEFAULT NULL,
  date_fin_contrat DATE DEFAULT NULL,
  options LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(options)),
  documents_manquants LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Liste des documents manquants avec statut' CHECK (json_valid(documents_manquants)),
  cgu_acceptees TINYINT(1) NOT NULL DEFAULT 0,
  date_cgu_acceptation DATETIME DEFAULT NULL,
  date_debut_souhaitee DATE DEFAULT NULL,

  activite_principale VARCHAR(200) DEFAULT NULL COMMENT 'Activite principale',
  domaine_activite VARCHAR(200) DEFAULT NULL COMMENT 'Domaine d''activite',

  -- Identification fiscale et administrative
  nif VARCHAR(50) DEFAULT NULL COMMENT 'NIF (20 caracteres)',
  nis VARCHAR(50) DEFAULT NULL COMMENT 'NIS (15 caracteres)',
  registre_commerce VARCHAR(50) DEFAULT NULL COMMENT 'Numero de registre de commerce',
  article_imposition VARCHAR(50) DEFAULT NULL COMMENT 'Article d''imposition',
  code_nae VARCHAR(20) DEFAULT NULL,
  activite_exercee VARCHAR(255) DEFAULT NULL,
  description_activite TEXT DEFAULT NULL,
  numero_auto_entrepreneur VARCHAR(50) DEFAULT NULL COMMENT 'Numero auto-entrepreneur',
  date_inscription_auto_entrepreneur DATE DEFAULT NULL,

  -- Coordonnees
  wilaya VARCHAR(100) DEFAULT NULL COMMENT 'Wilaya',
  commune VARCHAR(100) DEFAULT NULL COMMENT 'Commune',
  adresse_actuelle TEXT DEFAULT NULL COMMENT 'Adresse actuelle',
  adresse_siege_social TEXT DEFAULT NULL COMMENT 'Adresse du siege social',
  coordonnees_fiscales TEXT DEFAULT NULL COMMENT 'Coordonnees fiscales',
  coordonnees_administratives TEXT DEFAULT NULL COMMENT 'Coordonnees administratives',

  -- Representant legal
  representant_nom VARCHAR(100) DEFAULT NULL COMMENT 'Nom du representant legal',
  representant_prenom VARCHAR(100) DEFAULT NULL COMMENT 'Prenom du representant legal',
  representant_fonction VARCHAR(100) DEFAULT NULL COMMENT 'Fonction du representant',
  representant_telephone VARCHAR(20) DEFAULT NULL COMMENT 'Telephone du representant',
  representant_email VARCHAR(255) DEFAULT NULL COMMENT 'Email du representant',
  representant_adresse_residence VARCHAR(500) DEFAULT NULL,
  representant_ville VARCHAR(100) DEFAULT NULL,

  date_creation_entreprise DATE DEFAULT NULL COMMENT 'Date de creation de l''entreprise',
  ville_immatriculation VARCHAR(100) DEFAULT NULL,

  -- Dates et statut avec workflow complet
  statut ENUM('dossier_preparatoire', 'en_attente_complements', 'en_attente_signature', 'domiciliation_creee', 'active', 'refusee', 'expiree', 'resiliee') NOT NULL DEFAULT 'dossier_preparatoire',
  date_debut DATETIME DEFAULT NULL COMMENT 'Date de debut de service',
  date_fin DATETIME DEFAULT NULL COMMENT 'Date de fin de service',
  date_validation DATETIME DEFAULT NULL COMMENT 'Date de validation du dossier',

  -- Paiement et gestion
  montant_mensuel DECIMAL(10,2) DEFAULT NULL COMMENT 'Montant mensuel en DA',
  mode_paiement VARCHAR(50) DEFAULT NULL COMMENT 'Mode de paiement (cash, virement, etc.)',
  documents LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Documents uploades' CHECK (json_valid(documents)),
  notes_admin TEXT DEFAULT NULL COMMENT 'Notes internes admin',
  commentaire_admin TEXT DEFAULT NULL COMMENT 'Commentaire administratif',
  visible_sur_site TINYINT(1) DEFAULT 0 COMMENT 'Affichage public',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  alerte_expiration_envoyee TINYINT(1) DEFAULT 0,

  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_statut (statut),
  KEY idx_visible (visible_sur_site),
  KEY idx_user_statut (user_id, statut),
  KEY idx_dates (date_debut, date_fin),
  KEY idx_raison_sociale (raison_sociale),
  KEY idx_nif (nif),
  KEY idx_nis (nis),
  KEY idx_domiciliations_admin_filter (statut, created_at DESC),
  KEY idx_domiciliations_user (user_id, statut),
  KEY idx_domiciliations_numero_bureau (numero_bureau, statut),
  KEY idx_domiciliations_situation_type (situation_administrative, type_structure),
  KEY idx_domiciliations_cgu (cgu_acceptees, date_cgu_acceptation),
  KEY idx_domiciliations_contact_id (contact_id),
  KEY idx_domiciliations_statut (statut, created_at DESC),

  CONSTRAINT domiciliations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_domiciliation_contact FOREIGN KEY (contact_id) REFERENCES contacts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Domiciliations d''entreprises avec creation admin';

-- =====================================================
-- TABLE: courriers
-- Gestion du courrier des domicilies
-- =====================================================
CREATE TABLE courriers (
  id CHAR(36) NOT NULL,
  domiciliation_id CHAR(36) NOT NULL,
  type ENUM('lettre', 'colis', 'recommande', 'officiel', 'autre') DEFAULT 'lettre',
  expediteur VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT NULL,
  photo_url TEXT DEFAULT NULL COMMENT 'Photo du courrier uploadee',
  statut ENUM('recu', 'notifie', 'en_attente_instruction', 'recupere', 'scanne', 'reexpedier', 'traite') DEFAULT 'recu',
  instruction_client ENUM('recuperer', 'scanner', 'reexpedier') DEFAULT NULL COMMENT 'Choix du client',
  scan_url TEXT DEFAULT NULL COMMENT 'URL du scan si demande',
  date_reception DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_notification DATETIME DEFAULT NULL,
  date_instruction DATETIME DEFAULT NULL,
  date_traitement DATETIME DEFAULT NULL,
  notes_admin TEXT DEFAULT NULL,
  retire_par CHAR(36) DEFAULT NULL COMMENT 'Utilisateur ayant retire le courrier',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_retrait DATETIME DEFAULT NULL COMMENT 'Date de retrait du courrier',
  adresse_envoi TEXT DEFAULT NULL COMMENT 'Adresse de reexpedition',
  numero_suivi VARCHAR(100) DEFAULT NULL COMMENT 'Numero de suivi postal',
  date_envoi DATETIME DEFAULT NULL COMMENT 'Date d''envoi de la reexpedition',

  PRIMARY KEY (id),
  KEY idx_domiciliation (domiciliation_id),
  KEY idx_statut (statut),
  KEY fk_courriers_retire_par (retire_par),

  CONSTRAINT courriers_ibfk_1 FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE CASCADE,
  CONSTRAINT fk_courriers_retire_par FOREIGN KEY (retire_par) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: checkins
-- Enregistrement presence des reservations
-- =====================================================
CREATE TABLE checkins (
  id CHAR(36) NOT NULL,
  reservation_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  heure_arrivee_reelle DATETIME NOT NULL,
  heure_depart_reel DATETIME DEFAULT NULL,
  statut ENUM('present', 'absent', 'en_cours', 'parti') NOT NULL DEFAULT 'present',
  note TEXT DEFAULT NULL,
  enregistre_par CHAR(36) NOT NULL COMMENT 'Admin qui a enregistre',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY enregistre_par (enregistre_par),
  KEY idx_reservation_id (reservation_id),
  KEY idx_user_id (user_id),
  KEY idx_statut (statut),

  CONSTRAINT checkins_ibfk_1 FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  CONSTRAINT checkins_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT checkins_ibfk_3 FOREIGN KEY (enregistre_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: transactions
-- Historique des transactions financieres
-- =====================================================
CREATE TABLE transactions (
  id CHAR(36) NOT NULL COMMENT 'UUID de la transaction',
  user_id CHAR(36) DEFAULT NULL,
  type ENUM('abonnement', 'reservation', 'domiciliation', 'remboursement') NOT NULL COMMENT 'Type de transaction',
  montant DECIMAL(10,2) NOT NULL COMMENT 'Montant en DA',
  statut ENUM('en_attente', 'completee', 'echouee', 'remboursee') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la transaction',
  mode_paiement VARCHAR(50) DEFAULT NULL COMMENT 'Mode de paiement utilise',
  reference VARCHAR(100) DEFAULT NULL COMMENT 'Reference unique',
  description TEXT DEFAULT NULL COMMENT 'Description de la transaction',
  metadata LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Metadonnees additionnelles' CHECK (json_valid(metadata)),
  date_paiement DATETIME DEFAULT NULL COMMENT 'Date effective du paiement',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY reference (reference),
  KEY idx_user_id (user_id),
  KEY idx_type (type),
  KEY idx_statut (statut),
  KEY idx_reference (reference),
  KEY idx_user_type_statut (user_id, type, statut),
  KEY idx_date_paiement (date_paiement),

  CONSTRAINT transactions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des transactions financieres';

-- =====================================================
-- TABLE: transactions_caisse
-- Transactions caisse operationnelle
-- =====================================================
CREATE TABLE transactions_caisse (
  id CHAR(36) NOT NULL,
  reservation_id CHAR(36) DEFAULT NULL,
  domiciliation_id CHAR(36) DEFAULT NULL,
  abonnement_utilisateur_id CHAR(36) DEFAULT NULL,
  type_transaction ENUM('reservation', 'domiciliation', 'abonnement', 'autre') NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  mode_paiement ENUM('cash', 'virement', 'cheque', 'tpe', 'credit') NOT NULL,
  reference_paiement VARCHAR(100) DEFAULT NULL COMMENT 'Num cheque, ref virement...',
  numero_recu VARCHAR(50) NOT NULL COMMENT 'REC-2026-0001',
  statut ENUM('encaisse', 'en_attente', 'annule', 'rembourse') NOT NULL DEFAULT 'encaisse',
  encaisse_par CHAR(36) NOT NULL COMMENT 'Admin qui a encaisse',
  cloture_id CHAR(36) DEFAULT NULL COMMENT 'Lien vers cloture journaliere',
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY encaisse_par (encaisse_par),
  KEY reservation_id (reservation_id),
  KEY domiciliation_id (domiciliation_id),
  KEY idx_type (type_transaction),
  KEY idx_mode (mode_paiement),
  KEY idx_statut (statut),
  KEY idx_date (created_at),
  KEY idx_cloture (cloture_id),

  CONSTRAINT transactions_caisse_ibfk_1 FOREIGN KEY (encaisse_par) REFERENCES users(id),
  CONSTRAINT transactions_caisse_ibfk_2 FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
  CONSTRAINT transactions_caisse_ibfk_3 FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: clotures_caisse
-- Clotures journalieres de la caisse
-- =====================================================
CREATE TABLE clotures_caisse (
  id CHAR(36) NOT NULL,
  date_cloture DATE NOT NULL,
  total_cash DECIMAL(10,2) DEFAULT 0.00,
  total_virement DECIMAL(10,2) DEFAULT 0.00,
  total_cheque DECIMAL(10,2) DEFAULT 0.00,
  total_tpe DECIMAL(10,2) DEFAULT 0.00,
  total_general DECIMAL(10,2) DEFAULT 0.00,
  nombre_transactions INT(11) DEFAULT 0,
  cloture_par CHAR(36) NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY date_cloture (date_cloture),
  KEY cloture_par (cloture_par),

  CONSTRAINT clotures_caisse_ibfk_1 FOREIGN KEY (cloture_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: codes_promo
-- Codes promotionnels et reductions
-- =====================================================
CREATE TABLE codes_promo (
  id CHAR(36) NOT NULL COMMENT 'UUID du code promo',
  code VARCHAR(50) NOT NULL COMMENT 'Code promotionnel unique',
  type ENUM('pourcentage', 'montant_fixe') NOT NULL COMMENT 'Type de reduction',
  valeur DECIMAL(10,2) NOT NULL COMMENT 'Valeur de la reduction',
  date_debut DATETIME NOT NULL COMMENT 'Date de debut de validite',
  date_fin DATETIME NOT NULL COMMENT 'Date de fin de validite',
  utilisations_max INT(11) DEFAULT NULL COMMENT 'Nombre max d''utilisations',
  utilisations_actuelles INT(11) DEFAULT 0 COMMENT 'Nombre d''utilisations actuelles',
  montant_min DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Montant minimum requis',
  description TEXT DEFAULT NULL COMMENT 'Description du code promo',
  conditions TEXT DEFAULT NULL COMMENT 'Conditions d''utilisation',
  types_application LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Types ou le code s''applique' CHECK (json_valid(types_application)),
  actif TINYINT(1) DEFAULT 1 COMMENT 'Activation du code',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY code (code),
  KEY idx_code (code),
  KEY idx_actif (actif),
  KEY idx_dates (date_debut, date_fin),
  KEY idx_actif_dates (actif, date_debut, date_fin),
  KEY idx_codes_promo_actif (actif, date_fin),
  KEY idx_codes_promo_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Codes promotionnels et reductions';

-- =====================================================
-- TABLE: utilisations_codes_promo
-- Historique d'utilisation des codes promo
-- =====================================================
CREATE TABLE utilisations_codes_promo (
  id CHAR(36) NOT NULL COMMENT 'UUID de l''utilisation',
  code_promo_id CHAR(36) NOT NULL COMMENT 'Code promo utilise',
  user_id CHAR(36) DEFAULT NULL,
  reservation_id CHAR(36) DEFAULT NULL COMMENT 'Reservation associee',
  abonnement_id CHAR(36) DEFAULT NULL COMMENT 'Abonnement associe',
  domiciliation_id CHAR(36) DEFAULT NULL COMMENT 'Domiciliation associee',
  montant_reduction DECIMAL(10,2) NOT NULL COMMENT 'Montant de la reduction',
  montant_avant DECIMAL(10,2) NOT NULL COMMENT 'Montant avant reduction',
  montant_apres DECIMAL(10,2) NOT NULL COMMENT 'Montant apres reduction',
  type_utilisation ENUM('reservation', 'abonnement', 'domiciliation') NOT NULL COMMENT 'Type d''utilisation',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_code_promo_id (code_promo_id),
  KEY idx_user_id (user_id),
  KEY idx_reservation_id (reservation_id),
  KEY idx_abonnement_id (abonnement_id),
  KEY idx_domiciliation_id (domiciliation_id),
  KEY idx_type_utilisation (type_utilisation),
  KEY idx_created_at (created_at),

  CONSTRAINT utilisations_codes_promo_ibfk_1 FOREIGN KEY (code_promo_id) REFERENCES codes_promo(id) ON DELETE CASCADE,
  CONSTRAINT utilisations_codes_promo_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT utilisations_codes_promo_ibfk_3 FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
  CONSTRAINT utilisations_codes_promo_ibfk_4 FOREIGN KEY (abonnement_id) REFERENCES abonnements_utilisateurs(id) ON DELETE SET NULL,
  CONSTRAINT utilisations_codes_promo_ibfk_5 FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique d''utilisation des codes promo';

-- =====================================================
-- TABLE: parrainages
-- Systeme de parrainage
-- =====================================================
CREATE TABLE parrainages (
  id CHAR(36) NOT NULL COMMENT 'UUID du parrainage',
  parrain_id CHAR(36) DEFAULT NULL,
  code_parrain VARCHAR(50) NOT NULL COMMENT 'Code unique du parrain',
  parraines INT(11) DEFAULT 0 COMMENT 'Nombre de parraines',
  recompenses_totales DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total des recompenses',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY code_parrain (code_parrain),
  KEY idx_parrain_id (parrain_id),
  KEY idx_code_parrain (code_parrain),

  CONSTRAINT parrainages_ibfk_1 FOREIGN KEY (parrain_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Systeme de parrainage';

-- =====================================================
-- TABLE: parrainages_details
-- Details des parrainages
-- =====================================================
CREATE TABLE parrainages_details (
  id CHAR(36) NOT NULL COMMENT 'UUID du detail',
  parrainage_id CHAR(36) NOT NULL COMMENT 'Parrainage parent',
  filleul_id CHAR(36) DEFAULT NULL,
  recompense_parrain DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Recompense du parrain',
  recompense_filleul DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Recompense du filleul',
  statut ENUM('en_attente', 'valide', 'paye') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la recompense',
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date d''inscription du filleul',
  date_validation DATETIME DEFAULT NULL COMMENT 'Date de validation',

  PRIMARY KEY (id),
  KEY idx_parrainage_id (parrainage_id),
  KEY idx_filleul_id (filleul_id),
  KEY idx_parrainage_filleul (parrainage_id, filleul_id),
  KEY idx_statut (statut),

  CONSTRAINT parrainages_details_ibfk_1 FOREIGN KEY (parrainage_id) REFERENCES parrainages(id) ON DELETE CASCADE,
  CONSTRAINT parrainages_details_ibfk_2 FOREIGN KEY (filleul_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Details des parrainages';

-- =====================================================
-- TABLE: notifications
-- Systeme de notifications utilisateurs
-- =====================================================
CREATE TABLE notifications (
  id CHAR(36) NOT NULL COMMENT 'UUID de la notification',
  user_id CHAR(36) DEFAULT NULL,
  type ENUM('reservation', 'abonnement', 'domiciliation', 'paiement', 'promo', 'parrainage', 'systeme') NOT NULL COMMENT 'Type de notification',
  titre VARCHAR(200) NOT NULL COMMENT 'Titre de la notification',
  message TEXT NOT NULL COMMENT 'Message complet',
  lue TINYINT(1) DEFAULT 0 COMMENT 'Notification lue',
  metadata LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Metadonnees additionnelles' CHECK (json_valid(metadata)),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_lue (lue),
  KEY idx_type (type),
  KEY idx_user_lu_created (user_id, lue, created_at),

  CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notifications utilisateurs';

-- =====================================================
-- TABLE: documents_uploads
-- Gestion des documents uploades
-- =====================================================
CREATE TABLE documents_uploads (
  id CHAR(36) NOT NULL COMMENT 'UUID du document',
  user_id CHAR(36) DEFAULT NULL,
  entity_type ENUM('domiciliation', 'user', 'reservation', 'autre') NOT NULL COMMENT 'Type d''entite',
  entity_id CHAR(36) DEFAULT NULL COMMENT 'ID de l''entite associee',
  nom_fichier VARCHAR(255) NOT NULL COMMENT 'Nom du fichier stocke',
  nom_original VARCHAR(255) NOT NULL COMMENT 'Nom original',
  type_fichier VARCHAR(100) DEFAULT NULL COMMENT 'Type MIME',
  taille INT(11) DEFAULT NULL COMMENT 'Taille en octets',
  chemin_fichier TEXT NOT NULL COMMENT 'Chemin du fichier',
  type_document VARCHAR(50) DEFAULT NULL COMMENT 'Type de document (cni, rc, nif, etc.)',
  status ENUM('en_attente', 'valide', 'rejete') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de validation du document',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de creation (alias uploaded_at)',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_uploaded_at (uploaded_at),
  KEY idx_type_document (type_document),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  KEY idx_user_type (user_id, type_document),
  KEY idx_documents_created (created_at DESC),

  CONSTRAINT documents_uploads_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Documents uploades';

-- =====================================================
-- TABLE: audit_logs
-- Historique des activites (audit trail)
-- =====================================================
CREATE TABLE audit_logs (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) DEFAULT NULL,
  type VARCHAR(100) NOT NULL COMMENT 'Type d''activite',
  description TEXT NOT NULL COMMENT 'Description',
  metadata LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Metadonnees' CHECK (json_valid(metadata)),
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',
  user_agent TEXT DEFAULT NULL COMMENT 'User agent du navigateur',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR(50) DEFAULT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id CHAR(36) DEFAULT NULL,
  old_values LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(old_values)),
  new_values LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(new_values)),

  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_type (type),
  KEY idx_created_at (created_at),
  KEY idx_user_type (user_id, type),

  CONSTRAINT audit_logs_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des activites utilisateurs';

-- =====================================================
-- TABLE: password_resets
-- Tokens de reinitialisation de mot de passe
-- =====================================================
CREATE TABLE password_resets (
  id CHAR(36) NOT NULL COMMENT 'UUID du reset',
  user_id CHAR(36) DEFAULT NULL,
  email VARCHAR(255) NOT NULL COMMENT 'Email de l''utilisateur',
  token VARCHAR(255) NOT NULL COMMENT 'Token unique de reinitialisation',
  expires_at DATETIME NOT NULL COMMENT 'Date d''expiration du token (1h)',
  used_at DATETIME DEFAULT NULL COMMENT 'Date d''utilisation du token',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP de la demande',
  user_agent TEXT DEFAULT NULL COMMENT 'User agent de la requete',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de creation',

  PRIMARY KEY (id),
  KEY idx_token (token),
  KEY idx_email (email),
  KEY idx_user_id (user_id),
  KEY idx_expires_at (expires_at),
  KEY idx_used_at (used_at),

  CONSTRAINT password_resets_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens de reinitialisation de mot de passe';

-- =====================================================
-- TABLES TECHNIQUES
-- =====================================================

-- Table: rate_limits (Protection contre les abus)
CREATE TABLE rate_limits (
  id INT(11) NOT NULL AUTO_INCREMENT,
  key_name VARCHAR(255) NOT NULL COMMENT 'Cle de limitation',
  attempts INT(11) NOT NULL DEFAULT 0 COMMENT 'Nombre de tentatives',
  expires_at DATETIME NOT NULL COMMENT 'Expiration',

  PRIMARY KEY (id),
  UNIQUE KEY key_name (key_name),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting pour la securite';

-- Table: logs (Journalisation systeme)
CREATE TABLE logs (
  id CHAR(36) NOT NULL,
  level ENUM('info', 'warning', 'error', 'security') NOT NULL COMMENT 'Niveau de log',
  message TEXT NOT NULL COMMENT 'Message du log',
  context LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Contexte additionnel' CHECK (json_valid(context)),
  user_id CHAR(36) DEFAULT NULL COMMENT 'Utilisateur concerne',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_level (level),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at),
  KEY idx_level_created (level, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs systeme et securite';

-- Table: csrf_tokens (Protection CSRF)
CREATE TABLE csrf_tokens (
  id INT(11) NOT NULL AUTO_INCREMENT,
  token VARCHAR(64) NOT NULL COMMENT 'Token CSRF',
  user_id CHAR(36) DEFAULT NULL,
  expires_at DATETIME NOT NULL COMMENT 'Expiration',
  used TINYINT(1) DEFAULT 0 COMMENT 'Token utilise',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY idx_token (token),
  KEY idx_user_id (user_id),
  KEY idx_expires_at (expires_at),

  CONSTRAINT csrf_tokens_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens CSRF pour la securite';

-- =====================================================
-- VUES
-- =====================================================

-- Vue: Reservations actives
CREATE VIEW active_reservations AS
SELECT
    r.id,
    r.user_id,
    r.espace_id,
    u.nom,
    u.prenom,
    u.email,
    e.nom AS espace_nom,
    e.type AS espace_type,
    r.date_debut,
    r.date_fin,
    r.statut,
    r.type_reservation,
    r.montant_total,
    r.reduction,
    r.participants,
    r.created_at
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN espaces e ON r.espace_id = e.id
WHERE r.statut IN ('confirmee', 'en_cours')
AND r.date_fin >= NOW();

-- Vue: Statistiques quotidiennes
CREATE VIEW daily_stats AS
SELECT
    CAST(created_at AS DATE) AS date,
    COUNT(*) AS total_reservations,
    SUM(montant_total - COALESCE(reduction, 0)) AS revenue,
    SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) AS confirmed_count,
    SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) AS cancelled_count,
    AVG(montant_total - COALESCE(reduction, 0)) AS avg_amount,
    SUM(participants) AS total_participants
FROM reservations
GROUP BY CAST(created_at AS DATE);

-- Vue: Historique des contacts
CREATE VIEW contact_history AS
SELECT
    c.id AS contact_id,
    'reservation' AS type,
    r.id AS entity_id,
    r.created_at AS date,
    CONCAT('Reservation ', e.nom, ' du ', DATE_FORMAT(r.date_debut, '%d/%m/%Y')) AS description,
    r.montant_total AS montant,
    r.statut AS statut
FROM contacts c
LEFT JOIN reservations r ON c.id = r.contact_id
LEFT JOIN espaces e ON r.espace_id = e.id
WHERE r.id IS NOT NULL
UNION ALL
SELECT
    c.id AS contact_id,
    'domiciliation' AS type,
    d.id AS entity_id,
    d.created_at AS date,
    CONCAT('Domiciliation ', d.raison_sociale) AS description,
    NULL AS montant,
    d.statut AS statut
FROM contacts c
LEFT JOIN domiciliations d ON c.id = d.contact_id
WHERE d.id IS NOT NULL
ORDER BY date DESC;

-- =====================================================
-- PROCEDURES STOCKEES
-- =====================================================

DELIMITER $$

-- Procedure: Nettoyage des donnees expirees
CREATE PROCEDURE cleanup_expired_data()
BEGIN
    DECLARE deleted_rate_limits INT;
    DECLARE deleted_logs INT;
    DECLARE deleted_activities INT;
    DECLARE deleted_csrf INT;

    DELETE FROM rate_limits WHERE expires_at < NOW();
    SET deleted_rate_limits = ROW_COUNT();

    DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    SET deleted_logs = ROW_COUNT();

    DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    SET deleted_activities = ROW_COUNT();

    DELETE FROM csrf_tokens WHERE expires_at < NOW();
    SET deleted_csrf = ROW_COUNT();

    SELECT
        'Cleanup completed' AS status,
        deleted_rate_limits AS rate_limits_deleted,
        deleted_logs AS logs_deleted,
        deleted_activities AS activities_deleted,
        deleted_csrf AS csrf_tokens_deleted,
        NOW() AS cleanup_date;
END$$

-- Procedure: Nettoyage des tokens de reinitialisation expires
CREATE PROCEDURE cleanup_expired_password_resets()
BEGIN
  DELETE FROM password_resets
  WHERE expires_at < NOW()
  OR used_at IS NOT NULL;
END$$

-- Procedure: Mise a jour des abonnements expires
CREATE PROCEDURE update_expired_subscriptions()
BEGIN
    UPDATE abonnements_utilisateurs
    SET statut = 'expire'
    WHERE statut = 'actif'
    AND date_fin < NOW();

    SELECT
        'Subscriptions updated' AS status,
        ROW_COUNT() AS updated_count,
        NOW() AS update_date;
END$$

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER $$

-- Trigger: Notification automatique pour nouvelle reservation
CREATE TRIGGER after_reservation_created
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    INSERT INTO notifications (id, user_id, type, titre, message, created_at)
    VALUES (
        UUID(),
        NEW.user_id,
        'reservation',
        'Nouvelle reservation',
        CONCAT('Votre reservation pour ', (SELECT nom FROM espaces WHERE id = NEW.espace_id), ' a ete creee avec succes.'),
        NOW()
    );
END$$

-- Trigger: Audit suppression utilisateur
CREATE TRIGGER audit_users_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
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
END$$

-- Trigger: Audit modification utilisateur
CREATE TRIGGER audit_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
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
END$$

-- Trigger: Auto-increment du compteur de codes promo utilises
CREATE TRIGGER after_code_promo_used
AFTER INSERT ON utilisations_codes_promo
FOR EACH ROW
BEGIN
    UPDATE codes_promo
    SET utilisations_actuelles = utilisations_actuelles + 1
    WHERE id = NEW.code_promo_id;
END$$

DELIMITER ;

-- =====================================================
-- DONNEES INITIALES
-- =====================================================

-- Espaces de coworking avec tarification complete
INSERT INTO espaces (id, nom, type, capacite, prix_heure, prix_demi_journee, prix_jour, prix_semaine, prix_mois, description, equipements, image_url) VALUES
(UUID(), 'Open Space', 'open_space', 12, 200.00, 700.00, 1200.00, 5000.00, 15000.00,
 'Espace de travail collaboratif de 80m2 avec 12 postes equipes. Ambiance dynamique et professionnelle.',
 '["Wi-Fi 50-100 Mbps", "Acces communaute", "Cafe/the illimite", "Climatisation", "12 postes de travail", "Prises electriques", "Lumiere naturelle"]',
 '/espace-coworking.jpeg'),

(UUID(), 'Private Booth Aures', 'box_4', 4, 1000.00, 3000.00, 5000.00, 15000.00, 45000.00,
 'Box prive 2 places ideal pour duo ou consulting. Isolation phonique et equipement complet.',
 '["Wi-Fi haut debit", "Table/chaises", "Climatisation", "Insonorisation", "Acces 7h-20h", "Eclairage LED", "Prises USB"]',
 '/booth-aures.jpeg'),

(UUID(), 'Private Booth Hoggar', 'box_3', 2, 900.00, 2500.00, 5000.00, 15000.00, 35000.00,
 'Box prive 2 places confortable et climatise. Parfait pour concentration et productivite.',
 '["Wi-Fi haut debit", "Table/chaises", "Climatisation", "Insonorisation", "Acces 7h-20h", "Rangement securise"]',
 '/booth-hoggar.jpeg'),

(UUID(), 'Private Booth Atlas', 'box_4', 4, 1000.00, 3000.00, 5000.00, 20000.00, 45000.00,
 'Box prive 4 places spacieux avec ecran de presentation. Ideal pour petites equipes.',
 '["Wi-Fi haut debit", "Table/chaises", "Climatisation", "Ecran de presentation", "4 places", "Acces 7h-20h", "Tableau blanc"]',
 '/booth-atlas.jpeg'),

(UUID(), 'Salle de Reunion Premium', 'salle_reunion', 12, 2500.00, 7000.00, 12000.00, 50000.00, 0.00,
 'Salle de reunion premium 35-40m2 avec terrasse panoramique et equipement audiovisuel complet.',
 '["TV 80 pouces", "Systeme audio", "Tableau blanc", "Terrasse panoramique", "Wi-Fi haut debit", "Eau minerale", "Climatisation", "12 places assises", "Videoprojecteur", "Visioconference"]',
 '/salle-reunion.jpeg');

-- Types d'abonnements standard
INSERT INTO abonnements (id, nom, type, prix, prix_avec_domiciliation, duree_mois, description, avantages, actif, statut, ordre, credits_mensuels, couleur) VALUES
(UUID(), 'Open Space Mensuel', 'open_space_monthly', 15000.00, 12000.00, 1,
 'Acces mensuel dedie a l''espace de coworking open space',
 '["Acces open space 8h-18h", "Wi-Fi haut debit", "Cafe/the inclus", "12 postes disponibles", "Casier securise"]',
 1, 'actif', 1, 0, ''),

(UUID(), 'Hoggar Mensuel', 'booth_hoggar_monthly', 35000.00, NULL, 1,
 'Box prive Hoggar 2 places - Location mensuelle exclusive',
 '["Acces 7h-20h", "Wi-Fi haut debit", "Climatisation", "Insonorisation", "2 places", "Casier securise", "Badge d''acces"]',
 1, 'actif', 11, 0, ''),

(UUID(), 'Atlas Mensuel', 'booth_atlas_monthly', 45000.00, NULL, 1,
 'Box prive Atlas 4 places - Location mensuelle pour equipe',
 '["Acces 7h-20h", "Wi-Fi haut debit", "Climatisation", "Ecran presentation", "4 places", "Rangement equipe", "Badge d''acces"]',
 1, 'actif', 12, 0, ''),

(UUID(), 'Aures Mensuel', 'booth_aures_monthly', 45000.00, NULL, 1,
 'Box prive Aures 2 places - Location mensuelle premium',
 '["Acces 7h-20h", "Wi-Fi haut debit", "Climatisation", "Insonorisation", "2 places", "Mobilier premium", "Badge d''acces"]',
 1, 'actif', 13, 0, '');

-- =====================================================
-- ACTIVATION DES CONTRAINTES
-- =====================================================

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- FIN DU SCHEMA v4.2.0
-- =====================================================
