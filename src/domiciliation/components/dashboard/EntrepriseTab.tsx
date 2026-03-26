import React, { useState, useEffect } from 'react';
import { Building, Pencil, Save, Briefcase, Hash, FileText, MapPin, Banknote, Building2, ArrowRight } from 'lucide-react';
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

interface FormData {
  raisonSociale: string;
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

const buildFormData = (user: User): FormData => ({
  raisonSociale: user.raisonSociale || '',
  nif: user.nif || '',
  nis: user.nis || '',
  registreCommerce: user.registreCommerce || '',
  articleImposition: user.articleImposition || '',
  numeroAutoEntrepreneur: user.numeroAutoEntrepreneur || '',
  activitePrincipale: user.activitePrincipale || '',
  capital: user.capital || '',
  siegeSocial: user.siegeSocial || '',
  dateCreationEntreprise: user.dateCreationEntreprise || '',
});

const F: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-gray-400">{icon}</span>}
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
    </div>
    <p className="font-semibold text-gray-900">{value || 'Non renseigné'}</p>
  </div>
);

export default function EntrepriseTab({ user, demande, loading }: EntrepriseTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(buildFormData(user));
  const [saving, setSaving] = useState(false);
  const updateUser = useAppStore(s => s.updateUser);

  const isSociete = demande ? demande.typeStructure === 'societe' : user.typeEntreprise !== 'auto_entrepreneur';
  const hasInfo = user.raisonSociale || user.nif || user.numeroAutoEntrepreneur || demande;

  useEffect(() => {
    if (user) setFormData(buildFormData(user));
  }, [user]);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

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

  if (!hasInfo) {
    const PREVIEW_FIELDS = [
      'Raison sociale',
      'Forme juridique',
      'NIF / NIS',
      'Registre de commerce',
      'Activité principale',
      'Siège social',
    ];

    return (
      <div className="space-y-4">
        <Card className="p-0 overflow-hidden border border-gray-200">
          {/* En-tête */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Votre fiche entreprise</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                Centralisez ici toutes les informations légales de votre société —
                elles seront automatiquement renseignées à l'issue de votre domiciliation,
                ou vous pouvez les compléter dès maintenant.
              </p>
            </div>
          </div>

          {/* Aperçu des champs à compléter */}
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Informations à compléter
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {PREVIEW_FIELDS.map(field => (
                <div
                  key={field}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-sm text-gray-400 font-medium">{field}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 border-t border-gray-100">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Vous connaissez déjà vos informations ?</p>
                <p className="text-xs text-gray-400 mt-0.5">Complétez votre fiche maintenant, vous pourrez la modifier à tout moment.</p>
              </div>
              <Button
                onClick={() => { setFormData(buildFormData(user)); setShowModal(true); }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white whitespace-nowrap flex-shrink-0"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                leftIcon={<Pencil className="w-4 h-4" />}
              >
                Compléter ma fiche
              </Button>
            </div>
          </div>
        </Card>

        {/* Note domiciliation */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Après votre domiciliation</span> — votre raison sociale, forme juridique, NIF, NIS et registre de commerce seront automatiquement synchronisés ici depuis votre dossier.
          </p>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Compléter ma fiche entreprise" size="lg">
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Raison Sociale" value={formData.raisonSociale} onChange={handleChange('raisonSociale')} />
            </div>
            <Input label="Activité Principale" value={formData.activitePrincipale} onChange={handleChange('activitePrincipale')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="NIF" value={formData.nif} onChange={handleChange('nif')} />
              <Input label="NIS" value={formData.nis} onChange={handleChange('nis')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Registre de Commerce" value={formData.registreCommerce} onChange={handleChange('registreCommerce')} />
              <Input label="Article d'Imposition" value={formData.articleImposition} onChange={handleChange('articleImposition')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="N. Auto-Entrepreneur" value={formData.numeroAutoEntrepreneur} onChange={handleChange('numeroAutoEntrepreneur')} />
              <Input label="Capital (DA)" value={formData.capital} onChange={handleChange('capital')} />
            </div>
            <Input label="Siège Social" value={formData.siegeSocial} onChange={handleChange('siegeSocial')} />
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-5">
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button
              loading={saving}
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Enregistrer
            </Button>
          </div>
        </Modal>
      </div>
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
              <p className="text-sm text-gray-500">{isSociete ? 'Société' : 'Auto-entrepreneur'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isSociete ? 'warning' : 'info'}>
              {isSociete ? (demande?.formeJuridique || 'Société') : 'Auto-entrepreneur'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => { setFormData(buildFormData(user)); setShowModal(true); }}>
              <Pencil className="w-4 h-4 mr-1" />Modifier
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Raison Sociale" value={user.raisonSociale || demande?.raisonSociale} icon={<Building className="w-3.5 h-3.5" />} />
          <F label="Forme Juridique" value={demande?.formeJuridique} icon={<FileText className="w-3.5 h-3.5" />} />
          <F label="Activité Principale" value={user.activitePrincipale || demande?.activiteExercee} icon={<Briefcase className="w-3.5 h-3.5" />} />
          {isSociete ? (
            <>
              <F label="NIF" value={user.nif || demande?.nif} icon={<Hash className="w-3.5 h-3.5" />} />
              <F label="NIS" value={user.nis || demande?.nis} icon={<Hash className="w-3.5 h-3.5" />} />
              <F label="Registre de Commerce" value={user.registreCommerce || demande?.registreCommerce} icon={<FileText className="w-3.5 h-3.5" />} />
              <F label="Article d'Imposition" value={user.articleImposition || demande?.articleImposition} icon={<FileText className="w-3.5 h-3.5" />} />
              <F label="Capital" value={user.capital ? `${user.capital} DA` : undefined} icon={<Banknote className="w-3.5 h-3.5" />} />
            </>
          ) : (
            <F label="N. Auto-Entrepreneur" value={user.numeroAutoEntrepreneur || demande?.numeroAutoEntrepreneur} icon={<Hash className="w-3.5 h-3.5" />} />
          )}
          <F label="Siège Social" value={user.siegeSocial || demande?.adresseSiegeSocial} icon={<MapPin className="w-3.5 h-3.5" />} />
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
              <div><span className="text-amber-700">Type : </span><span className="font-medium text-amber-900">{demande.typeStructure === 'societe' ? 'Société' : 'Auto-entrepreneur'}</span></div>
            )}
            {demande.villeImmatriculation && (
              <div><span className="text-amber-700">Ville : </span><span className="font-medium text-amber-900">{demande.villeImmatriculation}</span></div>
            )}
            {demande.codeNae && (
              <div><span className="text-amber-700">Code NAE : </span><span className="font-medium text-amber-900">{demande.codeNae}</span></div>
            )}
          </div>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Modifier les informations entreprise" size="lg">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Raison Sociale" value={formData.raisonSociale} onChange={handleChange('raisonSociale')} />
          </div>
          <Input label="Activité Principale" value={formData.activitePrincipale} onChange={handleChange('activitePrincipale')} />
          {isSociete ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="NIF" value={formData.nif} onChange={handleChange('nif')} />
                <Input label="NIS" value={formData.nis} onChange={handleChange('nis')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Registre de Commerce" value={formData.registreCommerce} onChange={handleChange('registreCommerce')} />
                <Input label="Article d'Imposition" value={formData.articleImposition} onChange={handleChange('articleImposition')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Capital (DA)" value={formData.capital} onChange={handleChange('capital')} />
                <Input label="Date de Création" type="date" value={formData.dateCreationEntreprise} onChange={handleChange('dateCreationEntreprise')} />
              </div>
            </>
          ) : (
            <Input label="N. Auto-Entrepreneur" value={formData.numeroAutoEntrepreneur} onChange={handleChange('numeroAutoEntrepreneur')} />
          )}
          <Input label="Siège Social" value={formData.siegeSocial} onChange={handleChange('siegeSocial')} />
        </div>
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-5">
          <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button loading={saving} onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            <Save className="w-4 h-4 mr-1" />Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
