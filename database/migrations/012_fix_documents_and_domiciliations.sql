-- =====================================================
-- Migration 012: Fix documents_uploads table and domiciliations alignment
--
-- 1. documents_uploads table
--    - Add `type_document` column (VARCHAR 50) for document categorization
--    - Add `status` column (ENUM) for admin validation workflow
--    - Add `created_at` column as alias for `uploaded_at` (code expects created_at)
--
-- 2. domiciliations table
--    - Add `commentaire_admin` column (TEXT) - frontend sends this field
--    - Add `mode_paiement` column (VARCHAR 50) - used in contract tab
--    - Add `date_validation` column (DATETIME) - used when validating dossier
--
-- 3. users table
--    - Ensure type_entreprise ENUM includes all values used by frontend
--
-- These changes fix the "0 documents" bug caused by:
--    - upload.php trying to INSERT into non-existent `type_document` column
--    - index.php trying to ORDER BY non-existent `created_at` column
-- =====================================================

-- 1. Fix documents_uploads table
ALTER TABLE documents_uploads
  ADD COLUMN IF NOT EXISTS type_document VARCHAR(50) NULL COMMENT 'Type de document (cni, rc, nif, etc.)' AFTER chemin_fichier;

ALTER TABLE documents_uploads
  ADD COLUMN IF NOT EXISTS status ENUM('en_attente', 'valide', 'rejete') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de validation du document' AFTER type_document;

ALTER TABLE documents_uploads
  ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de creation (alias uploaded_at)' AFTER status;

ALTER TABLE documents_uploads
  ADD INDEX IF NOT EXISTS idx_type_document (type_document);

ALTER TABLE documents_uploads
  ADD INDEX IF NOT EXISTS idx_status (status);

ALTER TABLE documents_uploads
  ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- Backfill created_at from uploaded_at for existing rows
UPDATE documents_uploads SET created_at = uploaded_at WHERE created_at IS NULL AND uploaded_at IS NOT NULL;

-- 2. Fix domiciliations table
ALTER TABLE domiciliations
  ADD COLUMN IF NOT EXISTS commentaire_admin TEXT NULL COMMENT 'Commentaire administratif' AFTER notes_admin;

ALTER TABLE domiciliations
  ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50) NULL COMMENT 'Mode de paiement (cash, virement, etc.)' AFTER montant_mensuel;

ALTER TABLE domiciliations
  ADD COLUMN IF NOT EXISTS date_validation DATETIME NULL COMMENT 'Date de validation du dossier' AFTER date_fin;

-- Copy existing notes_admin into commentaire_admin for existing rows
UPDATE domiciliations SET commentaire_admin = notes_admin WHERE commentaire_admin IS NULL AND notes_admin IS NOT NULL;

-- 3. Fix users.type_entreprise to include all values
ALTER TABLE users
  MODIFY COLUMN type_entreprise ENUM('auto_entrepreneur', 'eurl', 'sarl', 'spa', 'snc', 'scs', 'startup', 'freelance', 'autre') COMMENT 'Type juridique';
