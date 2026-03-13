import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SelectNative from '../ui/SelectNative';
import Textarea from '../ui/Textarea';
import { useContactStore } from '../../store/contactStore';
import toast from 'react-hot-toast';
import type { ContactSource, ContactStatut } from '../../types';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contactId: string) => void;
}

export function CreateContactModal({ isOpen, onClose, onContactCreated }: CreateContactModalProps) {
  const { createContact } = useContactStore();
  const [loading, setLoading] = useState(false);
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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.email.trim() && !formData.telephone.trim()) {
      newErrors.email = 'Email ou téléphone requis';
      newErrors.telephone = 'Email ou téléphone requis';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
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

      if (contact && contact.id) {
        toast.success('Contact créé avec succès');
        onContactCreated?.(contact.id);
        handleClose();
      } else {
        toast.error('Erreur: Contact créé mais ID manquant');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du contact');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      entreprise: '',
      source: 'autre',
      statut: 'prospect',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer un contact">
      <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Dupont"
              error={errors.nom}
            />
            {errors.nom && (
              <p className="text-xs text-red-500 mt-1">{errors.nom}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jean.dupont@email.com"
            error={errors.email}
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
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="0555123456"
            error={errors.telephone}
          />
          {errors.telephone && (
            <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>
          )}
          <p className="text-xs text-muted mt-1">
            Au moins l'email ou le téléphone est requis
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Entreprise
          </label>
          <Input
            value={formData.entreprise}
            onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
            placeholder="Nom de l'entreprise"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Source <span className="text-red-500">*</span>
            </label>
            <SelectNative
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as ContactSource })}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="fixe">Téléphone fixe</option>
              <option value="mobile">Mobile</option>
              <option value="physique">En personne</option>
              <option value="email">Email</option>
              <option value="autre">Autre</option>
            </SelectNative>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Statut
            </label>
            <SelectNative
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value as ContactStatut })}
            >
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="perdu">Perdu</option>
            </SelectNative>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Notes
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes internes sur ce contact..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Création...' : 'Créer le contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
