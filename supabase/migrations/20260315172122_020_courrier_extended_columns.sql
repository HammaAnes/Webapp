/*
  # Add extended columns to courrier table

  ## Summary
  The courrier (mail management) system needs additional columns to support the
  full workflow of mail handling: scanning, re-shipping, client instructions,
  pick-up tracking, and dispatch tracking.

  The current courrier table only has basic columns (statut: recu/notifie/recupere/reexpedi).
  The admin workflow requires richer status tracking and instruction storage.

  ## New Columns
  - `scan_demande` (boolean) - Client requested a scan
  - `reexpedition_demandee` (boolean) - Client requested re-shipping  
  - `instruction_client` (text) - Free-text instruction from client
  - `date_instruction` (timestamptz) - When instruction was recorded
  - `date_recuperation` already exists - used for pick-up date

  ## Status Constraint Update
  Expanding the allowed statut values to support the full admin workflow:
  - recu: Mail received
  - notifie: Client notified
  - recupere: Client picked up mail
  - reexpedi: Mail re-shipped (existing)
  - en_attente_instruction: Waiting for client instructions

  ## Security
  No RLS changes - existing policies remain in effect.
*/

-- Add missing columns for extended courrier workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courrier' AND column_name = 'scan_demande'
  ) THEN
    ALTER TABLE courrier ADD COLUMN scan_demande boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courrier' AND column_name = 'reexpedition_demandee'
  ) THEN
    ALTER TABLE courrier ADD COLUMN reexpedition_demandee boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courrier' AND column_name = 'instruction_client'
  ) THEN
    ALTER TABLE courrier ADD COLUMN instruction_client text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courrier' AND column_name = 'date_instruction'
  ) THEN
    ALTER TABLE courrier ADD COLUMN date_instruction timestamptz;
  END IF;
END $$;

-- Expand statut constraint to support full workflow
ALTER TABLE courrier DROP CONSTRAINT IF EXISTS courrier_statut_check;
ALTER TABLE courrier ADD CONSTRAINT courrier_statut_check
  CHECK (statut = ANY (ARRAY[
    'recu'::text,
    'notifie'::text,
    'recupere'::text,
    'reexpedi'::text,
    'en_attente_instruction'::text
  ]));
