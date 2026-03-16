/*
  # Module Check-in / Check-out

  ## Tables créées
    - `checkins` : Enregistrement des arrivées et départs réels
      - id (UUID primary key)
      - reservation_id (lien vers reservations)
      - user_id (lien vers users)
      - heure_arrivee_reelle (datetime)
      - heure_depart_reel (datetime nullable)
      - statut (ENUM: present, absent, en_cours, parti)
      - note (texte libre)
      - enregistre_par (admin qui a fait le check-in)
      - created_at, updated_at

  ## Modifications de tables existantes
    - `reservations` :
      - Ajout colonne no_show (booléen, défaut 0)
      - Ajout colonne checkin_id (UUID nullable)

  ## Sécurité
    - Index sur reservation_id, user_id, statut pour performances
*/

-- Créer la table checkins
CREATE TABLE IF NOT EXISTS checkins (
    id CHAR(36) PRIMARY KEY,
    reservation_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    heure_arrivee_reelle DATETIME NOT NULL,
    heure_depart_reel DATETIME NULL,
    statut ENUM('present', 'absent', 'en_cours', 'parti') NOT NULL DEFAULT 'present',
    note TEXT,
    enregistre_par CHAR(36) NOT NULL COMMENT 'Admin qui a enregistré',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enregistre_par) REFERENCES users(id),
    INDEX idx_reservation_id (reservation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter colonnes à la table reservations si elles n'existent pas (MySQL compatible)
SET @dbname = DATABASE();

SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = 'reservations' AND column_name = 'no_show';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE reservations ADD COLUMN no_show TINYINT(1) DEFAULT 0, ADD INDEX idx_no_show (no_show)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = 'reservations' AND column_name = 'checkin_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE reservations ADD COLUMN checkin_id CHAR(36) NULL, ADD INDEX idx_checkin_id (checkin_id)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
