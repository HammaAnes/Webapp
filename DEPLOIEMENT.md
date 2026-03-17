# 🚀 Guide de Déploiement - Coffice v4.2.0

## 📋 Prérequis Serveur

- **PHP** : 8.1 ou supérieur
- **MySQL** : 8.0 ou supérieur
- **Apache** : avec mod_rewrite activé
- **SSL/HTTPS** : Obligatoire en production
- **Node.js** : 18+ (pour le build uniquement)

## 🔧 Installation Complète

### 1. Préparation Locale

```bash
# Cloner le projet
git clone <repo-url>
cd coffice-app

# Installer dépendances
npm install

# Configurer .env
cp api/.env.example api/.env
nano api/.env
```

**Configuration .env minimale :**

```env
# API Backend
VITE_API_URL=https://coffice.dz/api

# Database
DB_HOST=localhost
DB_NAME=cofficed_coffice
DB_USER=cofficed_user
DB_PASSWORD=VotreMotDePasseSecurise

# JWT Security
JWT_SECRET=generer_avec_openssl_rand_base64_64

# Email (Gmail recommandé)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre@email.com
MAIL_PASSWORD=mot_de_passe_application
MAIL_FROM_ADDRESS=noreply@coffice.dz
```

### 2. Base de Données

```bash
# Créer la database
mysql -u root -p -e "CREATE DATABASE cofficed_coffice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Créer l'utilisateur
mysql -u root -p -e "CREATE USER 'cofficed_user'@'localhost' IDENTIFIED BY 'MotDePasseSecurise';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON cofficed_coffice.* TO 'cofficed_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Importer le schéma
mysql -u root -p cofficed_coffice < database/coffice.sql

# Appliquer TOUTES les migrations dans l'ordre
mysql -u root -p cofficed_coffice < database/migrations/002_password_resets.sql
mysql -u root -p cofficed_coffice < database/migrations/003_add_rappel_envoye.sql
mysql -u root -p cofficed_coffice < database/migrations/004_performance_indexes.sql
mysql -u root -p cofficed_coffice < database/migrations/005_audit_logging.sql
mysql -u root -p cofficed_coffice < database/migrations/006_add_code_parrainage.sql

# Optimiser les tables
mysql -u root -p cofficed_coffice -e "ANALYZE TABLE users, reservations, domiciliations, espaces, abonnements, codes_promo, parrainages;"
```

### 3. Build Production

```bash
# Build optimisé
npm run build

# Vérifier le build
ls -la dist/
```

Le dossier `dist/` contient maintenant tous les fichiers frontend compilés.

### 4. Upload vers le Serveur

**Via cPanel File Manager :**

1. Connectez-vous à cPanel
2. File Manager → `public_html/`
3. Supprimez TOUT le contenu existant
4. Uploadez TOUS les fichiers depuis `dist/` à la racine de `public_html/`
5. Uploadez le dossier `api/` complet
6. Uploadez le dossier `database/migrations/`
7. Assurez-vous que `api/.env` est bien configuré pour le serveur

**Via FTP/SFTP :**

```bash
# Exemple avec rsync
rsync -avz --delete dist/ user@serveur:/home/user/public_html/
rsync -avz api/ user@serveur:/home/user/public_html/api/
rsync -avz database/migrations/ user@serveur:/home/user/public_html/database/migrations/
```

**Structure finale sur le serveur :**

```
public_html/
├── index.html              ✅ (depuis dist/)
├── assets/                 ✅ (depuis dist/)
│   ├── *.js
│   ├── *.css
│   └── images/
├── api/                    ✅ (dossier complet)
│   ├── auth/
│   ├── reservations/
│   ├── domiciliations/
│   ├── espaces/
│   ├── users/
│   ├── abonnements/
│   ├── codes-promo/
│   ├── parrainages/
│   ├── notifications/
│   ├── admin/
│   ├── uploads/            ✅ (créer si absent)
│   │   └── documents/      ✅ (créer si absent)
│   └── logs/               ✅ (créer si absent)
├── database/
│   └── migrations/         ✅ (optionnel mais recommandé)
├── api/
│   └── .env                ✅ (configuré pour prod)
└── .htaccess               ✅ (depuis dist/)
```

### 5. Permissions Serveur

```bash
# Via cPanel Terminal ou SSH
chmod 755 api/uploads
chmod 755 api/uploads/documents
chmod 755 api/logs
chmod 644 api/.env
chmod 644 .htaccess

# Vérifier propriétaire
chown -R user:user public_html/
```

### 6. Configuration .env Serveur

Éditer `api/.env` sur le serveur avec les vraies valeurs :

```env
VITE_API_URL=https://coffice.dz/api
APP_URL=https://coffice.dz
APP_ENV=production

DB_HOST=localhost
DB_NAME=cofficed_coffice
DB_USER=cofficed_user
DB_PASSWORD=MotDePasseReel

JWT_SECRET=VotreSecretJWTSecurise64Caracteres

MAIL_HOST=mail.coffice.dz
MAIL_PORT=465
MAIL_USERNAME=noreply@coffice.dz
MAIL_PASSWORD=MotDePasseEmailReel
```

## 📧 Configuration Email Gmail

1. Activer l'authentification à 2 facteurs : https://myaccount.google.com/security
2. Créer un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Utiliser ce mot de passe dans `MAIL_PASSWORD`

**Configuration Gmail dans api/.env :**

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_ENCRYPTION=tls
```

## 🧪 Tests Post-Déploiement

### 1. Test API

```bash
# Depuis votre navigateur
https://coffice.dz/api/check.php

# Doit retourner:
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2026-01-26T10:00:00+00:00"
}
```

### 2. Test MIME Types

```
https://coffice.dz/test-mime.html
```

Tous les tests doivent être verts.

### 3. Test Connexion DB

```bash
# Via cPanel Terminal
cd public_html
php api/test_db_connection.php
```

### 4. Test Complet Application

1. Accéder à `https://coffice.dz`
2. Créer un compte utilisateur
3. Se connecter
4. Créer une réservation test
5. Vérifier réception email

## 🔐 Sécurité Production

### SSL/HTTPS (Obligatoire)

Via cPanel :
1. SSL/TLS Status
2. Run AutoSSL (Let's Encrypt gratuit)
3. Activer "Force HTTPS Redirect"

### Headers Sécurité

Le `.htaccess` contient déjà :
- Protection XSS
- Content Security Policy
- Clickjacking protection
- MIME type sniffing protection

### Fichiers Sensibles

```apache
# Déjà dans .htaccess
<Files "api/.env">
    Order allow,deny
    Deny from all
</Files>
```

## 🔄 Mises à Jour

```bash
# Local
git pull origin main
npm install
npm run build

# Upload uniquement dist/ vers serveur
# NE PAS upload src/, node_modules/
```

## 🐛 Dépannage

### Erreur : Page blanche

**Solution :**
1. F12 → Console pour voir les erreurs
2. Vérifier que `index.html` et `assets/` sont à la racine
3. Vérifier `.htaccess` présent
4. Vider cache navigateur (Ctrl+Shift+Del)

### Erreur : API ne répond pas

**Solution :**
1. Vérifier `api/.env` configuré
2. Test : `https://coffice.dz/api/health.php`
3. Vérifier logs : `api/logs/app.log`
4. Vérifier permissions `api/uploads/` = 755

### Erreur : MIME type JavaScript

**Solution :**
1. Vérifier `.htaccess` présent à la racine
2. Rebuild : `npm run build`
3. Upload `dist/.htaccess`
4. Test : `/test-mime.html`

### Erreur : Emails ne partent pas

**Solution :**
1. Vérifier config email dans `api/.env`
2. Test : créer un compte utilisateur
3. Vérifier logs : `api/logs/app.log`
4. Gmail : vérifier mot de passe d'application

## 📊 Maintenance

### Logs à Surveiller

```bash
# Erreurs application
tail -f api/logs/app.log

# Audit (actions critiques)
tail -f api/logs/audit.log

# Via cPanel : Metrics → Errors
```

### Sauvegardes Automatiques

Via cPanel :
1. Backup Wizard → Generate Backup
2. Download : Home Directory + MySQL Database
3. Planifier : hebdomadaire minimum

### Nettoyage Base de Données

Ajouter dans cron (cPanel → Cron Jobs) :

```cron
# Tous les jours à 2h du matin
0 2 * * * mysql cofficed_coffice -e "DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL 24 HOUR;"

# Toutes les semaines
0 3 * * 0 mysql cofficed_coffice -e "OPTIMIZE TABLE users, reservations, domiciliations, espaces;"
```

## ✅ Checklist Finale

Avant de considérer le déploiement terminé :

- [ ] `npm run build` exécuté sans erreur
- [ ] Base de données créée + toutes migrations appliquées
- [ ] `api/.env` configuré avec les vraies valeurs
- [ ] Structure `public_html/` correcte (dist/ + api/)
- [ ] Permissions correctes (755 uploads/, 644 api/.env)
- [ ] `.htaccess` présent à la racine
- [ ] SSL/HTTPS actif et fonctionnel
- [ ] `https://coffice.dz` accessible sans erreur
- [ ] `/test-mime.html` : tous tests verts
- [ ] API répond : `/api/check.php`
- [ ] Création compte + login fonctionnel
- [ ] Emails envoyés correctement
- [ ] Test réservation complète OK

## 📞 Support

**Email** : desk@coffice.dz
**Site** : https://coffice.dz
**Documentation** : README.md

---

**Version** : 4.2.0
**Dernière mise à jour** : Janvier 2026
**Statut** : Production Ready ✅
