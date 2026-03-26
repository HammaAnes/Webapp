# Système de Design Coffice

Ce document décrit le système de design unifié de l'application Coffice, incluant les tokens, variantes, animations et bonnes pratiques.

## Architecture

Le système de design est organisé dans le dossier `/src/design/` :

```
src/design/
├── tokens.ts        # Jetons de design (couleurs, espacements, typographie)
├── variants.ts      # Variantes de composants (Button, Input, Card, etc.)
├── animations.ts    # Animations et transitions Framer Motion
└── index.ts         # Export centralisé
```

## Tokens de Design

### Couleurs

```typescript
import { designTokens } from '@/design';

// Couleurs principales
designTokens.colors.primary.DEFAULT  // #0f172a
designTokens.colors.accent.DEFAULT   // #0284c7

// Couleurs de statut
designTokens.colors.success.DEFAULT  // #059669
designTokens.colors.warning.DEFAULT  // #d97706
designTokens.colors.error.DEFAULT    // #dc2626
```

### Espacements

Utilise un système d'espacement basé sur 8px :

```typescript
designTokens.spacing[2]  // 8px
designTokens.spacing[4]  // 16px
designTokens.spacing[6]  // 24px
```

### Typographie

```typescript
// Tailles de police avec line-height
designTokens.fontSize.sm    // 14px / 1.25rem
designTokens.fontSize.base  // 16px / 1.5rem
designTokens.fontSize.xl    // 20px / 1.75rem
```

## Composants UI

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={false}>
  Cliquez ici
</Button>

// Variantes : primary, secondary, success, warning, danger, outline, ghost, link
// Tailles : xs, sm, md, lg, xl
```

### Input

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  error={errors.email}
  icon={<MailIcon />}
  helperText="Votre adresse email"
/>
```

### Card

```tsx
import { Card } from '@/components/ui';

<Card
  variant="default"
  padding="md"
  radius="md"
  interactive
>
  Contenu de la carte
</Card>
```

### Badge

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" size="sm">
  Actif
</Badge>

// Variantes : primary, accent, success, warning, danger, info, neutral
```

### Alert

```tsx
import { Alert } from '@/components/ui';

<Alert
  variant="success"
  title="Succès"
  dismissible
  onDismiss={() => {}}
>
  Votre opération a été effectuée avec succès
</Alert>
```

### Form

```tsx
import Form, { FormSection, FormRow, FormActions } from '@/components/ui/Form';

<Form onSubmit={handleSubmit}>
  <FormSection title="Informations" description="Remplissez vos informations">
    <FormRow columns={2}>
      <Input label="Prénom" {...register('prenom')} />
      <Input label="Nom" {...register('nom')} />
    </FormRow>
  </FormSection>

  <FormActions align="right">
    <Button variant="outline" type="button">Annuler</Button>
    <Button type="submit">Enregistrer</Button>
  </FormActions>
</Form>
```

## Hooks Personnalisés

### useForm

Hook pour la gestion des formulaires avec validation :

```tsx
import { useForm } from '@/hooks';

const { values, errors, getFieldProps, handleSubmit } = useForm({
  initialValues: { email: '', password: '' },
  validationRules: {
    email: {
      required: true,
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' }
    }
  },
  onSubmit: async (values) => {
    await login(values);
  }
});

<Input {...getFieldProps('email')} />
```

### useFocusTrap

Piège le focus à l'intérieur d'un élément (utile pour les modales) :

```tsx
import { useFocusTrap } from '@/hooks';

const modalRef = useFocusTrap(isOpen);

<div ref={modalRef}>
  {/* Contenu de la modale */}
</div>
```

### useKeyboard

Gestion des événements clavier :

```tsx
import { useKeyboard, useEscapeKey } from '@/hooks';

useEscapeKey(() => closeModal());

useKeyboard({
  key: 'Enter',
  onKeyDown: () => handleSubmit(),
  enabled: true,
});
```

## Animations

### Variantes Framer Motion

```tsx
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/design/animations';

<motion.div
  variants={fadeInUp}
  initial="hidden"
  animate="visible"
>
  Contenu animé
</motion.div>

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Animations disponibles

- `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`
- `scaleIn`
- `slideInFromBottom`, `slideInFromTop`, `slideInFromLeft`, `slideInFromRight`
- `modalBackdrop`, `modalContent`
- `staggerContainer`, `staggerItem`

## Utilitaires CSS

### Classes Tailwind personnalisées

```css
/* Classes de boutons */
.btn-primary
.btn-secondary
.btn-outline

/* Classes de cartes */
.card
.card-interactive

/* Classes d'input */
.input
.input-error

/* Classes de badge */
.badge-primary
.badge-success
.badge-warning
.badge-danger

/* Classes utilitaires */
.section-title
.section-subtitle
.glass-effect
.focus-ring
.link
.divider
.container-padding
.max-width-container
```

## Fonction cn()

Utilitaire pour combiner des classes conditionnellement :

```tsx
import { cn } from '@/design/variants';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  error && 'error-class',
  className
)} />
```

## Responsivité

### Breakpoints

```
sm:  640px   (mobile large)
md:  768px   (tablette)
lg:  1024px  (desktop)
xl:  1280px  (desktop large)
2xl: 1536px  (très grand écran)
```

### Utilisation

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Texte responsive
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grille responsive */}
</div>
```

## Accessibilité

### Bonnes pratiques

1. **Labels** : Toujours utiliser des labels pour les inputs
2. **ARIA** : Utiliser les attributs ARIA appropriés
3. **Focus** : Gérer le focus trap dans les modales
4. **Keyboard** : Support complet du clavier
5. **Contrast** : Ratios de contraste respectés (WCAG AA)

```tsx
// Exemple d'accessibilité
<button
  aria-label="Fermer"
  aria-pressed={isOpen}
  onClick={handleClick}
>
  <X className="w-5 h-5" aria-hidden="true" />
</button>
```

## Performance

### Code Splitting

Les composants lourds sont chargés dynamiquement :

```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Memoization

Utiliser React.memo pour les composants purs :

```tsx
export default React.memo(MyComponent);
```

## Bonnes Pratiques

1. **Cohérence** : Utiliser les tokens du design system plutôt que des valeurs en dur
2. **Composants** : Privilégier les composants UI du design system
3. **Animations** : Utiliser les variantes d'animation prédéfinies
4. **Accessibilité** : Tester avec le clavier et les lecteurs d'écran
5. **Performance** : Optimiser les images et lazy-load les composants lourds

## Contribution

Pour ajouter un nouveau composant au design system :

1. Créer le composant dans `/src/components/ui/`
2. Ajouter les variantes dans `/src/design/variants.ts` si nécessaire
3. Exporter depuis `/src/components/ui/index.ts`
4. Documenter l'utilisation dans ce fichier
