/*
  # Performance indexes

  ## Summary
  Ajout des index manquants sur les colonnes fréquemment interrogées.

  ## New Indexes

  ### documents_uploads
  - `idx_entity`: (entity_type, entity_id) - récupérer les documents par entité
  - `idx_user_type`: (user_id, type_document) - vérifier les types de documents d'un user

  ### reservations
  - `idx_reservations_user_statut`: (user_id, statut) - listes de réservations par user
  - `idx_reservations_espace_dates`: (espace_id, date_debut, date_fin) - vérification disponibilité
  - `idx_reservations_statut_created`: (statut, created_at) - listes admin

  ### domiciliations
  - `idx_domiciliations_user`: (user_id, statut) - lookup domiciliation par user
  - `idx_domiciliations_statut`: (statut, created_at) - listes admin

  ### notifications
  - Pas d'ajout : l'index (user_id, lue, created_at) existe déjà dans le schéma initial

  ### users
  - `idx_users_statut`: (statut) - filtrage par statut
  - `idx_users_role`: (role, statut) - filtrage par rôle

  ## Notes
  - Utilise `ADD INDEX IF NOT EXISTS` (MariaDB 10.1+)
  - Les colonnes DESC dans les définitions d'index ne sont pas supportées en MariaDB < 10.8,
    ORDER BY reste géré par le moteur InnoDB
*/

-- documents_uploads indexes
ALTER TABLE documents_uploads
  ADD INDEX IF NOT EXISTS idx_entity (entity_type, entity_id),
  ADD INDEX IF NOT EXISTS idx_user_type (user_id, type_document);

-- reservations indexes
ALTER TABLE reservations
  ADD INDEX IF NOT EXISTS idx_reservations_user_statut (user_id, statut),
  ADD INDEX IF NOT EXISTS idx_reservations_espace_dates (espace_id, date_debut, date_fin),
  ADD INDEX IF NOT EXISTS idx_reservations_statut_created (statut, created_at);

-- domiciliations indexes
ALTER TABLE domiciliations
  ADD INDEX IF NOT EXISTS idx_domiciliations_user (user_id, statut),
  ADD INDEX IF NOT EXISTS idx_domiciliations_statut (statut, created_at);

-- users indexes
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_statut (statut),
  ADD INDEX IF NOT EXISTS idx_users_role (role, statut);
