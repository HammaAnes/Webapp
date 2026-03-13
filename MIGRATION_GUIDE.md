# Guide de migration - Nouvelle architecture

## Vue d'ensemble

Ce guide vous aide à migrer progressivement les pages existantes vers la nouvelle architecture.

## Étape par étape

### Exemple : Migration de la page Users (Admin)

#### 1. État actuel (src/pages/dashboard/admin/Users.tsx)

```typescript
// AVANT - Code monolithique
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [filterRole, setFilterRole] = useState("");
const [currentPage, setCurrentPage] = useState(1);

useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  setLoading(true);
  try {
    const response = await apiClient.getUsers();
    if (response.success) {
      setUsers(response.data);
    }
  } catch (error) {
    toast.error("Erreur");
  } finally {
    setLoading(false);
  }
};

const filteredUsers = users.filter(user => {
  const matchSearch = user.nom.toLowerCase().includes(searchTerm);
  const matchRole = !filterRole || user.role === filterRole;
  return matchSearch && matchRole;
});

// 200+ lignes de JSX pour le tableau...
```

#### 2. Après migration

```typescript
// APRÈS - Architecture modulaire
import { useUserStore } from '@/store/user.store';
import { userService } from '@/services';
import { DataTable, FilterBar } from '@/components/ui';
import { useAsync } from '@/hooks';
import type { Column } from '@/components/ui';

export default function Users() {
  // État depuis le store
  const users = useUserStore(state => state.users);
  const loading = useUserStore(state => state.loading);

  // Chargement des données
  useAsync(() => userService.loadUsers(), { immediate: true });

  // Filtres
  const [filters, setFilters] = useState({
    role: '',
    statut: ''
  });

  // Colonnes du tableau
  const columns: Column<User>[] = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Rôle',
      render: (user) => <Badge>{user.role}</Badge>
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (user) => <Badge variant={user.statut === 'actif' ? 'success' : 'default'}>
        {user.statut}
      </Badge>
    }
  ];

  // Configuration des filtres
  const filterConfig = [
    {
      key: 'role',
      label: 'Rôle',
      type: 'select' as const,
      options: [
        { value: 'admin', label: 'Administrateur' },
        { value: 'user', label: 'Utilisateur' }
      ]
    },
    {
      key: 'statut',
      label: 'Statut',
      type: 'select' as const,
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'inactif', label: 'Inactif' }
      ]
    }
  ];

  // Filtrage des données
  const filteredUsers = users.filter(user => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.statut && user.statut !== filters.statut) return false;
    return true;
  });

  // Export
  const handleExport = () => {
    exportToExcel(filteredUsers, columns, 'utilisateurs');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters({ ...filters, [key]: value })}
        onReset={() => setFilters({ role: '', statut: '' })}
      />

      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        searchable
        searchKeys={['nom', 'email', 'entreprise']}
        searchPlaceholder="Rechercher un utilisateur..."
        pagination
        itemsPerPage={20}
        exportable
        onExport={handleExport}
        onRowClick={(user) => navigate(`/dashboard/admin/users/${user.id}`)}
        actions={(user) => (
          <>
            <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>
              Modifier
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(user)}>
              Supprimer
            </Button>
          </>
        )}
      />
    </div>
  );
}
```

**Réduction** : ~300 lignes → ~80 lignes (73% de réduction)

## Patterns de migration

### Pattern 1 : Chargement de données

```typescript
// AVANT
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getData();
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);

// APRÈS
const data = useDataStore(state => state.data);
const loading = useDataStore(state => state.loading);

useAsync(() => dataService.loadData(), { immediate: true });
```

### Pattern 2 : Formulaires avec gestion d'erreurs

```typescript
// AVANT
const handleSubmit = async (data) => {
  try {
    setLoading(true);
    const response = await apiClient.create(data);
    if (response.success) {
      toast.success('Créé');
      loadData();
      onClose();
    } else {
      toast.error(response.error);
    }
  } catch (error) {
    toast.error('Erreur');
  } finally {
    setLoading(false);
  }
};

// APRÈS
const handleSubmit = async (data) => {
  const result = await handleAsyncOperation(
    () => dataService.create(data),
    {
      successMessage: 'Créé avec succès',
      errorMessage: 'Erreur lors de la création',
      onSuccess: () => onClose()
    }
  );
};
```

### Pattern 3 : Suppression avec confirmation

```typescript
// AVANT
const handleDelete = async (id) => {
  if (window.confirm('Êtes-vous sûr ?')) {
    try {
      await apiClient.delete(id);
      toast.success('Supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  }
};

// APRÈS
const { confirm } = useConfirm();

const handleDelete = async (id) => {
  const confirmed = await confirm({
    title: 'Confirmer la suppression',
    message: 'Cette action est irréversible',
    variant: 'danger'
  });

  if (confirmed) {
    await handleAsyncOperation(
      () => dataService.delete(id),
      {
        successMessage: 'Supprimé avec succès',
        errorMessage: 'Erreur lors de la suppression'
      }
    );
  }
};
```

### Pattern 4 : Recherche et filtrage

```typescript
// AVANT
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState({});

const filteredData = data.filter(item => {
  const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchFilters = Object.entries(filters).every(([key, value]) => {
    return !value || item[key] === value;
  });
  return matchSearch && matchFilters;
});

// APRÈS
const { filteredItems, searchTerm, setSearchTerm } = useSearch(data, {
  searchKeys: ['name', 'email']
});

// Utiliser DataTable qui gère la recherche automatiquement
<DataTable
  data={data}
  searchable
  searchKeys={['name', 'email']}
  // ...
/>
```

### Pattern 5 : Export de données

```typescript
// AVANT
const exportData = () => {
  const csv = data.map(item => {
    return `${item.name},${item.email}`;
  }).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.csv';
  link.click();
};

// APRÈS
import { exportToCSV, exportToExcel } from '@/utils/export';

const columns = [
  { key: 'name', label: 'Nom' },
  { key: 'email', label: 'Email' }
];

const exportData = () => {
  exportToExcel(data, columns, 'export');
};

// Ou directement dans DataTable
<DataTable
  exportable
  onExport={() => exportToExcel(data, columns, 'export')}
/>
```

## Checklist de migration

Pour chaque page à migrer :

- [ ] **Identifier le domaine** (User, Espace, Réservation, etc.)
- [ ] **Remplacer useState par le store** approprié
- [ ] **Utiliser le service** pour les opérations CRUD
- [ ] **Remplacer les tableaux** par `<DataTable />`
- [ ] **Utiliser FilterBar** pour les filtres
- [ ] **Utiliser useAsync** pour le chargement
- [ ] **Utiliser useConfirm** pour les confirmations
- [ ] **Standardiser les erreurs** avec `handleAsyncOperation`
- [ ] **Utiliser les utils d'export** pour CSV/Excel
- [ ] **Tester** que tout fonctionne
- [ ] **Supprimer le code dupliqué**

## Tests après migration

Vérifier que :

1. ✅ Les données se chargent correctement
2. ✅ La recherche fonctionne
3. ✅ Les filtres fonctionnent
4. ✅ Le tri fonctionne
5. ✅ La pagination fonctionne
6. ✅ L'export fonctionne
7. ✅ Les actions (modifier, supprimer) fonctionnent
8. ✅ Les messages d'erreur s'affichent
9. ✅ Les messages de succès s'affichent
10. ✅ Le loading est affiché

## Exemple complet : Page Réservations

```typescript
import { useReservationStore } from '@/store/reservation.store';
import { reservationService } from '@/services';
import { DataTable, FilterBar, StatCard } from '@/components/ui';
import { useAsync, useConfirm } from '@/hooks';
import { exportToExcel } from '@/utils/export';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { Calendar, Clock, DollarSign, Users } from 'lucide-react';

export default function Reservations() {
  const reservations = useReservationStore(state => state.reservations);
  const loading = useReservationStore(state => state.loading);

  useAsync(() => reservationService.loadReservations(), { immediate: true });

  const { confirm } = useConfirm();

  const [filters, setFilters] = useState({
    statut: '',
    espaceId: ''
  });

  const columns = [
    {
      key: 'user.nom',
      label: 'Utilisateur',
      render: (r) => `${r.user?.nom} ${r.user?.prenom}`
    },
    { key: 'espace.nom', label: 'Espace' },
    {
      key: 'dateDebut',
      label: 'Date début',
      render: (r) => formatDate(r.dateDebut)
    },
    {
      key: 'dateFin',
      label: 'Date fin',
      render: (r) => formatDate(r.dateFin)
    },
    {
      key: 'montantTotal',
      label: 'Montant',
      render: (r) => formatCurrency(r.montantTotal)
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => <Badge variant={getStatusVariant(r.statut)}>
        {r.statut}
      </Badge>
    }
  ];

  const handleCancel = async (id: string) => {
    const confirmed = await confirm({
      title: 'Annuler la réservation',
      message: 'Êtes-vous sûr de vouloir annuler cette réservation ?',
      variant: 'warning'
    });

    if (confirmed) {
      await handleAsyncOperation(
        () => reservationService.cancelReservation(id),
        {
          successMessage: 'Réservation annulée',
          errorMessage: 'Erreur lors de l\'annulation'
        }
      );
    }
  };

  const stats = {
    total: reservations.length,
    confirmees: reservations.filter(r => r.statut === 'confirmee').length,
    enCours: reservations.filter(r => r.statut === 'en_cours').length,
    revenus: reservations.reduce((sum, r) => sum + r.montantTotal, 0)
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Réservations</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Confirmées"
          value={stats.confirmees}
          icon={Clock}
          color="green"
        />
        <StatCard
          title="En cours"
          value={stats.enCours}
          icon={Users}
          color="orange"
        />
        <StatCard
          title="Revenus"
          value={formatCurrency(stats.revenus)}
          icon={DollarSign}
          color="purple"
        />
      </div>

      <FilterBar
        filters={[
          {
            key: 'statut',
            label: 'Statut',
            type: 'select',
            options: [
              { value: 'confirmee', label: 'Confirmée' },
              { value: 'en_attente', label: 'En attente' },
              { value: 'annulee', label: 'Annulée' }
            ]
          }
        ]}
        values={filters}
        onChange={(key, value) => setFilters({ ...filters, [key]: value })}
        onReset={() => setFilters({ statut: '', espaceId: '' })}
      />

      <DataTable
        data={reservations.filter(r =>
          (!filters.statut || r.statut === filters.statut) &&
          (!filters.espaceId || r.espaceId === filters.espaceId)
        )}
        columns={columns}
        loading={loading}
        searchable
        searchKeys={['user.nom', 'user.email', 'espace.nom']}
        pagination
        itemsPerPage={20}
        exportable
        onExport={() => exportToExcel(reservations, columns, 'reservations')}
        onRowClick={(r) => navigate(`/dashboard/admin/reservations/${r.id}`)}
        actions={(r) => (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/dashboard/admin/reservations/${r.id}`)}
            >
              Détails
            </Button>
            {r.statut !== 'annulee' && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleCancel(r.id)}
              >
                Annuler
              </Button>
            )}
          </>
        )}
      />
    </div>
  );
}
```

## Support

Pour toute question sur la migration :
1. Consulter **ARCHITECTURE.md** pour la documentation complète
2. Voir **REFACTORING.md** pour le contexte global
3. Examiner les exemples ci-dessus
4. Tester progressivement sur une page à la fois
