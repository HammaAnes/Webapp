/*
  # Fix codes_promo column names to match backend API

  1. Modifications
    - Add `type_reduction` column mirroring the `type` column value
    - Add `montant_minimum` column mirroring the `montant_min` column value
    - Add `date_expiration` column mirroring the `date_fin` column value
    - Sync existing data from old columns to new columns

  2. Notes
    - The PHP backend expects `type_reduction`, `montant_minimum`, and `date_expiration`
    - The schema had `type`, `montant_min`, and `date_fin` instead
    - Both old and new column names are kept for compatibility
*/

ALTER TABLE codes_promo
  ADD COLUMN IF NOT EXISTS type_reduction ENUM('pourcentage', 'montant_fixe') NOT NULL DEFAULT 'pourcentage' COMMENT 'Type de reduction (alias de type)' AFTER type,
  ADD COLUMN IF NOT EXISTS montant_minimum DECIMAL(10,2) DEFAULT 0 COMMENT 'Montant minimum requis (alias de montant_min)' AFTER montant_min,
  ADD COLUMN IF NOT EXISTS date_expiration DATETIME NULL COMMENT 'Date expiration (alias de date_fin)' AFTER date_fin;

UPDATE codes_promo SET type_reduction = type WHERE type_reduction != type OR type_reduction IS NULL;
UPDATE codes_promo SET montant_minimum = montant_min WHERE montant_minimum != montant_min OR montant_minimum IS NULL;
UPDATE codes_promo SET date_expiration = date_fin WHERE date_expiration != date_fin OR date_expiration IS NULL;
