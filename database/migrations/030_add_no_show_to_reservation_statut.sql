/*
  # Add no_show to reservation statut ENUM

  1. Changes
    - ALTER `reservations.statut` ENUM to include 'no_show' value
    - Both the frontend and API already use 'no_show' as a valid statut
    - The existing `no_show` boolean column is kept for backward compatibility

  2. Reason
    - The API (reservations/update.php) treats 'no_show' as a valid statut transition
    - The frontend displays and filters by 'no_show' statut
    - Without this, UPDATE queries setting statut='no_show' fail with ENUM validation error
*/

ALTER TABLE reservations
  MODIFY COLUMN statut ENUM('confirmee', 'en_attente', 'en_cours', 'annulee', 'terminee', 'no_show')
  NOT NULL DEFAULT 'en_attente'
  COMMENT 'Statut de la reservation';
