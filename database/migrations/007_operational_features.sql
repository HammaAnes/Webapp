-- =====================================================
-- MIGRATION 007: FONCTIONNALITÉS OPÉRATIONNELLES CRITIQUES
-- Date: 2026-02-04
-- Description: Ajout de toutes les fonctionnalités manquantes pour la gestion quotidienne
--
-- NOUVELLES TABLES:
-- 1. check_ins: Gestion des arrivées/départs avec QR codes
-- 2. walk_ins: Venues spontanées sans réservation préalable
-- 3. blocages_espaces: Blocage d'espaces pour maintenance/événements
-- 4. courrier_domiciliation: Gestion du courrier pour les domiciliés
-- 5. prolongations: Historique des prolongations de réservations
-- 6. statistiques_espaces: Stats pré-calculées par espace
--
-- MODIFICATIONS:
-- - Ajout code_qr et no_show dans reservations
-- - Ajout champs paiement et prolongation
-- =====================================================

SET FOREIGN_KEY_CHECKS=0;

-- =====================================================
-- TABLE: check_ins
-- Gestion des présences réelles (arrivée/départ)
-- =====================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du check-in',
  reservation_id CHAR(36) NOT NULL COMMENT 'Réservation associée',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur concerné',
  espace_id CHAR(36) NOT NULL COMMENT 'Espace réservé',

  -- Horodatage
  heure_arrivee DATETIME NOT NULL COMMENT 'Heure réelle d\'arrivée',
  heure_depart DATETIME COMMENT 'Heure réelle de départ',

  -- Méthode de check-in
  methode_checkin ENUM('qr_code', 'manuel', 'automatique') NOT NULL DEFAULT 'manuel' COMMENT 'Méthode utilisée',
  methode_checkout ENUM('qr_code', 'manuel', 'automatique') COMMENT 'Méthode de checkout',

  -- Gestion
  checked_in_by CHAR(36) COMMENT 'Enregistré par (admin/user)',
  checked_out_by CHAR(36) COMMENT 'Départ enregistré par',
  notes TEXT COMMENT 'Notes sur la visite',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,

  INDEX idx_reservation_id (reservation_id),
  INDEX idx_user_id (user_id),
  INDEX idx_espace_id (espace_id),
  INDEX idx_heure_arrivee (heure_arrivee),
  INDEX idx_heure_depart (heure_depart),
  INDEX idx_espace_date (espace_id, heure_arrivee),

  UNIQUE KEY unique_checkin_reservation (reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Check-ins et check-outs des réservations';

-- =====================================================
-- TABLE: walk_ins
-- Venues spontanées sans réservation préalable
-- =====================================================
CREATE TABLE IF NOT EXISTS walk_ins (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du walk-in',

  -- Information visiteur
  nom VARCHAR(100) NOT NULL COMMENT 'Nom du visiteur',
  prenom VARCHAR(100) NOT NULL COMMENT 'Prénom du visiteur',
  telephone VARCHAR(20) COMMENT 'Téléphone',
  email VARCHAR(255) COMMENT 'Email optionnel',
  entreprise VARCHAR(200) COMMENT 'Entreprise',

  -- Espace et durée
  espace_id CHAR(36) NOT NULL COMMENT 'Espace utilisé',
  heure_arrivee DATETIME NOT NULL COMMENT 'Heure d\'arrivée',
  heure_depart DATETIME COMMENT 'Heure de départ',
  duree_estimee INT NOT NULL COMMENT 'Durée estimée en minutes',
  duree_reelle INT COMMENT 'Durée réelle en minutes',

  -- Paiement
  montant DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Montant payé',
  mode_paiement ENUM('cash', 'carte', 'virement', 'cheque') COMMENT 'Mode de paiement',
  statut_paiement ENUM('paye', 'en_attente', 'gratuit') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut du paiement',

  -- Gestion
  enregistre_par CHAR(36) NOT NULL COMMENT 'Admin ayant enregistré',
  converti_en_reservation CHAR(36) COMMENT 'ID réservation si convertie',
  notes TEXT COMMENT 'Notes et observations',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,
  FOREIGN KEY (enregistre_par) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (converti_en_reservation) REFERENCES reservations(id) ON DELETE SET NULL,

  INDEX idx_espace_id (espace_id),
  INDEX idx_heure_arrivee (heure_arrivee),
  INDEX idx_statut_paiement (statut_paiement),
  INDEX idx_telephone (telephone),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Venues spontanées sans réservation';

-- =====================================================
-- TABLE: blocages_espaces
-- Blocage d'espaces pour maintenance, événements privés, etc.
-- =====================================================
CREATE TABLE IF NOT EXISTS blocages_espaces (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du blocage',
  espace_id CHAR(36) NOT NULL COMMENT 'Espace bloqué',

  -- Période de blocage
  date_debut DATETIME NOT NULL COMMENT 'Début du blocage',
  date_fin DATETIME NOT NULL COMMENT 'Fin du blocage',

  -- Raison et type
  type ENUM('maintenance', 'reparation', 'nettoyage', 'event_prive', 'autre') NOT NULL COMMENT 'Type de blocage',
  raison TEXT NOT NULL COMMENT 'Raison détaillée',

  -- Gestion
  bloque_par CHAR(36) NOT NULL COMMENT 'Admin ayant créé le blocage',
  priorite ENUM('basse', 'normale', 'haute', 'urgente') NOT NULL DEFAULT 'normale' COMMENT 'Priorité',
  statut ENUM('planifie', 'en_cours', 'termine', 'annule') NOT NULL DEFAULT 'planifie' COMMENT 'Statut du blocage',

  notes TEXT COMMENT 'Notes additionnelles',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,
  FOREIGN KEY (bloque_par) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_espace_id (espace_id),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_statut (statut),
  INDEX idx_type (type),
  INDEX idx_espace_dates (espace_id, date_debut, date_fin),

  CONSTRAINT chk_dates_blocage CHECK (date_fin > date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Blocages d\'espaces pour maintenance et événements';

-- =====================================================
-- TABLE: courrier_domiciliation
-- Gestion du courrier pour les entreprises domiciliées
-- =====================================================
CREATE TABLE IF NOT EXISTS courrier_domiciliation (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID du courrier',
  domiciliation_id CHAR(36) NOT NULL COMMENT 'Domiciliation concernée',
  user_id CHAR(36) NOT NULL COMMENT 'Propriétaire de l\'entreprise',

  -- Informations du courrier
  date_reception DATETIME NOT NULL COMMENT 'Date de réception',
  expediteur VARCHAR(255) COMMENT 'Nom de l\'expéditeur',
  type_courrier ENUM('lettre', 'colis', 'recommande', 'administrative', 'judiciaire', 'autre') NOT NULL COMMENT 'Type de courrier',
  description TEXT COMMENT 'Description du courrier',

  -- Gestion du courrier
  statut ENUM('recu', 'notifie', 'retire', 'envoye', 'archive') NOT NULL DEFAULT 'recu' COMMENT 'Statut',
  date_notification DATETIME COMMENT 'Date de notification au client',
  date_retrait DATETIME COMMENT 'Date de retrait',
  retire_par VARCHAR(100) COMMENT 'Nom de la personne ayant retiré',
  signature_retrait TEXT COMMENT 'Signature numérique (base64)',

  -- Envoi postal
  date_envoi DATETIME COMMENT 'Date d\'envoi par poste',
  adresse_envoi TEXT COMMENT 'Adresse d\'envoi',
  numero_suivi VARCHAR(100) COMMENT 'Numéro de suivi postal',

  -- Photos et documents
  photos JSON COMMENT 'URLs des photos du courrier',

  -- Gestion
  enregistre_par CHAR(36) NOT NULL COMMENT 'Admin ayant enregistré',
  notes TEXT COMMENT 'Notes internes',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (domiciliation_id) REFERENCES domiciliations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enregistre_par) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_domiciliation_id (domiciliation_id),
  INDEX idx_user_id (user_id),
  INDEX idx_statut (statut),
  INDEX idx_date_reception (date_reception),
  INDEX idx_type_courrier (type_courrier),
  INDEX idx_domiciliation_statut (domiciliation_id, statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Gestion du courrier pour domiciliations';

-- =====================================================
-- TABLE: prolongations
-- Historique des prolongations de réservations
-- =====================================================
CREATE TABLE IF NOT EXISTS prolongations (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la prolongation',
  reservation_id CHAR(36) NOT NULL COMMENT 'Réservation prolongée',
  user_id CHAR(36) NOT NULL COMMENT 'Utilisateur',
  espace_id CHAR(36) NOT NULL COMMENT 'Espace',

  -- Dates
  date_fin_originale DATETIME NOT NULL COMMENT 'Date de fin avant prolongation',
  date_fin_nouvelle DATETIME NOT NULL COMMENT 'Nouvelle date de fin',
  duree_ajoutee INT NOT NULL COMMENT 'Durée ajoutée en minutes',

  -- Paiement
  montant_supplementaire DECIMAL(10,2) NOT NULL COMMENT 'Montant de la prolongation',
  mode_paiement VARCHAR(50) COMMENT 'Mode de paiement',
  statut_paiement ENUM('paye', 'en_attente', 'refuse') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut',

  -- Gestion
  demande_par ENUM('client', 'admin') NOT NULL DEFAULT 'client' COMMENT 'Demandeur',
  approuve_par CHAR(36) COMMENT 'Admin ayant approuvé',
  statut ENUM('demande', 'approuve', 'refuse', 'active') NOT NULL DEFAULT 'demande' COMMENT 'Statut',

  notes TEXT COMMENT 'Notes et raison',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,

  INDEX idx_reservation_id (reservation_id),
  INDEX idx_user_id (user_id),
  INDEX idx_statut (statut),
  INDEX idx_statut_paiement (statut_paiement),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Prolongations de réservations';

-- =====================================================
-- TABLE: statistiques_espaces
-- Statistiques pré-calculées par espace (mise à jour quotidienne)
-- =====================================================
CREATE TABLE IF NOT EXISTS statistiques_espaces (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la stat',
  espace_id CHAR(36) NOT NULL COMMENT 'Espace concerné',

  -- Période
  date DATE NOT NULL COMMENT 'Date des statistiques',
  annee INT NOT NULL COMMENT 'Année',
  mois INT NOT NULL COMMENT 'Mois',
  semaine INT NOT NULL COMMENT 'Semaine de l\'année',
  jour_semaine INT NOT NULL COMMENT 'Jour de la semaine (1=Lundi)',

  -- Occupations
  nb_reservations INT DEFAULT 0 COMMENT 'Nombre de réservations',
  nb_check_ins INT DEFAULT 0 COMMENT 'Nombre de présences réelles',
  nb_no_shows INT DEFAULT 0 COMMENT 'Nombre d\'absences',
  nb_walk_ins INT DEFAULT 0 COMMENT 'Nombre de walk-ins',
  nb_annulations INT DEFAULT 0 COMMENT 'Nombre d\'annulations',

  -- Durées (en minutes)
  duree_totale_reservee INT DEFAULT 0 COMMENT 'Durée totale réservée',
  duree_totale_utilisee INT DEFAULT 0 COMMENT 'Durée réellement utilisée',
  duree_disponible INT DEFAULT 0 COMMENT 'Durée disponible',

  -- Taux (en %)
  taux_occupation DECIMAL(5,2) DEFAULT 0 COMMENT 'Taux d\'occupation',
  taux_utilisation DECIMAL(5,2) DEFAULT 0 COMMENT 'Taux d\'utilisation réelle',
  taux_no_show DECIMAL(5,2) DEFAULT 0 COMMENT 'Taux de no-show',

  -- Financier
  revenus_total DECIMAL(10,2) DEFAULT 0 COMMENT 'Revenus totaux du jour',
  revenus_reservations DECIMAL(10,2) DEFAULT 0 COMMENT 'Revenus réservations',
  revenus_walk_ins DECIMAL(10,2) DEFAULT 0 COMMENT 'Revenus walk-ins',
  revenus_moyens DECIMAL(10,2) DEFAULT 0 COMMENT 'Revenus moyens par réservation',

  -- Pics d'affluence
  heure_pic VARCHAR(5) COMMENT 'Heure de pic (format HH:MM)',
  nb_participants_total INT DEFAULT 0 COMMENT 'Nombre total de participants',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE,

  INDEX idx_espace_id (espace_id),
  INDEX idx_date (date),
  INDEX idx_espace_date (espace_id, date),
  INDEX idx_annee_mois (annee, mois),
  INDEX idx_semaine (annee, semaine),

  UNIQUE KEY unique_espace_date (espace_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Statistiques pré-calculées par espace';

-- =====================================================
-- MODIFICATIONS DES TABLES EXISTANTES
-- =====================================================

-- Ajout de colonnes dans reservations pour QR code et no-show
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS code_qr VARCHAR(255) COMMENT 'Code QR unique pour check-in' AFTER notes,
  ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT FALSE COMMENT 'Absence non signalée' AFTER code_qr,
  ADD COLUMN IF NOT EXISTS check_in_status ENUM('non_arrive', 'present', 'parti', 'absent') DEFAULT 'non_arrive' COMMENT 'Statut de présence' AFTER no_show,
  ADD COLUMN IF NOT EXISTS duree_reelle INT COMMENT 'Durée réelle en minutes' AFTER check_in_status,
  ADD COLUMN IF NOT EXISTS prolongeable BOOLEAN DEFAULT TRUE COMMENT 'Peut être prolongée' AFTER duree_reelle,
  ADD COLUMN IF NOT EXISTS source ENUM('web', 'walk_in', 'admin', 'phone') DEFAULT 'web' COMMENT 'Source de la réservation' AFTER prolongeable;

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_code_qr ON reservations(code_qr);
CREATE INDEX IF NOT EXISTS idx_no_show ON reservations(no_show);
CREATE INDEX IF NOT EXISTS idx_check_in_status ON reservations(check_in_status);
CREATE INDEX IF NOT EXISTS idx_source ON reservations(source);

-- Ajout de colonnes dans espaces pour gestion avancée
ALTER TABLE espaces
  ADD COLUMN IF NOT EXISTS temps_preparation INT DEFAULT 15 COMMENT 'Temps de préparation entre réservations (minutes)' AFTER disponible,
  ADD COLUMN IF NOT EXISTS temps_nettoyage INT DEFAULT 15 COMMENT 'Temps de nettoyage après utilisation (minutes)' AFTER temps_preparation,
  ADD COLUMN IF NOT EXISTS accepte_walk_ins BOOLEAN DEFAULT TRUE COMMENT 'Accepte les venues spontanées' AFTER temps_nettoyage,
  ADD COLUMN IF NOT EXISTS heures_ouverture JSON COMMENT 'Heures d\'ouverture par jour' AFTER accepte_walk_ins,
  ADD COLUMN IF NOT EXISTS tarif_walk_in DECIMAL(10,2) COMMENT 'Tarif spécial walk-in (horaire)' AFTER heures_ouverture;

-- Ajout de colonnes dans users pour gestion no-shows
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nb_no_shows INT DEFAULT 0 COMMENT 'Nombre de no-shows' AFTER absences,
  ADD COLUMN IF NOT EXISTS nb_reservations_total INT DEFAULT 0 COMMENT 'Nombre total de réservations' AFTER nb_no_shows,
  ADD COLUMN IF NOT EXISTS taux_presence DECIMAL(5,2) DEFAULT 100 COMMENT 'Taux de présence (%)' AFTER nb_reservations_total;

CREATE INDEX IF NOT EXISTS idx_nb_no_shows ON users(nb_no_shows);
CREATE INDEX IF NOT EXISTS idx_taux_presence ON users(taux_presence);

-- =====================================================
-- VUES MATERIALISÉES (simulées avec tables)
-- =====================================================

-- Vue: Réservations du jour avec statut check-in
CREATE OR REPLACE VIEW v_reservations_aujourdhui AS
SELECT
  r.*,
  e.nom AS espace_nom,
  e.type AS espace_type,
  u.nom AS user_nom,
  u.prenom AS user_prenom,
  u.telephone AS user_telephone,
  ci.heure_arrivee AS checkin_heure,
  ci.heure_depart AS checkout_heure,
  CASE
    WHEN ci.heure_depart IS NOT NULL THEN 'parti'
    WHEN ci.heure_arrivee IS NOT NULL THEN 'present'
    WHEN r.date_debut < NOW() AND ci.id IS NULL THEN 'absent'
    ELSE 'non_arrive'
  END AS statut_presence
FROM reservations r
INNER JOIN espaces e ON r.espace_id = e.id
INNER JOIN users u ON r.user_id = u.id
LEFT JOIN check_ins ci ON r.id = ci.reservation_id
WHERE DATE(r.date_debut) = CURDATE()
  AND r.statut NOT IN ('annulee')
ORDER BY r.date_debut ASC;

-- Vue: Espaces disponibles en temps réel
CREATE OR REPLACE VIEW v_espaces_disponibles_maintenant AS
SELECT
  e.*,
  COUNT(DISTINCT r.id) AS reservations_actives,
  COUNT(DISTINCT ci.id) AS presences_actuelles,
  CASE
    WHEN COUNT(DISTINCT r.id) > 0 THEN FALSE
    WHEN b.id IS NOT NULL THEN FALSE
    ELSE TRUE
  END AS disponible_maintenant
FROM espaces e
LEFT JOIN reservations r ON e.id = r.espace_id
  AND r.statut IN ('confirmee', 'en_cours')
  AND NOW() BETWEEN r.date_debut AND r.date_fin
LEFT JOIN check_ins ci ON r.id = ci.reservation_id
  AND ci.heure_depart IS NULL
LEFT JOIN blocages_espaces b ON e.id = b.espace_id
  AND b.statut IN ('planifie', 'en_cours')
  AND NOW() BETWEEN b.date_debut AND b.date_fin
WHERE e.disponible = TRUE
GROUP BY e.id;

-- Vue: Walk-ins actifs
CREATE OR REPLACE VIEW v_walk_ins_actifs AS
SELECT
  w.*,
  e.nom AS espace_nom,
  e.type AS espace_type,
  u.nom AS admin_nom,
  u.prenom AS admin_prenom,
  TIMESTAMPDIFF(MINUTE, w.heure_arrivee, COALESCE(w.heure_depart, NOW())) AS duree_actuelle
FROM walk_ins w
INNER JOIN espaces e ON w.espace_id = e.id
INNER JOIN users u ON w.enregistre_par = u.id
WHERE w.heure_depart IS NULL
ORDER BY w.heure_arrivee DESC;

-- Vue: Statistiques du jour
CREATE OR REPLACE VIEW v_stats_jour AS
SELECT
  CURDATE() AS date_jour,
  COUNT(DISTINCT r.id) AS total_reservations,
  COUNT(DISTINCT ci.id) AS total_checkins,
  COUNT(DISTINCT CASE WHEN r.no_show = TRUE THEN r.id END) AS total_noshows,
  COUNT(DISTINCT w.id) AS total_walkins,
  SUM(DISTINCT r.montant_total) AS revenus_reservations,
  SUM(DISTINCT w.montant) AS revenus_walkins,
  COUNT(DISTINCT CASE WHEN ci.heure_depart IS NULL THEN ci.id END) AS presences_actuelles
FROM reservations r
LEFT JOIN check_ins ci ON r.id = ci.reservation_id
LEFT JOIN walk_ins w ON DATE(w.heure_arrivee) = CURDATE()
WHERE DATE(r.date_debut) = CURDATE();

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- FIN DE LA MIGRATION 007
-- =====================================================
