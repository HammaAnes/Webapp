/*
  # Ajout colonnes manquantes à la table abonnements

  1. Modifications
    - `credits_mensuels` (INT) — Nombre de crédits mensuels inclus dans le plan (ex: heures offertes)
    - `couleur` (VARCHAR) — Couleur d'affichage du plan dans l'interface (ex: #3B82F6)

  2. Notes
    - credits_mensuels défaut à 0 (pas de crédits inclus par défaut)
    - couleur défaut à chaine vide (pas de couleur spécifique par défaut)
    - Les colonnes sont optionnelles (NULL autorisé)
*/

ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS credits_mensuels INT DEFAULT 0 COMMENT 'Nombre de crédits mensuels inclus dans le plan',
  ADD COLUMN IF NOT EXISTS couleur VARCHAR(50) DEFAULT '' COMMENT 'Couleur affichage du plan (code hex)';
