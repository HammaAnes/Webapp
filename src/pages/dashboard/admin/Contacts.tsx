import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactStore } from '../../../store/contactStore';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import EmptyState from '../../../components/ui/EmptyState';
import { ContactCard } from '../../../components/contacts/ContactCard';
import { ContactFilters } from '../../../components/contacts/ContactFilters';
import { Users, Plus } from 'lucide-react';

export default function Contacts() {
  const navigate = useNavigate();
  const { contacts, loading, filters, pagination, fetchContacts, setFilters, setPage } = useContactStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value });
    }, 300);
  };

  const handleCreateContact = () => {
    navigate('/app/admin/contacts/nouveau');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Contacts CRM</h1>
          <p className="text-muted mt-1">
            Gérez vos prospects, leads et clients
          </p>
        </div>
        <Button
          onClick={handleCreateContact}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau contact
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <div className="mb-6">
          <ContactFilters
            searchValue={searchInput}
            onSearchChange={handleSearch}
            statutValue={filters.statut}
            onStatutChange={(value) => setFilters({ statut: value })}
            sourceValue={filters.source}
            onSourceChange={(value) => setFilters({ source: value })}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description="Commencez par créer votre premier contact"
            action={{
              label: 'Créer un contact',
              onClick: handleCreateContact,
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Coordonnées
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Entreprise
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Source
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Activité
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-primary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onView={(id) => navigate(`/app/admin/contacts/${id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} contacts)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
