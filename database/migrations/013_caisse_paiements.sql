/*
  # Module Caisse & Paiement

  ## Tables créées
    - `transactions_caisse` : Enregistrement de toutes les transactions financières
      - id (UUID)
      - reservation_id, domiciliation_id, abonnement_utilisateur_id (nullable, selon type)
      - type_transaction (ENUM: reservation, domiciliation, abonnement, autre)
      - montant (DECIMAL 10,2)
      - mode_paiement (ENUM: cash, virement, cheque, tpe, credit)
      - reference_paiement (numéro chèque, réf virement, etc.)
      - numero_recu (format REC-AAAA-XXXX)
      - statut (ENUM: encaisse, en_attente, annule, rembourse)
      - encaisse_par (admin)
      - cloture_id (lien vers clôture journalière)
      - notes
      - created_at, updated_at

    - `clotures_caisse` : Clôtures journalières
      - id (UUID)
      - date_cloture (DATE unique)
      - total_cash, total_virement, total_cheque, total_tpe (DECIMAL)
      - total_general (DECIMAL)
      - nombre_transactions (INT)
      - cloture_par (admin)
      - notes
      - created_at

  ## Sécurité
    - Index sur type_transaction, mode_paiement, statut, created_at, cloture_id
*/

-- Créer la table transactions_caisse
CREATE TABLE IF NOT EXISTS transactions_caisse (
    id CHAR(36) PRIMARY KEY,
    reservation_id CHAR(36) NULL,
    domiciliation_id CHAR(36) NULL,
    abonnement_utilisateur_id CHAR(36) NULL,
    type_transaction ENUM('reservation', 'domiciliation', 'abonnement', 'autre') NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    mode_paiement ENUM('cash', 'virement', 'cheque', 'tpe', 'credit') NOT NULL,
    reference_paiement VARCHAR(100) NULL COMMENT 'Num chèque, réf virement...',
    numero_recu VARCHAR(50) NOT NULL COMMENT 'REC-2026-0001',
    statut ENUM('encaisse', 'en_attente', 'annule', 'rembourse') NOT NULL DEFAULT 'encaisse',
    encaisse_par CHAR(36) NOT NULL COMMENT 'Admin qui a encaissé',
    cloture_id CHAR(36) NULL COMMENT 'Lien vers clôture journalière',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (encaisse_par) REFERENCES users(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE SET NULL,
    INDEX idx_type (type_transaction),
    INDEX idx_mode (mode_paiement),
    INDEX idx_statut (statut),
    INDEX idx_date (created_at),
    INDEX idx_cloture (cloture_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer la table clotures_caisse
CREATE TABLE IF NOT EXISTS clotures_caisse (
    id CHAR(36) PRIMARY KEY,
    date_cloture DATE NOT NULL UNIQUE,
    total_cash DECIMAL(10,2) DEFAULT 0,
    total_virement DECIMAL(10,2) DEFAULT 0,
    total_cheque DECIMAL(10,2) DEFAULT 0,
    total_tpe DECIMAL(10,2) DEFAULT 0,
    total_general DECIMAL(10,2) DEFAULT 0,
    nombre_transactions INT DEFAULT 0,
    cloture_par CHAR(36) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cloture_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
