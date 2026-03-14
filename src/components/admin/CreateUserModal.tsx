import { useState } from 'react';
import { Copy, Check, UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SelectNative from '../ui/SelectNative';
import { useContactStore } from '../../store/contactStore';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';

export interface CreatedUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  entreprise?: string;
  profession?: string;
  role: 'user' | 'admin';
  tempPassword?: string;
}

export interface CreateUserInitialData {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  contactId?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: CreatedUser) => void;
  initialData?: CreateUserInitialData;
}

export function CreateUserModal({ isOpen, onClose, onUserCreated, initialData }: CreateUserModalProps) {
  const { convertToUser } = useContactStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const [formData, setFormData] = useState({
    prenom: initialData?.prenom || '',
    nom: initialData?.nom || '',
    email: initialData?.email || '',
    telephone: initialData?.telephone || '',
    entreprise: initialData?.entreprise || '',
    profession: '',
    role: 'user' as 'user' | 'admin',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let user: CreatedUser;

      if (initialData?.contactId) {
        const result = await convertToUser(initialData.contactId, true);
        user = {
          id: result.userId,
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone || undefined,
          entreprise: formData.entreprise || undefined,
          role: 'user',
          tempPassword: result.temporaryPassword,
        };
      } else {
        const response = await apiClient.adminCreateUser({
          email: formData.email.trim(),
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          telephone: formData.telephone.trim() || undefined,
          password: formData.password.trim() || undefined,
          entreprise: formData.entreprise.trim() || undefined,
          profession: formData.profession.trim() || undefined,
          role: formData.role,
        });

        if (!response.success) {
          toast.error(response.error || response.message || 'Erreur lors de la création');
          return;
        }

        const data = response.data as Record<string, unknown>;
        user = {
          id: String(data.id),
          email: String(data.email),
          nom: String(data.nom),
          prenom: String(data.prenom),
          telephone: data.telephone as string | undefined,
          entreprise: data.entreprise as string | undefined,
          profession: data.profession as string | undefined,
          role: (data.role as 'user' | 'admin') || 'user',
          tempPassword: data.temp_password as string | undefined,
        };
      }

      setCreatedUser(user);
      onUserCreated(user);
      toast.success('Compte utilisateur créé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdUser?.tempPassword) {
      navigator.clipboard.writeText(createdUser.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setFormData({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      entreprise: '',
      profession: '',
      role: 'user',
      password: '',
    });
    setErrors({});
    setCreatedUser(null);
    setCopied(false);
    onClose();
  };

  if (createdUser) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Compte créé">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">
                {createdUser.prenom} {createdUser.nom}
              </p>
              <p className="text-sm text-green-600">{createdUser.email}</p>
            </div>
          </div>

          {createdUser.tempPassword && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800 mb-2">Mot de passe temporaire</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-mono text-amber-900 select-all">
                  {createdUser.tempPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors"
                  title="Copier"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-amber-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                Communiquez ce mot de passe à l'utilisateur. Il pourra le modifier depuis son profil.
              </p>
            </div>
          )}

          <Button onClick={handleClose} className="w-full">
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  const isFromContact = !!initialData?.contactId;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer un compte utilisateur">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isFromContact && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Le compte sera créé à partir des informations du contact. Un mot de passe temporaire sera généré automatiquement.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              placeholder="Jean"
              error={errors.prenom}
              disabled={loading || isFromContact}
            />
            {errors.prenom && <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Dupont"
              error={errors.nom}
              disabled={loading || isFromContact}
            />
            {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jean.dupont@email.com"
            error={errors.email}
            disabled={loading || isFromContact}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Téléphone</label>
          <Input
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="0555 12 34 56"
            disabled={loading || isFromContact}
          />
        </div>

        {!isFromContact && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Entreprise</label>
                <Input
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Profession</label>
                <Input
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="Fonction"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Mot de passe{' '}
                <span className="text-muted font-normal">(laissez vide pour générer automatiquement)</span>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 caractères"
                error={errors.password}
                disabled={loading}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">Rôle</label>
              <SelectNative
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                disabled={loading}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </SelectNative>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Création...' : 'Créer le compte'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
