# Système de Tests Coffice

## Vue d'ensemble

Le système de tests complet de Coffice permet de vérifier automatiquement que toutes les fonctionnalités de l'application fonctionnent correctement. Il couvre :

- **Frontend** : Interface utilisateur React
- **Backend** : API PHP
- **Base de données** : MySQL
- **Workflows** : Processus métier complets

## Accès au système de tests

1. Connectez-vous en tant qu'administrateur
2. Accédez au menu **Admin** > **Tests Système**
3. Lancez les tests par catégorie ou tous ensemble

## Catégories de tests

### 1. Interface Utilisateur (Frontend)
- Chargement des pages publiques
- Navigation et routage
- Chargement des assets statiques
- Responsive design

### 2. Authentification
- Connexion utilisateur
- Inscription
- Génération et validation JWT
- Protection des routes admin

### 3. Gestion Utilisateurs
- Création d'utilisateur
- Liste des utilisateurs
- Modification d'utilisateur
- Suspension/Activation

### 4. Gestion Espaces
- Liste des espaces
- Création d'espace
- Modification d'espace
- Activation/Désactivation

### 5. Réservations
- Création de réservation
- Vérification de disponibilité
- Confirmation réservation
- Annulation réservation

### 6. Abonnements
- Liste des plans
- Création de plan
- Souscription utilisateur
- Calcul d'expiration

### 7. Domiciliation
- Création de demande
- Workflow de statuts
- Upload de documents
- Gestion du courrier

### 8. Codes Promo & Parrainage
- Création de code promo
- Validation de code
- Application de réduction
- Génération de code parrainage

### 9. Base de Données
- Connexion MySQL
- Intégrité des tables
- Triggers automatiques
- Performance des requêtes

### 10. API Backend
- Health check
- Gestion des erreurs
- Rate limiting
- Configuration CORS

### 11. Notifications Email
- Configuration SMTP
- Template bienvenue
- Template réservation
- Template domiciliation

## Architecture technique

### Frontend
**Fichier** : `src/pages/dashboard/admin/SystemTests.tsx`

Composant React qui affiche l'interface des tests avec :
- Catégories de tests organisées
- Progression en temps réel
- Affichage des résultats (succès/échec/warning)
- Export de rapports JSON

### Backend
**Fichier** : `scripts/run_system_tests.php`

Script PHP qui exécute les tests côté serveur :
- Connexion à la base de données
- Création de données de test réelles
- Validation des fonctionnalités
- Retour des résultats en JSON

### Endpoint API
**Route** : `/api/admin/tests/run`
**Méthode** : POST
**Corps** : `{ testId: string, category: string }`

## Données de test

Le système crée de vraies données de test dans la base de production :
- Utilisateurs de test (email: `test_timestamp@coffice-test.dz`)
- Espaces de test (nom: `Espace Test timestamp`)
- Réservations de test
- Domiciliations de test
- Codes promo de test
- Abonnements de test

**Important** : Ces données doivent être supprimées manuellement après les tests.

## Rapports

Le système génère des rapports détaillés avec :
- Nombre total de tests exécutés
- Nombre de succès/échecs
- Taux de réussite global
- Durée d'exécution de chaque test
- Détails des erreurs
- Score de santé système

Les rapports peuvent être exportés en JSON via le bouton "Exporter".

## Comment ajouter un nouveau test

1. **Ajouter la définition du test dans le frontend** (`SystemTests.tsx`) :
```typescript
{
  id: "category-X",
  name: "Nom du test",
  category: "category",
  status: "pending",
  message: "Description du test",
}
```

2. **Implémenter la méthode PHP** (`run_system_tests.php`) :
```php
public function test_category_X() {
    try {
        // Logique du test
        return ['success' => true, 'message' => 'Test réussi'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
```

## Interprétation des résultats

### Statuts
- **Succès (vert)** : Test passé sans erreur
- **Échec (rouge)** : Test échoué, action requise
- **Warning (jaune)** : Test passé avec avertissement
- **En cours (bleu)** : Test en cours d'exécution

### Score de santé
- **90-100%** : Excellent - Système opérationnel
- **70-89%** : Bon - Quelques améliorations possibles
- **<70%** : À améliorer - Actions correctives nécessaires

## Dépannage

### Erreur de connexion à la base de données
- Vérifier les variables d'environnement dans `.env`
- S'assurer que MySQL est accessible
- Vérifier les permissions utilisateur

### Tests qui échouent systématiquement
- Consulter les logs PHP
- Vérifier les permissions des fichiers
- S'assurer que toutes les tables existent

### Timeout sur les tests
- Augmenter `max_execution_time` dans PHP
- Optimiser les requêtes lentes
- Réduire le nombre de tests exécutés simultanément

## Bonnes pratiques

1. **Exécuter les tests régulièrement** : Après chaque mise à jour majeure
2. **Vérifier les données de test** : Supprimer les données obsolètes
3. **Documenter les échecs** : Noter les erreurs récurrentes
4. **Isoler les problèmes** : Exécuter les tests par catégorie
5. **Monitorer les performances** : Suivre l'évolution du taux de réussite

## Sécurité

- Les tests sont accessibles uniquement aux administrateurs
- Les données de test sont clairement identifiables (`test_`, `Test`)
- Les tests n'affectent pas les données de production (sauf création de test data)
- Les tokens JWT sont validés avant chaque test

## Support

Pour toute question ou problème avec le système de tests, consulter :
- La documentation technique dans le code
- Les logs PHP dans `api/logs/`
- Les rapports de tests exportés
