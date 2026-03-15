import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail, Package, FileText, Search, RefreshCw, Plus, Check,
  Send, Eye, ChevronDown, Building2, Calendar, User, X, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { apiClient } from "../../../lib/api-client";
import { useAppStore } from "../../../store/store";

interface CourrierItem {
  id: string;
  domiciliation_id: string;
  user_id: string;
  type: string;
  expediteur: string;
  description: string;
  statut: string;
  notes: string | null;
  scan_url: string | null;
  date_reception: string;
  date_recuperation: string | null;
  raison_sociale: string;
  email: string;
  prenom: string;
  nom: string;
  instruction_client?: string | null;
  scan_demande?: boolean;
  reexpedition_demandee?: boolean;
}

interface NewCourrierForm {
  domiciliation_id: string;
  type: string;
  expediteur: string;
  description: string;
  notes: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  courrier: { label: "Courrier", icon: Mail, color: "bg-blue-100 text-blue-600" },
  colis: { label: "Colis", icon: Package, color: "bg-teal-100 text-teal-600" },
  recommande: { label: "Recommandé", icon: FileText, color: "bg-red-100 text-red-600" },
};

const STATUT_CONFIG: Record<string, { label: string; variant: "info" | "warning" | "success" | "neutral" | "accent" | "danger" }> = {
  recu: { label: "Reçu", variant: "neutral" },
  notifie: { label: "Notifié", variant: "info" },
  en_attente_instruction: { label: "En attente d'instruction", variant: "warning" },
  recupere: { label: "Récupéré", variant: "success" },
  reexpedi: { label: "Réexpédié", variant: "accent" },
};

const STATUS_FILTERS = [
  { value: "tous", label: "Tous" },
  { value: "recu", label: "Reçu" },
  { value: "notifie", label: "Notifié" },
  { value: "en_attente_instruction", label: "En attente" },
  { value: "recupere", label: "Récupéré" },
  { value: "reexpedi", label: "Réexpédié" },
];

export default function AdminCourrier() {
  const { demandesDomiciliation } = useAppStore();
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState("tous");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<CourrierItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newCourrier, setNewCourrier] = useState<NewCourrierForm>({
    domiciliation_id: "",
    type: "courrier",
    expediteur: "",
    description: "",
    notes: "",
  });

  const activeDomiciliations = useMemo(
    () => demandesDomiciliation.filter((d) => d.statut === "active"),
    [demandesDomiciliation]
  );

  const loadCourriers = useCallback(async () => {
    try {
      const response = await apiClient.get("/admin/courrier.php");
      const data = response.data as Record<string, unknown> | undefined;
      const list = (data?.courriers as CourrierItem[]) || [];
      setCourriers(list);
    } catch {
      toast.error("Impossible de charger les courriers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourriers();
  }, [loadCourriers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCourriers();
    setRefreshing(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourrier.domiciliation_id || !newCourrier.type) {
      toast.error("Veuillez sélectionner une domiciliation et un type");
      return;
    }
    setCreating(true);
    try {
      const response = await apiClient.post("/admin/courrier.php", {
        domiciliation_id: newCourrier.domiciliation_id,
        type: newCourrier.type,
        expediteur: newCourrier.expediteur,
        description: newCourrier.description,
        notes: newCourrier.notes || null,
      });
      if (response.success) {
        toast.success("Courrier enregistré et client notifié");
        setShowCreateModal(false);
        setNewCourrier({ domiciliation_id: "", type: "courrier", expediteur: "", description: "", notes: "" });
        await loadCourriers();
      } else {
        toast.error(response.error || response.message || "Erreur lors de l'enregistrement");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement du courrier");
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (courrierId: string, action: string, extra?: Record<string, string>) => {
    setActionLoading(`${courrierId}-${action}`);
    try {
      const response = await apiClient.put("/admin/courrier.php", {
        id: courrierId,
        action,
        ...extra,
      });
      if (response.success) {
        const labels: Record<string, string> = {
          recuperer: "Courrier marqué récupéré",
          reexpedier: "Courrier marqué pour réexpédition",
          scanner: "Scan demandé",
        };
        toast.success(labels[action] || "Mis à jour");
        if (showDetailModal?.id === courrierId) {
          await loadCourriers();
          setShowDetailModal(null);
        } else {
          await loadCourriers();
        }
      } else {
        toast.error(response.error || response.message || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    return courriers.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.expediteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatut = statutFilter === "tous" || c.statut === statutFilter;
      return matchSearch && matchStatut;
    });
  }, [courriers, searchTerm, statutFilter]);

  const stats = useMemo(() => ({
    total: courriers.length,
    nonTraites: courriers.filter((c) => c.statut === "recu" || c.statut === "notifie").length,
    enAttente: courriers.filter((c) => c.statut === "en_attente_instruction").length,
    traites: courriers.filter((c) => c.statut === "recupere" || c.statut === "reexpedi").length,
  }), [courriers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du courrier</h1>
          <p className="text-sm text-gray-500 mt-0.5">Courrier reçu pour les domiciliations actives</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Enregistrer courrier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-700 bg-gray-50" },
          { label: "Non traités", value: stats.nonTraites, color: "text-amber-700 bg-amber-50" },
          { label: "En attente", value: stats.enAttente, color: "text-blue-700 bg-blue-50" },
          { label: "Traités", value: stats.traites, color: "text-emerald-700 bg-emerald-50" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color.split(" ")[0]}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par entreprise, expéditeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatutFilter(f.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statutFilter === f.value
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun courrier</h3>
          <p className="text-sm text-gray-500">
            {searchTerm || statutFilter !== "tous"
              ? "Aucun résultat pour ces filtres"
              : "Aucun courrier enregistré pour le moment"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((courrier) => {
            const tc = TYPE_CONFIG[courrier.type] || TYPE_CONFIG.courrier;
            const sc = STATUT_CONFIG[courrier.statut] || STATUT_CONFIG.recu;
            const TypeIcon = tc.icon;
            const isActionable = courrier.statut === "recu" || courrier.statut === "notifie" || courrier.statut === "en_attente_instruction";
            const isActLoading = (a: string) => actionLoading === `${courrier.id}-${a}`;

            return (
              <Card key={courrier.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{tc.label}</p>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                          {courrier.instruction_client && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              Instruction client
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {courrier.raison_sociale || `${courrier.prenom} ${courrier.nom}`}
                          </span>
                          {courrier.expediteur && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {courrier.expediteur}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(courrier.date_reception), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                        {courrier.description && (
                          <p className="text-sm text-gray-500 mt-1 truncate">{courrier.description}</p>
                        )}
                        {courrier.instruction_client && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
                            Instruction : {courrier.instruction_client}
                          </p>
                        )}
                      </div>
                    </div>
                    {isActionable && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Button
                          size="sm"
                          variant="primary"
                          loading={isActLoading("recuperer")}
                          onClick={() => handleAction(courrier.id, "recuperer")}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Récupéré
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={isActLoading("reexpedier")}
                          onClick={() => handleAction(courrier.id, "reexpedier")}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          Réexpédier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDetailModal(courrier)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Détail
                        </Button>
                      </div>
                    )}
                    {!isActionable && (
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1"
                        onClick={() => setShowDetailModal(courrier)}
                      >
                        <Eye className="w-3 h-3" />
                        Voir détail
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Enregistrer un nouveau courrier"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Domiciliation <span className="text-red-500">*</span>
            </label>
            {activeDomiciliations.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Aucune domiciliation active trouvée
              </div>
            ) : (
              <select
                value={newCourrier.domiciliation_id}
                onChange={(e) => setNewCourrier((p) => ({ ...p, domiciliation_id: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Sélectionner une domiciliation</option>
                {activeDomiciliations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.raisonSociale} — Bureau {d.numeroBureau || "N/A"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type de courrier <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([value, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNewCourrier((p) => ({ ...p, type: value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      newCourrier.type === value
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Expéditeur</label>
            <input
              type="text"
              placeholder="Nom de l'expéditeur"
              value={newCourrier.expediteur}
              onChange={(e) => setNewCourrier((p) => ({ ...p, expediteur: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              placeholder="Description du contenu ou informations supplémentaires"
              value={newCourrier.description}
              onChange={(e) => setNewCourrier((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes internes</label>
            <input
              type="text"
              placeholder="Notes visibles uniquement par l'admin"
              value={newCourrier.notes}
              onChange={(e) => setNewCourrier((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={creating} className="flex-1">
              Enregistrer et notifier
            </Button>
          </div>
        </form>
      </Modal>

      {showDetailModal && (
        <Modal
          isOpen={!!showDetailModal}
          onClose={() => setShowDetailModal(null)}
          title="Détail du courrier"
          size="md"
        >
          <div className="space-y-4">
            {(() => {
              const c = showDetailModal;
              const tc = TYPE_CONFIG[c.type] || TYPE_CONFIG.courrier;
              const sc = STATUT_CONFIG[c.statut] || STATUT_CONFIG.recu;
              const TypeIcon = tc.icon;
              const isActionable = c.statut === "recu" || c.statut === "notifie" || c.statut === "en_attente_instruction";
              const isActLoading = (a: string) => actionLoading === `${c.id}-${a}`;

              return (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tc.color}`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{tc.label}</h3>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{c.raison_sociale || `${c.prenom} ${c.nom}`}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Expéditeur</p>
                      <p className="font-medium text-gray-900">{c.expediteur || "Non spécifié"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Date de réception</p>
                      <p className="font-medium text-gray-900">{format(new Date(c.date_reception), "d MMM yyyy", { locale: fr })}</p>
                    </div>
                    {c.description && (
                      <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                        <p className="text-xs text-gray-400 mb-0.5">Description</p>
                        <p className="font-medium text-gray-900">{c.description}</p>
                      </div>
                    )}
                    {c.instruction_client && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 col-span-2">
                        <p className="text-xs text-amber-500 mb-0.5">Instruction du client</p>
                        <p className="font-medium text-amber-900">{c.instruction_client}</p>
                      </div>
                    )}
                    {c.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                        <p className="text-xs text-gray-400 mb-0.5">Notes internes</p>
                        <p className="font-medium text-gray-900">{c.notes}</p>
                      </div>
                    )}
                    {c.date_recuperation && (
                      <div className="bg-emerald-50 rounded-lg p-3 col-span-2">
                        <p className="text-xs text-emerald-500 mb-0.5">Récupéré le</p>
                        <p className="font-medium text-emerald-900">{format(new Date(c.date_recuperation), "d MMM yyyy", { locale: fr })}</p>
                      </div>
                    )}
                  </div>

                  {isActionable && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={isActLoading("recuperer")}
                        onClick={() => handleAction(c.id, "recuperer")}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Marquer récupéré
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={isActLoading("reexpedier")}
                        onClick={() => handleAction(c.id, "reexpedier")}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-1.5" />
                        Réexpédier
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}
