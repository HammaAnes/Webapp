/*
  # Add extra fields to abonnements_utilisateurs

  ## Summary
  Adds optional informational fields to the abonnements_utilisateurs table
  to store the data collected from the multi-step subscription form:
  - commentaire: free-text note from the user
  - date_debut_souhaitee: preferred start date
  - entreprise: company name override at subscription time
  - montant_paye and credits_restants: already added by migration 014

  ## Changes
  - abonnements_utilisateurs: adds commentaire, date_debut_souhaitee, entreprise columns (if not exist)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'abonnements_utilisateurs' AND column_name = 'commentaire'
  ) THEN
    ALTER TABLE abonnements_utilisateurs ADD COLUMN commentaire TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'abonnements_utilisateurs' AND column_name = 'date_debut_souhaitee'
  ) THEN
    ALTER TABLE abonnements_utilisateurs ADD COLUMN date_debut_souhaitee DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'abonnements_utilisateurs' AND column_name = 'entreprise'
  ) THEN
    ALTER TABLE abonnements_utilisateurs ADD COLUMN entreprise VARCHAR(255);
  END IF;
END $$;
