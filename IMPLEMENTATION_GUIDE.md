# Guide d'Implémentation - Coffice v4.3.0

## ✅ Travaux Complétés

### Phase 1: Nettoyage & Corrections (100% complété)

#### Suppressions effectuées
- Module ERP doublon (1498 lignes)
- Modules admin non fonctionnels (WalkIns, Blocages, SystemTests)
- Module CodesPromo côté utilisateur
- Dossier `api/debug/` complet
- Fichiers de test: `test.php`, `test-create.php`, `run_system_tests.php`
- Scripts obsolètes: `test_api.php`, `audit_api.php`, `create_admin_web.php`
- Images en doublon dans `/public`
- Dépendances NPM inutilisées: `@tanstack/react-query`, `@tanstack/react-table`, `qrcode.react`

#### Bugs corrigés
1. Double conversion snake_case dans `api-client.ts` (createEspace, updateEspace)
2. Adaptateur manquant dans `authStore.register()`
3. Calcul erroné du taux d'occupation (utilisait capacite au lieu de participants)
4. Suppression de `calculateReservationAmount` (code mort)
5. Nettoyage imports inutiles (rawUser, use from i18next)

### Phase 2: Infrastructure SQL (100% complété)

#### Migrations créées

**012_checkin_checkout.sql**
- Table `checkins` (arrivées/départs réels)
- Colonnes ajoutées à `reservations`: `no_show`, `checkin_id`

**013_caisse_paiements.sql**
- Table `transactions_caisse` (toutes transactions financières)
- Table `clotures_caisse` (clôtures journalières)

**014_gestion_courrier.sql**
- Table `courriers` (workflow complet courrier domiciliation)
- Colonnes ajoutées: `domiciliations.alerte_expiration_envoyee`, `abonnements_utilisateurs.credits_restants`

#### Endpoints PHP créés

**api/email/send.php**
- Envoi d'emails (admin uniquement)
- POST avec params: to, subject, html

**api/abonnements/souscrire.php**
- Souscription abonnement par utilisateur
- Vérification abonnement actif existant
- Calcul automatique date fin selon durée

**api/domiciliations/public-stats.php**
- Stats publiques: nombre entreprises domiciliées actives
- GET sans authentification

---

## 📋 Phase 3: Backend PHP à développer

### Endpoints Check-in / Check-out

**api/checkins/create.php**
```php
POST /api/checkins/create.php
Body: {
  "reservation_id": "uuid",
  "heure_arrivee_reel le": "2026-03-12 09:05:00",
  "note": "Arrivé en avance"
}
Response: { "success": true, "id": "uuid" }
```

**api/checkins/checkout.php**
```php
PUT /api/checkins/checkout.php
Body: {
  "checkin_id": "uuid",
  "heure_depart_reel": "2026-03-12 17:30:00"
}
Response: { "success": true, "duree_minutes": 510 }
```

**api/checkins/index.php**
```php
GET /api/checkins/index.php?date=2026-03-12
Response: {
  "checkins": [...],
  "presences_actuelles": 12
}
```

### Endpoints Caisse

**api/caisse/transactions.php**
```php
GET /api/caisse/transactions.php?date=2026-03-12
POST /api/caisse/transactions.php
Body: {
  "reservation_id": "uuid",
  "type_transaction": "reservation",
  "montant": 5000,
  "mode_paiement": "cash",
  "reference_paiement": null
}
Response: {
  "success": true,
  "numero_recu": "REC-2026-0001"
}
```

**api/caisse/cloture.php**
```php
POST /api/caisse/cloture.php
Body: { "date_cloture": "2026-03-12" }
Calcule automatiquement:
- total_cash, total_virement, total_cheque, total_tpe
- total_general, nombre_transactions
Response: { "success": true, "id": "uuid" }
```

**api/caisse/recu.php**
```php
GET /api/caisse/recu.php?transaction_id=uuid
Génère PDF avec:
- Logo Coffice
- Numéro reçu
- Date, client, montant, mode paiement
Response: PDF file download
```

### Endpoint Courrier

**api/admin/courrier.php**
```php
GET /api/admin/courrier.php?domiciliation_id=uuid
POST /api/admin/courrier.php (admin: enregistrer réception)
Body: {
  "domiciliation_id": "uuid",
  "type": "recommande",
  "expediteur": "La Poste",
  "description": "Lettre recommandée",
  "photo_url": "/uploads/courrier/xxx.jpg"
}
Auto: envoi email + notification au client

PUT /api/admin/courrier.php (client: donner instruction)
Body: {
  "courrier_id": "uuid",
  "instruction_client": "scanner"
}
Auto: mise à jour statut, notification admin

Response: { "success": true }
```

---

## 🎨 Phase 4: Frontend à développer

### Page Admin: Caisse (`/app/admin/caisse`)

**Créer:** `src/pages/dashboard/admin/Caisse.tsx`

**Composants:**
1. **Journal du jour**
   - Tableau transactions avec colonnes: heure, type, montant, mode, reçu
   - Totaux par mode de paiement (cash, virement, chèque, TPE)
   - Total général

2. **Modal encaissement**
   - Déclenchée à la confirmation d'une réservation
   - Champs: montant perçu, mode paiement, référence
   - Génération auto numéro reçu REC-AAAA-XXXX
   - Bouton télécharger reçu PDF

3. **Section clôture**
   - Bouton "Clôturer la journée"
   - Modal confirmation avec récapitulatif
   - Liste historique clôtures (date, total, admin)

4. **Widgets stats**
   - CA du jour (barre progression vs objectif mensuel)
   - CA du mois (comparaison mois précédent)

**Routes à ajouter:**
- Dans `Dashboard.tsx`: `<Route path="admin/caisse" element={<Caisse />} />`
- Dans `DashboardLayout.tsx`: Ajouter lien menu sidebar admin

### Page Admin: Aujourd'hui (enrichie)

**Modifier:** `src/pages/dashboard/admin/Aujourdhui.tsx`

**Fonctionnalités à ajouter:**

1. **Boutons Check-in/Check-out**
   - Pour chaque réservation confirmée du jour
   - "Arrivée" → capture heure réelle, calcul retard, passe statut "en_cours"
   - "Départ" → capture heure départ, calcul durée présence, passe "terminee"

2. **Compteur présences**
   - Widget en haut: "X personnes actuellement présentes"
   - Temps réel (somme participants des checkins statut "en_cours")

3. **Alertes no-shows**
   - Bandeau rouge pour réservations sans check-in 30 min après heure prévue
   - Bouton action: "Marquer absent" / "Contacter client"

4. **Timeline visuelle**
   - Vue Gantt horizontale de la journée 8h-20h
   - Blocs colorés par espace et statut
   - Tooltip: nom client, participants, heure arrivée réelle

5. **Section "Prochaines arrivées"**
   - 5 prochaines réservations attendues
   - Nom client, espace, heure, participants

6. **Widget revenus**
   - CA du jour en cours
   - Comparaison J-1

### Onglet Courrier Utilisateur

**Modifier:** `src/components/domiciliation/CourrierUtilisateur.tsx`

**Workflow à implémenter:**

1. **Liste courriers reçus**
   - Tableau: date réception, type, expéditeur, statut
   - Badge couleur selon statut
   - Photo miniature si disponible

2. **Pour chaque courrier "notifié":**
   - 3 boutons radio: "Je viens le récupérer" / "Scannez-le" / "Réexpédiez-le"
   - Bouton "Valider mon choix"
   - Appel PUT `/api/admin/courrier.php` avec instruction

3. **Courriers traités:**
   - Lien téléchargement scan si disponible
   - Date de traitement
   - Badge "Récupéré" / "Scanné" / "Réexpédié"

4. **Filtres:**
   - Par date
   - Par type
   - Par statut

---

## 🔔 Phase 5: Automatisations (Scripts PHP)

### Script: Alertes expiration domiciliation

**Créer:** `api/cron/alertes_domiciliation.php`

```php
// À exécuter quotidiennement via cron: 0 9 * * *

// Récupérer domiciliations avec date_fin dans 30, 15, 7 jours
// Si alerte_expiration_envoyee = 0 pour le palier concerné:
//   - Envoyer email au client
//   - Créer notification in-app
//   - Créer notification admin
//   - Marquer alerte_expiration_envoyee = 1
```

### Script: Alertes abonnements

**Créer:** `api/cron/alertes_abonnements.php`

```php
// À exécuter quotidiennement via cron: 0 9 * * *

// Récupérer abonnements_utilisateurs avec date_fin dans 7 jours
// Envoyer email + notification
```

### Script: Résumé quotidien admin

**Créer:** `api/cron/resume_quotidien_admin.php`

```php
// À exécuter chaque matin: 0 8 * * *

// Email admin avec:
// - Réservations du jour (planning)
// - Réservations en attente validation
// - CA de la veille
// - Domiciliations expirant bientôt
// - Abonnements expirant bientôt
```

### Cron job à configurer

```bash
# Dans crontab -e

# Rappels réservations J-1 (existant, à activer)
0 18 * * * php /path/to/api/send_reminders.php

# Cleanup réservations expirées (existant)
0 2 * * * php /path/to/api/cleanup_expired.php

# Nouveaux scripts
0 9 * * * php /path/to/api/cron/alertes_domiciliation.php
0 9 * * * php /path/to/api/cron/alertes_abonnements.php
0 8 * * * php /path/to/api/cron/resume_quotidien_admin.php
```

---

## 📊 Phase 6: KPI & Rapports avancés

**Modifier:** `src/pages/dashboard/admin/Reports.tsx`

### Nouveaux composants à créer

**1. Heatmap Taux de remplissage**
```tsx
// Tableau 2D: Espaces (Y) × Tranches horaires (X)
// Couleur: Vert (libre) → Orange (50%) → Rouge (100%)
// Données: Grouper réservations par espace et tranche 2h
```

**2. Funnel de conversion**
```tsx
// 3 barres horizontales:
// - Demandes de réservation (100%)
// - Confirmées (%)
// - Payées (%)
// Taux affichés entre chaque étape
```

**3. Widget ARPU**
```tsx
// Revenu moyen par client
// Calcul: Total CA / Nombre clients ayant réservé
// Comparaison mois précédent
```

**4. Tableau No-shows par client**
```tsx
// Liste clients avec:
// - Nombre total réservations
// - Nombre no-shows
// - Taux %
// Tri par taux décroissant
// Flag "Problématique" si > 20%
```

**5. Graphe Durée moyenne réservations**
```tsx
// Barre par type d'espace
// Moyenne heures de réservation
```

**6. Évolution CA mensuelle**
```tsx
// Ligne Chart sur 12 mois
// Comparaison année N vs N-1
```

**7. Top 5 Clients**
```tsx
// Liste avec: Nom, CA généré, Nombre réservations
// Ordre décroissant par CA
```

**8. Taux renouvellement abonnements**
```tsx
// % abonnements renouvelés vs expirés
// Sur les 3 derniers mois
```

---

## 📄 Phase 7: Génération PDF

### Contrat domiciliation

**Créer:** `src/utils/pdf-generator.ts`

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function genererContratDomiciliation(demande: DemandeDomiciliation) {
  const doc = new jsPDF();

  // Header avec logo
  doc.addImage('/logo_coffice.png', 'PNG', 10, 10, 40, 20);

  // Titre
  doc.setFontSize(18);
  doc.text('CONTRAT DE DOMICILIATION', 105, 40, { align: 'center' });

  // Infos Coffice
  doc.setFontSize(10);
  doc.text('COFFICE', 10, 55);
  doc.text('Bureau 1178, 4e étage', 10, 60);
  doc.text('Mohammadia Mall, Alger', 10, 65);

  // Infos Entreprise
  doc.text(`ENTRE: ${demande.raisonSociale}`, 10, 80);
  doc.text(`Forme juridique: ${demande.formeJuridique}`, 10, 85);
  doc.text(`NIF: ${demande.nif}`, 10, 90);
  doc.text(`Représentée par: ${demande.representantNom} ${demande.representantPrenom}`, 10, 95);

  // Termes du contrat
  doc.text('ARTICLE 1: Objet', 10, 110);
  doc.text('Domiciliation commerciale et administrative...', 10, 115);

  // Dates et montant
  doc.text(`Durée: du ${demande.dateDebut} au ${demande.dateFin}`, 10, 140);
  doc.text(`Montant: ${demande.montantTotal} DA`, 10, 145);

  // Signatures
  doc.text('Signature Coffice', 30, 260);
  doc.text('Signature Client', 130, 260);

  // Téléchargement
  doc.save(`Contrat_${demande.raisonSociale}_${demande.dateDebut}.pdf`);
}
```

**Appel après activation domiciliation:**
```typescript
// Dans api/domiciliations/activate.php
// Après UPDATE statut = 'active'
// Générer PDF côté serveur OU côté client après success
// Archiver dans documents_uploads
// Envoyer lien par email
```

### Reçu de paiement

**Intégrer dans:** `api/caisse/recu.php`

```php
require_once __DIR__ . '/../vendor/autoload.php';

use Dompdf\Dompdf;

$transaction = getTransactionById($transactionId);

$html = "
<html>
<head><style>
body { font-family: Arial; }
.header { text-align: center; margin-bottom: 30px; }
.details { margin: 20px 0; }
.footer { margin-top: 50px; text-align: center; font-size: 10px; }
</style></head>
<body>
<div class='header'>
  <img src='/path/logo_coffice.png' width='150'>
  <h2>REÇU DE PAIEMENT</h2>
  <p>N° {$transaction['numero_recu']}</p>
</div>
<div class='details'>
  <p><strong>Date:</strong> {$transaction['created_at']}</p>
  <p><strong>Client:</strong> {$clientNom}</p>
  <p><strong>Service:</strong> Réservation {$espaceNom}</p>
  <p><strong>Montant:</strong> {$transaction['montant']} DA</p>
  <p><strong>Mode de paiement:</strong> {$transaction['mode_paiement']}</p>
</div>
<div class='footer'>
  <p>COFFICE - Bureau 1178, Mohammadia Mall, Alger</p>
  <p>Téléphone: +213 XXX XXX XXX</p>
</div>
</body>
</html>
";

$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->render();
$dompdf->stream("Recu_{$transaction['numero_recu']}.pdf");
```

---

## 🚀 Déploiement

### 1. Appliquer les migrations SQL

```bash
mysql -u root -p coffice < database/migrations/012_checkin_checkout.sql
mysql -u root -p coffice < database/migrations/013_caisse_paiements.sql
mysql -u root -p coffice < database/migrations/014_gestion_courrier.sql
```

### 2. Installer les dépendances nettoyées

```bash
npm install
```

### 3. Build de production

```bash
npm run build
```

### 4. Configurer les cron jobs

```bash
crontab -e
# Ajouter les lignes mentionnées dans Phase 5
```

### 5. Permissions fichiers

```bash
chmod -R 755 api/
chmod -R 777 api/uploads/
chmod -R 777 api/.cache/
```

---

## ✅ Checklist Finale

### Backend PHP
- [ ] Endpoints check-in/check-out
- [ ] Endpoints caisse (transactions, clôture, reçu)
- [ ] Endpoint courrier
- [ ] Scripts cron alertes

### Frontend
- [ ] Page admin Caisse
- [ ] Enrichissement Aujourd'hui (check-in/check-out, timeline)
- [ ] Workflow courrier utilisateur
- [ ] KPI avancés dans Reports

### PDF
- [ ] Génération contrats domiciliation
- [ ] Génération reçus paiement

### Tests
- [ ] Test check-in/check-out workflow
- [ ] Test encaissement + génération reçu
- [ ] Test workflow courrier complet
- [ ] Test alertes automatiques
- [ ] Test clôture de caisse

### Documentation
- [ ] Guide utilisateur courrier
- [ ] Guide admin caisse
- [ ] Formation check-in/check-out

---

**Estimé temps Phase 3-7:** 40-60 heures développement

**Priorisation recommandée:**
1. Check-in/Check-out (critique pour opérations quotidiennes)
2. Module Caisse (traçabilité financière)
3. Gestion Courrier (service client domiciliation)
4. Automatisations (efficacité)
5. KPI & PDF (amélioration continue)
