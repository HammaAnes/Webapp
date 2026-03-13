import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactStore } from '../../../store/contactStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import SelectNative from '../../../components/ui/SelectNative';
import Textarea from '../../../components/ui/Textarea';
import Checkbox from '../../../components/ui/Checkbox';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ContactSource, ContactStatut } from '../../../types';

const SOURCE_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'fixe', label: 'Téléphone fixe' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'physique', label: 'En personne' },
  { value: 'email', label: 'Email' },
  { value: 'autre', label: 'Autre' },
] as const;

const STATUT_OPTIONS = [
  { value: 'prospect', label: 'Prospect', description: 'Contact potentiel non converti' },
  { value: 'client', label: 'Client', description: 'Client actif ou ayant réservé' },
  { value: 'perdu', label: 'Perdu', description: 'Contact ne présentant plus d\'intérêt' },
] as const;

export default function ContactCreate() {
  const navigate = useNavigate();
  const { createContact } = useContactStore();
  const [loading, setLoading] = useState(false);
  const [createAsUser, setCreateAsUser] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    entreprise: '',
    source: 'autre' as ContactSource,
    statut: 'prospect' as ContactStatut,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.email.trim() && !formData.telephone.trim()) {
      newErrors.email = 'Au moins un email ou un téléphone est requis';
      newErrors.telephone = 'Au moins un email ou un téléphone est requis';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (createAsUser && !formData.email.trim()) {
      newErrors.email = 'Un email est requis pour créer un compte utilisateur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    try {
      const contact = await createContact({
        ...formData,
        email: formData.email.trim() || undefined,
        telephone: formData.telephone.trim() || undefined,
        entreprise: formData.entreprise.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.success('Contact créé avec succès');

      if (createAsUser) {
        navigate(`/dashboard/admin/contacts/${contact.id}?convertToUser=true`);
      } else {
        navigate(`/dashboard/admin/contacts/${contact.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du contact');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/admin/contacts')}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Nouveau contact</h1>
          <p className="text-muted mt-1">
            Créer un nouveau contact dans le CRM
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-primary mb-6">
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.prenom}
                onChange={(e) => handleFieldChange('prenom', e.target.value)}
                placeholder="Jean"
                error={errors.prenom}
                disabled={loading}
              />
              {errors.prenom && (
                <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.nom}
                onChange={(e) => handleFieldChange('nom', e.target.value)}
                placeholder="Dupont"
                error={errors.nom}
                disabled={loading}
              />
              {errors.nom && (
                <p className="text-xs text-red-500 mt-1">{errors.nom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Email {createAsUser && <span className="text-red-500">*</span>}
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="jean.dupont@email.com"
                error={errors.email}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleFieldChange('telephone', e.target.value)}
                placeholder="0555 12 34 56"
                error={errors.telephone}
                disabled={loading}
              />
              {errors.telephone && (
                <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>
              )}
              <p className="text-xs text-muted mt-1">
                Au moins l'email ou le téléphone est requis
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">
                Entreprise
              </label>
              <Input
                value={formData.entreprise}
                onChange={(e) => handleFieldChange('entreprise', e.target.value)}
                placeholder="Nom de l'entreprise"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-primary mb-6">
            Informations CRM
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Source du contact <span className="text-red-500">*</span>
              </label>
              <SelectNative
                value={formData.source}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                disabled={loading}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectNative>
              <p className="text-xs text-muted mt-1">
                Comment ce contact a-t-il été acquis ?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Statut
              </label>
              <SelectNative
                value={formData.statut}
                onChange={(e) => handleFieldChange('statut', e.target.value)}
                disabled={loading}
              >
                {STATUT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectNative>
              <p className="text-xs text-muted mt-1">
                {STATUT_OPTIONS.find((o) => o.value === formData.statut)?.description}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">
                Notes internes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Ajoutez des notes sur ce contact, son intérêt, son historique de contact..."
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-muted mt-1">
                Ces notes sont uniquement visibles par l'équipe
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="createAsUser"
              checked={createAsUser}
              onChange={(e) => setCreateAsUser(e.target.checked)}
              disabled={loading}
            />
            <div className="flex-1">
              <label
                htmlFor="createAsUser"
                className="text-sm font-medium text-primary cursor-pointer flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Créer également un compte utilisateur
              </label>
              <p className="text-xs text-muted mt-1">
                Un compte utilisateur sera créé après la création du contact. Un email avec un
                mot de passe temporaire sera envoyé.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/admin/contacts')}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer le contact
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
