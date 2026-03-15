import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Plus,
  Shield,
  Briefcase,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import type { DemandeDomiciliation } from "../../types";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { DemandeSummary, NoDemandeLanding, WizardForm } from "../../components/domiciliation";
import CourrierUtilisateur from "../../components/domiciliation/CourrierUtilisateur";
import DocumentsEntreprise from "../../components/domiciliation/DocumentsEntreprise";
import EntrepriseTab from "../../components/domiciliation/EntrepriseTab";
import type { DomiciliationFormData, UploadedDocument } from "../../components/domiciliation";
import toast from "react-hot-toast";
import { registerLocale } from "react-datepicker";
import { emailService } from "../../services/email-service";
import { fr } from "date-fns/locale";
import { DOMICILIATION_STATUT_LABELS } from "../../constants";
import { apiClient } from "../../lib/api-client";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("fr", fr);

type TabId = "domiciliation" | "entreprise" | "courrier" | "documents";

const ALL_TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; requiresActive: boolean }[] = [
  { id: "domiciliation", label: "Domiciliation", icon: Shield, requiresActive: false },
  { id: "entreprise", label: "Mon Entreprise", icon: Briefcase, requiresActive: false },
  { id: "courrier", label: "Mon courrier", icon: Mail, requiresActive: true },
  { id: "documents", label: "Mes documents", icon: FileText, requiresActive: true },
];

const MonEspace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "domiciliation";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const { user } = useAuthStore();
  const {
    getUserDemandeDomiciliation,
    createDemandeDomiciliation,
    loadDemandesDomiciliation,
    updateUser,
  } = useAppStore();

  const [showWizard, setShowWizard] = useState(false);
  const [domLoading, setDomLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDemandesDomiciliation().finally(() => {
        const { demandesDomiciliation } = useAppStore.getState();
        setDataLoading(false);
      });
    }
  }, [user, loadDemandesDomiciliation]);

  const demande = user ? getUserDemandeDomiciliation(user.id) : null;
  const hasDemande = !!demande;
  const isTerminal = demande && (demande.statut === "refusee" || demande.statut === "expiree" || demande.statut === "resiliee");
  const hasActiveDomiciliation = hasDemande && !isTerminal;

  const handleTabChange = (tab: TabId) => {
    const tabConfig = ALL_TABS.find(t => t.id === tab);
    if (tabConfig?.requiresActive && !hasActiveDomiciliation) return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tabConfig = ALL_TABS.find(t => t.id === activeTab);
    if (tabConfig?.requiresActive && !hasActiveDomiciliation) {
      setActiveTab("domiciliation");
      setSearchParams({ tab: "domiciliation" });
    }
  }, [hasActiveDomiciliation, activeTab, setSearchParams]);

  const handleWizardSubmit = async (data: {
    situation: "en_cours_creation" | "deja_creee";
    typeStructure: "societe" | "auto_entrepreneur";
    formData: DomiciliationFormData;
    uploadedDocuments: UploadedDocument[];
  }) => {
    if (!user) return;
    const { situation, typeStructure, formData: wizFormData, uploadedDocuments } = data;
    const isAutoEntrepreneur = typeStructure === "auto_entrepreneur";
    const raisonSociale = isAutoEntrepreneur
      ? `${wizFormData.dirigeant.prenom} ${wizFormData.dirigeant.nom}`.trim()
      : wizFormData.denominationSociale;

    const submitData: Record<string, unknown> = {
      userId: user.id,
      situationAdministrative: situation,
      typeStructure,
      raisonSociale,
      formeJuridique: isAutoEntrepreneur ? "Auto-entrepreneur" : wizFormData.formeJuridique,
      representantLegal: {
        nom: wizFormData.dirigeant.nom,
        prenom: wizFormData.dirigeant.prenom,
        telephone: wizFormData.dirigeant.telephone,
        email: wizFormData.dirigeant.email,
        fonction: isAutoEntrepreneur ? "Auto-entrepreneur" : "Gérant",
        adresseResidence: wizFormData.dirigeant.adresseResidence,
        ville: wizFormData.dirigeant.ville,
      },
      domaineActivite: isAutoEntrepreneur ? wizFormData.activiteExercee : wizFormData.codeNae,
      options: wizFormData.options,
      cguAcceptees: wizFormData.cguAcceptees,
      dateCguAcceptation: new Date().toISOString(),
      dateDebutSouhaitee: wizFormData.dateDebutSouhaitee?.toISOString(),
    };

    if (isAutoEntrepreneur) {
      submitData.activiteExercee = wizFormData.activiteExercee;
      submitData.descriptionActivite = wizFormData.descriptionActivite;
      if (wizFormData.numeroAutoEntrepreneur) submitData.numeroAutoEntrepreneur = wizFormData.numeroAutoEntrepreneur;
      if (wizFormData.dateInscriptionAutoEntrepreneur) {
        submitData.dateInscriptionAutoEntrepreneur = wizFormData.dateInscriptionAutoEntrepreneur.toISOString();
      }
    } else {
      submitData.codeNae = wizFormData.codeNae;
      if (wizFormData.nif) submitData.nif = wizFormData.nif;
      if (wizFormData.nis) submitData.nis = wizFormData.nis;
      if (wizFormData.registreCommerce) submitData.registreCommerce = wizFormData.registreCommerce;
      if (wizFormData.articleImposition) submitData.articleImposition = wizFormData.articleImposition;
      if (wizFormData.dateCreationEntreprise) {
        submitData.dateCreationEntreprise = wizFormData.dateCreationEntreprise.toISOString();
      }
      if (wizFormData.villeImmatriculation) submitData.villeImmatriculation = wizFormData.villeImmatriculation;
    }

    if (uploadedDocuments.length > 0) {
      submitData.documents = JSON.stringify(
        uploadedDocuments.map(d => ({ type: d.type, name: d.name }))
      );
    }

    const result = await createDemandeDomiciliation(submitData as unknown as Parameters<typeof createDemandeDomiciliation>[0]);

    if (result.success) {
      const demandeId = result.id || "";
      if (uploadedDocuments.length > 0 && demandeId) {
        for (const doc of uploadedDocuments) {
          try {
            await apiClient.uploadDocument(doc.file, "domiciliation", demandeId, doc.type);
          } catch {
            toast.error(`Erreur lors de l'envoi du document : ${doc.name}`);
          }
        }
      } else if (uploadedDocuments.length > 0 && !demandeId) {
        toast.error("Les documents n'ont pas pu être liés à la demande. Utilisez l'onglet Documents pour les renvoyer.");
      }

      try {
        const companyData: Record<string, unknown> = {
          activitePrincipale: isAutoEntrepreneur ? wizFormData.activiteExercee : wizFormData.codeNae,
        };
        if (isAutoEntrepreneur) {
          companyData.typeEntreprise = "auto_entrepreneur";
          companyData.raisonSociale = raisonSociale;
          companyData.formeJuridique = "auto_entrepreneur";
          if (wizFormData.numeroAutoEntrepreneur) companyData.numeroAutoEntrepreneur = wizFormData.numeroAutoEntrepreneur;
        } else {
          companyData.raisonSociale = wizFormData.denominationSociale;
          companyData.formeJuridique = wizFormData.formeJuridique?.toLowerCase() || "";
          companyData.typeEntreprise = wizFormData.formeJuridique?.toLowerCase() || "";
          if (wizFormData.nif) companyData.nif = wizFormData.nif;
          if (wizFormData.nis) companyData.nis = wizFormData.nis;
          if (wizFormData.registreCommerce) companyData.registreCommerce = wizFormData.registreCommerce;
          if (wizFormData.articleImposition) companyData.articleImposition = wizFormData.articleImposition;
        }
        await updateUser(user.id, companyData);
      } catch {
        // best-effort
      }

      toast.success("Demande de domiciliation envoyée avec succès !");
      const recipientEmail = data.formData.dirigeant.email || user?.email;
      if (recipientEmail) {
        emailService.onDomiciliationSubmitted(recipientEmail, {
          prenom: data.formData.dirigeant.prenom || user?.prenom || "",
          raisonSociale: raisonSociale || "",
          formeJuridique: isAutoEntrepreneur ? "Auto-entrepreneur" : (wizFormData.formeJuridique || ""),
          statut: "dossier_preparatoire",
          statutLabel: "Dossier préparatoire",
        });
      }
      setShowWizard(false);
    } else {
      toast.error(result.error || "Erreur lors de l'envoi de la demande");
      throw new Error(result.error || "Erreur");
    }
  };

  const handlePostCreationSubmit = async (data: Record<string, string>) => {
    if (!demande || !user) return;
    setDomLoading(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (data.nif) updateData.nif = data.nif;
      if (data.nis) updateData.nis = data.nis;
      if (data.registreCommerce) updateData.registreCommerce = data.registreCommerce;
      if (data.articleImposition) updateData.articleImposition = data.articleImposition;
      if (data.numeroAutoEntrepreneur) updateData.numeroAutoEntrepreneur = data.numeroAutoEntrepreneur;

      const response = await apiClient.updateDemandeDomiciliation(demande.id, updateData);
      if (response.success) {
        try {
          const companySync: Record<string, unknown> = {};
          if (data.nif) companySync.nif = data.nif;
          if (data.nis) companySync.nis = data.nis;
          if (data.registreCommerce) companySync.registreCommerce = data.registreCommerce;
          if (data.articleImposition) companySync.articleImposition = data.articleImposition;
          if (data.numeroAutoEntrepreneur) companySync.numeroAutoEntrepreneur = data.numeroAutoEntrepreneur;
          await updateUser(user.id, companySync);
        } catch {
          // best-effort
        }
        toast.success("Informations soumises avec succès. L'équipe Coffice va procéder à la validation finale.");
        await loadDemandesDomiciliation();
        await new Promise(r => setTimeout(r, 100));
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setDomLoading(false);
    }
  };

  const handleRenewalRequest = async () => {
    if (!demande || !user) return;
    setDomLoading(true);
    try {
      const response = await apiClient.updateDemandeDomiciliation(demande.id, {
        commentaireAdmin: `[RENOUVELLEMENT] Demande de renouvellement soumise le ${new Date().toLocaleDateString("fr-FR")}. ${demande.commentaireAdmin || ""}`,
      });
      if (response.success) {
        toast.success("Votre demande de renouvellement a été envoyée. L'équipe Coffice vous contactera.");
        try {
          emailService.onDomiciliationStatusUpdate(
            demande.representantLegal?.email || user.email,
            {
              prenom: demande.representantLegal?.prenom || user.prenom || "",
              raisonSociale: demande.raisonSociale || "",
              formeJuridique: demande.formeJuridique || "",
              statut: "active",
              statutLabel: "Demande de renouvellement",
            }
          );
        } catch {
          // best-effort
        }
        await loadDemandesDomiciliation();
      } else {
        toast.error("Erreur lors de la demande de renouvellement");
      }
    } catch {
      toast.error("Erreur lors de la demande de renouvellement");
    } finally {
      setDomLoading(false);
    }
  };

  if (!user) return null;

  if (dataLoading) {
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
    ? demande.statut === "active"
      ? "success"
      : demande.statut === "refusee" || demande.statut === "resiliee"
        ? "danger"
        : "warning"
    : null;

  const userExpirationAlert = (() => {
    if (!demande?.dateFinContrat || !["active", "domiciliation_creee"].includes(demande.statut)) return null;
    const fin = new Date(demande.dateFinContrat);
    const now = new Date();
    const daysLeft = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { type: "expired", daysLeft, fin };
    if (daysLeft <= 30) return { type: "warning", daysLeft, fin };
    return null;
  })();

  return (
    <div className="space-y-6">
      {userExpirationAlert && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${userExpirationAlert.type === "expired" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${userExpirationAlert.type === "expired" ? "text-red-600" : "text-amber-600"}`} />
          <div className="flex-1">
            <p className={`font-semibold ${userExpirationAlert.type === "expired" ? "text-red-800" : "text-amber-800"}`}>
              {userExpirationAlert.type === "expired" ? "Contrat de domiciliation expiré" : `Renouvellement — ${userExpirationAlert.daysLeft} jour${userExpirationAlert.daysLeft > 1 ? "s" : ""} restant${userExpirationAlert.daysLeft > 1 ? "s" : ""}`}
            </p>
            <p className={`text-sm mt-0.5 ${userExpirationAlert.type === "expired" ? "text-red-600" : "text-amber-600"}`}>
              {userExpirationAlert.type === "expired"
                ? "Votre contrat a expiré. Contactez l'équipe Coffice pour le renouveler."
                : "Votre contrat de domiciliation arrive à échéance prochainement. Pensez à contacter Coffice pour le renouvellement."
              }
            </p>
          </div>
          {userExpirationAlert.type === "warning" && (
            <button
              onClick={handleRenewalRequest}
              disabled={domLoading}
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
                    <MapPin className="w-3 h-3" />
                    Bureau {demande.numeroBureau}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {activeTab === "domiciliation" && (!demande || isTerminal) && (
              <Button
                onClick={() => setShowWizard(true)}
                variant="default"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {demande ? "Nouvelle demande" : "Faire une demande"}
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
                    ? "text-gray-300 cursor-not-allowed"
                    : isActive
                      ? "text-gray-900 bg-gray-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                } ${index > 0 ? "border-l border-gray-100" : ""}`}
              >
                {isDisabled ? (
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-gray-900" : ""}`} />
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
          {activeTab === "domiciliation" && (
            <DomiciliationTab
              demande={demande}
              loading={domLoading}
              isTerminal={!!isTerminal}
              onOpenWizard={() => setShowWizard(true)}
              onPostCreationSubmit={handlePostCreationSubmit}
              onRenewalRequest={handleRenewalRequest}
            />
          )}

          {activeTab === "entreprise" && (
            <EntrepriseTab user={user} demande={demande} loading = {dataLoading} />
          )}

          {activeTab === "courrier" && demande && hasActiveDomiciliation && (
            <CourrierUtilisateur
              domiciliationId={demande.id}
              options={demande.options as unknown as { scanNotificationEmail?: boolean; reexpeditionCourrier?: boolean; [key: string]: boolean | undefined }}
            />
          )}

          {activeTab === "documents" && demande && hasActiveDomiciliation && (
            <DocumentsEntreprise
              domiciliationId={demande.id}
              typeStructure={demande.typeStructure as "societe" | "auto_entrepreneur"}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {user && (
        <WizardForm
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          user={user}
          onSubmit={handleWizardSubmit}
        />
      )}
    </div>
  );
};

interface DomiciliationTabProps {
  demande: DemandeDomiciliation | null;
  loading: boolean;
  isTerminal: boolean;
  onOpenWizard: () => void;
  onPostCreationSubmit: (data: Record<string, string>) => void;
  onRenewalRequest?: () => void;
}

function DomiciliationTab({ demande, loading, onOpenWizard, onPostCreationSubmit, onRenewalRequest }: DomiciliationTabProps) {
  if (!demande) {
    return <NoDemandeLanding onStartDemande={onOpenWizard} />;
  }

  return (
    <DemandeSummary
      demande={demande}
      loading={loading}
      onPostCreationSubmit={onPostCreationSubmit}
      onNewDemande={onOpenWizard}
      onRenewalRequest={onRenewalRequest}
    />
  );
}

export default MonEspace;
