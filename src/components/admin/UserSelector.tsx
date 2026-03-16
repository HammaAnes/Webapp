import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, UserPlus, X, User, Loader2, ChevronRight } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiClient.searchUsers(q.trim());
      if (res.success && res.data) {
        const raw = Array.isArray(res.data)
          ? res.data
          : ((res.data as Record<string, unknown>).users as unknown[]) || [];
        setResults(
          raw.map((u: unknown) => {
            const r = u as Record<string, unknown>;
            return {
              id: String(r.id),
              email: String(r.email || ''),
              nom: String(r.nom || ''),
              prenom: String(r.prenom || ''),
              telephone: r.telephone as string | undefined,
            };
          })
        );
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectUser = (user: SelectedUser) => {
    onChange(user);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const clearSelection = () => {
    onChange(null);
    setQuery('');
  };

  const handleUserCreated = (user: CreatedUser) => {
    selectUser({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
    });
    setShowCreateUser(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {value ? (
        <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-accent" />
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowResults(true);
              }}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent text-sm bg-white"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
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

      {showResults && !value && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => selectUser(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
            >
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {u.prenom} {u.nom}
                </p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {showResults && !value && !searching && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            Aucun resultat — utilisez "Nouveau" pour creer un compte
          </div>
        </div>
      )}

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
