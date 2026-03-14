/*
  # Align contacts table schema with PHP API and TypeScript types

  ## Summary
  The contacts table was created with different enum values than what the PHP backend
  API and TypeScript types use. This migration aligns the Supabase schema to match
  the actual application logic.

  ## Changes

  ### Modified Table: contacts
  1. Drop existing CHECK constraints on `source` and `statut`
  2. Add new CHECK constraints matching the PHP API enum values:
     - source: whatsapp, instagram, tiktok, fixe, mobile, physique, email, autre
     - statut: prospect, client, perdu
  3. Update default value for `statut` from 'nouveau' to 'prospect'
  4. Add missing `created_by` column (used by PHP API audit logging)
  5. Add missing `user_id` column for linked user (different from `converti_user_id`)
  6. Add `contact_id` to reservations and domiciliations tables

  ## Notes
  - The PHP API is the single API layer; Supabase is used for persistence
  - All contact operations go through PHP which enforces its own validation
  - This migration does NOT drop existing data
*/

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_source_check;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_statut_check;

ALTER TABLE contacts 
  ADD CONSTRAINT contacts_source_check 
  CHECK (source = ANY (ARRAY[
    'whatsapp'::text, 'instagram'::text, 'tiktok'::text, 
    'fixe'::text, 'mobile'::text, 'physique'::text, 
    'email'::text, 'autre'::text
  ]));

ALTER TABLE contacts 
  ADD CONSTRAINT contacts_statut_check 
  CHECK (statut = ANY (ARRAY['prospect'::text, 'client'::text, 'perdu'::text]));

ALTER TABLE contacts 
  ALTER COLUMN statut SET DEFAULT 'prospect';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE contacts ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE reservations ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domiciliations' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE domiciliations ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'commentaire_admin'
  ) THEN
    ALTER TABLE contacts ADD COLUMN commentaire_admin text;
  END IF;
END $$;
