# Configuration Google OAuth pour Coffice

Ce guide explique comment configurer l'authentification Google OAuth dans l'application Coffice.

## 1. Créer un projet Google Cloud

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ pour votre projet

## 2. Configurer OAuth 2.0

1. Dans la console Google Cloud, allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Si demandé, configurez l'écran de consentement OAuth :
   - Type d'application : **Application externe**
   - Nom de l'application : **Coffice**
   - Email d'assistance utilisateur : votre email
   - Logo de l'application : (optionnel)
   - Domaine autorisé : **coffice.dz**
   - Informations de contact du développeur : votre email

4. Créez l'identifiant OAuth :
   - Type d'application : **Application Web**
   - Nom : **Coffice Web Client**
   - Origines JavaScript autorisées :
     - `https://coffice.dz`
     - `http://localhost:5173` (pour le développement)
   - URI de redirection autorisés :
     - `https://coffice.dz`
     - `http://localhost:5173` (pour le développement)

5. Copiez le **Client ID** généré

## 3. Configuration Frontend

Ajoutez le Client ID à votre fichier `.env` :

```bash
VITE_GOOGLE_CLIENT_ID=votre-client-id-ici.apps.googleusercontent.com
```

## 4. Configuration Backend

Ajoutez le Client ID à votre fichier `.env` backend :

```bash
GOOGLE_CLIENT_ID=votre-client-id-ici.apps.googleusercontent.com
```

## 5. Migration de la Base de Données

Exécutez la migration pour ajouter le support Google OAuth :

```bash
mysql -u votre_user -p votre_database < database/migrations/015_add_google_oauth.sql
```

Cette migration ajoute :
- Une colonne `google_id` pour stocker l'identifiant unique Google
- Un index sur `google_id` pour des recherches rapides
- Rend `password_hash` nullable pour les comptes OAuth uniquement

## 6. Test de la Configuration

1. Redémarrez votre serveur de développement
2. Accédez à la page de connexion
3. Vous devriez voir un bouton "Continuer avec Google"
4. Cliquez dessus et testez la connexion

## Architecture Technique

### Frontend
- **GoogleLoginButton.tsx** : Composant réutilisable qui charge le SDK Google Sign-In
- Le bouton utilise la bibliothèque officielle Google Sign-In pour gérer le flux OAuth
- Après connexion réussie, le token ID est envoyé au backend

### Backend
- **google-callback.php** : Endpoint qui vérifie le token ID avec Google
- Crée un nouvel utilisateur si inexistant
- Connecte l'utilisateur existant si trouvé par email ou google_id
- Retourne un JWT pour maintenir la session

### Base de Données
- Les utilisateurs Google ont `google_id` renseigné
- `password_hash` peut être NULL pour les comptes OAuth uniquement
- Un utilisateur peut avoir à la fois email/password ET Google OAuth

## Sécurité

- Le token ID Google est vérifié côté serveur avec l'API Google
- Le `aud` (audience) est vérifié pour s'assurer que le token appartient à notre application
- L'email doit être vérifié par Google (`email_verified = true`)
- Les tokens JWT standard sont utilisés pour maintenir la session après connexion

## Dépannage

### Le bouton Google ne s'affiche pas
- Vérifiez que `VITE_GOOGLE_CLIENT_ID` est configuré dans `.env`
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que le domaine est autorisé dans la console Google Cloud

### Erreur "Token Google invalide"
- Vérifiez que `GOOGLE_CLIENT_ID` est configuré dans le backend
- Vérifiez que le Client ID frontend et backend correspondent
- Assurez-vous que l'origine est autorisée dans Google Cloud Console

### L'utilisateur ne peut pas se connecter
- Vérifiez que la migration a été exécutée
- Vérifiez les logs du serveur pour les erreurs SQL
- Assurez-vous que la colonne `google_id` existe dans la table `users`

## Fonctionnalités

- ✅ Connexion avec Google
- ✅ Inscription avec Google
- ✅ Création automatique de compte lors de la première connexion
- ✅ Association automatique des comptes existants par email
- ✅ Support des comptes hybrides (email + Google)
- ✅ Génération automatique du code de parrainage pour les nouveaux utilisateurs
