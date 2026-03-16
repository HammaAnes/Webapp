/*
  # Add missing columns to abonnements_utilisateurs

  1. Modified Tables
    - `abonnements_utilisateurs`
      - `commentaire` (TEXT) - user comment on subscription
      - `date_debut_souhaitee` (DATE) - desired start date
      - `entreprise` (VARCHAR 255) - company name

  2. Notes
    - These columns are referenced by the subscription API
    - All columns are nullable with no destructive changes
*/

-- Add commentaire column if not exists
SET @dbname = DATABASE();
SET @tablename = 'abonnements_utilisateurs';

SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'commentaire';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE abonnements_utilisateurs ADD COLUMN commentaire TEXT NULL',
    'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add date_debut_souhaitee column if not exists
SELECT COUNT(*) INTO @col_exists2
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'date_debut_souhaitee';

SET @query2 = IF(@col_exists2 = 0,
    'ALTER TABLE abonnements_utilisateurs ADD COLUMN date_debut_souhaitee DATE NULL',
    'SELECT 1');
PREPARE stmt2 FROM @query2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Add entreprise column if not exists
SELECT COUNT(*) INTO @col_exists3
FROM information_schema.columns
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'entreprise';

SET @query3 = IF(@col_exists3 = 0,
    'ALTER TABLE abonnements_utilisateurs ADD COLUMN entreprise VARCHAR(255) NULL',
    'SELECT 1');
PREPARE stmt3 FROM @query3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
