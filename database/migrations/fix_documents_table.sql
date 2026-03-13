-- =====================================================
-- Migration: Corriger la structure de la table documents
-- Date: 2026-03-13
-- Description: Ajouter les colonnes manquantes dans la table documents
-- =====================================================

-- Vérifier et ajouter la colonne created_at si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'documents'
    AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE documents ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER date_upload',
    'SELECT "Column created_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter la colonne type_document si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'documents'
    AND COLUMN_NAME = 'type_document'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE documents ADD COLUMN type_document VARCHAR(100) NOT NULL DEFAULT "autre" AFTER nom_fichier',
    'SELECT "Column type_document already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mise à jour des enregistrements existants pour remplir created_at depuis date_upload
UPDATE documents
SET created_at = date_upload
WHERE created_at IS NULL;

-- Afficher le résultat
SELECT
    'Migration terminée' AS status,
    COUNT(*) AS total_documents
FROM documents;

-- Afficher la structure finale
SHOW COLUMNS FROM documents;
