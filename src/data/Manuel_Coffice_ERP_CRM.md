# Manuel d'utilisation — ERP/CRM Coffice
**À l'intention des employés — Usage quotidien**

---

## Table des matières

1. [Vue d'ensemble de l'interface](#1-vue-densemble)
2. [Tableau de bord — Réception & Opérations du jour](#2-tableau-de-bord)
3. [Locations (Espaces)](#3-locations)
4. [Domiciliations](#4-domiciliations)
5. [Courrier](#5-courrier)
6. [Caisse](#6-caisse)
7. [CRM — Contacts](#7-crm--contacts)
8. [Abonnements](#8-abonnements)
9. [Utilisateurs](#9-utilisateurs)
10. [Espaces](#10-espaces)
11. [Codes Promo](#11-codes-promo)
12. [Parrainages](#12-parrainages)
13. [Rapports](#13-rapports)
14. [Procédures quotidiennes — Checklist](#14-checklist-quotidienne)

---

## 1. Vue d'ensemble

L'interface admin de Coffice est accessible depuis `coffice.dz/app/admin`. Elle regroupe tous les outils nécessaires à la gestion quotidienne du coworking et du service de domiciliation.

### Navigation principale
Le menu latéral gauche donne accès à tous les modules. Les sections principales sont :

| Module | Usage |
|---|---|
| **Tableau de bord** | Point de départ de chaque journée — opérations du jour, check-in/check-out, alertes |
| **Caisse** | Enregistrement des paiements et clôture journalière |
| **Locations** | Gestion complète des réservations d'espaces |
| **Domiciliations** | Dossiers domiciliation et suivi des contrats |
| **Courrier** | Réception et traitement du courrier des domiciliés |
| **Contacts** | CRM prospects et clients |
| **Abonnements** | Plans et demandes d'abonnement |
| **Utilisateurs** | Gestion des comptes clients |
| **Espaces** | Paramétrage des salles et bureaux |
| **Codes Promo** | Création et suivi des remises |
| **Parrainages** | Programme de parrainage |
| **Rapports** | Statistiques et exports |

---

## 2. Tableau de bord — Réception & Opérations du jour

**Accès :** Menu → Tableau de bord (page d'accueil)

C'est le **point de départ et le poste de travail central** de chaque journée. Il centralise en un seul écran toutes les opérations du jour : accueil des clients, check-in/check-out, alertes et disponibilité des espaces. Les données se rafraîchissent automatiquement toutes les 2 minutes.

---

### Indicateurs du jour (KPIs)

En haut de la page, 4 cartes résument l'état actuel :

| Indicateur | Signification |
|---|---|
| **Réservations** | Nombre total de locations prévues aujourd'hui |
| **Présents** | Clients actuellement sur place (check-in effectué) |
| **En attente** | Locations à confirmer |
| **Alertes** | Actions requises (abonnements, domiciliations, courrier) |

---

### Planning du jour

Section centrale : toutes les locations d'aujourd'hui, triées par catégorie.

| Catégorie | Signification |
|---|---|
| **En cours** | Client actuellement sur place |
| **Arrive bientôt** | Client attendu dans moins de 60 minutes |
| **À venir** | Locations confirmées pour plus tard dans la journée |
| **Terminées** | Locations clôturées |
| **Annulées / No-show** | Annulations et absences constatées |

Une barre de **recherche rapide** permet de filtrer par nom de client, espace ou numéro de téléphone.

---

### Actions sur chaque location du jour

Chaque ligne de location affiche les boutons d'action adaptés à son statut :

**✓ Confirmer** (location En attente)
Cliquez le bouton ✓ pour valider une demande en attente. La location passe en "Confirmée" et le client est notifié.

**▶ Check-in (Arrivée)**
Cliquez **Check-in** quand le client se présente à l'accueil. Ceci marque la location comme "En cours" et enregistre l'heure réelle d'arrivée. Si le client arrive en retard, le système calcule automatiquement le retard en minutes.

**◀ Check-out (Départ)**
Cliquez **Check-out** quand le client quitte les lieux. La location passe en "Terminée".

**✕ No-show**
Si le client ne vient pas sans prévenir après la fin de son créneau, cliquez **No-show**. La location est marquée comme telle dans l'historique et les statistiques.

> **Important :** Effectuez systématiquement le check-in à l'arrivée et le check-out au départ. Ces actions garantissent des statistiques d'occupation fiables et permettent au système de libérer l'espace automatiquement.

---

### Disponibilité des espaces (temps réel)

Chaque espace est affiché avec une couleur indiquant son état actuel :

- 🟢 **Vert** — Libre maintenant
- 🟠 **Orange** — Une location est confirmée plus tard dans la journée
- 🔴 **Rouge** — Occupé actuellement (client sur place)

---

### Caisse du jour (résumé)

Une barre en haut affiche le total encaissé du jour et le nombre de transactions, avec le détail par mode de paiement. Cliquez **Gérer la caisse** pour accéder au module complet.

---

### Alertes

En bas du tableau de bord, 3 widgets signalent les actions requises :

**Abonnements à valider**
Liste des souscriptions en attente de confirmation. Cliquez **Gérer les souscriptions** pour traiter.

**Domiciliations expirantes**
Contrats expirant dans les 30 jours. Contactez les clients concernés pour lancer le renouvellement.

**Courriers non traités**
Courriers reçus non encore traités. Cliquez **Gérer le courrier** pour traiter.

---

## 3. Locations

**Accès :** Menu → Locations

Gestion complète des réservations d'espaces — toutes dates confondues.

### Comprendre les deux origines

Chaque location porte un badge **Origine** :
- 🌐 **En ligne** — Le client a réservé lui-même depuis l'application
- 🏪 **Guichet** — La location a été créée manuellement par un employé

### Créer une location au guichet

1. Cliquez **+ Nouvelle location**
2. Sélectionnez le **client** (recherche par nom ou email) ou entrez un contact ad hoc
3. Choisissez l'**espace** dans la liste déroulante
4. Renseignez la **date et heure de début**, la **date et heure de fin**
5. Indiquez le nombre de **participants**
6. Ajoutez des **notes** si nécessaire (ex : besoin matériel spécifique)
7. Cliquez **Créer la location**

> Le montant est calculé automatiquement en fonction du tarif de l'espace.

### Cycle de vie d'une location

```
En attente → Confirmée → En cours → Terminée
                ↓
             Annulée
```

| Statut | Signification |
|---|---|
| **En attente** | Demande en ligne non encore traitée |
| **Confirmée** | Acceptée, client prévenu |
| **En cours** | Client sur place (check-in effectué) |
| **Terminée** | Location clôturée |
| **Annulée** | Annulée avant ou pendant la location |

### Gérer une location existante

Cliquez sur une ligne du tableau → le **panneau de détail** s'ouvre à droite avec :

**Changer le statut**
- **Confirmer** / **Refuser** → pour les locations "En attente"
- **Marquer en cours** → pour les locations "Confirmées"
- **Marquer terminée** → pour clôturer manuellement

**Annuler une location**
Le lien "Annuler la location" en rouge est disponible pour tout statut sauf Annulée et Terminée.

### Encaisser un paiement

1. Ouvrez le panneau de détail d'une location (statut : Confirmée, En cours, ou Terminée)
2. Cliquez **Encaisser** (bouton vert avec le montant)
3. Dans la fenêtre qui s'ouvre, vérifiez le montant et choisissez le **mode de paiement** :
   - Espèces
   - TPE (carte bancaire)
   - Virement
   - Chèque
   - Crédit (wallet client)
4. Renseignez une **référence** si nécessaire
5. Cliquez **Confirmer l'encaissement**

Un numéro de reçu est généré automatiquement. La transaction apparaît dans la Caisse.

### Filtres et recherche

- **Recherche** : tapez le nom du client, l'espace, ou le numéro de reçu
- **Filtre statut** : filtrez par En attente / Confirmée / En cours / Terminée / Annulée
- **Filtre date** : limitez l'affichage à une plage de dates

### Exporter les données

Cliquez **Exporter CSV** pour télécharger la liste filtrée au format tableur.

---

## 4. Domiciliations

**Accès :** Menu → Domiciliations

Module de gestion des contrats de domiciliation commerciale. Coffice propose l'adresse du bureau 1178, Mohammadia Mall, 4ème étage, Alger comme siège social officiel pour ses clients.

### Deux vues disponibles

**Vue liste** : tableau avec tous les dossiers, triable et filtrable
**Vue Kanban** : colonnes par étape du workflow — recommandée pour suivre l'avancement des dossiers

### Workflow d'un dossier domiciliation

Un dossier passe obligatoirement par ces étapes dans l'ordre :

```
Dossier préparatoire
        ↓
  En attente de signature notariale
        ↓
  Domiciliation créée
        ↓
      Active
        ↓
  Résiliée / Expirée
```

À tout moment, un dossier peut être refusé ou passer en "Attente de compléments".

### Comprendre les statuts

| Statut | Signification | Action requise |
|---|---|---|
| **Dossier préparatoire** | Demande soumise par le client, en cours d'examen | Valider ou demander des compléments |
| **En attente de compléments** | Documents ou infos manquants demandés au client | Attendre la réponse client |
| **En attente de signature** | Dossier validé, rendez-vous notaire à organiser | Enregistrer la signature après le RDV |
| **Domiciliation créée** | Contrat signé chez le notaire | Activer la domiciliation |
| **Active** | Service opérationnel | Suivi mensuel, renouvellement |
| **Résiliée / Expirée** | Contrat terminé | Archivé |

### Traiter un dossier

Cliquez sur un dossier → page de détail avec 6 onglets :

| Onglet | Contenu |
|---|---|
| **Informations** | Données de l'entreprise et du dirigeant |
| **Contrat** | Numéro de bureau, dates, montant mensuel, réf. notariale |
| **Courrier** | Historique du courrier reçu pour ce client |
| **Documents** | Pièces justificatives uploadées, avec validation possible |
| **Notes** | Notes internes (non visibles par le client) |
| **Historique** | Journal de toutes les actions effectuées sur le dossier |

### Actions disponibles (panneau de droite)

**Valider le dossier**
→ Passe en "En attente de signature notariale"
À faire après avoir vérifié que tous les documents sont corrects et complets.

**Demander des compléments**
→ Passe en "En attente de compléments"
Précisez dans le champ texte exactement ce qui manque. Le client reçoit une notification automatique.

**Enregistrer la signature notariale**
→ Passe en "Domiciliation créée"
Renseignez :
- Numéro de bureau attribué (1 à 60)
- Référence du contrat notarié (ex : CONT-2026-001)
- Date de début du contrat
- Date de fin du contrat
- Montant mensuel (DA)

> Vérifiez que le numéro de bureau n'est pas déjà attribué à un autre client actif. Le système affiche les bureaux occupés en rouge.

**Activer la domiciliation**
→ Passe en "Active"
À faire après confirmation que le contrat est bien en place.

**Renouveler le contrat**
Pour les contrats actifs ou expirés. Renseignez les nouvelles dates et le nouveau montant.

**Résilier la domiciliation**
Action irréversible. Un motif est obligatoire. Une double confirmation est demandée.

**Refuser la demande**
Action irréversible. Un motif est obligatoire.

### Complétude du dossier

Le widget **"Complétude du dossier"** (panneau droit) affiche un score en pourcentage et liste les éléments manquants : documents non uploadés, champs non renseignés, bureau non attribué, etc. Visez 100% avant d'activer un dossier.

### Alertes d'expiration

Dans la vue liste, les dossiers dont le contrat expire bientôt sont signalés :
- 🟡 Moins de 30 jours → avertissement
- 🔴 Moins de 7 jours → critique

Contactez le client pour lancer le renouvellement avant l'expiration.

### Créer une domiciliation manuellement

Cliquez **+ Nouvelle domiciliation** pour créer un dossier directement depuis l'admin (client présent physiquement ou par téléphone).

---

## 5. Courrier

**Accès :** Menu → Courrier

Gestion du courrier reçu pour le compte des clients domiciliés chez Coffice.

### Enregistrer un nouveau courrier

1. Cliquez **+ Nouveau courrier**
2. Sélectionnez le **client domicilié** destinataire
3. Choisissez le **type** de courrier :
   - Lettre simple
   - Colis
   - Recommandé
   - Courrier officiel (administratif)
   - Autre
4. Renseignez **l'expéditeur**
5. Ajoutez une **description** si utile (ex : "Notification DCP", "Colis Algérie Poste")
6. Validez → le client reçoit une notification automatique par email

### Cycle de traitement du courrier

```
Reçu → Notifié → En attente d'instruction
                         ↓
              Récupéré / Scanné / Réexpédié
                         ↓
                      Traité
```

| Statut | Signification |
|---|---|
| **Reçu** | Courrier arrivé, pas encore traité |
| **Notifié** | Client informé par notification |
| **En attente d'instruction** | Le client doit indiquer que faire du courrier |
| **Récupéré** | Le client est venu chercher son courrier |
| **Scanné** | Courrier numérisé et envoyé par email |
| **Réexpédié** | Courrier renvoyé à une autre adresse |
| **Traité** | Processus terminé |

### Actions disponibles sur un courrier

- **Marquer récupéré** : le client est venu chercher son courrier en main propre
- **Marquer scanné** : vous avez numérisé le courrier et l'avez envoyé
- **Marquer réexpédié** : vous avez envoyé le courrier à l'adresse demandée par le client
- **Ajouter une note admin** : information interne (non visible par le client)

### Bonnes pratiques

> - Enregistrez systématiquement chaque courrier **dès réception**, même si le client ne l'a pas encore réclamé.
> - Pour les recommandés, notez le numéro de suivi en description.
> - Pour les courriers officiels (DCP, wilaya, impôts), marquez-les comme "Officiel" — le client reçoit une alerte prioritaire.

---

## 6. Caisse

**Accès :** Menu → Caisse

Enregistrement de tous les encaissements journaliers et gestion de la clôture de caisse.

### Structure de la caisse

La caisse affiche :
- Le **total encaissé du jour** par mode de paiement
- La **liste de toutes les transactions** du jour
- L'**historique** des jours précédents

### Créer une transaction manuelle

Pour enregistrer un paiement non lié à une location ou domiciliation (ex : vente d'un service ponctuel) :

1. Cliquez **+ Nouvelle transaction**
2. Choisissez le **type** : Encaissement / Remboursement
3. Sélectionnez le **mode de paiement** :
   - Espèces
   - TPE / Carte bancaire
   - Virement bancaire
   - Chèque
   - Crédit client
4. Saisissez le **montant** (en DA)
5. Ajoutez une **note descriptive** (ex : "Abonnement mensuel Mars 2026 — M. Kaci")
6. Renseignez une **référence** si disponible (numéro de chèque, référence virement)
7. Validez

Un **numéro de reçu** est généré automatiquement (format : RC-XXXXXX).

> **Important :** Ne créez jamais une transaction manuellement pour une location — utilisez le bouton "Encaisser" dans le module Locations. Cela garantit la traçabilité.

### Clôture de caisse

En fin de journée :
1. Cliquez **Clôturer la caisse**
2. Vérifiez les totaux par mode de paiement
3. Confirmez la clôture

Une clôture crée un rapport récapitulatif horodaté. La caisse du lendemain repart à zéro.

### Filtres

- Par **mode de paiement** : comparez espèces vs TPE vs chèque
- Par **date** : consultez l'historique d'un jour précédent
- Par **type** : encaissements uniquement, ou tout

---

## 7. CRM — Contacts

**Accès :** Menu → Contacts

Base de données des prospects et clients non encore inscrits sur la plateforme.

### Quand utiliser les Contacts vs Utilisateurs ?

| Contacts | Utilisateurs |
|---|---|
| Prospect qui n'a pas encore de compte | Client avec compte Coffice actif |
| Lead commercial issu d'un appel/visite | Compte créé en ligne ou par vous |
| Contact d'une entreprise (pas de login) | A accès à l'application |

### Créer un contact

1. Cliquez **+ Nouveau contact**
2. Renseignez : Nom, Prénom, Téléphone, Email
3. Ajoutez l'entreprise si applicable
4. Précisez la **source** (comment ce contact vous a trouvé) :
   - Réseaux sociaux
   - Bouche à oreille
   - Site web
   - Salon / événement
   - Autre
5. Choisissez le **statut** :
   - Prospect (premier contact)
   - Lead (intérêt confirmé)
   - Client (déjà acheté)

### Vue détail d'un contact

Cliquez sur un contact pour voir :
- Ses coordonnées complètes
- Son historique d'interactions
- La possibilité de **convertir en utilisateur** (crée un compte Coffice pour lui)

### Convertir un contact en utilisateur

Quand un prospect souhaite créer un compte :
1. Ouvrez la fiche du contact
2. Cliquez **Convertir en utilisateur**
3. Vérifiez les informations pré-remplies
4. Validez → un compte est créé, le client reçoit ses identifiants par email

---

## 8. Abonnements

**Accès :** Menu → Abonnements

Gestion des formules d'abonnement et validation des demandes clients.

### Onglet Plans

Liste de toutes les formules disponibles (Mensuel, Trimestriel, Annuel, etc.) avec leurs tarifs.

**Pour modifier un plan :**
1. Cliquez l'icône crayon sur la ligne du plan
2. Modifiez le nom, le prix, la durée ou les avantages
3. Sauvegardez

**Pour désactiver un plan** (sans le supprimer) : basculez l'interrupteur Actif/Inactif.

### Onglet Demandes

Liste les abonnements en attente de validation soumis par des clients depuis l'application.

**Pour chaque demande, vous voyez :**
- Nom du client, email
- Formule souhaitée, prix
- Date de la demande, date de début souhaitée
- Statut : En attente / Actif / Refusé / Annulé

**Valider un abonnement :**
1. Cliquez sur la ligne de la demande
2. Cliquez **Valider**
3. L'abonnement passe en "Actif" — le client est notifié

**Refuser un abonnement :**
1. Cliquez **Refuser**
2. Saisissez optionnellement un motif de refus
3. Confirmez — le client est notifié

---

## 9. Utilisateurs

**Accès :** Menu → Utilisateurs

Gestion de tous les comptes clients de la plateforme.

### Rechercher un utilisateur

Utilisez la barre de recherche (nom, email, entreprise). Filtres disponibles :
- Par **rôle** : Utilisateur / Administrateur
- Par **statut** : Actif / Inactif

### Fiche utilisateur

Cliquez sur une ligne pour ouvrir la page de détail avec :
- Informations personnelles (nom, email, téléphone, entreprise)
- Nombre de locations actives
- Date d'inscription
- Crédit wallet (en DA)

### Actions disponibles

**Créer un utilisateur** (compte guichet)
→ Cliquez **+ Nouvel utilisateur** → remplissez le formulaire → l'email/mot de passe sont envoyés au client

**Changer le rôle**
→ Cliquez sur le badge Rôle (Utilisateur / Administrateur)
→ Une confirmation est demandée — **n'accordez le rôle Admin qu'avec autorisation de la direction**

**Désactiver / Réactiver un compte**
→ Un utilisateur désactivé ne peut plus se connecter ni réserver
→ Utilisez cette option plutôt que la suppression

**Supprimer un compte**
→ Action irréversible, demande double confirmation
→ À n'utiliser qu'en dernier recours (les données de réservation restent dans le système)

**Exporter**
→ Cliquez **Exporter CSV** pour extraire la liste des utilisateurs

---

## 10. Espaces

**Accès :** Menu → Espaces

Paramétrage des salles, bureaux et espaces disponibles à la location.

> **Note :** Ce module est principalement utilisé lors de l'ouverture ou d'une modification tarifaire. Toute modification impacte immédiatement les prix affichés aux clients.

### Informations d'un espace

| Champ | Détail |
|---|---|
| Nom | Nom affiché aux clients (ex : Atlas, Aurès, Hoggar) |
| Type | Box / Bureau / Salle de réunion / Open space |
| Capacité | Nombre de personnes maximum |
| Tarif horaire | Prix pour une heure |
| Tarif demi-journée | Prix pour 4 heures |
| Tarif journée | Prix pour 8 heures |
| Tarif semaine | Prix pour 5 jours |
| Équipements | WiFi, écran, café, imprimante, visioconférence |
| Disponibilité | Actif / Inactif (masqué des réservations si inactif) |

### Modifier les tarifs

1. Cliquez l'icône crayon sur l'espace concerné
2. Modifiez les champs tarifaires
3. Le système vérifie la cohérence : tarif journée > demi-journée > horaire
4. Sauvegardez

### Vue grille / Vue liste

Basculez entre les deux vues selon vos préférences. La vue grille donne un aperçu visuel avec les équipements, la vue liste est plus compacte pour comparer les tarifs.

---

## 11. Codes Promo

**Accès :** Menu → Codes Promo

Création et gestion des remises promotionnelles.

### Types de remises

| Type | Exemple |
|---|---|
| **Pourcentage** | -20% sur le montant total |
| **Montant fixe** | -2 000 DA sur la commande |

### Créer un code promo

1. Cliquez **+ Nouveau code**
2. Saisissez le code (ex : COFFICE2026) ou cliquez **Générer** pour un code aléatoire
3. Choisissez le type de remise et la valeur
4. Définissez les **dates de validité** (début et fin)
5. Fixez le **nombre d'utilisations maximum** (0 = illimité)
6. Optionnel : ajoutez un **montant minimum** de commande pour que le code soit applicable
7. Choisissez l'**applicabilité** :
   - Locations uniquement
   - Abonnements uniquement
   - Domiciliation uniquement
   - Tous les services
8. Activez ou laissez inactif jusqu'à la date de lancement
9. Sauvegardez

### Suivi de l'utilisation

Chaque code affiche une barre de progression :
- 🟢 Moins de 70% utilisé
- 🟡 Entre 70% et 90% utilisé
- 🔴 Plus de 90% ou épuisé

Le statut se met à jour automatiquement :
- **Actif** — En cours de validité
- **Expiré** — Date de fin dépassée
- **Épuisé** — Nombre max d'utilisations atteint
- **Désactivé** — Manuellement désactivé

### Copier un code

Cliquez l'icône copier sur la ligne du code pour le copier dans le presse-papier (utile pour l'envoyer à un client).

---

## 12. Parrainages

**Accès :** Menu → Parrainages

Suivi du programme de parrainage : un client existant (parrain) recommande Coffice à un proche (filleul) et reçoit une récompense à la première réservation du filleul.

### Comprendre le programme

- **Parrain** : client qui partage son code de parrainage → reçoit X DA de crédit
- **Filleul** : nouveau client qui utilise le code lors de son inscription → reçoit Y DA de crédit
- Les montants sont configurés dans les paramètres (section business rules)

### Cycle d'un parrainage

```
En attente → Validé → Payé
```

| Statut | Signification |
|---|---|
| **En attente** | Le filleul est inscrit mais n'a pas encore effectué sa première réservation |
| **Validé** | Première réservation effectuée — crédits à accorder |
| **Payé** | Crédits effectivement crédités sur les wallets |

### Actions

**Valider un parrainage**
Passez un parrainage de "En attente" à "Validé" après vérification de la première réservation du filleul.

**Marquer comme payé**
Après avoir crédité les wallets des deux parties, passez le statut à "Payé".

### Tableau des meilleurs parrains

Le widget en haut de page affiche le **top 5 des parrains** avec leur nombre de filleuls et les récompenses totales. Utile pour identifier vos ambassadeurs les plus actifs.

---

## 13. Rapports

**Accès :** Menu → Rapports

Tableaux de bord statistiques pour le suivi de l'activité globale.

### Indicateurs disponibles

- **Chiffre d'affaires** : total mensuel et comparaison avec le mois précédent
- **Locations** : nombre, taux d'occupation par espace
- **Domiciliations actives** : évolution du portefeuille
- **Abonnements** : revenus récurrents
- **Nouveaux clients** : acquisitions mensuelles
- **Parrainages** : nombre et valeur des récompenses accordées

### Exporter les données

Chaque graphique propose un bouton d'export CSV pour extraire les données brutes vers Excel.

---

## 14. Checklist quotidienne

Procédure recommandée pour une journée de travail type.

### ☀️ Ouverture (matin)

- [ ] Ouvrir le **Tableau de bord** — identifier les alertes et les locations du jour
- [ ] Consulter le **planning du jour** et signaler tout problème d'attribution d'espace
- [ ] Parcourir les **domiciliations expirantes** et préparer les relances
- [ ] Vérifier les **courriers non traités** de la veille
- [ ] Vérifier les **demandes d'abonnement** en attente de validation

### 🔄 En cours de journée

- [ ] Effectuer les **check-in** à l'arrivée des clients (depuis le Tableau de bord)
- [ ] **Enregistrer chaque courrier** à sa réception
- [ ] **Encaisser les paiements** via le module Locations (pas de transaction manuelle sauf exception)
- [ ] Mettre à jour les **statuts de domiciliation** dès qu'une action est réalisée
- [ ] Répondre aux **demandes de compléments** des clients en attente

### 🌙 Clôture (soir)

- [ ] Effectuer les **check-out** des clients encore présents (depuis le Tableau de bord)
- [ ] Marquer en **No-show** les absences constatées
- [ ] **Clôturer la caisse** et vérifier la cohérence des totaux
- [ ] Traiter les **courriers récupérés dans la journée** (marquer Récupéré / Traité)
- [ ] Vérifier qu'il n'y a plus de **locations En cours** actives

---

## Conseils importants

**Traçabilité**
Toujours utiliser les boutons dédiés (Encaisser, Valider, etc.) plutôt que de créer des entrées manuelles — cela garantit un historique cohérent et des rapports fiables.

**Statuts irréversibles**
Les actions **Refuser**, **Résilier**, et **Supprimer** sont irréversibles. En cas de doute, préférez **Désactiver** ou **Annuler** (qui peut être suivi).

**Confidentialité**
Les notes internes sur les dossiers domiciliation et les fiches clients ne sont pas visibles par les clients. Vous pouvez y noter librement des informations de suivi.
