/*
  # Ajout de la carte d'identité sur la table users

  ## Résumé
  Ajout d'une colonne optionnelle `carte_identite_url` sur la table `users` pour stocker
  le chemin du fichier de la carte d'identité nationale de chaque utilisateur.

  ## Changements

  ### Table modifiée : users
  - `carte_identite_url` (text, nullable) : chemin relatif vers le fichier uploadé (image ou PDF)

  ## Notes
  - Colonne nullable : les utilisateurs existants ne sont pas impactés
  - Aucune donnée existante n'est modifiée ou supprimée
  - La valeur NULL signifie que l'utilisateur n'a pas encore fourni sa CIN
  - Le blocage des réservations sans CIN est géré au niveau applicatif (PHP + frontend)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'carte_identite_url'
  ) THEN
    ALTER TABLE users ADD COLUMN carte_identite_url TEXT DEFAULT NULL;
  END IF;
END $$;
