/*
  # Coffice Complete Schema — Clean Consolidated Migration

  ## Purpose
  Creates all Coffice tables with correct constraints, indexes, and RLS.
  Safe to run multiple times (IF NOT EXISTS everywhere).

  ## Tables
  1. users, 2. password_resets, 3. espaces, 4. abonnements,
  5. abonnements_utilisateurs, 6. codes_promo, 7. transactions,
  8. utilisations_codes_promo, 9. parrainages, 10. parrainages_details,
  11. contacts, 12. domiciliations, 13. reservations, 14. courriers,
  15. documents, 16. notifications, 17. checkins,
  18. transactions_caisse, 19. clotures_caisse,
  20. email_logs, 21. system_settings, 22. activites
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                       text UNIQUE NOT NULL,
  password_hash               text,
  nom                         text NOT NULL DEFAULT '',
  prenom                      text NOT NULL DEFAULT '',
  telephone                   text,
  profession                  text,
  entreprise                  text,
  bio                         text,
  avatar_url                  text,
  role                        text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  statut                      text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','inactif','suspendu')),
  google_id                   text UNIQUE,
  email_verified              boolean NOT NULL DEFAULT false,
  code_parrainage             text UNIQUE,
  credit                      numeric(10,2) NOT NULL DEFAULT 0,
  type_entreprise             text,
  numero_rc                   text,
  nif                         text,
  nis                         text,
  adresse_entreprise          text,
  wilaya                      text,
  commune                     text,
  activite                    text,
  date_creation_entreprise    date,
  carte_identite_url          text,
  notif_email                 boolean NOT NULL DEFAULT true,
  notif_reservation           boolean NOT NULL DEFAULT true,
  notif_domiciliation         boolean NOT NULL DEFAULT true,
  derniere_connexion          timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_code_parrainage ON users(code_parrainage) WHERE code_parrainage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_statut ON users(statut);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. PASSWORD_RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  token       text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pwreset_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_pwreset_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_pwreset_expires_at ON password_resets(expires_at);

-- ============================================================
-- 3. ESPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS espaces (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                 text NOT NULL,
  type                text NOT NULL DEFAULT 'bureau' CHECK (type IN ('open_space','bureau_prive','salle_reunion','booth_telephonique')),
  description         text,
  capacite            integer NOT NULL DEFAULT 1,
  superficie          numeric(8,2),
  etage               integer,
  numero              text,
  equipements         jsonb DEFAULT '[]'::jsonb,
  images              jsonb DEFAULT '[]'::jsonb,
  prix_heure          numeric(10,2) NOT NULL DEFAULT 0,
  prix_demi_journee   numeric(10,2) NOT NULL DEFAULT 0,
  prix_jour           numeric(10,2) NOT NULL DEFAULT 0,
  prix_semaine        numeric(10,2) NOT NULL DEFAULT 0,
  prix_mois           numeric(10,2) NOT NULL DEFAULT 0,
  actif               boolean NOT NULL DEFAULT true,
  disponible          boolean NOT NULL DEFAULT true,
  ordre               integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE espaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active espaces" ON espaces;
CREATE POLICY "Anyone can view active espaces"
  ON espaces FOR SELECT USING (actif = true);

CREATE INDEX IF NOT EXISTS idx_espaces_type ON espaces(type);
CREATE INDEX IF NOT EXISTS idx_espaces_actif ON espaces(actif);

DROP TRIGGER IF EXISTS trg_espaces_updated_at ON espaces;
CREATE TRIGGER trg_espaces_updated_at BEFORE UPDATE ON espaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. ABONNEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS abonnements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  description text,
  prix        numeric(10,2) NOT NULL DEFAULT 0,
  duree_mois  integer NOT NULL DEFAULT 1,
  avantages   jsonb DEFAULT '[]'::jsonb,
  actif       boolean NOT NULL DEFAULT true,
  ordre       integer NOT NULL DEFAULT 0,
  couleur     text DEFAULT '#000000',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE abonnements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active abonnements" ON abonnements;
CREATE POLICY "Anyone can view active abonnements"
  ON abonnements FOR SELECT USING (actif = true);

CREATE INDEX IF NOT EXISTS idx_abonnements_actif ON abonnements(actif);

DROP TRIGGER IF EXISTS trg_abonnements_updated_at ON abonnements;
CREATE TRIGGER trg_abonnements_updated_at BEFORE UPDATE ON abonnements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ABONNEMENTS_UTILISATEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS abonnements_utilisateurs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  abonnement_id         uuid NOT NULL REFERENCES abonnements(id) ON DELETE RESTRICT,
  date_debut            date NOT NULL,
  date_fin              date NOT NULL,
  statut                text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','actif','expire','annule','suspendu')),
  auto_renouvellement   boolean NOT NULL DEFAULT false,
  commentaire           text,
  date_debut_souhaitee  date,
  entreprise            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE abonnements_utilisateurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON abonnements_utilisateurs;
CREATE POLICY "Users can view own subscriptions"
  ON abonnements_utilisateurs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON abonnements_utilisateurs;
CREATE POLICY "Users can insert own subscriptions"
  ON abonnements_utilisateurs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_abo_util_user_id ON abonnements_utilisateurs(user_id);
CREATE INDEX IF NOT EXISTS idx_abo_util_statut ON abonnements_utilisateurs(statut);
CREATE INDEX IF NOT EXISTS idx_abo_util_date_fin ON abonnements_utilisateurs(date_fin);

DROP TRIGGER IF EXISTS trg_abo_util_updated_at ON abonnements_utilisateurs;
CREATE TRIGGER trg_abo_util_updated_at BEFORE UPDATE ON abonnements_utilisateurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. CODES_PROMO
-- ============================================================
CREATE TABLE IF NOT EXISTS codes_promo (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    text UNIQUE NOT NULL,
  type_remise             text NOT NULL DEFAULT 'pourcentage' CHECK (type_remise IN ('pourcentage','montant_fixe')),
  valeur_remise           numeric(10,2) NOT NULL DEFAULT 0,
  description             text,
  date_debut              date,
  date_fin                date,
  utilisations_max        integer,
  utilisations_actuelles  integer NOT NULL DEFAULT 0,
  actif                   boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE codes_promo ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_codes_promo_code ON codes_promo(code);
CREATE INDEX IF NOT EXISTS idx_codes_promo_actif ON codes_promo(actif);

DROP TRIGGER IF EXISTS trg_codes_promo_updated_at ON codes_promo;
CREATE TRIGGER trg_codes_promo_updated_at BEFORE UPDATE ON codes_promo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  type            text NOT NULL CHECK (type IN ('reservation','abonnement','domiciliation','credit','remboursement','autre')),
  montant         numeric(10,2) NOT NULL DEFAULT 0,
  statut          text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','completee','echouee','remboursee','annulee')),
  mode_paiement   text DEFAULT 'cash',
  reference       text,
  description     text,
  date_paiement   timestamptz,
  entity_type     text,
  entity_id       uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_statut ON transactions(statut);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date_paiement);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  prenom      text,
  email       text,
  telephone   text,
  entreprise  text,
  poste       text,
  source      text DEFAULT 'manuel',
  statut      text NOT NULL DEFAULT 'prospect' CHECK (statut IN ('prospect','client','inactif','bloque')),
  notes       text,
  tags        jsonb DEFAULT '[]'::jsonb,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_statut ON contacts(statut);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. PARRAINAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS parrainages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_id            uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_parrain          text UNIQUE NOT NULL,
  parraines             integer NOT NULL DEFAULT 0,
  recompenses_totales   numeric(10,2) NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parrainages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own parrainage" ON parrainages;
CREATE POLICY "Users can view own parrainage"
  ON parrainages FOR SELECT TO authenticated
  USING (auth.uid() = parrain_id);

CREATE INDEX IF NOT EXISTS idx_parrainages_parrain_id ON parrainages(parrain_id);
CREATE INDEX IF NOT EXISTS idx_parrainages_code ON parrainages(code_parrain);

DROP TRIGGER IF EXISTS trg_parrainages_updated_at ON parrainages;
CREATE TRIGGER trg_parrainages_updated_at BEFORE UPDATE ON parrainages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. PARRAINAGES_DETAILS
-- ============================================================
CREATE TABLE IF NOT EXISTS parrainages_details (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parrainage_id   uuid NOT NULL REFERENCES parrainages(id) ON DELETE CASCADE,
  filleul_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  statut          text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','rejete')),
  recompense      numeric(10,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parrainages_details ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_parr_details_id ON parrainages_details(parrainage_id);

DROP TRIGGER IF EXISTS trg_parr_details_updated_at ON parrainages_details;
CREATE TRIGGER trg_parr_details_updated_at BEFORE UPDATE ON parrainages_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. DOMICILIATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS domiciliations (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         uuid REFERENCES users(id) ON DELETE SET NULL,
  contact_id                      uuid REFERENCES contacts(id) ON DELETE SET NULL,
  situation_administrative        text DEFAULT 'deja_creee',
  type_structure                  text DEFAULT 'societe',
  raison_sociale                  text,
  forme_juridique                 text,
  capital                         numeric(15,2),
  activite_principale             text,
  domaine_activite                text,
  activite_exercee                text,
  description_activite            text,
  nif                             text,
  nis                             text,
  registre_commerce               text,
  article_imposition              text,
  numero_auto_entrepreneur        text,
  code_nae                        text,
  wilaya                          text,
  commune                         text,
  adresse_actuelle                text,
  adresse_siege_social            text,
  representant_nom                text,
  representant_prenom             text,
  representant_fonction           text,
  representant_telephone          text,
  representant_email              text,
  representant_adresse_residence  text,
  representant_ville              text,
  date_creation_entreprise        date,
  ville_immatriculation           text,
  numero_bureau                   integer CHECK (numero_bureau BETWEEN 1 AND 60),
  reference_contrat_notarie       text,
  date_debut_contrat              date,
  date_fin_contrat                date,
  date_debut_souhaitee            date,
  date_debut                      date,
  date_fin                        date,
  options                         jsonb DEFAULT '{}'::jsonb,
  montant_mensuel                 numeric(10,2),
  cgu_acceptees                   boolean NOT NULL DEFAULT false,
  date_cgu_acceptation            timestamptz,
  statut                          text NOT NULL DEFAULT 'dossier_preparatoire' CHECK (
    statut IN (
      'dossier_preparatoire','en_attente_complements','en_attente_signature',
      'domiciliation_creee','active','refusee','expiree','resiliee'
    )
  ),
  date_validation                 timestamptz,
  date_activation                 timestamptz,
  date_expiration                 timestamptz,
  notes_admin                     text,
  commentaire_admin               text,
  motif_refus                     text,
  complements_demandes            text,
  visible_sur_site                boolean NOT NULL DEFAULT false,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE domiciliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own domiciliations" ON domiciliations;
CREATE POLICY "Users can view own domiciliations"
  ON domiciliations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own domiciliations" ON domiciliations;
CREATE POLICY "Users can insert own domiciliations"
  ON domiciliations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own domiciliations" ON domiciliations;
CREATE POLICY "Users can update own domiciliations"
  ON domiciliations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_domiciliations_user_id ON domiciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_domiciliations_statut ON domiciliations(statut);
CREATE INDEX IF NOT EXISTS idx_domiciliations_nif ON domiciliations(nif) WHERE nif IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domiciliations_date_fin ON domiciliations(date_fin) WHERE date_fin IS NOT NULL;

DROP TRIGGER IF EXISTS trg_domiciliations_updated_at ON domiciliations;
CREATE TRIGGER trg_domiciliations_updated_at BEFORE UPDATE ON domiciliations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. RESERVATIONS (after codes_promo and espaces)
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  espace_id           uuid NOT NULL REFERENCES espaces(id) ON DELETE RESTRICT,
  date_debut          timestamptz NOT NULL,
  date_fin            timestamptz NOT NULL,
  statut              text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','confirmee','en_cours','terminee','annulee','refusee')),
  participants        integer NOT NULL DEFAULT 1,
  notes               text,
  montant             numeric(10,2) NOT NULL DEFAULT 0,
  montant_remise      numeric(10,2) NOT NULL DEFAULT 0,
  montant_final       numeric(10,2) NOT NULL DEFAULT 0,
  code_promo_id       uuid REFERENCES codes_promo(id) ON DELETE SET NULL,
  code_promo_utilise  text,
  mode_paiement       text DEFAULT 'cash',
  reference_paiement  text,
  rappel_envoye       boolean NOT NULL DEFAULT false,
  commentaire_admin   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own reservations" ON reservations;
CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_espace_id ON reservations(espace_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_date_debut ON reservations(date_debut);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(date_debut, date_fin);

DROP TRIGGER IF EXISTS trg_reservations_updated_at ON reservations;
CREATE TRIGGER trg_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. UTILISATIONS_CODES_PROMO
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisations_codes_promo (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_promo_id   uuid NOT NULL REFERENCES codes_promo(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  reservation_id  uuid REFERENCES reservations(id) ON DELETE SET NULL,
  montant_remise  numeric(10,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE utilisations_codes_promo ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_util_codes_code_id ON utilisations_codes_promo(code_promo_id);
CREATE INDEX IF NOT EXISTS idx_util_codes_user_id ON utilisations_codes_promo(user_id);

-- ============================================================
-- 14. COURRIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS courriers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domiciliation_id  uuid NOT NULL REFERENCES domiciliations(id) ON DELETE CASCADE,
  type_courrier     text NOT NULL DEFAULT 'courrier' CHECK (type_courrier IN ('courrier','colis','recommande','acte_notarie','autre')),
  expediteur        text,
  description       text,
  date_reception    date NOT NULL DEFAULT CURRENT_DATE,
  statut            text NOT NULL DEFAULT 'recu' CHECK (statut IN ('recu','notifie','recupere','reexpedier','archive')),
  notifie_le        timestamptz,
  recupere_le       timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courriers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own courriers" ON courriers;
CREATE POLICY "Users can view own courriers"
  ON courriers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM domiciliations d
      WHERE d.id = courriers.domiciliation_id AND d.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_courriers_dom_id ON courriers(domiciliation_id);
CREATE INDEX IF NOT EXISTS idx_courriers_statut ON courriers(statut);
CREATE INDEX IF NOT EXISTS idx_courriers_date ON courriers(date_reception DESC);

DROP TRIGGER IF EXISTS trg_courriers_updated_at ON courriers;
CREATE TRIGGER trg_courriers_updated_at BEFORE UPDATE ON courriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 15. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         text NOT NULL,
  entity_id           uuid NOT NULL,
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  type_document       text NOT NULL,
  nom_fichier         text NOT NULL,
  nom_original        text,
  mime_type           text,
  taille              bigint,
  chemin              text NOT NULL,
  statut              text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','rejete')),
  commentaire_rejet   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents(statut);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'info',
  titre       text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  lue         boolean NOT NULL DEFAULT false,
  lien        text,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lue ON notifications(lue);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 17. CHECKINS
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  espace_id       uuid REFERENCES espaces(id) ON DELETE SET NULL,
  reservation_id  uuid REFERENCES reservations(id) ON DELETE SET NULL,
  heure_entree    timestamptz NOT NULL DEFAULT now(),
  heure_sortie    timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checkins" ON checkins;
CREATE POLICY "Users can view own checkins"
  ON checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_heure_entree ON checkins(heure_entree);

-- ============================================================
-- 18. TRANSACTIONS_CAISSE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions_caisse (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                text NOT NULL CHECK (type IN ('entree','sortie')),
  montant             numeric(10,2) NOT NULL,
  categorie           text,
  description         text,
  reference           text,
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  caissier_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  mode_paiement       text DEFAULT 'cash',
  date_transaction    timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions_caisse ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_trans_caisse_date ON transactions_caisse(date_transaction);

-- ============================================================
-- 19. CLOTURES_CAISSE
-- ============================================================
CREATE TABLE IF NOT EXISTS clotures_caisse (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_cloture      date NOT NULL UNIQUE,
  montant_ouverture numeric(10,2) NOT NULL DEFAULT 0,
  total_entrees     numeric(10,2) NOT NULL DEFAULT 0,
  total_sorties     numeric(10,2) NOT NULL DEFAULT 0,
  montant_cloture   numeric(10,2) NOT NULL DEFAULT 0,
  notes             text,
  caissier_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clotures_caisse ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clotures_date ON clotures_caisse(date_cloture);

-- ============================================================
-- 20. EMAIL_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  to_email        text NOT NULL,
  subject         text NOT NULL,
  template        text,
  statut          text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','envoye','echoue','rebondi')),
  provider        text DEFAULT 'brevo',
  provider_id     text,
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_statut ON email_logs(statut);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- ============================================================
-- 21. SYSTEM_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle         text UNIQUE NOT NULL,
  valeur      text,
  type        text NOT NULL DEFAULT 'string' CHECK (type IN ('string','integer','boolean','json')),
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO system_settings (cle, valeur, type, description) VALUES
  ('parrainage_bonus_montant', '3000', 'integer', 'Montant du bonus de parrainage en DA'),
  ('max_domiciliations', '60', 'integer', 'Nombre maximum de domiciliations actives'),
  ('reservation_rappel_heures', '24', 'integer', 'Heures avant rappel de réservation'),
  ('domiciliation_adresse', 'Mohammadia Mall, 4ème étage, Bureau 1178, Alger', 'string', 'Adresse officielle de domiciliation')
ON CONFLICT (cle) DO NOTHING;

-- ============================================================
-- 22. ACTIVITES (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS activites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  details     jsonb DEFAULT '{}'::jsonb,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activites_user_id ON activites(user_id);
CREATE INDEX IF NOT EXISTS idx_activites_created_at ON activites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activites_entity ON activites(entity_type, entity_id);
