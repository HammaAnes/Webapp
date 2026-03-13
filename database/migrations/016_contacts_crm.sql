/*
  # Module CRM - Gestion des Contacts et Leads

  1. Nouvelle Table
    - `contacts`
      - `id` (uuid, primary key)
      - `nom` (varchar 100, requis)
      - `prenom` (varchar 100, requis)
      - `email` (varchar 255, optionnel, unique si renseigné)
      - `telephone` (varchar 20, optionnel)
      - `entreprise` (varchar 255, optionnel)
      - `source` (enum: whatsapp, instagram, tiktok, fixe, mobile, physique, email, autre)
      - `statut` (enum: prospect, client, perdu)
      - `notes` (text, optionnel)
      - `user_id` (uuid, optionnel, FK vers users - NULL si pas encore converti)
      - `created_by` (uuid, requis, FK vers users - admin qui a créé)
      - `created_at`, `updated_at`

  2. Modifications Tables Existantes
    - `reservations` : Ajouter `contact_id` (uuid, optionnel)
    - `domiciliations` : Ajouter `contact_id` (uuid, optionnel)
    - `user_abonnements` : Ajouter `contact_id` (uuid, optionnel)
    - Contraintes : Chaque ligne doit avoir user_id OU contact_id (un des deux)

  3. Sécurité
    - Index sur email, telephone, statut, source pour performance
    - Logs d'audit pour traçabilité
    - Contraintes de validation
*/

-- Table contacts (CRM)
CREATE TABLE IF NOT EXISTS contacts (
  id CHAR(36) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  telephone VARCHAR(20) DEFAULT NULL,
  entreprise VARCHAR(255) DEFAULT NULL,
  source ENUM('whatsapp', 'instagram', 'tiktok', 'fixe', 'mobile', 'physique', 'email', 'autre') NOT NULL DEFAULT 'autre',
  statut ENUM('prospect', 'client', 'perdu') NOT NULL DEFAULT 'prospect',
  notes TEXT DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_contact_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_contact_has_email_or_phone CHECK (email IS NOT NULL OR telephone IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_telephone ON contacts(telephone);
CREATE INDEX IF NOT EXISTS idx_contacts_statut ON contacts(statut);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Ajouter contact_id aux réservations
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS contact_id CHAR(36) DEFAULT NULL AFTER user_id,
ADD CONSTRAINT fk_reservation_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT;

-- Index sur contact_id
CREATE INDEX IF NOT EXISTS idx_reservations_contact_id ON reservations(contact_id);

-- Contrainte : user_id OU contact_id obligatoire (un des deux)
ALTER TABLE reservations
ADD CONSTRAINT chk_reservation_user_or_contact
CHECK ((user_id IS NOT NULL AND contact_id IS NULL) OR (user_id IS NULL AND contact_id IS NOT NULL));

-- Ajouter contact_id aux domiciliations
ALTER TABLE domiciliations
ADD COLUMN IF NOT EXISTS contact_id CHAR(36) DEFAULT NULL AFTER user_id,
ADD CONSTRAINT fk_domiciliation_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT;

-- Index sur contact_id
CREATE INDEX IF NOT EXISTS idx_domiciliations_contact_id ON domiciliations(contact_id);

-- Contrainte : user_id OU contact_id obligatoire
ALTER TABLE domiciliations
ADD CONSTRAINT chk_domiciliation_user_or_contact
CHECK ((user_id IS NOT NULL AND contact_id IS NULL) OR (user_id IS NULL AND contact_id IS NOT NULL));

-- Ajouter contact_id aux abonnements (si table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_abonnements') THEN
    ALTER TABLE user_abonnements
    ADD COLUMN IF NOT EXISTS contact_id CHAR(36) DEFAULT NULL;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_abonnement_contact'
                   AND table_name = 'user_abonnements') THEN
      ALTER TABLE user_abonnements
      ADD CONSTRAINT fk_abonnement_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                   WHERE index_name = 'idx_abonnements_contact_id'
                   AND table_name = 'user_abonnements') THEN
      CREATE INDEX idx_abonnements_contact_id ON user_abonnements(contact_id);
    END IF;
  END IF;
END $$;

-- Vue pour historique complet d'un contact
CREATE OR REPLACE VIEW contact_history AS
SELECT
  c.id as contact_id,
  'reservation' as type,
  r.id as entity_id,
  r.created_at as date,
  CONCAT('Réservation ', e.nom, ' du ', DATE_FORMAT(r.date_debut, '%d/%m/%Y')) as description,
  r.montant_total as montant,
  r.statut as statut
FROM contacts c
LEFT JOIN reservations r ON c.id = r.contact_id
LEFT JOIN espaces e ON r.espace_id = e.id
WHERE r.id IS NOT NULL

UNION ALL

SELECT
  c.id as contact_id,
  'domiciliation' as type,
  d.id as entity_id,
  d.created_at as date,
  CONCAT('Domiciliation ', d.raison_sociale) as description,
  NULL as montant,
  d.statut as statut
FROM contacts c
LEFT JOIN domiciliations d ON c.id = d.contact_id
WHERE d.id IS NOT NULL

ORDER BY date DESC;
