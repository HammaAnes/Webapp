import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  User,
  Building2,
  Hash,
  Calendar,
  Banknote,
  FileText,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import { useAppStore } from "../../../store/store";
import { apiClient } from "../../../lib/api-client";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { getDisplayName } from "../../../features/domiciliation/utils";
import StatutBadge from "../../../features/domiciliation/components/StatutBadge";
import WorkflowTimeline from "../../../features/domiciliation/components/WorkflowTimeline";
import ActionsSidebar from "../../../features/domiciliation/components/ActionsSidebar";
import DossierCompleteness from "../../../features/domiciliation/components/DossierCompleteness";
import InformationsTab from "../../../features/domiciliation/tabs/InformationsTab";
import ContratTab from "../../../features/domiciliation/tabs/ContratTab";
import CourrierTab from "../../../features/domiciliation/tabs/CourrierTab";
import DocumentsTab from "../../../features/domiciliation/tabs/DocumentsTab";
import NotesTab from "../../../features/domiciliation/tabs/NotesTab";
import HistoriqueTab from "../../../features/domiciliation/tabs/HistoriqueTab";
import type { DemandeDomiciliation } from "../../../features/domiciliation/types";
import type { ActionKey, ActionData } from "../../../features/domiciliation/types";

const TABS = [
  { key: "infos", label: "Informations" },
  { key: "contrat", label: "Contrat" },
  { key: "courrier", label: "Courrier" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "historique", label: "Historique" },
] as const;

type TabKey = typeof TABS[number]["key"];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${highlight ? "border-amber-200 shadow-sm" : "border-gray-200"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="font-bold text-gray-900 text-sm truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDomiciliationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { demandesDomiciliation, loadDemandesDomiciliation } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("infos");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const demande: DemandeDomiciliation | undefined = demandesDomiciliation.find(
    (d) => d.id === id
  );

  useEffect(() => {
    if (!demande) {
      loadDemandesDomiciliation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadDemandesDomiciliation();
    setRefreshing(false);
  }, [loadDemandesDomiciliation]);

  const handleUpdate = useCallback(
    async (data: Record<string, unknown>) => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiClient.updateDemandeDomiciliation(id, data as Parameters<typeof apiClient.updateDemandeDomiciliation>[1]);
        if ((res as { success: boolean }).success) {
          toast.success("Informations mises a jour");
          try { await loadDemandesDomiciliation(); } catch { /* reload failed silently */ }
        } else {
          toast.error((res as { error?: string }).error || "Erreur lors de la mise a jour");
        }
      } catch {
        toast.error("Erreur lors de la mise a jour");
      } finally {
        setLoading(false);
      }
    },
    [id, loadDemandesDomiciliation]
  );

  const handleAction = useCallback(
    async (action: ActionKey, data?: ActionData) => {
      if (!id || !demande) return;
      setLoading(true);
      try {
        let res: { success?: boolean; error?: string; message?: string };

        switch (action) {
          case "valider":
            res = await apiClient.validateDomiciliation(id);
            break;
          case "complements":
            res = await apiClient.updateDemandeDomiciliation(id, {
              statut: "en_attente_complements",
              commentaireAdmin: data?.motif,
              complementsDemandes: data?.complementsDemandes || data?.motif,
            });
            break;
          case "rejeter":
            res = await apiClient.rejectDomiciliation(id, data?.motif || "");
            break;
          case "signer":
            res = await apiClient.updateDemandeDomiciliation(id, {
              statut: "domiciliation_creee",
              referenceContratNotarie: data?.referenceContratNotarie,
              numeroBureau: data?.numeroBureau,
              dateDebutContrat: data?.dateDebutContrat,
              dateFinContrat: data?.dateFinContrat,
              montantMensuel: data?.montantMensuel,
            });
            break;
          case "activer":
            res = await apiClient.activateDomiciliation(id, {
              montantMensuel: data?.montantMensuel ?? demande.montantMensuel ?? 12000,
              dateDebut: data?.dateDebutContrat ?? (demande.dateDebutContrat ? String(demande.dateDebutContrat) : new Date().toISOString().split("T")[0]),
              dateFin: data?.dateFinContrat ?? (demande.dateFinContrat ? String(demande.dateFinContrat) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
              numeroBureau: data?.numeroBureau,
            });
            break;
          case "renouveler":
            res = await apiClient.updateDemandeDomiciliation(id, {
              statut: "active",
              dateDebutContrat: data?.dateDebutContrat,
              dateFinContrat: data?.dateFinContrat,
              montantMensuel: data?.montantMensuel,
            });
            break;
          case "resilier":
            res = await apiClient.updateDemandeDomiciliation(id, {
              statut: "resiliee",
              commentaireAdmin: data?.motif,
            });
            break;
          default:
            setLoading(false);
            return;
        }

        if (res.success) {
          const msgs: Record<ActionKey, string> = {
            valider: "Dossier validé — en attente de signature notariale",
            complements: "Demande de compléments envoyée",
            rejeter: "Demande refusée",
            signer: "Signature notariale enregistrée",
            activer: "Domiciliation activée",
            renouveler: "Contrat renouvelé",
            resilier: "Domiciliation résiliée",
          };
          toast.success(msgs[action]);
          try { await loadDemandesDomiciliation(); } catch { /* reload failed silently */ }
        } else {
          toast.error(res.error || res.message || "Erreur lors de l'action");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur inattendue");
      } finally {
        setLoading(false);
      }
    },
    [id, demande, loadDemandesDomiciliation]
  );

  if (!demande) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-gray-500">Chargement de la domiciliation...</p>
      </div>
    );
  }

  const rep = demande.representantLegal;
  const displayName = getDisplayName(demande);
  const isAutoEntrepreneur = demande.typeStructure === "auto_entrepreneur";

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/app/admin/domiciliations")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Domiciliations
        </button>
        <Button
          size="sm"
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                {isAutoEntrepreneur ? (
                  <User className="w-7 h-7 text-white" />
                ) : (
                  <Building2 className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-gray-500">
                    {isAutoEntrepreneur ? "Auto-entrepreneur" : demande.formeJuridique || "Société"}
                  </span>
                  {demande.numeroBureau && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Bureau {demande.numeroBureau}
                      </span>
                    </>
                  )}
                </div>
                {rep && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {rep.prenom} {rep.nom}
                    {rep.email && <span className="ml-1 text-gray-400">· {rep.email}</span>}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <StatutBadge statut={demande.statut} labelType="full" />
              <p className="text-xs text-gray-400">Créée le {formatDate(demande.dateCreation)}</p>
            </div>
          </div>
          <WorkflowTimeline statut={demande.statut} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={Hash}
          label="Bureau"
          value={demande.numeroBureau ? `Bureau ${demande.numeroBureau}` : "Non attribué"}
          color={demande.numeroBureau ? "bg-amber-500" : "bg-gray-400"}
          highlight={!!demande.numeroBureau}
        />
        <KpiCard
          icon={Banknote}
          label="Mensualité"
          value={demande.montantMensuel ? formatCurrency(demande.montantMensuel) : "—"}
          color="bg-emerald-500"
        />
        <KpiCard
          icon={Calendar}
          label="Fin de contrat"
          value={demande.dateFinContrat ? formatDate(demande.dateFinContrat as string) : "—"}
          color="bg-sky-500"
        />
        <KpiCard
          icon={FileText}
          label="Documents"
          value="—"
          sub="Voir onglet Documents"
          color="bg-blue-500"
        />
        <KpiCard
          icon={Mail}
          label="Email"
          value={rep?.email || "—"}
          color="bg-slate-500"
        />
      </div>

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.key
                      ? "border-amber-500 text-amber-700 bg-amber-50/30"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "infos" && (
              <InformationsTab demande={demande} onUpdate={handleUpdate} loading={loading} />
            )}
            {activeTab === "contrat" && (
              <ContratTab demande={demande} onUpdate={handleUpdate} loading={loading} />
            )}
            {activeTab === "courrier" && <CourrierTab demande={demande} />}
            {activeTab === "documents" && <DocumentsTab demande={demande} />}
            {activeTab === "notes" && (
              <NotesTab demande={demande} onUpdate={handleUpdate} loading={loading} />
            )}
            {activeTab === "historique" && <HistoriqueTab demande={demande} />}
          </div>
        </div>

        <div className="w-80 flex-shrink-0 space-y-4 sticky top-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Actions</h3>
            <ActionsSidebar demande={demande} onAction={handleAction} loading={loading} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Complétude du dossier</h3>
            <DossierCompleteness demande={demande} />
          </div>
        </div>
      </div>
    </div>
  );
}
