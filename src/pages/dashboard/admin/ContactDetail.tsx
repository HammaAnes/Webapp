import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContactStore } from '../../../store/contactStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import SelectNative from '../../../components/ui/SelectNative';
import Textarea from '../../../components/ui/Textarea';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import { ArrowLeft, FileEdit as Edit, Save, X, Trash2, UserPlus, Mail, Phone, Building2, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import type { Contact, ContactHistory } from '../../../types';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentContact, loading, fetchContactById, updateContact, deleteContact, convertToUser } = useContactStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (id) {
      fetchContactById(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentContact) {
      setFormData(currentContact);
    }
  }, [currentContact]);

  const handleUpdate = async () => {
    if (!id) return;

    try {
      await updateContact(id, formData);
      toast.success('Contact mis à jour');
      setIsEditing(false);
      fetchContactById(id);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteContact(id);
      toast.success('Contact supprimé');
      navigate('/dashboard/admin/contacts');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleConvert = async () => {
    if (!id) return;

    try {
      const result = await convertToUser(id, true);
      toast.success(
        <div>
          <p>Contact converti en utilisateur</p>
          <p className="text-xs mt-1">Mot de passe: {result.temporaryPassword}</p>
        </div>
      );
      setShowConvertModal(false);
      fetchContactById(id);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la conversion');
    }
  };

  if (loading && !currentContact) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentContact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Contact non trouvé</p>
        <Button onClick={() => navigate('/dashboard/admin/contacts')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  const contact = currentContact as any;
  const history: ContactHistory[] = contact.history || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/admin/contacts')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {contact.prenom} {contact.nom}
            </h1>
            <p className="text-muted mt-1">
              Créé le {formatDate(contact.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!contact.userId && (
            <Button
              variant="outline"
              onClick={() => setShowConvertModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Convertir en utilisateur
            </Button>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button onClick={handleUpdate}>
                <Save className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">
              Informations du contact
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Prénom
                </label>
                {isEditing ? (
                  <Input
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                ) : (
                  <p className="text-muted">{contact.prenom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Nom
                </label>
                {isEditing ? (
                  <Input
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                ) : (
                  <p className="text-muted">{contact.nom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-muted">{contact.email || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Téléphone
                </label>
                {isEditing ? (
                  <Input
                    value={formData.telephone || ''}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                ) : (
                  <p className="text-muted">{contact.telephone || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Entreprise
                </label>
                {isEditing ? (
                  <Input
                    value={formData.entreprise || ''}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  />
                ) : (
                  <p className="text-muted">{contact.entreprise || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Source
                </label>
                {isEditing ? (
                  <SelectNative
                    value={formData.source || 'autre'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
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
                ) : (
                  <p className="text-muted capitalize">{contact.source}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Statut
                </label>
                {isEditing ? (
                  <SelectNative
                    value={formData.statut || 'prospect'}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="client">Client</option>
                    <option value="perdu">Perdu</option>
                  </SelectNative>
                ) : (
                  <Badge>{contact.statut}</Badge>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary mb-2">
                  Notes
                </label>
                {isEditing ? (
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-muted whitespace-pre-wrap">{contact.notes || '-'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">
              Historique d'activité
            </h2>

            {history.length === 0 ? (
              <p className="text-muted text-center py-8">
                Aucune activité enregistrée
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={item.type === 'reservation' ? 'default' : 'secondary'}>
                          {item.type === 'reservation' ? 'Réservation' : 'Domiciliation'}
                        </Badge>
                        <Badge>{item.statut}</Badge>
                      </div>
                      <p className="text-sm text-primary font-medium">{item.description}</p>
                      <p className="text-xs text-muted mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(item.date)}
                      </p>
                    </div>
                    {item.montant && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-accent">
                          {formatCurrency(item.montant)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Statistiques
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">Réservations</p>
                <p className="text-2xl font-bold text-primary">
                  {contact.stats?.nbReservations || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Domiciliations</p>
                <p className="text-2xl font-bold text-primary">
                  {contact.stats?.nbDomiciliations || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Revenu total</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(contact.stats?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          {contact.user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">
                  Compte utilisateur
                </h3>
              </div>
              <p className="text-sm text-green-700">
                Ce contact dispose d'un compte utilisateur actif.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard/admin/users/${contact.userId}`)}
                className="mt-4 w-full"
              >
                Voir le profil utilisateur
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le contact"
      >
        <p className="text-muted mb-6">
          Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700">
            Supprimer
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convertir en utilisateur"
      >
        <p className="text-muted mb-6">
          Cette action va créer un compte utilisateur pour ce contact et transférer toutes ses
          réservations et domiciliations. Un email avec un mot de passe temporaire sera envoyé.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowConvertModal(false)} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleConvert} className="flex-1">
            Convertir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
