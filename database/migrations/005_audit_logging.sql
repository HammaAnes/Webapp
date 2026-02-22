/*
  # Système d'Audit Logging

  1. Nouvelle Table
    - `audit_logs` - Journalisation complète des actions

  2. Structure
    - id (UUID) - Identifiant unique
    - user_id (UUID) - Utilisateur qui a effectué l'action
    - action (VARCHAR) - Type d'action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
    - entity_type (VARCHAR) - Type d'entité (user, reservation, domiciliation, etc.)
    - entity_id (UUID) - ID de l'entité modifiée
    - old_values (JSON) - Valeurs avant modification
    - new_values (JSON) - Valeurs après modification
    - ip_address (VARCHAR) - Adresse IP de l'utilisateur
    - user_agent (TEXT) - User agent du navigateur
    - created_at (TIMESTAMP) - Date/heure de l'action

  3. Index
    - Index sur user_id pour recherche par utilisateur
    - Index sur entity_type et entity_id pour recherche par entité
    - Index sur action pour filtrage
    - Index sur created_at pour tri chronologique

  4. Cas d'Usage
    - Traçabilité complète des modifications
    - Investigation de problèmes
    - Conformité RGPD et audit
    - Détection d'activités suspectes
    - Analyse comportementale
*/

-- Création de la table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id CHAR(36) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id, created_at DESC),
    INDEX idx_audit_entity (entity_type, entity_id, created_at DESC),
    INDEX idx_audit_action (action, created_at DESC),
    INDEX idx_audit_created (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger pour logger automatiquement les modifications sur users
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS audit_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NOT (OLD.nom <=> NEW.nom AND OLD.prenom <=> NEW.prenom AND
            OLD.email <=> NEW.email AND OLD.telephone <=> NEW.telephone AND
            OLD.role <=> NEW.role AND OLD.statut <=> NEW.statut) THEN

        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, created_at)
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
            NOW()
        );
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS audit_users_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, created_at)
    VALUES (
        UUID(),
        OLD.id,
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
        NOW()
    );
END$$

DELIMITER ;

-- Nettoyage automatique des logs > 1 an (optionnel, à activer en cron)
-- DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
