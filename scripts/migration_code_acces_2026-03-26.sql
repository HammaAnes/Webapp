-- Migration: ajout du code d'accès serrure sur les souscriptions
-- Date: 2026-03-26

ALTER TABLE abonnements_utilisateurs
  ADD COLUMN code_acces VARCHAR(10) NULL COMMENT 'Code serrure Tuya (7 chiffres + #)' AFTER commentaire;
