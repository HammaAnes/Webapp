/*
  # Reset complet de la base de données

  Suppression de toutes les tables dans l'ordre correct (respectant les FK).
  Utilisation de CASCADE pour gérer automatiquement les dépendances.
*/

DROP TABLE IF EXISTS utilisations_codes_promo CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS parrainages CASCADE;
DROP TABLE IF EXISTS courrier CASCADE;
DROP TABLE IF EXISTS documents_uploads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS domiciliations CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS abonnements_utilisateurs CASCADE;
DROP TABLE IF EXISTS abonnements CASCADE;
DROP TABLE IF EXISTS codes_promo CASCADE;
DROP TABLE IF EXISTS espaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
