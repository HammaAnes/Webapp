/*
  # Module Gestion Courrier

  ## Tables créées
    - `courriers` : Gestion du courrier pour les entreprises domiciliées
      - id (UUID)
      - domiciliation_id (lien vers domiciliations)
      - type (ENUM: lettre, colis, recommande, officiel, autre)
      - expediteur (VARCHAR 255)
      - description (TEXT)
      - photo_url (TEXT) pour photo du courrier
      - statut (ENUM: recu, notifie, en_attente_instruction, recupere, scanne, reexpedier, traite)
      - instruction_client (ENUM: recuperer, scanner, reexpedier) - choix du client
      - scan_url (TEXT) si scan demandé
      - date_reception, date_notification, date_instruction, date_traitement
      - notes_admin (TEXT)
      - created_at, updated_at

  ## Sécurité
    - Index sur domiciliation_id et statut
*/

-- Créer la table courriers
CREATE TABLE IF NOT EXISTS courriers (
    id CHAR(36) PRIMARY KEY,
    domiciliation_id CHAR(36) NOT NULL,
    type ENUM('lettre', 'colis', 'recommande', 'officiel', 'autre') DEFAULT 'lettre',
    expediteur VARCHAR(255) DEFAULT '',
    description TEXT,
    photo_url TEXT NULL COMMENT 'Photo du courrier uploadée',
    statut ENUM('recu', 'notifie', 'en_attente_instruction', 'recupere', 'scanne', 'reexpedier', 'traite') DEFAULT 'recu',
    instruction_client ENUM('recuperer', 'scanner', 'reexpedier') NULL COMMENT 'Choix du client',
    scan_url TEXT NULL COMMENT 'URL du scan si demandé',
    date_reception DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_notification DATETIME NULL,
    date_instruction DATETIME NULL,
    date_traitement DATETIME NULL,
    notes_admin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE CASCADE,
    INDEX idx_domiciliation (domiciliation_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter colonne alerte_expiration_envoyee à domiciliations si elle n'existe pas (MySQL compatible)
SET @dbname = DATABASE();

SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = 'domiciliations' AND column_name = 'alerte_expiration_envoyee';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE domiciliations ADD COLUMN alerte_expiration_envoyee TINYINT(1) DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter colonne credits_restants à abonnements_utilisateurs si elle n'existe pas
SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = 'abonnements_utilisateurs' AND column_name = 'credits_restants';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE abonnements_utilisateurs ADD COLUMN credits_restants DECIMAL(10,2) DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
