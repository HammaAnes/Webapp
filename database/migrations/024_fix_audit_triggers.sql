/*
  # Fix audit_logs triggers

  ## Problem
  Triggers `audit_users_update` et `audit_users_delete` peuvent référencer
  des colonnes absentes dans la table `audit_logs` déployée.

  ## Fix
  - Ajouter les colonnes manquantes dans audit_logs
  - Recréer les triggers avec les bons noms de colonnes

  ## Tables modifiées
  - `audit_logs` : ajout colonnes action, entity_type, entity_id, old_values, new_values

  ## IMPORTANT - Instructions d'exécution dans phpMyAdmin
  Exécuter les blocs ci-dessous UN PAR UN dans des onglets séparés de phpMyAdmin,
  ou via le CLI MySQL avec la commande : mysql -u user -p dbname < 024_fix_audit_triggers.sql

  Les triggers nécessitent une exécution séparée de chaque CREATE TRIGGER.
*/

-- Étape 1 : Ajouter les colonnes manquantes dans audit_logs
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS action VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS entity_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS old_values JSON NULL,
  ADD COLUMN IF NOT EXISTS new_values JSON NULL;

-- Étape 2 : Supprimer les anciens triggers
DROP TRIGGER IF EXISTS audit_users_update;
DROP TRIGGER IF EXISTS audit_users_delete;

-- Étape 3a : Créer le trigger de mise à jour
-- EXÉCUTER CE BLOC SEUL dans phpMyAdmin (coller uniquement ce qui suit jusqu'à END)
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
END;

-- Étape 3b : Créer le trigger de suppression
-- EXÉCUTER CE BLOC SEUL dans phpMyAdmin (coller uniquement ce qui suit jusqu'à END)
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
END;
