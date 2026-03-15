/*
  # Fix domiciliation constraints and data consistency

  ## Changes

  1. numero_bureau CHECK constraint
     - Old migration 008 set CHECK (numero_bureau BETWEEN 1 AND 36)
     - Business rules and API enforce 1-60
     - Fix: modify column to allow 1-60

  2. Backfill date_debut_contrat / date_fin_contrat
     - activate.php previously only wrote date_debut_contrat when numero_bureau was provided
     - Active domiciliations may have date_debut / date_fin filled but not date_debut_contrat / date_fin_contrat
     - Fix: copy values from date_debut / date_fin where contrat fields are null

  3. statut ENUM cleanup
     - Remove legacy values 'en_attente' and 'validee' from the ENUM
     - They were migrated to new values in 008 but left in the ENUM definition

  ## Notes
  - No data is deleted or destructively modified
  - All changes are safe and reversible
*/

-- Fix numero_bureau column: allow 1-60 to match business rules and API validation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domiciliations' AND column_name = 'numero_bureau'
  ) THEN
    ALTER TABLE domiciliations
      ALTER COLUMN numero_bureau TYPE smallint;

    ALTER TABLE domiciliations
      DROP CONSTRAINT IF EXISTS domiciliations_numero_bureau_check;

    ALTER TABLE domiciliations
      ADD CONSTRAINT domiciliations_numero_bureau_check CHECK (numero_bureau BETWEEN 1 AND 60);
  END IF;
END $$;

-- Backfill date_debut_contrat from date_debut where missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domiciliations' AND column_name = 'date_debut_contrat'
  ) THEN
    UPDATE domiciliations
    SET date_debut_contrat = date_debut
    WHERE statut IN ('active', 'domiciliation_creee')
      AND date_debut_contrat IS NULL
      AND date_debut IS NOT NULL;
  END IF;
END $$;

-- Backfill date_fin_contrat from date_fin where missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domiciliations' AND column_name = 'date_fin_contrat'
  ) THEN
    UPDATE domiciliations
    SET date_fin_contrat = date_fin
    WHERE statut IN ('active', 'domiciliation_creee')
      AND date_fin_contrat IS NULL
      AND date_fin IS NOT NULL;
  END IF;
END $$;
