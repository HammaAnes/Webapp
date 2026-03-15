import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, FileText, Mail, MapPin, Plus, Shield, Briefcase, Lock, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

import { useDomiciliation } from '../../domiciliation/hooks/useDomiciliation';
import WizardModal from '../../domiciliation/components/wizard/WizardModal';
import DemandeSummary from '../../domiciliation/components/dashboard/DemandeSummary';
import NoDemandeLanding from '../../domiciliation/components/dashboard/NoDemandeLanding';
import CourrierUtilisateur from '../../domiciliation/components/dashboard/CourrierUtilisateur';
import DocumentsEntreprise from '../../domiciliation/components/dashboard/DocumentsEntreprise';
import EntrepriseTab from '../../domiciliation/components/dashboard/EntrepriseTab';
import type { WizardFormData, UploadedDocument } from '../../domiciliation/domain/types';
import { DOMICILIATION_STATUT_LABELS } from '../../constants';

registerLocale('fr', fr);

type TabId = 'domiciliation' | 'entreprise' | 'courrier' | 'documents';

const ALL_TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; requiresActive: boolean }[] = [
  { id: 'domiciliation', label: 'Domiciliation', icon: Shield, requiresActive: false },
  { id: 'entreprise', label: 'Mon Entreprise', icon: Briefcase, requiresActive: false },
  { id: 'courrier', label: 'Mon courrier', icon: Mail, requiresActive: true },
  { id: 'documents', label: 'Mes documents', icon: FileText, requiresActive: true },
];

const MonEspace = ({ initialTab: initialTabProp }: { initialTab?: TabId } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = initialTabProp || (searchParams.get('tab') as TabId) || 'domiciliation';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [showWizard, setShowWizard] = useState(false);

  const { user } = useAuthStore();

  const {
    demande,
    loading,
    actionLoading,
    loadDemande,
    submitNewDemande,
    submitPostCreation,
    requestRenewal,
  } = useDomiciliation(user?.id || '');

  useEffect(() => {
    if (user?.id) {
      loadDemande();
    }
  }, [user?.id, loadDemande]);

  const isTerminal = demande && (
    demande.statut === 'refusee' || demande.statut === 'expiree' || demande.statut === 'resiliee'
  );
  const hasActiveDomiciliation = !!demande && !isTerminal;

  const handleTabChange = (tab: TabId) => {
    const tabConfig = ALL_TABS.find(t => t.id === tab);
    if (tabConfig?.requiresActive && !hasActiveDomiciliation) return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tabConfig = ALL_TABS.find(t => t.id === activeTab);
    if (tabConfig?.requiresActive && !hasActiveDomiciliation) {
      setActiveTab('domiciliation');
      setSearchParams({ tab: 'domiciliation' });
    }
  }, [hasActiveDomiciliation, activeTab, setSearchParams]);

  const handleWizardSubmit = async (formData: WizardFormData, documents: UploadedDocument[]) => {
    try {
      await submitNewDemande(formData, documents);
      toast.success('Demande de domiciliation envoyée avec succès !');
      setShowWizard(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi");
      throw e;
    }
  };

  const handlePostCreationSubmit = async (data: Record<string, string>) => {
    if (!demande) return;
    try {
      await submitPostCreation(demande.typeStructure, data);
      toast.success("Informations soumises avec succès. L'équipe Coffice va procéder à la validation finale.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleRenewalRequest = async () => {
    try {
      await requestRenewal();
      toast.success("Votre demande de renouvellement a été envoyée. L'équipe Coffice vous contactera.");
    } catch {
      toast.error('Erreur lors de la demande de renouvellement');
    }
  };

  if (!user) return null;

  if (loading && !demande) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statutLabel = demande
    ? (DOMICILIATION_STATUT_LABELS[demande.statut as keyof typeof DOMICILIATION_STATUT_LABELS] || demande.statut)
    : null;

  const statutBadgeVariant = demande
    ? demande.statut === 'active'
      ? 'success'
      : demande.statut === 'refusee' || demande.statut === 'resiliee'
        ? 'danger'
        : 'warning'
    : null;

  const expirationAlert = (() => {
    if (!demande?.dateFinContrat || !['active', 'domiciliation_creee'].includes(demande.statut)) return null;
    const fin = new Date(demande.dateFinContrat);
    const now = new Date();
    const daysLeft = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { type: 'expired' as const, daysLeft, fin };
    if (daysLeft <= 30) return { type: 'warning' as const, daysLeft, fin };
    return null;
  })();

  return (
    <div className="space-y-6">
      {expirationAlert && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${expirationAlert.type === 'expired' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${expirationAlert.type === 'expired' ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="flex-1">
            <p className={`font-semibold ${expirationAlert.type === 'expired' ? 'text-red-800' : 'text-amber-800'}`}>
              {expirationAlert.type === 'expired'
                ? 'Contrat de domiciliation expiré'
                : `Renouvellement — ${expirationAlert.daysLeft} jour${expirationAlert.daysLeft > 1 ? 's' : ''} restant${expirationAlert.daysLeft > 1 ? 's' : ''}`
              }
            </p>
            <p className={`text-sm mt-0.5 ${expirationAlert.type === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>
              {expirationAlert.type === 'expired'
                ? "Votre contrat a expiré. Contactez l'équipe Coffice pour le renouveler."
                : "Votre contrat de domiciliation arrive à échéance prochainement."
              }
            </p>
          </div>
          {expirationAlert.type === 'warning' && (
            <button
              onClick={handleRenewalRequest}
              disabled={actionLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex-shrink-0"
            >
              Demander le renouvellement
            </button>
          )}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLThoMnYxMmgtMlYyNnptLTE2IDRWMTJIMTJ2LTJIMjR2MmgtNHY0em0xNi00aDJ2NEgzNHYtMmgydi0yaC0yem0tOC04aDJ2NEgyOHYtMmgydi0yaC0yem0tOCAwaDJ2MkgyMHYtMnptMCA4aDJ2MkgyMHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Mon espace pro</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {user.raisonSociale && (
                  <span className="text-white/70 text-sm font-medium">{user.raisonSociale}</span>
                )}
                {demande && statutBadgeVariant && (
                  <Badge variant={statutBadgeVariant}>{statutLabel}</Badge>
                )}
                {demande?.numeroBureau && (
                  <span className="text-white/50 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />Bureau {demande.numeroBureau}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'domiciliation' && (!demande || isTerminal) && (
              <Button
                onClick={() => setShowWizard(true)}
                variant="outline"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {demande ? 'Nouvelle demande' : 'Faire une demande'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <nav className="flex overflow-x-auto">
          {ALL_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.requiresActive && !hasActiveDomiciliation;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={isDisabled}
                className={`relative flex items-center gap-2.5 px-5 py-4 text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center min-w-0 ${
                  isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isActive
                      ? 'text-gray-900 bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                } ${index > 0 ? 'border-l border-gray-100' : ''}`}
              >
                {isDisabled ? (
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : ''}`} />
                )}
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'domiciliation' && (
            demande && !isTerminal ? (
              <DemandeSummary
                demande={demande}
                loading={actionLoading}
                onPostCreationSubmit={handlePostCreationSubmit}
                onNewDemande={() => setShowWizard(true)}
                onRenewalRequest={handleRenewalRequest}
              />
            ) : (
              <NoDemandeLanding onStartDemande={() => setShowWizard(true)} />
            )
          )}

          {activeTab === 'entreprise' && (
            <EntrepriseTab user={user} demande={demande} loading={loading} />
          )}

          {activeTab === 'courrier' && demande && hasActiveDomiciliation && (
            <CourrierUtilisateur
              domiciliationId={demande.id}
              options={demande.options}
            />
          )}

          {activeTab === 'documents' && demande && hasActiveDomiciliation && (
            <DocumentsEntreprise
              domiciliationId={demande.id}
              typeStructure={demande.typeStructure}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {user && (
        <WizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          user={user}
          onSubmit={handleWizardSubmit}
        />
      )}
    </div>
  );
};

export default MonEspace;
