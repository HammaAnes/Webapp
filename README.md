# Coffice - Plateforme de Coworking

Application web complete de gestion d'espaces de coworking au Mohammadia Mall, Alger.

## 🎉 Nouvelle architecture (v4.2.0)

Le projet a été **entièrement refactorisé** avec une architecture modulaire moderne :

- ✅ **Stores modulaires** par domaine métier
- ✅ **Couche service** séparant logique métier et UI
- ✅ **Composants UI réutilisables** (DataTable, FilterBar, etc.)
- ✅ **Hooks personnalisés** pour logique réutilisable
- ✅ **Gestion d'erreurs standardisée**
- ✅ **Documentation complète**

📚 **Voir** :
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture complète
- [REFACTORING.md](./REFACTORING.md) - Détails de la refactorisation
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guide de migration

## Vue d'ensemble

Coffice est une plateforme moderne de reservation et gestion d'espaces de coworking comprenant :
- 2 box de 4 places
- 1 box de 3 places
- 1 table open space de 12 places (dont 2 postes informatiques)
- 1 salle de reunion avec terrasse
- 1 kitchenette equipee

## Technologies

### Frontend
- React 18 avec TypeScript
- Vite - Build tool moderne
- TailwindCSS - Design system
- React Router - Navigation
- React Hook Form - Gestion des formulaires
- Zustand - State management
- date-fns - Manipulation des dates
- Recharts - Visualisations

### Backend
- PHP 8+ - API REST
- MySQL - Base de donnees
- JWT - Authentication

## Installation

### Prerequis
- Node.js 18+
- PHP 8.1+
- MySQL 8+
- Apache avec mod_rewrite active

### Configuration

1. Cloner le projet
```bash
git clone <repository-url>
cd coffice-app
```

2. Installer les dependances frontend
```bash
npm install
```

3. Configurer l'environnement
```bash
cp api/.env.example api/.env
```

Modifier `api/.env` avec vos informations :
```env
DB_HOST=localhost
DB_NAME=cofficed_coffice
DB_USER=cofficed_user
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=votre_secret_jwt

VITE_API_URL=https://coffice.dz/api
```

4. Creer la base de donnees
```bash
mysql -u root -p -e "CREATE DATABASE cofficed_coffice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'cofficed_user'@'localhost' IDENTIFIED BY 'MotDePasseSecurise';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON cofficed_coffice.* TO 'cofficed_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

mysql -u root -p cofficed_coffice < database/coffice.sql

mysql -u root -p cofficed_coffice < database/migrations/002_password_resets.sql
mysql -u root -p cofficed_coffice < database/migrations/003_add_rappel_envoye.sql
mysql -u root -p cofficed_coffice < database/migrations/004_performance_indexes.sql
mysql -u root -p cofficed_coffice < database/migrations/005_audit_logging.sql
mysql -u root -p cofficed_coffice < database/migrations/006_add_code_parrainage.sql
mysql -u root -p cofficed_coffice < database/migrations/007_operational_features.sql
mysql -u root -p cofficed_coffice < database/migrations/008_domiciliation_workflow.sql
mysql -u root -p cofficed_coffice < database/migrations/009_fix_codes_promo_columns.sql
mysql -u root -p cofficed_coffice < database/migrations/010_walk_ins.sql

mysql -u root -p cofficed_coffice -e "ANALYZE TABLE users, reservations, domiciliations, espaces, abonnements, codes_promo, parrainages;"
```

5. Build frontend
```bash
npm run build
```

## Developpement

```bash
npm run dev
```

Le site sera accessible sur http://localhost:5173

## Structure du projet

```
coffice-app/
├── api/                    # Backend PHP
│   ├── config/            # Configuration DB, CORS
│   ├── utils/             # Auth, Response, etc.
│   ├── auth/              # Endpoints authentification
│   ├── espaces/           # Endpoints espaces
│   ├── reservations/      # Endpoints reservations
│   ├── domiciliations/    # Endpoints domiciliations
│   └── users/             # Endpoints utilisateurs
├── src/                   # Frontend React
│   ├── components/        # Composants reutilisables
│   ├── pages/             # Pages de l'application
│   ├── lib/               # API client
│   ├── store/             # State management
│   ├── types/             # Types TypeScript
│   └── utils/             # Utilitaires
├── database/              # Scripts SQL
└── dist/                  # Build de production
```

## Fonctionnalites

### Utilisateurs
- Inscription / Connexion
- Gestion du profil
- Reservation d'espaces avec modification et annulation
- Suivi des reservations
- Mon Espace Pro : page unifiee domiciliation + entreprise
  - Onglet Domiciliation : demande, suivi workflow, gestion contrat
  - Onglet Mon Entreprise : informations legales editables
  - Onglet Mon Courrier : suivi du courrier recu (lecture seule)
  - Onglet Mes Documents : upload RC, NIF, NIS, C20, Carte AE
- Parrainage

### Administrateurs - Gestion operationnelle
- Tableau de bord "Aujourd'hui" : Vision temps reel de l'activite
- Walk-ins : Gestion des venues spontanees
- Blocages : Maintenance et evenements prives
- Calendrier disponibilite : Vue temps reel avec blocage des conflits
- Gestion du courrier : Pour domiciliations
- Statistiques detaillees : Par espace, jour, semaine, mois

### Administrateurs - Gestion generale
- Dashboard complet
- Gestion des espaces
- Gestion des reservations
- Gestion des utilisateurs
- Gestion des domiciliations
- Rapports financiers
- Codes promo
- Abonnements

## API Backend

### Authentification
- `POST /api/auth/register.php` - Inscription
- `POST /api/auth/login.php` - Connexion
- `POST /api/auth/logout.php` - Deconnexion
- `GET /api/auth/me.php` - Profil utilisateur

### Espaces
- `GET /api/espaces/index.php` - Liste des espaces
- `GET /api/espaces/show.php?id=xxx` - Details d'un espace
- `POST /api/espaces/create.php` - Creer un espace (admin)
- `PUT /api/espaces/update.php` - Modifier un espace (admin)
- `DELETE /api/espaces/delete.php` - Supprimer un espace (admin)

### Reservations
- `GET /api/reservations/index.php` - Liste des reservations
- `GET /api/reservations/show.php?id=xxx` - Details d'une reservation
- `POST /api/reservations/create.php` - Creer une reservation
- `PUT /api/reservations/update.php` - Modifier une reservation
- `POST /api/reservations/cancel.php` - Annuler une reservation

### Domiciliations
- `GET /api/domiciliations/index.php` - Liste (admin)
- `GET /api/domiciliations/user.php?user_id=xxx` - Par utilisateur
- `POST /api/domiciliations/create.php` - Creer une demande
- `PUT /api/domiciliations/update.php` - Mettre a jour

### Abonnements
- `GET /api/abonnements/index.php` - Liste
- `POST /api/abonnements/create.php` - Creer
- `PUT /api/abonnements/update.php` - Modifier
- `DELETE /api/abonnements/delete.php` - Supprimer

### Admin
- `GET /api/admin/stats.php` - Statistiques
- `GET /api/admin/blocages.php` - Blocages d'espaces
- `GET /api/admin/walk-ins.php` - Walk-ins
- `GET /api/admin/courrier.php` - Courrier domiciliation

## Tests

```bash
php scripts/test_api.php https://coffice.dz/api
php scripts/test_api.php http://localhost/api
```

## Deploiement Production

### 1. Build

```bash
npm run build
ls -la dist/
```

### 2. Upload vers le serveur

Via cPanel File Manager :

1. Connectez-vous a cPanel
2. File Manager -> `public_html/`
3. Uploadez les fichiers depuis `dist/` a la racine de `public_html/`
4. Uploadez le dossier `api/` complet (incluant `api/.env` configuré pour le serveur)

Via FTP/SFTP :

```bash
rsync -avz --delete dist/ user@serveur:/home/user/public_html/
rsync -avz api/ user@serveur:/home/user/public_html/api/
```

Structure finale sur le serveur :

```
public_html/
├── index.html
├── assets/
├── api/
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
│   ├── uploads/
│   │   └── documents/
│   ├── logs/
│   └── .env
└── .htaccess
```

### 3. Permissions

```bash
chmod 755 api/uploads
chmod 755 api/uploads/documents
chmod 755 api/logs
chmod 644 api/.env
chmod 644 .htaccess
```

### 4. SSL/HTTPS

Via cPanel :
1. SSL/TLS Status
2. Run AutoSSL (Let's Encrypt gratuit)
3. Activer "Force HTTPS Redirect"

### 5. Tests post-deploiement

```bash
curl https://coffice.dz/api/check.php
```

Verifier : creation de compte, connexion, reservation test, envoi d'emails.

### 6. Maintenance

Ajouter dans cron (cPanel -> Cron Jobs) :

```cron
# Nettoyage quotidien a 2h
0 2 * * * mysql cofficed_coffice -e "DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL 24 HOUR;"

# Optimisation hebdomadaire
0 3 * * 0 mysql cofficed_coffice -e "OPTIMIZE TABLE users, reservations, domiciliations, espaces;"
```

## Depannage

- Page blanche : F12 -> Console, verifier index.html et .htaccess, vider cache
- API ne repond pas : verifier api/.env, tester /api/health.php, consulter api/logs/app.log
- Reservations en erreur : `php scripts/init_espaces.php`, consulter logs PHP
- Emails ne partent pas : verifier config SMTP dans api/.env, verifier mot de passe d'application Gmail

## Mises a jour

```bash
git pull origin main
npm install
npm run build
# Upload dist/ vers le serveur
```

## Licence

Proprietaire - Coffice 2024-2026
