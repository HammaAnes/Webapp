-- Migration: 008_domiciliation_workflow.sql
-- Description: Complete overhaul of domiciliation workflow per new specifications
-- Adds new fields for situation administrative, type structure, notary contract, bureau number, and CGU

-- Add new columns for situation and type
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS situation_administrative ENUM('en_cours_creation', 'deja_creee') NOT NULL DEFAULT 'deja_creee' AFTER user_id,
ADD COLUMN IF NOT EXISTS type_structure ENUM('societe', 'auto_entrepreneur') NOT NULL DEFAULT 'societe' AFTER situation_administrative;

-- Add columns for auto-entrepreneur specific fields
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS numero_auto_entrepreneur VARCHAR(50) NULL AFTER article_imposition,
ADD COLUMN IF NOT EXISTS date_inscription_auto_entrepreneur DATE NULL AFTER numero_auto_entrepreneur;

-- Add columns for detailed company info
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS code_nae VARCHAR(20) NULL AFTER article_imposition,
ADD COLUMN IF NOT EXISTS activite_exercee VARCHAR(255) NULL AFTER code_nae,
ADD COLUMN IF NOT EXISTS description_activite TEXT NULL AFTER activite_exercee,
ADD COLUMN IF NOT EXISTS ville_immatriculation VARCHAR(100) NULL AFTER date_creation_entreprise;

-- Add columns for representative details
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS representant_adresse_residence VARCHAR(500) NULL AFTER representant_email,
ADD COLUMN IF NOT EXISTS representant_ville VARCHAR(100) NULL AFTER representant_adresse_residence;

-- Add columns for notary contract (Step 6 in the prompt)
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS numero_bureau TINYINT UNSIGNED NULL CHECK (numero_bureau BETWEEN 1 AND 60) AFTER capital,
ADD COLUMN IF NOT EXISTS reference_contrat_notarie VARCHAR(100) NULL AFTER numero_bureau,
ADD COLUMN IF NOT EXISTS date_debut_contrat DATE NULL AFTER reference_contrat_notarie,
ADD COLUMN IF NOT EXISTS date_fin_contrat DATE NULL AFTER date_debut_contrat;

-- Add columns for domiciliation options (Step 8 in the prompt)
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS options JSON NULL AFTER date_fin_contrat;

-- Add columns for CGU acceptance
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS cgu_acceptees TINYINT(1) NOT NULL DEFAULT 0 AFTER options,
ADD COLUMN IF NOT EXISTS date_cgu_acceptation DATETIME NULL AFTER cgu_acceptees;

-- Add column for desired start date
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS date_debut_souhaitee DATE NULL AFTER date_cgu_acceptation;

-- Update statut column to include new workflow statuses
ALTER TABLE domiciliations
MODIFY COLUMN statut ENUM(
  'dossier_preparatoire',
  'en_attente_signature',
  'domiciliation_creee',
  'en_attente_complements',
  'active',
  'refusee',
  'expiree',
  'resiliee',
  'en_attente',
  'validee'
) NOT NULL DEFAULT 'dossier_preparatoire';

-- Migrate old statuses to new ones
UPDATE domiciliations SET statut = 'dossier_preparatoire' WHERE statut = 'en_attente';
UPDATE domiciliations SET statut = 'active' WHERE statut = 'validee';

-- Add index for bureau number to ensure uniqueness per active period
CREATE INDEX IF NOT EXISTS idx_domiciliations_numero_bureau ON domiciliations(numero_bureau, statut);

-- Add index for situation and type for filtering
CREATE INDEX IF NOT EXISTS idx_domiciliations_situation_type ON domiciliations(situation_administrative, type_structure);

-- Add index for CGU acceptance date
CREATE INDEX IF NOT EXISTS idx_domiciliations_cgu ON domiciliations(cgu_acceptees, date_cgu_acceptation);
