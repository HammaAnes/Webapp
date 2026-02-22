-- =====================================================
-- MIGRATION 011: Tables ERP - Coffice
-- Date: 2026-02-14
--
-- Description:
--   Ajout des tables necessaires au module ERP pour
--   la gestion financiere, inventaire, maintenance,
--   personnel et evenements communautaires.
--
-- 1. Nouvelles tables:
--    - factures: Factures clients avec numerotation sequentielle
--    - facture_lignes: Lignes de detail des factures
--    - paiements: Suivi des paiements recus
--    - depenses: Gestion des charges et depenses operationnelles
--    - inventaire: Stock de fournitures et equipements
--    - demandes_maintenance: Demandes d'intervention technique
--    - personnel: Gestion du personnel Coffice
--    - evenements: Evenements communautaires
--
-- 2. Securite:
--    - Foreign keys vers users et espaces
--    - Contraintes CHECK sur les montants
--    - Index optimises pour les requetes frequentes
--
-- 3. Notes:
--    - Montants en DA (Dinar Algerien)
--    - TVA 19% par defaut (norme algerienne)
--    - Numerotation factures: FAC-YYYY-NNNNNN
-- =====================================================

SET NAMES utf8mb4;

-- =====================================================
-- TABLE: factures
-- Factures clients avec conformite fiscale algerienne
-- =====================================================
CREATE TABLE IF NOT EXISTS factures (
  id CHAR(36) PRIMARY KEY,
  numero_facture VARCHAR(50) UNIQUE NOT NULL COMMENT 'Numero sequentiel FAC-YYYY-NNNNNN',
  user_id CHAR(36) NOT NULL COMMENT 'Client facture',
  reservation_id CHAR(36) NULL COMMENT 'Reservation associee',
  domiciliation_id CHAR(36) NULL COMMENT 'Domiciliation associee',
  abonnement_utilisateur_id CHAR(36) NULL COMMENT 'Souscription abonnement associee',

  sous_total DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Sous-total HT',
  taux_tva DECIMAL(5,2) NOT NULL DEFAULT 19.00 COMMENT 'Taux TVA (%)',
  montant_tva DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Montant TVA',
  remise DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Remise globale',
  montant_total DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Total TTC',

  statut ENUM('brouillon', 'envoyee', 'en_attente', 'payee', 'en_retard', 'annulee') NOT NULL DEFAULT 'brouillon',
  date_emission DATE NOT NULL COMMENT 'Date emission',
  date_echeance DATE NOT NULL COMMENT 'Date echeance paiement',
  date_paiement DATE NULL COMMENT 'Date paiement effectif',
  mode_paiement VARCHAR(50) NULL COMMENT 'especes, virement, cheque, cib',

  adresse_facturation TEXT NULL COMMENT 'Adresse facturation client',
  notes TEXT NULL COMMENT 'Notes internes',
  conditions TEXT NULL COMMENT 'Conditions de paiement',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_statut (statut),
  INDEX idx_date_emission (date_emission),
  INDEX idx_date_echeance (date_echeance),
  INDEX idx_numero (numero_facture),
  INDEX idx_user_statut (user_id, statut),

  CONSTRAINT chk_montant_total_positif CHECK (montant_total >= 0),
  CONSTRAINT chk_sous_total_positif CHECK (sous_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Factures clients';

-- =====================================================
-- TABLE: facture_lignes
-- Lignes de detail des factures
-- =====================================================
CREATE TABLE IF NOT EXISTS facture_lignes (
  id CHAR(36) PRIMARY KEY,
  facture_id CHAR(36) NOT NULL,
  description VARCHAR(500) NOT NULL COMMENT 'Description du service/produit',
  quantite DECIMAL(10,2) NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,
  remise DECIMAL(12,2) NOT NULL DEFAULT 0,
  montant_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  type VARCHAR(50) NULL COMMENT 'reservation, abonnement, domiciliation, service',
  ordre INT NOT NULL DEFAULT 0,

  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,

  INDEX idx_facture_id (facture_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lignes de facture';

-- =====================================================
-- TABLE: paiements
-- Suivi des paiements recus
-- =====================================================
CREATE TABLE IF NOT EXISTS paiements (
  id CHAR(36) PRIMARY KEY,
  facture_id CHAR(36) NULL COMMENT 'Facture associee',
  user_id CHAR(36) NOT NULL COMMENT 'Client payeur',
  montant DECIMAL(12,2) NOT NULL COMMENT 'Montant paye',
  mode_paiement ENUM('especes', 'virement', 'cheque', 'cib', 'edahabia', 'baridimob') NOT NULL DEFAULT 'especes',
  statut ENUM('en_attente', 'complete', 'echoue', 'rembourse') NOT NULL DEFAULT 'en_attente',
  reference_transaction VARCHAR(100) NULL COMMENT 'Reference bancaire ou recu',
  date_paiement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,

  montant_rembourse DECIMAL(12,2) NULL DEFAULT 0,
  date_remboursement DATETIME NULL,
  raison_remboursement TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_facture_id (facture_id),
  INDEX idx_user_id (user_id),
  INDEX idx_statut (statut),
  INDEX idx_date_paiement (date_paiement),
  INDEX idx_mode (mode_paiement),

  CONSTRAINT chk_montant_positif CHECK (montant > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Paiements recus';

-- =====================================================
-- TABLE: depenses
-- Charges et depenses operationnelles
-- =====================================================
CREATE TABLE IF NOT EXISTS depenses (
  id CHAR(36) PRIMARY KEY,
  categorie ENUM('loyer', 'charges', 'fournitures', 'equipement', 'maintenance', 'salaires', 'marketing', 'assurance', 'impots', 'divers') NOT NULL DEFAULT 'divers',
  montant DECIMAL(12,2) NOT NULL,
  date_depense DATE NOT NULL,
  description VARCHAR(500) NOT NULL,
  fournisseur VARCHAR(200) NULL COMMENT 'Nom du fournisseur',
  recu TEXT NULL COMMENT 'Chemin vers le recu',
  mode_paiement VARCHAR(50) NULL,
  statut ENUM('en_attente', 'approuvee', 'rejetee', 'payee') NOT NULL DEFAULT 'en_attente',
  approuvee_par CHAR(36) NULL COMMENT 'Admin ayant approuve',
  recurrente BOOLEAN NOT NULL DEFAULT FALSE,
  frequence_recurrence ENUM('hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle') NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_categorie (categorie),
  INDEX idx_statut (statut),
  INDEX idx_date (date_depense),
  INDEX idx_categorie_date (categorie, date_depense),

  CONSTRAINT chk_depense_positive CHECK (montant > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Depenses operationnelles';

-- =====================================================
-- TABLE: inventaire
-- Stock fournitures et equipements
-- =====================================================
CREATE TABLE IF NOT EXISTS inventaire (
  id CHAR(36) PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  categorie ENUM('fourniture_bureau', 'informatique', 'mobilier', 'cuisine', 'nettoyage', 'securite', 'divers') NOT NULL DEFAULT 'divers',
  quantite INT NOT NULL DEFAULT 0,
  quantite_min INT NOT NULL DEFAULT 5 COMMENT 'Seuil alerte stock bas',
  unite VARCHAR(50) NOT NULL DEFAULT 'piece',
  fournisseur VARCHAR(200) NULL,
  prix_achat DECIMAL(12,2) NULL COMMENT 'Prix unitaire achat',
  emplacement VARCHAR(200) NULL,
  notes TEXT NULL,
  date_dernier_reapprovisionnement DATE NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_categorie (categorie),
  INDEX idx_quantite (quantite),
  INDEX idx_nom (nom),

  CONSTRAINT chk_quantite_positive CHECK (quantite >= 0),
  CONSTRAINT chk_quantite_min_positive CHECK (quantite_min >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventaire fournitures et equipements';

-- =====================================================
-- TABLE: demandes_maintenance
-- Demandes d'intervention technique
-- =====================================================
CREATE TABLE IF NOT EXISTS demandes_maintenance (
  id CHAR(36) PRIMARY KEY,
  titre VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  espace_id CHAR(36) NULL COMMENT 'Espace concerne',
  priorite ENUM('basse', 'moyenne', 'haute', 'critique') NOT NULL DEFAULT 'moyenne',
  statut ENUM('en_attente', 'en_cours', 'terminee', 'annulee') NOT NULL DEFAULT 'en_attente',
  demandee_par CHAR(36) NULL COMMENT 'Utilisateur ou staff demandeur',
  assignee_a CHAR(36) NULL COMMENT 'Membre du personnel assigne',
  date_prevue DATE NULL COMMENT 'Date prevue intervention',
  date_terminee DATETIME NULL,
  cout_estime DECIMAL(12,2) NULL,
  cout_reel DECIMAL(12,2) NULL,
  notes TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_statut (statut),
  INDEX idx_priorite (priorite),
  INDEX idx_espace_id (espace_id),
  INDEX idx_assignee (assignee_a),
  INDEX idx_statut_priorite (statut, priorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Demandes de maintenance';

-- =====================================================
-- TABLE: personnel
-- Gestion du personnel Coffice
-- =====================================================
CREATE TABLE IF NOT EXISTS personnel (
  id CHAR(36) PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(20) NULL,
  poste VARCHAR(100) NOT NULL COMMENT 'receptionniste, technicien, manager, etc.',
  departement VARCHAR(100) NULL,
  statut ENUM('actif', 'inactif', 'conge') NOT NULL DEFAULT 'actif',
  date_embauche DATE NULL,
  notes TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_statut (statut),
  INDEX idx_poste (poste),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Personnel Coffice';

-- =====================================================
-- TABLE: evenements
-- Evenements communautaires
-- =====================================================
CREATE TABLE IF NOT EXISTS evenements (
  id CHAR(36) PRIMARY KEY,
  titre VARCHAR(300) NOT NULL,
  description TEXT NULL,
  date_debut DATETIME NOT NULL,
  date_fin DATETIME NOT NULL,
  lieu VARCHAR(200) NOT NULL DEFAULT 'Coffice - Mohammadia Mall',
  capacite INT NOT NULL DEFAULT 20,
  inscrits INT NOT NULL DEFAULT 0,
  organisateur VARCHAR(200) NULL,
  categorie ENUM('networking', 'formation', 'atelier', 'conference', 'social', 'autre') NOT NULL DEFAULT 'autre',
  statut ENUM('a_venir', 'en_cours', 'termine', 'annule') NOT NULL DEFAULT 'a_venir',
  image_url TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_statut (statut),
  INDEX idx_date_debut (date_debut),
  INDEX idx_categorie (categorie),

  CONSTRAINT chk_capacite_positive CHECK (capacite > 0),
  CONSTRAINT chk_dates_coherentes CHECK (date_fin > date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Evenements communautaires';

-- =====================================================
-- SEQUENCE NUMEROTATION FACTURES
-- =====================================================
CREATE TABLE IF NOT EXISTS sequences (
  nom VARCHAR(50) PRIMARY KEY,
  valeur_courante INT NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO sequences (nom, valeur_courante) VALUES ('facture', 0);

-- =====================================================
-- FONCTION: Generateur de numero de facture
-- =====================================================
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS next_numero_facture()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
  DECLARE next_val INT;
  DECLARE annee CHAR(4);

  SET annee = YEAR(CURDATE());

  UPDATE sequences SET valeur_courante = valeur_courante + 1 WHERE nom = 'facture';
  SELECT valeur_courante INTO next_val FROM sequences WHERE nom = 'facture';

  RETURN CONCAT('FAC-', annee, '-', LPAD(next_val, 6, '0'));
END$$

DELIMITER ;

-- =====================================================
-- TRIGGER: Notification pour maintenance critique
-- =====================================================
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS after_maintenance_critical
AFTER INSERT ON demandes_maintenance
FOR EACH ROW
BEGIN
  IF NEW.priorite = 'critique' THEN
    INSERT INTO notifications (id, user_id, type, titre, message, created_at)
    SELECT UUID(), u.id, 'systeme',
           'Maintenance critique',
           CONCAT('Alerte: ', NEW.titre, ' - Priorite critique'),
           NOW()
    FROM users u WHERE u.role = 'admin' AND u.statut = 'actif';
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Migration 011 - Tables ERP' as migration;
SELECT 'Tables creees: factures, facture_lignes, paiements, depenses, inventaire, demandes_maintenance, personnel, evenements, sequences' as tables_creees;
