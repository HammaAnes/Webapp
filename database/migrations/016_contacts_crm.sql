/*
  # Module CRM - Gestion des Contacts et Leads

  1. Nouvelle Table
    - `contacts`
      - `id` (uuid, primary key)
      - `nom` (varchar 100, requis)
      - `prenom` (varchar 100, requis)
      - `email` (varchar 255, optionnel, unique si renseigné)
      - `telephone` (varchar 20, optionnel)
      - `entreprise` (varchar 255, optionnel)
      - `source` (enum: whatsapp, instagram, tiktok, fixe, mobile, physique, email, autre)
      - `statut` (enum: prospect, client, perdu)
      - `notes` (text, optionnel)
      - `user_id` (uuid, optionnel, FK vers users - NULL si pas encore converti)
      - `created_by` (uuid, requis, FK vers users - admin qui a créé)
      - `created_at`, `updated_at`

  2. Modifications Tables Existantes
    - `reservations` : Ajouter `contact_id` (uuid, optionnel)
    - `domiciliations` : Ajouter `contact_id` (uuid, optionnel)
    - Note: MySQL ne supporte pas les contraintes CHECK sur les colonnes
    - La validation user_id OU contact_id sera faite au niveau application

  3. Sécurité
    - Index sur email, telephone, statut, source pour performance
    - Logs d'audit pour traçabilité
*/

-- Table contacts (CRM)
CREATE TABLE IF NOT EXISTS contacts (
  id CHAR(36) PRIMARY KEY,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_contact_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_telephone ON contacts(telephone);
CREATE INDEX IF NOT EXISTS idx_contacts_statut ON contacts(statut);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Ajouter contact_id aux réservations
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS contact_id CHAR(36) DEFAULT NULL AFTER user_id;

-- Index et foreign key pour contact_id
CREATE INDEX IF NOT EXISTS idx_reservations_contact_id ON reservations(contact_id);

-- Vérifier si la contrainte existe avant de l'ajouter
SET @dbname = DATABASE();
SET @tablename = 'reservations';
SET @constraintname = 'fk_reservation_contact';
SET @check_constraint = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND CONSTRAINT_NAME = @constraintname
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql_fk_reservation = IF(
  @check_constraint = 0,
  'ALTER TABLE reservations ADD CONSTRAINT fk_reservation_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT',
  'SELECT "Foreign key fk_reservation_contact already exists" AS msg'
);

PREPARE stmt FROM @sql_fk_reservation;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter contact_id aux domiciliations
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS contact_id CHAR(36) DEFAULT NULL AFTER user_id;

-- Index pour contact_id
CREATE INDEX IF NOT EXISTS idx_domiciliations_contact_id ON domiciliations(contact_id);

-- Vérifier si la contrainte existe avant de l'ajouter
SET @tablename = 'domiciliations';
SET @constraintname = 'fk_domiciliation_contact';
SET @check_constraint = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND CONSTRAINT_NAME = @constraintname
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql_fk_domiciliation = IF(
  @check_constraint = 0,
  'ALTER TABLE domiciliations ADD CONSTRAINT fk_domiciliation_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT',
  'SELECT "Foreign key fk_domiciliation_contact already exists" AS msg'
);

PREPARE stmt FROM @sql_fk_domiciliation;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vue pour historique complet d'un contact (MySQL compatible)
DROP VIEW IF EXISTS contact_history;
CREATE VIEW contact_history AS
SELECT
  c.id as contact_id,
  'reservation' as type,
  r.id as entity_id,
  r.created_at as date,
  CONCAT('Réservation ', e.nom, ' du ', DATE_FORMAT(r.date_debut, '%d/%m/%Y')) as description,
  r.montant_total as montant,
  r.statut as statut
FROM contacts c
LEFT JOIN reservations r ON c.id = r.contact_id
LEFT JOIN espaces e ON r.espace_id = e.id
WHERE r.id IS NOT NULL

UNION ALL

SELECT
  c.id as contact_id,
  'domiciliation' as type,
  d.id as entity_id,
  d.created_at as date,
  CONCAT('Domiciliation ', d.raison_sociale) as description,
  NULL as montant,
  d.statut as statut
FROM contacts c
LEFT JOIN domiciliations d ON c.id = d.contact_id
WHERE d.id IS NOT NULL

ORDER BY date DESC;
