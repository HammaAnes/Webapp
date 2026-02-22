/*
  # Walk-ins (Venues spontanees) - Table et vues

  1. Nouvelle table
    - `walk_ins`
      - `id` (CHAR(36), cle primaire UUID)
      - `nom` (VARCHAR(100), nom du visiteur)
      - `prenom` (VARCHAR(100), prenom du visiteur)
      - `telephone` (VARCHAR(20), numero de telephone)
      - `email` (VARCHAR(255), email optionnel)
      - `entreprise` (VARCHAR(200), nom d'entreprise optionnel)
      - `espace_id` (CHAR(36), espace utilise, FK vers espaces)
      - `heure_arrivee` (DATETIME, heure d'arrivee, defaut NOW)
      - `heure_depart` (DATETIME, heure de depart, NULL si encore present)
      - `duree_estimee` (INT, duree estimee en minutes)
      - `duree_reelle` (INT, duree reelle en minutes, calcule au checkout)
      - `montant` (DECIMAL(10,2), montant facture en DA)
      - `mode_paiement` (ENUM, mode: cash/carte/virement/cheque)
      - `statut_paiement` (ENUM, statut: en_attente/paye/gratuit)
      - `notes` (TEXT, notes ou observations)
      - `created_by` (CHAR(36), admin ayant enregistre le walk-in)
      - `created_at` / `updated_at` (timestamps)

  2. Vues
    - `walk_ins_details` : jointure avec espaces pour afficher le nom de l'espace
    - `walk_ins_daily_stats` : statistiques quotidiennes des walk-ins

  3. Index
    - Index sur heure_arrivee, heure_depart, statut_paiement, espace_id, created_at
    - Index composite pour les requetes frequentes (actifs, aujourd'hui)

  4. Notes
    - Les walk-ins ne sont pas lies a un compte utilisateur (visiteurs spontanes)
    - Seuls les admins peuvent gerer les walk-ins
    - La duree_reelle est calculee au moment du checkout
*/

CREATE TABLE IF NOT EXISTS walk_ins (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du walk-in',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom du visiteur',
  prenom VARCHAR(100) NOT NULL COMMENT 'Prenom du visiteur',
  telephone VARCHAR(20) DEFAULT '' COMMENT 'Telephone du visiteur',
  email VARCHAR(255) DEFAULT '' COMMENT 'Email du visiteur',
  entreprise VARCHAR(200) DEFAULT '' COMMENT 'Entreprise du visiteur',

  espace_id CHAR(36) NOT NULL COMMENT 'Espace utilise',

  heure_arrivee DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Heure d''arrivee',
  heure_depart DATETIME DEFAULT NULL COMMENT 'Heure de depart (NULL = encore present)',
  duree_estimee INT NOT NULL DEFAULT 120 COMMENT 'Duree estimee en minutes',
  duree_reelle INT DEFAULT NULL COMMENT 'Duree reelle en minutes (calcule au checkout)',

  montant DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Montant facture en DA',
  mode_paiement ENUM('cash', 'carte', 'virement', 'cheque') NOT NULL DEFAULT 'cash' COMMENT 'Mode de paiement',
  statut_paiement ENUM('en_attente', 'paye', 'gratuit') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut du paiement',

  notes TEXT DEFAULT NULL COMMENT 'Notes ou observations',
  created_by CHAR(36) DEFAULT NULL COMMENT 'Admin ayant enregistre le walk-in',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_heure_arrivee (heure_arrivee),
  INDEX idx_heure_depart (heure_depart),
  INDEX idx_statut_paiement (statut_paiement),
  INDEX idx_espace_id (espace_id),
  INDEX idx_created_at (created_at),
  INDEX idx_actifs (heure_depart, heure_arrivee),
  INDEX idx_today (heure_arrivee, statut_paiement),
  INDEX idx_nom_prenom (nom, prenom),
  INDEX idx_telephone (telephone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Venues spontanees (walk-ins) sans reservation';

DROP VIEW IF EXISTS walk_ins_details;

CREATE VIEW walk_ins_details AS
SELECT
  w.id,
  w.nom,
  w.prenom,
  w.telephone,
  w.email,
  w.entreprise,
  w.espace_id,
  e.nom AS espace_nom,
  e.type AS espace_type,
  e.prix_heure AS espace_prix_heure,
  w.heure_arrivee,
  w.heure_depart,
  w.duree_estimee,
  w.duree_reelle,
  w.montant,
  w.mode_paiement,
  w.statut_paiement,
  w.notes,
  w.created_by,
  w.created_at,
  w.updated_at,
  CASE
    WHEN w.heure_depart IS NULL THEN TIMESTAMPDIFF(MINUTE, w.heure_arrivee, NOW())
    ELSE COALESCE(w.duree_reelle, TIMESTAMPDIFF(MINUTE, w.heure_arrivee, w.heure_depart))
  END AS duree_calculee
FROM walk_ins w
INNER JOIN espaces e ON w.espace_id = e.id;

DROP VIEW IF EXISTS walk_ins_daily_stats;

CREATE VIEW walk_ins_daily_stats AS
SELECT
  DATE(heure_arrivee) AS jour,
  COUNT(*) AS total_walkins,
  SUM(CASE WHEN heure_depart IS NULL THEN 1 ELSE 0 END) AS actifs,
  SUM(CASE WHEN heure_depart IS NOT NULL THEN 1 ELSE 0 END) AS termines,
  SUM(montant) AS revenu_total,
  SUM(CASE WHEN statut_paiement = 'paye' THEN montant ELSE 0 END) AS revenu_encaisse,
  SUM(CASE WHEN statut_paiement = 'en_attente' THEN montant ELSE 0 END) AS revenu_en_attente,
  SUM(CASE WHEN statut_paiement = 'en_attente' THEN 1 ELSE 0 END) AS impayes,
  AVG(CASE WHEN duree_reelle IS NOT NULL THEN duree_reelle ELSE NULL END) AS duree_moyenne_min,
  AVG(montant) AS montant_moyen
FROM walk_ins
GROUP BY DATE(heure_arrivee);
