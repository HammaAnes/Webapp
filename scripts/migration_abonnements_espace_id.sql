-- Migration: Associer un espace à un plan d'abonnement
-- Permet de créer automatiquement une réservation dans le calendrier
-- quand un abonnement est validé (ex: Open Space = occupation tout le mois)

ALTER TABLE abonnements
  ADD COLUMN espace_id VARCHAR(36) NULL
    COMMENT 'Espace couvert par cet abonnement (si NULL = pas de réservation calendrier)';

ALTER TABLE abonnements
  ADD CONSTRAINT fk_abonnements_espace
    FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE SET NULL;

-- Étendre l'ENUM type_reservation pour inclure 'abonnement'
ALTER TABLE reservations
  MODIFY COLUMN type_reservation
    ENUM('heure','demi_journee','jour','semaine','mois','abonnement')
    NOT NULL DEFAULT 'heure'
    COMMENT 'Type de période';
