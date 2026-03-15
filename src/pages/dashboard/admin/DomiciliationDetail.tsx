import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2, User, Building } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import { useAppStore } from "../../../store/store";
import { apiClient } from "../../../lib/api-client";
import { formatDate } from "../../../utils/formatters";
import { getDisplayName } from "../../../features/domiciliation/utils";
import StatutBadge from "../../../features/domiciliation/components/StatutBadge";
import InformationsTab from "../../../features/domiciliation/tabs/InformationsTab";
import ContratTab from "../../../features/domiciliation/tabs/ContratTab";
import CourrierTab from "../../../features/domiciliation/tabs/CourrierTab";
import DocumentsTab from "../../../features/domiciliation/tabs/DocumentsTab";
import NotesTab from "../../../features/domiciliation/tabs/NotesTab";
import ActionsTab from "../../../features/domiciliation/tabs/ActionsTab";
import type { DemandeDomiciliation } from "../../../features/domiciliation/types";
import type { ActionKey, ActionData } from "../../../features/domiciliation/types";

const TABS = [
  { key: "infos", label: "Informations" },
  { key: "contrat", label: "Contrat" },
  { key: "courrier", label: "Courrier" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "actions", label: "Actions" },
] as const;

type TabKey = typeof TABS[number]["key"];

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
        const res = await apiClient.updateDemandeDomiciliation(id, data);
        if ((res as { success: boolean }).success) {
          toast.success("Informations mises à jour");
          await loadDemandesDomiciliation();
        } else {
          const errMsg = (res as { error?: string }).error || "Erreur lors de la mise à jour";
          toast.error(errMsg);
          throw new Error(errMsg);
        }
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
            res = await apiClient.activateDomiciliation(id, data?.numeroBureau);
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
          await loadDemandesDomiciliation();
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/app/admin/domiciliations")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour aux domiciliations</span>
        </button>
        <Button
          size="sm"
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Actualiser
        </Button>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-md">
              {demande.typeStructure === "auto_entrepreneur" ? (
                <User className="w-8 h-8 text-white" />
              ) : (
                <Building className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-600">
                  {demande.typeStructure === "auto_entrepreneur"
                    ? "Auto-entrepreneur"
                    : demande.formeJuridique || "Société"}
                </p>
                {demande.numeroBureau && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm font-bold text-amber-700">
                      Bureau {demande.numeroBureau}
                    </span>
                  </>
                )}
              </div>
              {rep && (
                <p className="text-sm text-gray-500 mt-1">
                  {rep.prenom} {rep.nom}
                  {rep.email && ` · ${rep.email}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatutBadge statut={demande.statut} />
            <p className="text-xs text-gray-500">
              Créée le {formatDate(demande.dateCreation)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? "border-amber-500 text-amber-700 bg-amber-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
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
        {activeTab === "actions" && (
          <ActionsTab demande={demande} onAction={handleAction} loading={loading} />
        )}
      </div>
    </div>
  );
}
