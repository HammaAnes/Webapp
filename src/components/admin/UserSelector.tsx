import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, X, User, Loader2, Search, Users } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { CreateUserModal, type CreatedUser } from './CreateUserModal';

export interface SelectedUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  isContact?: boolean;
}

interface UserSelectorProps {
  value: SelectedUser | null;
  onChange: (user: SelectedUser | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

interface ClientEntry {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  type: 'user' | 'contact';
}

export function UserSelector({ value, onChange, label = 'Client', required, error }: UserSelectorProps) {
  const [clients, setClients] = useState<ClientEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, contactsRes] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getContacts({}).catch(() => ({ success: false, data: null })),
      ]);

      const entries: ClientEntry[] = [];

      if (usersRes.success && usersRes.data) {
        const raw = Array.isArray(usersRes.data)
          ? usersRes.data
          : ((usersRes.data as Record<string, unknown>).users as unknown[]) || [];
        (raw as Record<string, unknown>[]).forEach((r) => {
          entries.push({
            id: String(r.id),
            email: String(r.email || ''),
            nom: String(r.nom || ''),
            prenom: String(r.prenom || ''),
            telephone: r.telephone as string | undefined,
            type: 'user',
          });
        });
      }

      if (contactsRes.success && contactsRes.data) {
        const data = contactsRes.data as Record<string, unknown>;
        const raw = (data.contacts || []) as Record<string, unknown>[];
        raw.forEach((r) => {
          if (r.user_id) return;
          const email = String(r.email || '');
          if (entries.some((e) => e.email && e.email === email)) return;
          entries.push({
            id: String(r.id),
            email,
            nom: String(r.nom || ''),
            prenom: String(r.prenom || ''),
            telephone: r.telephone as string | undefined,
            type: 'contact',
          });
        });
      }

      setClients(entries);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.telephone && c.telephone.includes(q))
    );
  }, [clients, searchTerm]);

  const handleSelect = (client: ClientEntry) => {
    onChange({
      id: client.id,
      email: client.email,
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      isContact: client.type === 'contact',
    });
    setShowDropdown(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onChange(null);
  };

  const handleUserCreated = (user: CreatedUser) => {
    const newEntry: ClientEntry = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      type: 'user',
    };
    setClients((prev) => [newEntry, ...prev]);
    onChange({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
    });
    setShowCreateUser(false);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {value ? (
        <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            value.isContact ? 'bg-amber-50' : 'bg-sky-50'
          }`}>
            {value.isContact ? (
              <Users className="w-4 h-4 text-amber-600" />
            ) : (
              <User className="w-4 h-4 text-sky-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 text-sm truncate">
                {value.prenom} {value.nom}
              </p>
              {value.isContact && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                  Contact
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{value.email || value.telephone}</p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Rechercher un client..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white"
                  />
                </div>
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          Aucun client trouve
                        </div>
                      ) : (
                        filteredClients.slice(0, 50).map((client) => (
                          <button
                            key={`${client.type}-${client.id}`}
                            type="button"
                            onClick={() => handleSelect(client)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              client.type === 'contact' ? 'bg-amber-50' : 'bg-sky-50'
                            }`}>
                              {client.type === 'contact' ? (
                                <Users className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-sky-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {client.prenom} {client.nom}
                                </span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  client.type === 'contact'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-sky-100 text-sky-700'
                                }`}>
                                  {client.type === 'contact' ? 'Contact' : 'Utilisateur'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 truncate block">
                                {client.email || client.telephone || '-'}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCreateUser(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {showCreateUser && (
        <CreateUserModal
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
}
