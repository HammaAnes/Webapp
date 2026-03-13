# Architecture de l'application Coffice

## Vue d'ensemble

Cette application est construite avec React 18, TypeScript, et utilise une architecture modulaire basée sur les principes de séparation des préoccupations et de responsabilité unique.

## Structure du projet

```
src/
├── adapters/           # Adaptateurs pour transformer les données API
├── components/         # Composants React réutilisables
│   ├── admin/         # Composants spécifiques à l'administration
│   ├── dashboard/     # Composants du tableau de bord
│   ├── domiciliation/ # Composants de domiciliation
│   ├── reservation/   # Composants de réservation
│   └── ui/            # Composants UI génériques
├── hooks/             # Hooks React personnalisés
├── lib/               # Bibliothèques et clients API
├── pages/             # Pages de l'application
├── services/          # Couche service (logique métier)
├── store/             # Stores Zustand (gestion d'état)
├── types/             # Types TypeScript
└── utils/             # Fonctions utilitaires
```

## Architecture en couches

### 1. Couche Présentation (Components)

Les composants sont organisés par fonctionnalité et suivent le principe de composition :

- **Components UI** : Composants réutilisables et agnostiques (Button, Input, DataTable, etc.)
- **Feature Components** : Composants spécifiques à une fonctionnalité métier
- **Page Components** : Composants de page qui orchestrent les fonctionnalités

**Bonnes pratiques** :
- Utiliser les hooks personnalisés pour la logique réutilisable
- Garder les composants petits et focalisés
- Privilégier la composition à l'héritage

### 2. Couche Service

Les services encapsulent la logique métier et communiquent avec l'API :

```typescript
// Exemple : userService
import { userService } from '@/services';

// Charger les utilisateurs
await userService.loadUsers();

// Créer un utilisateur
await userService.createUser(userData);
```

**Services disponibles** :
- `userService` - Gestion des utilisateurs
- `espaceService` - Gestion des espaces
- `reservationService` - Gestion des réservations
- `domiciliationService` - Gestion des domiciliations
- `abonnementService` - Gestion des abonnements

### 3. Couche État (Stores)

Les stores Zustand sont organisés par domaine métier :

```typescript
// Stores modulaires
import { useUserStore } from '@/store/user.store';
import { useEspaceStore } from '@/store/espace.store';
import { useReservationStore } from '@/store/reservation.store';
import { useAuthStore } from '@/store/authStore';
```

**Principes** :
- Un store par domaine métier
- État minimal et normalisé
- Actions simples et prévisibles
- Pas de logique métier dans les stores (utiliser les services)

### 4. Couche API

Deux clients API disponibles :

- **apiClient** (legacy) : Client API original
- **apiClientV2** (recommandé) : Client API amélioré avec :
  - Gestion d'erreurs standardisée
  - Types stricts
  - Refresh automatique des tokens
  - Retry logic

```typescript
import { apiClientV2 } from '@/lib/api-client-v2';

const response = await apiClientV2.get('/users');
if (response.success) {
  // Utiliser response.data
}
```

## Composants UI réutilisables

### DataTable

Tableau de données avec recherche, tri, pagination et export :

```tsx
<DataTable
  data={users}
  columns={[
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle', render: (user) => <Badge>{user.role}</Badge> }
  ]}
  searchable
  searchKeys={['nom', 'email']}
  pagination
  itemsPerPage={20}
  exportable
  onExport={() => exportToExcel(users, columns, 'users')}
/>
```

### FilterBar

Barre de filtres dynamique :

```tsx
<FilterBar
  filters={[
    { key: 'statut', label: 'Statut', type: 'select', options: statusOptions },
    { key: 'date', label: 'Date', type: 'date' }
  ]}
  values={filterValues}
  onChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
  onReset={() => setFilterValues({})}
/>
```

### StatCard

Carte statistique avec icône et tendance :

```tsx
<StatCard
  title="Utilisateurs actifs"
  value={activeUsers}
  icon={Users}
  color="blue"
  trend={{ value: 12.5, isPositive: true }}
/>
```

### ConfirmDialog

Dialogue de confirmation :

```tsx
const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

// Utilisation
const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Supprimer l\'utilisateur',
    message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
    variant: 'danger'
  });

  if (confirmed) {
    await userService.deleteUser(userId);
  }
};
```

## Hooks personnalisés

### useAsync

Gère les opérations asynchrones avec état de chargement et erreurs :

```tsx
const { execute, loading, error, data } = useAsync(
  () => userService.loadUsers(),
  {
    immediate: true,
    onSuccess: (users) => console.log('Loaded', users),
    onError: (error) => console.error(error)
  }
);
```

### useSearch, useSort, usePagination

Hooks pour gérer recherche, tri et pagination :

```tsx
const { filteredItems, searchTerm, setSearchTerm } = useSearch(items, {
  searchKeys: ['nom', 'email']
});

const { sortedItems, toggleSort } = useSort(filteredItems);

const { paginatedItems, currentPage, totalPages } = usePagination(sortedItems, {
  itemsPerPage: 10
});
```

### useDebounce

Debounce une valeur :

```tsx
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  // S'exécute 300ms après la dernière modification
  searchUsers(debouncedSearch);
}, [debouncedSearch]);
```

## Gestion des erreurs

Système de gestion d'erreurs standardisé :

```typescript
import { handleAsyncOperation, showErrorToast, showSuccessToast } from '@/utils/error-handler';

// Avec gestion automatique des toasts
const result = await handleAsyncOperation(
  () => userService.createUser(data),
  {
    successMessage: 'Utilisateur créé avec succès',
    errorMessage: 'Erreur lors de la création',
    context: 'CreateUser'
  }
);

// Gestion manuelle
try {
  await userService.createUser(data);
  showSuccessToast('Utilisateur créé');
} catch (error) {
  showErrorToast(error, 'Erreur lors de la création');
}
```

## Export de données

Fonctions d'export vers CSV et Excel :

```typescript
import { exportToCSV, exportToExcel } from '@/utils/export';

const columns = [
  { key: 'nom', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'createdAt', label: 'Date création', format: formatDate }
];

// Export CSV
exportToCSV(users, columns, 'utilisateurs');

// Export Excel
exportToExcel(users, columns, 'utilisateurs', 'Liste des utilisateurs');
```

## Performance

### Optimisations implémentées

1. **Code splitting** : Chargement lazy des routes
2. **Memoization** : Utilisation de `useMemo` et `useCallback`
3. **Debouncing** : Pour les recherches et inputs
4. **Pagination** : Pour les longues listes
5. **Virtual scrolling** : Prêt à implémenter avec `useIntersectionObserver`

### Bonnes pratiques

```tsx
// Memoize les calculs coûteux
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// Memoize les callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Lazy load des composants
const AdminPanel = lazy(() => import('./pages/dashboard/admin'));
```

## Sécurité

### Authentification

- Tokens JWT stockés dans localStorage/sessionStorage
- Refresh automatique des tokens avant expiration
- Redirection vers login si session expirée

### Validation

- Validation côté client avec react-hook-form
- Règles de validation centralisées dans `utils/validation`
- Sanitization des inputs

### Protection XSS

- Utilisation de React (échappe automatiquement)
- Pas de `dangerouslySetInnerHTML` sans sanitization
- Validation stricte des données utilisateur

## Tests

Pour ajouter des tests (recommandé) :

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Structure recommandée :

```
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
```

## Migration du code legacy

Pour migrer du code existant vers la nouvelle architecture :

1. **Identifier le domaine** : User, Espace, Réservation, etc.
2. **Utiliser le service approprié** : `userService`, `espaceService`, etc.
3. **Remplacer les appels directs à l'API** par des appels au service
4. **Utiliser le store correspondant** pour l'état
5. **Utiliser les composants UI réutilisables** (DataTable, FilterBar, etc.)

### Exemple de migration

**Avant** :
```tsx
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

**Après** :
```tsx
const users = useUserStore(state => state.users);
const loading = useUserStore(state => state.loading);

useAsync(() => userService.loadUsers(), { immediate: true });
```

## Conventions de code

### Naming

- **Composants** : PascalCase (`UserCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useUsers.ts`)
- **Services** : camelCase avec suffixe `Service` (`userService.ts`)
- **Stores** : camelCase avec suffixe `Store` (`userStore.ts`)
- **Types** : PascalCase (`User`, `Reservation`)
- **Constants** : SCREAMING_SNAKE_CASE (`API_URL`)

### Fichiers

- Un composant par fichier
- Index files pour réexporter
- Tests à côté du code source ou dans `__tests__`

### Imports

```typescript
// 1. Librairies externes
import React from 'react';
import { format } from 'date-fns';

// 2. Composants et hooks
import { Button } from '@/components/ui';
import { useAsync } from '@/hooks';

// 3. Services et stores
import { userService } from '@/services';
import { useUserStore } from '@/store/user.store';

// 4. Types
import type { User } from '@/types';

// 5. Utilitaires
import { formatCurrency } from '@/utils/formatters';
```

## Ressources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
