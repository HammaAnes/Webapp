-- Migration: Ajout colonne commentaire_rejet à documents_uploads
-- Date: 2026-03-26
-- Raison: Le champ commentaire_rejet était utilisé côté front/back mais absent de la table

ALTER TABLE documents_uploads
  ADD COLUMN commentaire_rejet TEXT DEFAULT NULL
    COMMENT 'Motif de rejet saisi par l''admin'
  AFTER status;
