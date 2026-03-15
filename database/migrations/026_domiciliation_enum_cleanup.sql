/*
  # Domiciliation enum cleanup

  ## Problem
  The `domiciliations.statut` ENUM contains legacy values `en_attente` and `validee`
  that are no longer used. The frontend adapter maps them to canonical values.

  ## Fix
  1. Migrate existing rows with legacy status values
  2. Modify the ENUM to remove legacy values

  ## Tables Modified
  - `domiciliations`: Migrate legacy statuses and update ENUM definition

  ## Mapping
  - `en_attente` -> `dossier_preparatoire`
  - `validee` -> `active`
  - `en_cours` -> `en_attente_signature` (if it exists as legacy)

  ## Notes
  - Data migration happens before ENUM modification
  - Safe to run if already migrated (UPDATE affects 0 rows)
*/

-- Step 1: Migrate legacy status values
UPDATE domiciliations SET statut = 'dossier_preparatoire' WHERE statut = 'en_attente';
UPDATE domiciliations SET statut = 'active' WHERE statut = 'validee';
UPDATE domiciliations SET statut = 'en_attente_signature' WHERE statut = 'en_cours';

-- Step 2: Modify ENUM to remove legacy values
ALTER TABLE domiciliations
  MODIFY COLUMN statut ENUM(
    'dossier_preparatoire',
    'en_attente_complements',
    'en_attente_signature',
    'domiciliation_creee',
    'active',
    'refusee',
    'expiree',
    'resiliee'
  ) NOT NULL DEFAULT 'dossier_preparatoire';
