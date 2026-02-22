/*
  # Migration : Ajout du code parrainage aux utilisateurs

  1. Modifications
    - Ajout du champ `code_parrainage` dans la table `users`
    - Generation automatique des codes pour les utilisateurs existants
    - Index pour optimiser les recherches

  2. Securite
    - Code unique par utilisateur
    - Format simplifie : COFFICE-XXX123 (prenom 3 lettres + 3 chiffres)
    - Exemple: COFFICE-AHM472 pour Ahmed

  3. Notes
    - Format facile a retenir et partager verbalement
    - Les codes sont generes automatiquement si absents
*/

-- Ajout du champ code_parrainage dans la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS code_parrainage VARCHAR(20) UNIQUE COMMENT 'Code unique de parrainage de l\'utilisateur';

-- Index pour optimiser les recherches de codes parrainage
CREATE INDEX IF NOT EXISTS idx_code_parrainage ON users(code_parrainage);

-- Generation automatique des codes pour les utilisateurs existants
-- Format: COFFICE-XXX123 (3 premieres lettres du prenom + 3 chiffres aleatoires)
UPDATE users
SET code_parrainage = CONCAT(
    'COFFICE-',
    UPPER(LEFT(REGEXP_REPLACE(prenom, '[^A-Za-z]', ''), 3)),
    LPAD(FLOOR(RAND() * 1000), 3, '0')
)
WHERE code_parrainage IS NULL OR code_parrainage = '';

-- Creer automatiquement les entrees dans la table parrainages pour les utilisateurs existants
INSERT INTO parrainages (id, parrain_id, code_parrain, parraines, recompenses_totales, created_at)
SELECT
    UUID(),
    u.id,
    u.code_parrainage,
    0,
    0,
    NOW()
FROM users u
WHERE u.code_parrainage IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM parrainages p WHERE p.parrain_id = u.id
  );
