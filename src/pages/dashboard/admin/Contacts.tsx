import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactStore } from '../../../store/contactStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import EmptyState from '../../../components/ui/EmptyState';
import { Users, Search, Plus, Phone, Mail, Building2, Eye } from 'lucide-react';
import type { ContactSource, ContactStatut } from '../../../types';

const sourceLabels: Record<ContactSource, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  fixe: 'Téléphone fixe',
  mobile: 'Mobile',
  physique: 'En personne',
  email: 'Email',
  autre: 'Autre',
};

const sourceColors: Record<ContactSource, string> = {
  whatsapp: 'bg-green-100 text-green-800',
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-purple-100 text-purple-800',
  fixe: 'bg-blue-100 text-blue-800',
  mobile: 'bg-cyan-100 text-cyan-800',
  physique: 'bg-amber-100 text-amber-800',
  email: 'bg-gray-100 text-gray-800',
  autre: 'bg-slate-100 text-slate-800',
};

const statutLabels: Record<ContactStatut, string> = {
  prospect: 'Prospect',
  client: 'Client',
  perdu: 'Perdu',
};

const statutColors: Record<ContactStatut, string> = {
  prospect: 'bg-yellow-100 text-yellow-800',
  client: 'bg-green-100 text-green-800',
  perdu: 'bg-red-100 text-red-800',
};

export default function Contacts() {
  const navigate = useNavigate();
  const { contacts, loading, filters, pagination, fetchContacts, setFilters, setPage } = useContactStore();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const debounce = setTimeout(() => {
      setFilters({ search: value });
    }, 300);
    return () => clearTimeout(debounce);
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
          onClick={() => navigate('/dashboard/admin/contacts/nouveau')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau contact
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <Input
                type="text"
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filters.statut}
            onChange={(e) => setFilters({ statut: e.target.value as ContactStatut | '' })}
          >
            <option value="">Tous les statuts</option>
            <option value="prospect">Prospect</option>
            <option value="client">Client</option>
            <option value="perdu">Perdu</option>
          </Select>

          <Select
            value={filters.source}
            onChange={(e) => setFilters({ source: e.target.value as ContactSource | '' })}
          >
            <option value="">Toutes les sources</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="fixe">Téléphone fixe</option>
            <option value="mobile">Mobile</option>
            <option value="physique">En personne</option>
            <option value="email">Email</option>
            <option value="autre">Autre</option>
          </Select>
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
              onClick: () => navigate('/dashboard/admin/contacts/nouveau'),
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
                    <tr
                      key={contact.id}
                      className="border-b border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-primary">
                            {contact.prenom} {contact.nom}
                          </div>
                          {contact.user && (
                            <div className="text-xs text-muted mt-1">
                              Compte créé
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <Mail className="w-4 h-4" />
                              {contact.email}
                            </div>
                          )}
                          {contact.telephone && (
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <Phone className="w-4 h-4" />
                              {contact.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {contact.entreprise && (
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Building2 className="w-4 h-4" />
                            {contact.entreprise}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={sourceColors[contact.source]}>
                          {sourceLabels[contact.source]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={statutColors[contact.statut]}>
                          {statutLabels[contact.statut]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted">
                        <div>
                          {(contact as any).nbReservations || 0} rés.
                        </div>
                        <div>
                          {(contact as any).nbDomiciliations || 0} dom.
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/admin/contacts/${contact.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
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
