/*
  # Fix documents_uploads and transactions_caisse schema

  1. Modified Tables
    - `documents_uploads`
      - Add `type_document` column (VARCHAR 100, default 'autre')
      - Add index on (user_id, type_document)
    - `transactions_caisse`
      - Extend `type_transaction` ENUM to include 'impression', 'boisson', 'remboursement'

  2. Important Notes
    - The documents upload API requires `type_document` but the column was missing
    - The caisse frontend offers transaction types not in the original ENUM
    - Safe migrations using IF NOT EXISTS / column checks
*/

-- Add type_document column to documents_uploads if missing
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'documents_uploads'
    AND COLUMN_NAME = 'type_document'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE documents_uploads ADD COLUMN type_document VARCHAR(100) DEFAULT \'autre\' AFTER chemin_fichier',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on (user_id, type_document) if not exists
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'documents_uploads'
    AND INDEX_NAME = 'idx_user_type'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE documents_uploads ADD INDEX idx_user_type (user_id, type_document)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Extend transactions_caisse type_transaction ENUM
ALTER TABLE transactions_caisse
  MODIFY COLUMN type_transaction ENUM('reservation', 'domiciliation', 'abonnement', 'autre', 'impression', 'boisson', 'remboursement') NOT NULL;
