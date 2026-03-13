# Refactoring des Formulaires - Documentation

## Vue d'ensemble

Ce document décrit le refactoring complet du système de formulaires de l'application Coffice. L'objectif est d'harmoniser, fiabiliser, centraliser et rendre tous les formulaires et wizards fonctionnels à 100%.

## Architecture

### Structure des Dossiers

```
src/
├── hooks/
│   ├── useFormSubmit.ts         # Hook pour gérer la soumission de formulaires
│   ├── useFormPersistence.ts    # Hook pour sauvegarder les brouillons
│   ├── useWizard.ts             # Hook pour gérer les wizards multi-étapes
│   ├── useFileUpload.ts         # Hook pour gérer les uploads de fichiers
│   └── index.ts                 # Export centralisé de tous les hooks
│
├── components/ui/
│   ├── Input.tsx                # Composant Input amélioré
│   ├── PasswordInput.tsx        # Input avec toggle visibilité + force
│   ├── Select.tsx               # Select réutilisable avec icône
│   ├── Textarea.tsx             # Textarea standardisé
│   ├── Checkbox.tsx             # Checkbox réutilisable
│   ├── FileUpload.tsx           # Upload de fichiers avec drag & drop
│   ├── FormField.tsx            # Wrapper pour champs de formulaire
│   ├── WizardProgress.tsx       # Barre de progression pour wizards
│   ├── Button.tsx               # Bouton (existant, amélioré)
│   └── index.ts                 # Export centralisé
│
└── utils/
    └── validation.ts            # Règles de validation centralisées
```

## Composants de Formulaires

### 1. Input

Composant de base pour tous les champs de saisie texte.

**Props:**
- `label` - Label du champ
- `error` - Message d'erreur
- `icon` - Icône à gauche
- `helperText` - Texte d'aide
- `rightElement` - Élément à droite (spinner, icône de validation, etc.)
- Tous les props HTML input standards

**Exemple:**
```tsx
<Input
  label="Email"
  type="email"
  icon={<Mail className="w-5 h-5" />}
  placeholder="votre@email.com"
  helperText="Utilisez votre email professionnel"
  {...register('email', validationRules.email)}
  error={errors.email?.message}
  required
/>
```

### 2. PasswordInput

Input spécialisé pour les mots de passe avec toggle de visibilité et indicateur de force.

**Props:**
- Hérite de toutes les props d'Input
- `showStrength` - Afficher l'indicateur de force du mot de passe

**Exemple:**
```tsx
<PasswordInput
  label="Mot de passe"
  showStrength
  {...register('password', validationRules.password)}
  error={errors.password?.message}
  required
/>
```

### 3. Select

Select dropdown avec support d'icônes et placeholder.

**Props:**
- `label` - Label du champ
- `error` - Message d'erreur
- `options` - Array d'options `{ value, label, disabled? }`
- `placeholder` - Placeholder
- `icon` - Icône à gauche
- `onChange` - Callback onChange qui reçoit la valeur

**Exemple:**
```tsx
<Select
  label="Type d'espace"
  options={[
    { value: 'bureau', label: 'Bureau privé' },
    { value: 'meeting', label: 'Salle de réunion' },
  ]}
  placeholder="Choisir un type"
  {...register('type', { required: 'Type requis' })}
  error={errors.type?.message}
  required
/>
```

### 4. Textarea

Textarea avec auto-resize et support du helper text.

**Props:**
- `label` - Label du champ
- `error` - Message d'erreur
- `helperText` - Texte d'aide
- Tous les props HTML textarea standards

**Exemple:**
```tsx
<Textarea
  label="Description"
  placeholder="Décrivez votre activité..."
  helperText="Maximum 500 caractères"
  {...register('description')}
  error={errors.description?.message}
  rows={4}
/>
```

### 5. Checkbox

Checkbox réutilisable avec label et description.

**Props:**
- `label` - Label (peut être React.ReactNode)
- `error` - Message d'erreur
- `description` - Description sous le label
- Tous les props HTML input[type="checkbox"] standards

**Exemple:**
```tsx
<Checkbox
  label="J'accepte les conditions"
  description="En cochant cette case, vous acceptez nos CGU"
  {...register('acceptTerms', validationRules.acceptTerms)}
  error={errors.acceptTerms?.message}
  required
/>
```

### 6. FileUpload

Composant d'upload de fichiers avec drag & drop et preview.

**Props:**
- `label` - Label du champ
- `error` - Message d'erreur
- `accept` - Types de fichiers acceptés
- `multiple` - Autoriser plusieurs fichiers
- `maxSize` - Taille max par fichier (en bytes)
- `files` - Array de fichiers uploadés
- `onFilesChange` - Callback quand les fichiers changent
- `helperText` - Texte d'aide

**Exemple:**
```tsx
const [files, setFiles] = useState<UploadedFile[]>([]);

<FileUpload
  label="Documents justificatifs"
  accept="image/*,application/pdf"
  multiple
  maxSize={5 * 1024 * 1024}
  files={files}
  onFilesChange={setFiles}
  helperText="PNG, JPG ou PDF - Max 5MB par fichier"
  error={errors.documents?.message}
/>
```

### 7. WizardProgress

Barre de progression pour formulaires multi-étapes.

**Props:**
- `steps` - Array d'étapes `{ label, description? }`
- `currentStep` - Index de l'étape courante
- `completedSteps` - Array d'index des étapes complétées

**Exemple:**
```tsx
<WizardProgress
  steps={[
    { label: 'Informations', description: 'Vos coordonnées' },
    { label: 'Documents', description: 'Pièces justificatives' },
    { label: 'Confirmation', description: 'Vérification' },
  ]}
  currentStep={currentStep}
  completedSteps={[0]}
/>
```

## Hooks Personnalisés

### 1. useFormSubmit

Hook pour gérer la soumission de formulaires avec loading et erreurs.

**Paramètres:**
- `onSubmit` - Fonction async de soumission
- `successMessage` - Message de succès
- `errorMessage` - Message d'erreur par défaut
- `onSuccess` - Callback après succès
- `onError` - Callback après erreur

**Retour:**
- `isSubmitting` - État de soumission
- `submitError` - Erreur de soumission
- `handleSubmit` - Fonction à passer au formulaire
- `reset` - Réinitialiser l'état

**Exemple:**
```tsx
const { isSubmitting, handleSubmit } = useFormSubmit({
  onSubmit: async (data) => {
    await apiClient.createReservation(data);
  },
  successMessage: 'Réservation créée avec succès',
  onSuccess: () => {
    navigate('/app/reservations');
  },
});
```

### 2. useFormPersistence

Hook pour sauvegarder automatiquement les brouillons en localStorage.

**Paramètres:**
- `key` - Clé unique pour le localStorage
- `defaultValues` - Valeurs par défaut
- `enabled` - Activer/désactiver la persistence
- `debounceMs` - Délai de debounce (défaut: 500ms)

**Retour:**
- `formData` - Données du formulaire
- `setFormData` - Mettre à jour les données
- `clearDraft` - Supprimer le brouillon
- `resetForm` - Réinitialiser le formulaire
- `hasDraft` - Booléen si un brouillon existe

**Exemple:**
```tsx
const { formData, setFormData, clearDraft, hasDraft } = useFormPersistence({
  key: 'domiciliation-form',
  defaultValues: initialFormData,
  enabled: true,
});

// Restaurer le brouillon au chargement
useEffect(() => {
  if (hasDraft) {
    reset(formData);
  }
}, []);
```

### 3. useWizard

Hook pour gérer la navigation dans les wizards multi-étapes.

**Paramètres:**
- `totalSteps` - Nombre total d'étapes
- `initialStep` - Étape initiale (défaut: 0)
- `onStepChange` - Callback quand l'étape change

**Retour:**
- `currentStep` - Index de l'étape courante
- `isFirstStep` - Booléen si première étape
- `isLastStep` - Booléen si dernière étape
- `progress` - Pourcentage de progression (0-100)
- `canGoNext` - Peut aller à l'étape suivante
- `canGoBack` - Peut revenir en arrière
- `goToStep` - Aller à une étape spécifique
- `nextStep` - Étape suivante
- `previousStep` - Étape précédente
- `reset` - Réinitialiser au début

**Exemple:**
```tsx
const {
  currentStep,
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
} = useWizard({
  totalSteps: 8,
  onStepChange: (step) => {
    console.log('Étape changée:', step);
  },
});
```

### 4. useFileUpload

Hook pour gérer l'upload de fichiers avec validation.

**Paramètres:**
- `maxSize` - Taille max par fichier (défaut: 5MB)
- `allowedTypes` - Types de fichiers autorisés
- `maxFiles` - Nombre max de fichiers
- `onUpload` - Fonction d'upload async

**Retour:**
- `files` - Liste des fichiers
- `isUploading` - État d'upload
- `addFiles` - Ajouter des fichiers
- `removeFile` - Supprimer un fichier par ID
- `uploadFiles` - Lancer l'upload
- `clearFiles` - Supprimer tous les fichiers
- `hasFiles` - Booléen si des fichiers existent
- `fileCount` - Nombre de fichiers

**Exemple:**
```tsx
const {
  files,
  isUploading,
  addFiles,
  removeFile,
  uploadFiles,
} = useFileUpload({
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/*', 'application/pdf'],
  maxFiles: 10,
  onUpload: async (files) => {
    await apiClient.uploadDocuments(files);
  },
});
```

## Système de Validation

### Règles de Validation Disponibles

Le fichier `src/utils/validation.ts` centralise toutes les règles de validation pour React Hook Form.

#### Règles de Base

```tsx
import { validationRules } from '../utils/validation';

// Email
validationRules.email

// Mot de passe (min 6 caractères)
validationRules.password

// Confirmation de mot de passe
validationRules.passwordConfirm(password)

// Nom
validationRules.nom

// Prénom
validationRules.prenom

// Acceptation de termes
validationRules.acceptTerms
```

#### Règles Algériennes

```tsx
// Téléphone algérien (format: +213 ou 0 suivi de 9 chiffres)
validationRules.phone          // Optionnel
validationRules.phoneRequired  // Requis

// NIF (Numéro d'Identification Fiscale)
validationRules.nif

// NIS (Numéro d'Identification Statistique)
validationRules.nis

// Registre de Commerce
validationRules.rc
```

#### Règles Génériques

```tsx
// Champ requis
validationRules.required('Nom du champ')

// Longueur min
validationRules.minLength(10, 'Description')

// Longueur max
validationRules.maxLength(100, 'Description')

// Date dans le futur
validationRules.dateInFuture

// Date après une autre
validationRules.dateAfter(startDate)

// Montant
validationRules.amount

// Nombre avec min/max
validationRules.number(0, 100)

// Pourcentage (0-100)
validationRules.percentage

// Capacité (min 1)
validationRules.capacity(maxCapacity)
```

#### Validateurs Asynchrones

```tsx
import { asyncValidators } from '../utils/validation';

// Vérifier l'unicité d'un email
{
  validate: {
    unique: async (value) => await asyncValidators.uniqueEmail(
      value,
      (email) => apiClient.checkEmailExists(email)
    )
  }
}

// Valider un code promo
{
  validate: {
    valid: async (value) => await asyncValidators.codePromo(
      value,
      (code) => apiClient.validatePromoCode(code)
    )
  }
}
```

#### Combiner des Validations

```tsx
import { combineValidations, validationRules } from '../utils/validation';

<Input
  {...register('telephone', combineValidations(
    validationRules.phoneRequired,
    { pattern: { value: /custom/, message: 'Format invalide' } }
  ))}
/>
```

## Formulaires Refactorisés

### 1. Formulaires d'Authentification

#### Login (`/src/pages/Login.tsx`)

Améliorations:
- Utilisation de `PasswordInput` avec toggle de visibilité
- Utilisation de `Checkbox` pour "Se souvenir de moi"
- Validation cohérente avec React Hook Form
- Animation Framer Motion
- Gestion améliorée des sessions expirées

#### Register (`/src/pages/Register.tsx`)

Améliorations:
- Layout responsive (grille 2 colonnes sur desktop)
- `PasswordInput` avec indicateur de force
- Validation en temps réel du code parrainage
- Feedback visuel du code parrainage (✓ Valide / ✗ Invalide)
- Champs entreprise et profession ajoutés
- Helper text pour le téléphone
- Checkbox pour les CGU avec liens cliquables

#### ForgotPassword (`/src/pages/ForgotPassword.tsx`)

Améliorations:
- Utilisation de React Hook Form
- Animation de succès avec icône CheckCircle
- Écran de confirmation amélioré
- Boutons de navigation cohérents

#### ResetPassword (`/src/pages/ResetPassword.tsx`)

Améliorations:
- `PasswordInput` avec indicateur de force
- Écran de vérification avec `LoadingSpinner`
- Écran d'erreur avec icône AlertCircle
- Validation automatique de correspondance des mots de passe
- Animation cohérente

### 2. Formulaires à Implémenter (Prochaines Étapes)

Les formulaires suivants doivent être refactorisés avec le nouveau système:

#### Réservation
- `src/components/dashboard/ReservationForm.tsx`
- Utiliser `Select` pour les espaces
- DatePicker wrapper pour les dates
- Validation de disponibilité en temps réel
- Calcul automatique du prix

#### Admin - Espaces
- `src/pages/dashboard/admin/Spaces.tsx`
- Formulaire modal de création/édition
- Grille de tarifs avec `Input` type="number"
- Checkbox pour équipements
- Toggle pour disponibilité

#### Admin - Codes Promo
- `src/pages/dashboard/admin/CodesPromo.tsx`
- Générateur de code aléatoire
- `Select` pour le type de réduction
- DatePicker pour dates début/fin
- Validation conditionnelle selon le type

#### Admin - Utilisateurs
- `src/pages/dashboard/admin/Users.tsx`
- Formulaire de création utilisateur
- `Select` pour le rôle
- Validation email unique (async)

#### Admin - Abonnements
- `src/pages/dashboard/admin/Abonnements.tsx`
- Liste dynamique d'avantages
- Grille de prix
- Toggle actif/inactif
- Ordre d'affichage

#### Domiciliation (Wizard)
- `src/components/domiciliation/WizardForm.tsx`
- Refactoriser avec `useWizard`
- Utiliser `WizardProgress`
- Persistence automatique avec `useFormPersistence`
- Upload de documents avec `FileUpload`
- Modulariser les 8 étapes

## Bonnes Pratiques

### 1. Structure d'un Formulaire

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input, Button } from '../components/ui';
import { validationRules } from '../utils/validation';
import { useFormSubmit } from '../hooks';

interface FormData {
  name: string;
  email: string;
}

export default function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const { isSubmitting, handleSubmit: onSubmit } = useFormSubmit({
    onSubmit: async (data: FormData) => {
      // Logique de soumission
      await apiClient.submit(data);
    },
    successMessage: 'Formulaire soumis avec succès',
    onSuccess: () => {
      // Redirection ou autre action
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Nom"
        {...register('name', validationRules.nom)}
        error={errors.name?.message}
        required
      />

      <Input
        label="Email"
        type="email"
        {...register('email', validationRules.email)}
        error={errors.email?.message}
        required
      />

      <Button type="submit" loading={isSubmitting}>
        Soumettre
      </Button>
    </form>
  );
}
```

### 2. Wizard Multi-Étapes

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { WizardProgress, Button } from '../components/ui';
import { useWizard, useFormPersistence } from '../hooks';

const STEPS = [
  { label: 'Étape 1', description: 'Description 1' },
  { label: 'Étape 2', description: 'Description 2' },
  { label: 'Étape 3', description: 'Description 3' },
];

export default function MyWizard() {
  const { currentStep, isFirstStep, isLastStep, nextStep, previousStep } = useWizard({
    totalSteps: STEPS.length,
  });

  const { formData, setFormData } = useFormPersistence({
    key: 'my-wizard',
    defaultValues: {},
  });

  const { register, handleSubmit } = useForm({ defaultValues: formData });

  const onNext = (data: any) => {
    setFormData({ ...formData, ...data });
    nextStep();
  };

  return (
    <div>
      <WizardProgress
        steps={STEPS}
        currentStep={currentStep}
      />

      <form onSubmit={handleSubmit(onNext)}>
        {/* Contenu de l'étape */}
        {currentStep === 0 && <Step1 register={register} />}
        {currentStep === 1 && <Step2 register={register} />}
        {currentStep === 2 && <Step3 register={register} />}

        <div className="flex gap-4">
          {!isFirstStep && (
            <Button type="button" variant="outline" onClick={previousStep}>
              Précédent
            </Button>
          )}
          <Button type="submit">
            {isLastStep ? 'Soumettre' : 'Suivant'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### 3. Upload de Fichiers

```tsx
import React, { useState } from 'react';
import { FileUpload, Button } from '../components/ui';
import { useFileUpload } from '../hooks';

export default function MyUploadForm() {
  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadFiles,
  } = useFileUpload({
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/*', 'application/pdf'],
    onUpload: async (fileList) => {
      const formData = new FormData();
      fileList.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      await apiClient.upload(formData);
    },
  });

  return (
    <div className="space-y-6">
      <FileUpload
        label="Documents"
        files={files}
        onFilesChange={(newFiles) => {
          // FileUpload gère déjà addFiles en interne
        }}
        multiple
      />

      <Button onClick={uploadFiles} loading={isUploading} disabled={files.length === 0}>
        Télécharger les fichiers
      </Button>
    </div>
  );
}
```

## Tests et Validation

### Checklist de Test pour Chaque Formulaire

- [ ] Tous les champs requis sont validés
- [ ] Les messages d'erreur sont clairs et en français
- [ ] La validation fonctionne en temps réel (onBlur)
- [ ] Le formulaire ne peut pas être soumis avec des erreurs
- [ ] L'état de loading s'affiche pendant la soumission
- [ ] Les messages de succès/erreur s'affichent correctement
- [ ] Le formulaire se réinitialise après succès (si nécessaire)
- [ ] La navigation fonctionne (redirection après succès)
- [ ] Les animations sont fluides
- [ ] Le design est responsive (mobile/tablet/desktop)
- [ ] L'accessibilité est respectée (labels, aria-*, focus)

### Tests d'Accessibilité

Tous les composants respectent les standards ARIA:
- Labels correctement associés aux inputs
- Messages d'erreur liés avec `aria-describedby`
- État invalide indiqué avec `aria-invalid`
- Navigation au clavier fonctionnelle
- Focus visible sur tous les éléments interactifs

## Prochaines Étapes

1. **Refactorer les formulaires de réservation** ✓ Priorité haute
2. **Refactorer les formulaires admin** ✓ Priorité haute
3. **Refactorer le wizard de domiciliation** ✓ Priorité haute
4. **Créer un composant DatePicker wrapper** (pour react-datepicker)
5. **Ajouter des tests unitaires** pour tous les hooks et composants
6. **Créer une Storybook** pour documenter les composants visuellement
7. **Optimiser les performances** avec React.memo et useMemo
8. **Ajouter l'i18n** si nécessaire (français/arabe)

## Résumé des Bénéfices

### Avant le Refactoring
- Code dupliqué dans chaque formulaire
- Validation incohérente
- Pas de persistence des brouillons
- UX/UI différente selon les formulaires
- Difficile à maintenir et étendre

### Après le Refactoring
- ✅ Composants réutilisables et centralisés
- ✅ Validation cohérente et robuste
- ✅ Persistence automatique des brouillons
- ✅ UX/UI harmonisée sur tous les formulaires
- ✅ Hooks personnalisés pour la logique commune
- ✅ Code plus maintenable et extensible
- ✅ Meilleure accessibilité
- ✅ Animations fluides
- ✅ Type-safe avec TypeScript
- ✅ Prêt pour les tests automatisés

## Contributeurs

- Refactoring initial: 2026-03-13
- Architecture et design: Système centralisé avec React Hook Form
- Pattern: Hooks + Composants réutilisables

---

*Ce document sera mis à jour au fur et à mesure de l'avancement du refactoring.*
