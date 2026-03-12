# Outils de Debug - API Coffice

Ce dossier contient des outils de diagnostic pour comprendre et résoudre les erreurs de l'API.

## Fichiers de Test

### 1. Test de Connexion à la Base de Données
**Fichier:** `test-db.php`
**URL:** `https://votredomaine.com/api/debug/test-db.php`

Vérifie:
- La connexion à MySQL
- Les variables d'environnement
- L'existence des tables
- Le nombre d'enregistrements par table

### 2. Test d'Authentification
**Fichier:** `test-auth.php`
**URL:** `https://votredomaine.com/api/debug/test-auth.php`

Vérifie:
- Le token JWT dans le header Authorization
- La validité du token
- Les informations de l'utilisateur connecté

**Comment tester:**
```bash
curl -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
     https://votredomaine.com/api/debug/test-auth.php
```

### 3. Test de Création de Réservation
**Fichier:** `/api/reservations/test-create.php`
**URL:** `https://votredomaine.com/api/reservations/test-create.php`

Teste la création d'une réservation avec des informations de debug détaillées à chaque étape:
- Parsing du JSON
- Validation des dates
- Vérification de l'espace
- Vérification des conflits
- Calcul du prix
- Insertion en base de données

**Comment tester:**
```bash
curl -X POST \
     -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
     -H "Content-Type: application/json" \
     -d '{
       "espace_id": "ID_ESPACE",
       "date_debut": "2024-01-20T10:00:00.000Z",
       "date_fin": "2024-01-20T12:00:00.000Z",
       "participants": 2,
       "notes": "Test"
     }' \
     https://votredomaine.com/api/reservations/test-create.php
```

## Interface Frontend

Le formulaire de réservation affiche maintenant des informations de debug en cas d'erreur:
- Données du formulaire
- Payload de la requête
- Réponse complète de l'API
- Erreurs et exceptions

Pour activer le debug:
1. Ouvrez le formulaire de réservation
2. Remplissez les champs
3. Soumettez le formulaire
4. En cas d'erreur, un panneau bleu "Debug Info" s'affiche
5. Cliquez sur "Copier" pour copier les informations

## Résolution des Problèmes Courants

### Erreur: "No authorization header"
- Vérifiez que vous êtes connecté
- Vérifiez que le token est bien envoyé dans le header Authorization

### Erreur: "Database connection failed"
- Vérifiez le fichier `.env` à la racine du projet
- Vérifiez que les credentials MySQL sont corrects
- Testez avec `test-db.php`

### Erreur: "Space not found"
- Vérifiez que l'ID de l'espace existe dans la table `espaces`
- Utilisez `test-db.php` pour voir la liste des espaces

### Erreur: "Time slot already reserved"
- Un créneau horaire est déjà réservé
- Choisissez une autre date/heure

### Erreur: "Invalid date format"
- Vérifiez le format des dates (ISO 8601)
- Format attendu: `2024-01-20T10:00:00.000Z`

## Sécurité

**IMPORTANT:** Ces fichiers de debug doivent être supprimés en production ou protégés par authentification admin.

Pour les protéger, ajoutez un `.htaccess` dans le dossier `debug/`:
```apache
Order Deny,Allow
Deny from all
Allow from 127.0.0.1
Allow from YOUR_IP_ADDRESS
```

Ou supprimez le dossier complet avant le déploiement en production:
```bash
rm -rf api/debug/
```
