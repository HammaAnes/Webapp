/*
  # Performance indexes

  ## Summary
  Add missing indexes for frequently queried columns across all main tables.

  ## New Indexes

  ### documents_uploads
  - `idx_entity`: (entity_type, entity_id) - for fetching documents by entity
  - `idx_user_type`: (user_id, type_document) - for checking user document types
  - `idx_documents_created`: (created_at DESC) - for sorting

  ### reservations
  - `idx_reservations_user_statut`: (user_id, statut) - for user reservation lists
  - `idx_reservations_espace_dates`: (espace_id, date_debut, date_fin) - for availability checks
  - `idx_reservations_statut_created`: (statut, created_at) - for admin lists

  ### domiciliations
  - `idx_domiciliations_user`: (user_id, statut) - for user domiciliation lookup
  - `idx_domiciliations_statut`: (statut, created_at) - for admin lists

  ### notifications
  - `idx_notifications_user_read`: (user_id, lu, created_at) - for unread count

  ## Notes
  - All use `ADD INDEX IF NOT EXISTS` for safety
*/

-- documents_uploads indexes
ALTER TABLE documents_uploads
  ADD INDEX IF NOT EXISTS idx_entity (entity_type, entity_id),
  ADD INDEX IF NOT EXISTS idx_user_type (user_id, type_document),
  ADD INDEX IF NOT EXISTS idx_documents_created (created_at DESC);

-- reservations indexes
ALTER TABLE reservations
  ADD INDEX IF NOT EXISTS idx_reservations_user_statut (user_id, statut),
  ADD INDEX IF NOT EXISTS idx_reservations_espace_dates (espace_id, date_debut, date_fin),
  ADD INDEX IF NOT EXISTS idx_reservations_statut_created (statut, created_at DESC);

-- domiciliations indexes
ALTER TABLE domiciliations
  ADD INDEX IF NOT EXISTS idx_domiciliations_user (user_id, statut),
  ADD INDEX IF NOT EXISTS idx_domiciliations_statut (statut, created_at DESC);

-- notifications indexes
ALTER TABLE notifications
  ADD INDEX IF NOT EXISTS idx_notifications_user_read (user_id, lu, created_at DESC);

-- users indexes
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_statut (statut, created_at DESC),
  ADD INDEX IF NOT EXISTS idx_users_role (role, statut);
