-- =====================================================
-- MIGRATION: Password Resets Table
-- Date: 2026-01-23
-- Description: Table pour la réinitialisation des mots de passe
-- =====================================================

-- Créer la table password_resets si elle n'existe pas
CREATE TABLE IF NOT EXISTS password_resets (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du reset',
  user_id CHAR(36) NOT NULL COMMENT 'ID de l\'utilisateur',
  email VARCHAR(255) NOT NULL COMMENT 'Email de l\'utilisateur',
  token VARCHAR(255) NOT NULL COMMENT 'Token unique de réinitialisation',
  expires_at DATETIME NOT NULL COMMENT 'Date d\'expiration du token (1h)',
  used_at DATETIME COMMENT 'Date d\'utilisation du token',
  ip_address VARCHAR(45) COMMENT 'Adresse IP de la demande',
  user_agent TEXT COMMENT 'User agent de la requête',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',

  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_used_at (used_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens de réinitialisation de mot de passe';

-- Nettoyage automatique des tokens expirés (peut être appelé par un cron)
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS cleanup_expired_password_resets()
BEGIN
  DELETE FROM password_resets
  WHERE expires_at < NOW()
  OR used_at IS NOT NULL;
END$$

DELIMITER ;
