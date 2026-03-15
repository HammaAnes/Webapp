import React, { useState, useEffect } from 'react';
import { Building, Pencil, Save, Briefcase, Hash, FileText, MapPin, Banknote } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { useAppStore } from '../../../store/store';
import toast from 'react-hot-toast';
import type { User } from '../../../types';
import type { DemandeDomiciliation } from '../../domain/types';

interface EntrepriseTabProps {
  user: User;
  demande: DemandeDomiciliation | null;
  loading?: boolean;
}

interface EditFormData {
  raisonSociale: string;
  formeJuridique: string;
  nif: string;
  nis: string;
  registreCommerce: string;
  articleImposition: string;
  numeroAutoEntrepreneur: string;
  activitePrincipale: string;
  capital: string;
  siegeSocial: string;
  dateCreationEntreprise: string;
}

function buildEditForm(user: User): EditFormData {
  return {
    raisonSociale: user.raisonSociale || '',
    formeJuridique: user.formeJuridique || '',
    nif: user.nif || '',
    nis: user.nis || '',
    registreCommerce: user.registreCommerce || '',
    articleImposition: user.articleImposition || '',
    numeroAutoEntrepreneur: user.numeroAutoEntrepreneur || '',
    activitePrincipale: user.activitePrincipale || '',
    capital: user.capital || '',
    siegeSocial: user.siegeSocial || '',
    dateCreationEntreprise: user.dateCreationEntreprise || '',
  };
}

const InfoField: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-gray-400">{icon}</span>}
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
    </div>
    <p className="font-semibold text-gray-900">{value || 'Non renseigné'}</p>
  </div>
);

function isSociete(demande: DemandeDomiciliation | null, user: User): boolean {
  if (demande) return demande.typeStructure === 'societe';
  return (user as Record<string, unknown>).typeEntreprise !== 'auto_entrepreneur';
}

export default function EntrepriseTab({ user, demande, loading }: EntrepriseTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<EditFormData>(buildEditForm(user));
  const [saving, setSaving] = useState(false);
  const updateUser = useAppStore((s) => s.updateUser);
  const societe = isSociete(demande, user);
  const hasInfo = user.raisonSociale || user.nif || user.numeroAutoEntrepreneur || demande;

  useEffect(() => {
    setFormData(buildEditForm(user));
  }, [user]);

  const handleChange = (field: keyof EditFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, formData as unknown as Record<string, unknown>);
      setShowModal(false);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  const openModal = () => {
    setFormData(buildEditForm(user));
    setShowModal(true);
  };

  if (!hasInfo) {
    return (
      <Card className="p-12 text-center">
        <div className="bg-amber-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Building className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune information entreprise</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Vos informations entreprise apparaîtront ici une fois votre demande de domiciliation soumise.
        </p>
        <Button
          onClick={openModal}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Renseigner mes informations
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Fiche Entreprise</h2>
              <p className="text-sm text-gray-500">{societe ? 'Société' : 'Auto-entrepreneur'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={societe ? 'warning' : 'info'}>
              {societe ? (user.formeJuridique || demande?.formeJuridique || 'Société') : 'Auto-entrepreneur'}
            </Badge>
            <Button variant="outline" size="sm" onClick={openModal}>
              <Pencil className="w-4 h-4 mr-1" />Modifier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Raison Sociale" value={user.raisonSociale || demande?.raisonSociale} icon={<Building className="w-3.5 h-3.5" />} />
          <InfoField label="Forme Juridique" value={user.formeJuridique || demande?.formeJuridique} icon={<FileText className="w-3.5 h-3.5" />} />
          <InfoField
            label="Activité Principale"
            value={user.activitePrincipale || demande?.activitePrincipale || demande?.activiteExercee}
            icon={<Briefcase className="w-3.5 h-3.5" />}
          />
          {societe ? (
            <>
              <InfoField label="NIF" value={user.nif || demande?.nif} icon={<Hash className="w-3.5 h-3.5" />} />
              <InfoField label="NIS" value={user.nis || demande?.nis} icon={<Hash className="w-3.5 h-3.5" />} />
              <InfoField label="Registre de Commerce" value={user.registreCommerce || demande?.registreCommerce} icon={<FileText className="w-3.5 h-3.5" />} />
              <InfoField label="Article d'Imposition" value={user.articleImposition || demande?.articleImposition} icon={<FileText className="w-3.5 h-3.5" />} />
              <InfoField
                label="Capital"
                value={user.capital ? `${user.capital} DA` : undefined}
                icon={<Banknote className="w-3.5 h-3.5" />}
              />
            </>
          ) : (
            <InfoField
              label="N. Auto-Entrepreneur"
              value={user.numeroAutoEntrepreneur || demande?.numeroAutoEntrepreneur}
              icon={<Hash className="w-3.5 h-3.5" />}
            />
          )}
          <InfoField label="Siège Social" value={user.siegeSocial || demande?.adresseSiegeSocial} icon={<MapPin className="w-3.5 h-3.5" />} />
        </div>
      </Card>

      {demande && (
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-amber-600" />
            <p className="font-semibold text-amber-900 text-sm">Informations issues de la demande de domiciliation</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {demande.typeStructure && (
              <div>
                <span className="text-amber-700">Type : </span>
                <span className="font-medium text-amber-900">
                  {demande.typeStructure === 'societe' ? 'Société' : 'Auto-entrepreneur'}
                </span>
              </div>
            )}
            {demande.villeImmatriculation && (
              <div>
                <span className="text-amber-700">Ville : </span>
                <span className="font-medium text-amber-900">{demande.villeImmatriculation}</span>
              </div>
            )}
            {demande.codeNae && (
              <div>
                <span className="text-amber-700">Code NAE : </span>
                <span className="font-medium text-amber-900">{demande.codeNae}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Modifier les informations entreprise" size="lg">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Raison Sociale" value={formData.raisonSociale} onChange={(e) => handleChange('raisonSociale', e.target.value)} />
            <Input label="Forme Juridique" value={formData.formeJuridique} onChange={(e) => handleChange('formeJuridique', e.target.value)} />
          </div>
          <Input label="Activité Principale" value={formData.activitePrincipale} onChange={(e) => handleChange('activitePrincipale', e.target.value)} />
          {societe ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="NIF" value={formData.nif} onChange={(e) => handleChange('nif', e.target.value)} />
                <Input label="NIS" value={formData.nis} onChange={(e) => handleChange('nis', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Registre de Commerce" value={formData.registreCommerce} onChange={(e) => handleChange('registreCommerce', e.target.value)} />
                <Input label="Article d'Imposition" value={formData.articleImposition} onChange={(e) => handleChange('articleImposition', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Capital (DA)" value={formData.capital} onChange={(e) => handleChange('capital', e.target.value)} />
                <Input label="Date de Création" type="date" value={formData.dateCreationEntreprise} onChange={(e) => handleChange('dateCreationEntreprise', e.target.value)} />
              </div>
            </>
          ) : (
            <Input label="N. Auto-Entrepreneur" value={formData.numeroAutoEntrepreneur} onChange={(e) => handleChange('numeroAutoEntrepreneur', e.target.value)} />
          )}
          <Input label="Siège Social" value={formData.siegeSocial} onChange={(e) => handleChange('siegeSocial', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-5">
          <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button
            loading={saving}
            onClick={handleSave}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Save className="w-4 h-4 mr-1" />Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
