import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Mail, Package, FileText, Calendar, User, CheckCircle,
  Send, ScanLine, ChevronLeft, ChevronRight, Inbox, MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import { apiClient } from "../../lib/api-client";

interface CourrierRaw {
  id: string;
  type: string;
  expediteur: string;
  description: string;
  statut: string;
  date_reception?: string;
  dateReception?: string;
  date_retrait?: string;
  dateRetrait?: string;
  instruction_client?: string;
}

interface CourrierItem {
  id: string;
  type: string;
  expediteur: string;
  description: string;
  statut: string;
  dateReception: string;
  dateRetrait?: string;
  instructionClient?: string;
}

interface CourrierUtilisateurProps {
  domiciliationId: string;
  options?: {
    scanNotificationEmail?: boolean;
    reexpeditionCourrier?: boolean;
    [key: string]: boolean | undefined;
  };
}

const ITEMS_PER_PAGE = 10;

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  lettre: { label: "Lettre", icon: Mail, color: "text-blue-600 bg-blue-50" },
  colis: { label: "Colis", icon: Package, color: "text-teal-600 bg-teal-50" },
  recommande: { label: "Recommandé", icon: FileText, color: "text-red-600 bg-red-50" },
  autre: { label: "Autre", icon: Mail, color: "text-gray-600 bg-gray-50" },
};

const STATUT_CONFIG: Record<string, { label: string; variant: "info" | "warning" | "success" | "neutral" | "accent" }> = {
  recu: { label: "Reçu", variant: "neutral" },
  notifie: { label: "Notifié", variant: "info" },
  en_attente_instruction: { label: "En attente", variant: "warning" },
  recupere: { label: "Récupéré", variant: "success" },
  retire: { label: "Retiré", variant: "success" },
  scanne: { label: "Scanné", variant: "accent" },
  reexpedier: { label: "Réexpédition", variant: "info" },
  envoye: { label: "Envoyé", variant: "info" },
  traite: { label: "Traité", variant: "success" },
  archive: { label: "Archivé", variant: "neutral" },
};

const TYPE_FILTERS = [{ value: "all", label: "Tous" }, { value: "lettre", label: "Lettres" }, { value: "colis", label: "Colis" }, { value: "recommande", label: "Recommandés" }, { value: "autre", label: "Autres" }];
const STATUT_FILTERS = [{ value: "all", label: "Tous" }, { value: "recu", label: "Reçu" }, { value: "notifie", label: "Notifié" }, { value: "en_attente_instruction", label: "En attente" }, { value: "recupere", label: "Récupéré" }, { value: "scanne", label: "Scanné" }, { value: "reexpedier", label: "Réexpédition" }, { value: "traite", label: "Traité" }];

function FilterRow({ filters, value, onChange }: { filters: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === f.value ? "bg-amber-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-10 h-10 text-amber-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun courrier</h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        Aucun courrier ne correspond à vos filtres. Modifiez vos critères ou revenez plus tard.
      </p>
    </Card>
  );
}

export default function CourrierUtilisateur({ domiciliationId, options }: CourrierUtilisateurProps) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState<Record<string, string>>({});

  const loadCourrier = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserCourrier(domiciliationId);
      const data = response.data as Record<string, unknown> | undefined;
      const raw = ((data?.courriers || []) as CourrierRaw[]).map((c) => ({
        id: c.id,
        type: c.type,
        expediteur: c.expediteur || "",
        description: c.description || "",
        statut: c.statut,
        dateReception: c.date_reception || c.dateReception || "",
        dateRetrait: c.date_retrait || c.dateRetrait,
        instructionClient: c.instruction_client,
      }));
      setCourriers(raw);
    } catch {
      setCourriers([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  useEffect(() => { loadCourrier(); }, [loadCourrier]);
  useEffect(() => { setPage(1); }, [typeFilter, statutFilter]);

  const filtered = useMemo(() => courriers.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (statutFilter !== "all" && c.statut !== statutFilter) return false;
    return true;
  }), [courriers, typeFilter, statutFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAction = async (courrierId: string, action: string, label: string) => {
    setActionLoading(`${courrierId}-${action}`);
    try {
      await apiClient.actionCourrier(courrierId, action);
      toast.success(`${label} effectué avec succès`);
      await loadCourrier();
    } catch {
      toast.error(`Erreur lors de l'action : ${label}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInstruction = async (courrierId: string, instruction: string) => {
    if (!instruction.trim()) return;
    setActionLoading(`${courrierId}-instruction`);
    try {
      await apiClient.donnerInstructionCourrier(courrierId, instruction);
      toast.success("Instruction enregistrée");
      await loadCourrier();
    } catch {
      toast.error("Erreur lors de l'enregistrement de l'instruction");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <FilterRow filters={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
        <div className="hidden sm:block w-px bg-gray-200" />
        <FilterRow filters={STATUT_FILTERS} value={statutFilter} onChange={setStatutFilter} />
      </div>

      {paginated.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {paginated.map((courrier) => {
            const tc = TYPE_CONFIG[courrier.type] || TYPE_CONFIG.autre;
            const sc = STATUT_CONFIG[courrier.statut] || STATUT_CONFIG.recu;
            const TypeIcon = tc.icon;
            const isActionable = courrier.statut === "recu" || courrier.statut === "notifie" || courrier.statut === "en_attente_instruction";
            const canScan = options?.scanNotificationEmail && isActionable;
            const canReexpedition = options?.reexpeditionCourrier && isActionable;
            const isActLoading = (a: string) => actionLoading === `${courrier.id}-${a}`;
            const currentInstruction = instructionText[courrier.id] ?? "";

            return (
              <Card key={courrier.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{tc.label}</p>
                        {courrier.expediteur && (
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 flex-shrink-0" />{courrier.expediteur}
                          </p>
                        )}
                      </div>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </div>
                    {courrier.description && <p className="text-sm text-gray-600 mt-2">{courrier.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Reçu le {format(new Date(courrier.dateReception), "d MMM yyyy", { locale: fr })}
                      </span>
                      {courrier.dateRetrait && (
                        <span className="flex items-center gap-1 text-teal-600">
                          <CheckCircle className="w-3 h-3" />
                          Retiré le {format(new Date(courrier.dateRetrait), "d MMM yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                    {isActionable && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="primary" loading={isActLoading("recuperer")} onClick={() => handleAction(courrier.id, "recuperer", "Demande de récupération")}>
                            <CheckCircle className="w-3.5 h-3.5" /> Récupérer
                          </Button>
                          {canScan && (
                            <Button size="sm" variant="outline" loading={isActLoading("scanner")} onClick={() => handleAction(courrier.id, "scanner", "Demande de numérisation")}>
                              <ScanLine className="w-3.5 h-3.5" /> Demander un scan
                            </Button>
                          )}
                          {canReexpedition && (
                            <Button size="sm" variant="outline" loading={isActLoading("reexpedier")} onClick={() => handleAction(courrier.id, "reexpedier", "Demande de réexpédition")}>
                              <Send className="w-3.5 h-3.5" /> Réexpédier
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Instruction particulière..."
                            value={currentInstruction}
                            onChange={(e) => setInstructionText(prev => ({ ...prev, [courrier.id]: e.target.value }))}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            loading={isActLoading("instruction")}
                            disabled={!currentInstruction.trim()}
                            onClick={() => handleInstruction(courrier.id, currentInstruction)}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {courrier.instructionClient && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            Instruction : {courrier.instructionClient}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="ghost" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 font-medium px-2">{currentPage} / {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
