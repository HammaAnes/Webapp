/*
  # Cleanup duplicate columns in codes_promo

  ## Problem
  Migration 009 added duplicate columns for PHP compatibility:
  - `type_reduction` (mirrors `type`)
  - `montant_minimum` (mirrors `montant_min`)
  - `date_expiration` (mirrors `date_fin`)

  All PHP code has now been updated to use canonical column names.

  ## Fix
  1. Ensure canonical columns have all data from alias columns
  2. Drop the alias columns
  3. Add performance indexes

  ## Tables Modified
  - `codes_promo`: Remove 3 duplicate columns

  ## Notes
  - Data is migrated from alias to canonical columns first
  - Safe to run if alias columns don't exist (DROP COLUMN IF EXISTS)
*/

-- Step 1: Migrate data from alias columns to canonical columns
UPDATE codes_promo SET type = COALESCE(type, type_reduction) WHERE type IS NULL AND type_reduction IS NOT NULL;
UPDATE codes_promo SET date_fin = COALESCE(date_fin, date_expiration) WHERE date_fin IS NULL AND date_expiration IS NOT NULL;
UPDATE codes_promo SET montant_min = COALESCE(montant_min, montant_minimum) WHERE montant_min IS NULL AND montant_minimum IS NOT NULL;

-- Step 2: Drop duplicate columns
ALTER TABLE codes_promo
  DROP COLUMN IF EXISTS type_reduction,
  DROP COLUMN IF EXISTS date_expiration,
  DROP COLUMN IF EXISTS montant_minimum;

-- Step 3: Add performance indexes
ALTER TABLE codes_promo ADD INDEX IF NOT EXISTS idx_codes_promo_actif (actif, date_fin);
ALTER TABLE codes_promo ADD INDEX IF NOT EXISTS idx_codes_promo_code (code);
