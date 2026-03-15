/*
  # Fix audit_logs triggers

  ## Problem
  Triggers `audit_users_update` and `audit_users_delete` reference columns
  that may not exist in the deployed `audit_logs` table.

  ## Fix
  - Add missing columns to audit_logs if they don't exist
  - Recreate triggers using correct column names

  ## Tables Modified
  - `audit_logs`: Ensure all needed columns exist (action, entity_type, entity_id, old_values, new_values)

  ## Notes
  - Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards)
  - Uses NULL for ip_address in triggers (not available in trigger context)
*/

-- Ensure all required columns exist in audit_logs
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS action VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS entity_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS old_values JSON NULL,
  ADD COLUMN IF NOT EXISTS new_values JSON NULL;

-- Drop existing triggers to recreate cleanly
DROP TRIGGER IF EXISTS audit_users_update;
DROP TRIGGER IF EXISTS audit_users_delete;

DELIMITER $$

CREATE TRIGGER audit_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NOT (OLD.nom <=> NEW.nom AND OLD.prenom <=> NEW.prenom AND
            OLD.email <=> NEW.email AND OLD.telephone <=> NEW.telephone AND
            OLD.role <=> NEW.role AND OLD.statut <=> NEW.statut) THEN
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at)
        VALUES (
            UUID(),
            NEW.id,
            'UPDATE',
            'user',
            NEW.id,
            JSON_OBJECT(
                'nom', OLD.nom,
                'prenom', OLD.prenom,
                'email', OLD.email,
                'telephone', OLD.telephone,
                'role', OLD.role,
                'statut', OLD.statut
            ),
            JSON_OBJECT(
                'nom', NEW.nom,
                'prenom', NEW.prenom,
                'email', NEW.email,
                'telephone', NEW.telephone,
                'role', NEW.role,
                'statut', NEW.statut
            ),
            NULL,
            NOW()
        );
    END IF;
END$$

CREATE TRIGGER audit_users_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, ip_address, created_at)
    VALUES (
        UUID(),
        NULL,
        'DELETE',
        'user',
        OLD.id,
        JSON_OBJECT(
            'nom', OLD.nom,
            'prenom', OLD.prenom,
            'email', OLD.email,
            'role', OLD.role,
            'statut', OLD.statut
        ),
        NULL,
        NOW()
    );
END$$

DELIMITER ;
