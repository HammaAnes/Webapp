-- ============================================================
-- Migration 018 : Système email world-class
-- ============================================================
-- Résumé :
--   1. Table `email_logs`         — Trace chaque email envoyé (statut, erreur, metadata)
--   2. Table `email_queue`        — File d'attente asynchrone avec retry exponentiel
--   3. Table `email_preferences`  — Préférences de notifications par utilisateur
--      avec token de désabonnement unique
--
-- Tous les champs sensibles sont non nuls avec valeurs par défaut sûres.
-- Des index sont créés pour les requêtes admin fréquentes.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Logs d'envoi d'emails
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
    id            CHAR(36)     NOT NULL,
    user_id       CHAR(36)     NULL,
    type          VARCHAR(80)  NOT NULL DEFAULT '',
    recipient     VARCHAR(255) NOT NULL DEFAULT '',
    subject       VARCHAR(255) NOT NULL DEFAULT '',
    status        ENUM('sent','failed','bounced') NOT NULL DEFAULT 'sent',
    attempts      TINYINT UNSIGNED NOT NULL DEFAULT 1,
    error_message TEXT         NULL,
    metadata      JSON         NULL,
    sent_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email_logs_user_id  (user_id),
    INDEX idx_email_logs_type     (type),
    INDEX idx_email_logs_status   (status),
    INDEX idx_email_logs_sent_at  (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. File d'attente d'emails
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_queue (
    id              CHAR(36)     NOT NULL,
    user_id         CHAR(36)     NULL,
    type            VARCHAR(80)  NOT NULL DEFAULT '',
    to_email        VARCHAR(255) NOT NULL DEFAULT '',
    subject         VARCHAR(255) NOT NULL DEFAULT '',
    template        VARCHAR(80)  NOT NULL DEFAULT '',
    payload         JSON         NOT NULL,
    status          ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
    priority        TINYINT UNSIGNED NOT NULL DEFAULT 3,
    scheduled_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts    TINYINT UNSIGNED NOT NULL DEFAULT 3,
    last_attempt_at DATETIME     NULL,
    error_message   TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email_queue_status       (status),
    INDEX idx_email_queue_scheduled_at (scheduled_at),
    INDEX idx_email_queue_user_id      (user_id),
    INDEX idx_email_queue_type         (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. Préférences email par utilisateur
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_preferences (
    id                    CHAR(36)     NOT NULL,
    user_id               CHAR(36)     NOT NULL,
    email_transactionnel  TINYINT(1)   NOT NULL DEFAULT 1,
    email_rappels         TINYINT(1)   NOT NULL DEFAULT 1,
    email_marketing       TINYINT(1)   NOT NULL DEFAULT 1,
    email_systeme         TINYINT(1)   NOT NULL DEFAULT 1,
    unsubscribe_token     CHAR(64)     NOT NULL DEFAULT '',
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_email_preferences_user_id        (user_id),
    UNIQUE KEY uq_email_preferences_unsub_token    (unsubscribe_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
