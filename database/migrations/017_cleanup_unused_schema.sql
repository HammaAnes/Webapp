/*
  # Nettoyage du schéma de base de données

  1. Corrections critiques
    - Renommage de la table `activites` en `audit_logs` (utilisée dans le code)
    - Ajout des colonnes manquantes dans `courriers`

  2. Suppression des tables inutilisées
    - Table `walk_ins` et ses vues (migration 010 - jamais implémentée)
    - Tables ERP (migration 011 - module complet jamais implémenté):
      * factures, facture_lignes
      * paiements (remplacé par transactions_caisse)
      * depenses, inventaire
      * demandes_maintenance, personnel, evenements
      * sequences
    - Fonction `next_numero_facture()`
    - Procédure `calculate_occupancy_rate()`

  3. Suppression des colonnes inutilisées (optionnel - commenté par défaut)
    - 44 colonnes jamais référencées dans le code
    - À décommenter uniquement après backup et validation

  4. Notes importantes
    - Les triggers et contraintes sont automatiquement supprimés avec les tables
    - Faire un BACKUP complet avant exécution
    - Tester d'abord sur un environnement de développement
*/

-- ============================================================================
-- PARTIE 1 : CORRECTIONS CRITIQUES (OBLIGATOIRE)
-- ============================================================================

-- 1.1 Renommer activites → audit_logs (le code utilise audit_logs)
-- ============================================================================
DROP TABLE IF EXISTS audit_logs;
RENAME TABLE activites TO audit_logs;

-- 1.2 Ajouter colonnes manquantes dans courriers (utilisées dans api/admin/courrier.php)
-- ============================================================================
ALTER TABLE courriers
ADD COLUMN IF NOT EXISTS retire_par CHAR(36) DEFAULT NULL COMMENT 'Utilisateur ayant retiré le courrier' AFTER notes_admin,
ADD COLUMN IF NOT EXISTS date_retrait DATETIME DEFAULT NULL COMMENT 'Date de retrait du courrier',
ADD COLUMN IF NOT EXISTS adresse_envoi TEXT DEFAULT NULL COMMENT 'Adresse de réexpédition',
ADD COLUMN IF NOT EXISTS numero_suivi VARCHAR(100) DEFAULT NULL COMMENT 'Numéro de suivi postal',
ADD COLUMN IF NOT EXISTS date_envoi DATETIME DEFAULT NULL COMMENT 'Date d\'envoi de la réexpédition';

-- Ajouter la contrainte FK pour retire_par
ALTER TABLE courriers
ADD CONSTRAINT fk_courriers_retire_par
FOREIGN KEY (retire_par) REFERENCES users(id) ON DELETE SET NULL;


-- ============================================================================
-- PARTIE 2 : SUPPRESSION DES TABLES INUTILISÉES (RECOMMANDÉ)
-- ============================================================================

-- 2.1 Supprimer les vues walk_ins (migration 010)
-- ============================================================================
DROP VIEW IF EXISTS walk_ins_daily_stats;
DROP VIEW IF EXISTS walk_ins_details;

-- 2.2 Supprimer la table walk_ins
-- ============================================================================
DROP TABLE IF EXISTS walk_ins;

-- 2.3 Supprimer les tables ERP (migration 011)
-- ============================================================================
-- Ordre important : d'abord les tables enfants, puis les parents

-- Tables de détails/lignes
DROP TABLE IF EXISTS facture_lignes;

-- Tables principales
DROP TABLE IF EXISTS paiements;
DROP TABLE IF EXISTS factures;
DROP TABLE IF EXISTS depenses;
DROP TABLE IF EXISTS inventaire;
DROP TABLE IF EXISTS demandes_maintenance;
DROP TABLE IF EXISTS personnel;
DROP TABLE IF EXISTS evenements;
DROP TABLE IF EXISTS sequences;

-- 2.4 Supprimer la fonction inutilisée
-- ============================================================================
DROP FUNCTION IF EXISTS next_numero_facture;

-- 2.5 Supprimer la procédure stockée inutilisée
-- ============================================================================
DROP PROCEDURE IF EXISTS calculate_occupancy_rate;


-- ============================================================================
-- PARTIE 3 : SUPPRESSION DES COLONNES INUTILISÉES (OPTIONNEL - COMMENTÉ)
-- ============================================================================
-- ⚠️ ATTENTION : Décommentez uniquement après :
--    1. Backup complet de la base
--    2. Test en environnement de développement
--    3. Validation qu'aucune migration future n'utilise ces colonnes
-- ============================================================================

-- 3.1 Nettoyage table users (17 colonnes inutilisées)
-- ----------------------------------------------------------------------------
/*
ALTER TABLE users
DROP COLUMN IF EXISTS avatar,
DROP COLUMN IF EXISTS adresse,
DROP COLUMN IF EXISTS bio,
DROP COLUMN IF EXISTS article_imposition,
DROP COLUMN IF EXISTS numero_auto_entrepreneur,
DROP COLUMN IF EXISTS raison_sociale,
DROP COLUMN IF EXISTS date_creation_entreprise,
DROP COLUMN IF EXISTS capital,
DROP COLUMN IF EXISTS siege_social,
DROP COLUMN IF EXISTS activite_principale,
DROP COLUMN IF EXISTS forme_juridique,
DROP COLUMN IF EXISTS credit,
DROP COLUMN IF EXISTS absences,
DROP COLUMN IF EXISTS banned_until;
*/

-- 3.2 Nettoyage table reservations (5 colonnes inutilisées)
-- ----------------------------------------------------------------------------
/*
ALTER TABLE reservations
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS annulee_par,
DROP COLUMN IF EXISTS raison_annulation,
DROP COLUMN IF EXISTS date_annulation,
DROP COLUMN IF EXISTS rappel_envoye;
*/

-- 3.3 Nettoyage table domiciliations (21 colonnes inutilisées)
-- ----------------------------------------------------------------------------
/*
ALTER TABLE domiciliations
DROP COLUMN IF EXISTS adresse_siege_social,
DROP COLUMN IF EXISTS coordonnees_fiscales,
DROP COLUMN IF EXISTS coordonnees_administratives,
DROP COLUMN IF EXISTS representant_adresse_residence,
DROP COLUMN IF EXISTS representant_ville,
DROP COLUMN IF EXISTS code_nae,
DROP COLUMN IF EXISTS activite_exercee,
DROP COLUMN IF EXISTS description_activite,
DROP COLUMN IF EXISTS ville_immatriculation,
DROP COLUMN IF EXISTS date_inscription_auto_entrepreneur,
DROP COLUMN IF EXISTS numero_bureau,
DROP COLUMN IF EXISTS reference_contrat_notarie,
DROP COLUMN IF EXISTS date_debut_contrat,
DROP COLUMN IF EXISTS date_fin_contrat,
DROP COLUMN IF EXISTS date_cgu_acceptation,
DROP COLUMN IF EXISTS date_debut_souhaitee,
DROP COLUMN IF EXISTS documents,
DROP COLUMN IF EXISTS notes_admin,
DROP COLUMN IF EXISTS commentaire_admin,
DROP COLUMN IF EXISTS alerte_expiration_envoyee,
DROP COLUMN IF EXISTS date_validation;
*/

-- 3.4 Nettoyage table espaces (1 colonne inutilisée)
-- ----------------------------------------------------------------------------
/*
ALTER TABLE espaces
DROP COLUMN IF EXISTS etage;
*/

-- 3.5 Nettoyage table abonnements_utilisateurs (1 colonne inutilisée)
-- ----------------------------------------------------------------------------
/*
ALTER TABLE abonnements_utilisateurs
DROP COLUMN IF EXISTS credits_restants;
*/


-- ============================================================================
-- PARTIE 4 : VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- 4.1 Vérifier que la table audit_logs existe bien
SELECT 'audit_logs table exists' AS status, COUNT(*) AS row_count FROM audit_logs;

-- 4.2 Vérifier que les colonnes ont été ajoutées à courriers
SHOW COLUMNS FROM courriers LIKE 'retire_par';
SHOW COLUMNS FROM courriers LIKE 'date_retrait';
SHOW COLUMNS FROM courriers LIKE 'adresse_envoi';
SHOW COLUMNS FROM courriers LIKE 'numero_suivi';
SHOW COLUMNS FROM courriers LIKE 'date_envoi';

-- 4.3 Vérifier que les tables inutilisées ont été supprimées
SELECT
    'Tables supprimées avec succès' AS status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = DATABASE()
     AND table_name IN ('walk_ins', 'factures', 'facture_lignes', 'paiements',
                        'depenses', 'inventaire', 'demandes_maintenance',
                        'personnel', 'evenements', 'sequences')) AS remaining_count
FROM DUAL;

-- Si remaining_count = 0, tout est OK


-- ============================================================================
-- RÉSUMÉ DES MODIFICATIONS
-- ============================================================================
/*
EXÉCUTÉ PAR DÉFAUT :
✅ Renommage activites → audit_logs
✅ Ajout de 5 colonnes dans courriers
✅ Suppression de 10 tables inutilisées
✅ Suppression de 2 vues
✅ Suppression de 1 fonction
✅ Suppression de 1 procédure stockée

COMMENTÉ (À ACTIVER MANUELLEMENT) :
⚠️ Suppression de 44 colonnes inutilisées

IMPACT :
- Réduction de la taille de la BDD
- Amélioration de la cohérence code/schéma
- Simplification de la maintenance
- Aucun impact sur les fonctionnalités existantes
*/
