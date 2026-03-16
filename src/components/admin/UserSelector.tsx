import { useState, useEffect, useCallback } from 'react';
import { UserPlus, X, User, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { CreateUserModal, type CreatedUser } from './CreateUserModal';

export interface SelectedUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
}

interface UserSelectorProps {
  value: SelectedUser | null;
  onChange: (user: SelectedUser | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export function UserSelector({ value, onChange, label = 'Client', required, error }: UserSelectorProps) {
  const [users, setUsers] = useState<SelectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getUsers();
      if (res.success && res.data) {
        const raw = Array.isArray(res.data)
          ? res.data
          : ((res.data as Record<string, unknown>).users as unknown[]) || [];
        setUsers(
          (raw as Record<string, unknown>[]).map((r) => ({
            id: String(r.id),
            email: String(r.email || ''),
            nom: String(r.nom || ''),
            prenom: String(r.prenom || ''),
            telephone: r.telephone as string | undefined,
          }))
        );
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSelect = (userId: string) => {
    if (!userId) {
      onChange(null);
      return;
    }
    const user = users.find((u) => u.id === userId);
    if (user) onChange(user);
  };

  const clearSelection = () => {
    onChange(null);
  };

  const handleUserCreated = (user: CreatedUser) => {
    const newUser: SelectedUser = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
    };
    setUsers((prev) => [newUser, ...prev]);
    onChange(newUser);
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
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {value.prenom} {value.nom}
            </p>
            <p className="text-xs text-gray-500 truncate">{value.email}</p>
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
              <select
                value=""
                onChange={(e) => handleSelect(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white appearance-none"
              >
                <option value="">Sélectionner un client...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email}
                  </option>
                ))}
              </select>
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
