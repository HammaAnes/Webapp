-- =====================================================
-- Migration 003: Ajouter colonne rappel_envoye
-- Date: 2026-01-23
-- Description: Ajoute la colonne pour tracker les rappels envoyés
-- =====================================================

ALTER TABLE reservations
ADD COLUMN rappel_envoye TINYINT(1) DEFAULT 0 COMMENT 'Rappel email envoyé (0=non, 1=oui)'
AFTER participants;

-- Index pour optimiser les requêtes du cron job
CREATE INDEX idx_rappel_envoye ON reservations(rappel_envoye, date_debut, statut);

-- Note: Cette colonne permet au script send_reminders.php de ne pas envoyer
-- plusieurs fois le même rappel pour une réservation donnée.
