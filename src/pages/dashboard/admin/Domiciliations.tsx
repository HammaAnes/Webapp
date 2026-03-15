import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { differenceInDays } from "date-fns";
import {
  Building,
  Search,
  Download,
  Eye,
  Clock,
  User,
  Banknote,
  Loader2,
  Plus,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Zap,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import AdminCreateDomiciliationModal from "../../../components/admin/AdminCreateDomiciliationModal";
import StatutBadge from "../../../features/domiciliation/components/StatutBadge";
import DomiciliationKanban from "../../../features/domiciliation/components/DomiciliationKanban";
import QuickPreviewPanel from "../../../features/domiciliation/components/QuickPreviewPanel";
import { useAppStore } from "../../../store/store";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { getDisplayName, getSituationLabel, exportDomiciliationsCSV } from "../../../features/domiciliation/utils";
import { STATUS_FILTERS, STATUT_CONFIG } from "../../../features/domiciliation/constants";
import toast from "react-hot-toast";
import type { DemandeDomiciliation } from "../../../features/domiciliation/types";

const PAGE_SIZE = 15;
type SortKey = "entreprise" | "bureau" | "statut" | "date";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "kanban";

export default function AdminDomiciliations() {
  const navigate = useNavigate();
  const { demandesDomiciliation, loadDemandesDomiciliation } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    loadDemandesDomiciliation();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return demandesDomiciliation.filter((d) => {
      const matchSearch =
        !q ||
        [
          d.raisonSociale,
          d.nif,
          d.representantLegal?.nom,
          d.representantLegal?.prenom,
          d.representantLegal?.email,
          d.numeroBureau?.toString(),
        ].some((v) => (v || "").toLowerCase().includes(q));
      const matchStatus = statusFilter === "tous" || d.statut === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [demandesDomiciliation, searchTerm, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "entreprise":
          cmp = getDisplayName(a).localeCompare(getDisplayName(b));
          break;
        case "bureau":
          cmp = (a.numeroBureau || 0) - (b.numeroBureau || 0);
          break;
        case "statut":
          cmp = (a.statut || "").localeCompare(b.statut || "");
          break;
        case "date":
          cmp =
            new Date(a.dateCreation as string).getTime() -
            new Date(b.dateCreation as string).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      preparatoires: demandesDomiciliation.filter((d) => d.statut === "dossier_preparatoire").length,
      enAttenteComplements: demandesDomiciliation.filter((d) => d.statut === "en_attente_complements").length,
      enAttenteSignature: demandesDomiciliation.filter((d) => d.statut === "en_attente_signature").length,
      domiciliationsCreees: demandesDomiciliation.filter((d) => d.statut === "domiciliation_creee").length,
      actives: demandesDomiciliation.filter((d) => d.statut === "active").length,
      expirees: demandesDomiciliation.filter((d) => d.statut === "expiree").length,
      refusees: demandesDomiciliation.filter((d) => ["refusee", "resiliee"].includes(d.statut)).length,
      enCours: demandesDomiciliation.filter((d) =>
        ["dossier_preparatoire", "en_attente_complements", "en_attente_signature", "domiciliation_creee"].includes(d.statut)
      ).length,
      revenuMensuel: demandesDomiciliation
        .filter((d) => d.statut === "active")
        .reduce((sum, d) => sum + (d.montantMensuel || 0), 0),
    }),
    [demandesDomiciliation]
  );

  const urgences = useMemo(() => {
    const expiringIn30 = demandesDomiciliation.filter((d) => {
      if (d.statut !== "active" || !d.dateFinContrat) return false;
      const days = differenceInDays(new Date(d.dateFinContrat as string), new Date());
      return days >= 0 && days <= 30;
    });
    const stagnant = demandesDomiciliation.filter((d) => {
      if (["active", "refusee", "resiliee", "expiree"].includes(d.statut)) return false;
      const age = Math.floor(
        (Date.now() - new Date(d.dateCreation as string).getTime()) / (1000 * 60 * 60 * 24)
      );
      return age > 30;
    });
    return { expiringIn30, stagnant };
  }, [demandesDomiciliation]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDemandesDomiciliation();
    setRefreshing(false);
  };

  const handleExport = () => {
    exportDomiciliationsCSV(filtered, formatDate, formatCurrency);
    toast.success("Export CSV généré");
  };

  const previewDemande = useMemo(
    () => (previewId ? demandesDomiciliation.find((d) => d.id === previewId) ?? null : null),
    [previewId, demandesDomiciliation]
  );

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
    );
  };

  const SortableHeader = ({
    label,
    col,
  }: {
    label: string;
    col: SortKey;
  }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
      <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
      >
        {label}
        <SortIcon col={col} />
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Domiciliations</h1>
          <p className="text-gray-500 mt-1">
            {demandesDomiciliation.length} domiciliation
            {demandesDomiciliation.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-amber-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                viewMode === "kanban"
                  ? "bg-amber-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Actualiser
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            value: stats.preparatoires,
            label: "Préparatoires",
            gradient: "from-amber-50 to-orange-50",
            border: "border-amber-200",
            text: "text-amber-700",
            icon: Clock,
            iconBg: "bg-amber-100 text-amber-600",
            filter: "dossier_preparatoire",
          },
          {
            value: stats.enAttenteSignature,
            label: "Att. signature",
            gradient: "from-sky-50 to-cyan-50",
            border: "border-sky-200",
            text: "text-sky-700",
            icon: Building,
            iconBg: "bg-sky-100 text-sky-600",
            filter: "en_attente_signature",
          },
          {
            value: stats.actives,
            label: "Actives",
            gradient: "from-emerald-50 to-green-50",
            border: "border-emerald-200",
            text: "text-emerald-700",
            icon: Building,
            iconBg: "bg-emerald-100 text-emerald-600",
            filter: "active",
          },
          {
            value: stats.expirees,
            label: "Expirées",
            gradient: "from-gray-50 to-slate-50",
            border: "border-gray-300",
            text: "text-gray-700",
            icon: Clock,
            iconBg: "bg-gray-200 text-gray-600",
            filter: "expiree",
          },
          {
            value: stats.refusees,
            label: "Refusées/Résiliées",
            gradient: "from-red-50 to-rose-50",
            border: "border-red-200",
            text: "text-red-700",
            icon: Building,
            iconBg: "bg-red-100 text-red-600",
            filter: "refusee",
          },
        ].map(({ value, label, gradient, border, text, icon: Icon, iconBg, filter }) => (
          <Card
            key={label}
            className={`p-4 bg-gradient-to-br ${gradient} border ${border} cursor-pointer hover:shadow-md transition-shadow ${
              statusFilter === filter ? "ring-2 ring-amber-400" : ""
            }`}
            onClick={() => setStatusFilter(statusFilter === filter ? "tous" : filter)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
                <p className={`text-xs ${text} opacity-80`}>{label}</p>
              </div>
            </div>
          </Card>
        ))}
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(stats.revenuMensuel)}
              </p>
              <p className="text-xs text-emerald-600">Rev. mensuel</p>
            </div>
          </div>
        </Card>
      </div>

      {(urgences.expiringIn30.length > 0 || urgences.stagnant.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgences.expiringIn30.length > 0 && (
            <Card className="p-4 bg-amber-50 border-2 border-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900 mb-2">
                    {urgences.expiringIn30.length} contrat
                    {urgences.expiringIn30.length > 1 ? "s" : ""} expirant dans 30 jours
                  </p>
                  <div className="space-y-1.5">
                    {urgences.expiringIn30.slice(0, 3).map((d) => {
                      const days = differenceInDays(new Date(d.dateFinContrat!), new Date());
                      return (
                        <button
                          key={d.id}
                          onClick={() => navigate(`/app/admin/domiciliations/${d.id}`)}
                          className="w-full flex items-center justify-between text-left hover:bg-amber-100 p-2 rounded-lg transition-colors"
                        >
                          <span className="text-sm font-medium text-amber-900">
                            {getDisplayName(d)}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              days <= 7
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-200 text-amber-800"
                            }`}
                          >
                            {days}j restants
                          </span>
                        </button>
                      );
                    })}
                    {urgences.expiringIn30.length > 3 && (
                      <p className="text-xs text-amber-600 pl-2">
                        +{urgences.expiringIn30.length - 3} autre(s)...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
          {urgences.stagnant.length > 0 && (
            <Card className="p-4 bg-red-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-900 mb-2">
                    {urgences.stagnant.length} dossier
                    {urgences.stagnant.length > 1 ? "s" : ""} en attente depuis +30j
                  </p>
                  <div className="space-y-1.5">
                    {urgences.stagnant.slice(0, 3).map((d) => {
                      const age = Math.floor(
                        (Date.now() - new Date(d.dateCreation as string).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return (
                        <button
                          key={d.id}
                          onClick={() => navigate(`/app/admin/domiciliations/${d.id}`)}
                          className="w-full flex items-center justify-between text-left hover:bg-red-100 p-2 rounded-lg transition-colors"
                        >
                          <span className="text-sm font-medium text-red-900">
                            {getDisplayName(d)}
                          </span>
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {age}j
                          </span>
                        </button>
                      );
                    })}
                    {urgences.stagnant.length > 3 && (
                      <p className="text-xs text-red-600 pl-2">
                        +{urgences.stagnant.length - 3} autre(s)...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom, NIF, email, bureau..."
              icon={<Search className="w-5 h-5" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 text-sm rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === key
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
                {key !== "tous" && (
                  <span className="ml-1.5 text-xs opacity-75">
                    {demandesDomiciliation.filter((d) => d.statut === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {viewMode === "kanban" ? (
        <DomiciliationKanban
          demandes={filtered}
          onAction={(demande) => navigate(`/app/admin/domiciliations/${demande.id}`)}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <SortableHeader label="Entreprise" col="entreprise" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Situation
                  </th>
                  <SortableHeader label="Bureau" col="bureau" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Représentant
                  </th>
                  <SortableHeader label="Statut" col="statut" />
                  <SortableHeader label="Date" col="date" />
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Aucune domiciliation trouvée
                    </td>
                  </tr>
                ) : (
                  paginated.map((d) => (
                    <DomiciliationRow
                      key={d.id}
                      demande={d}
                      onDetail={() => navigate(`/app/admin/domiciliations/${d.id}`)}
                      onPreview={() => setPreviewId(d.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} sur{" "}
                {sorted.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-amber-500 text-white"
                            : "hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <AdminCreateDomiciliationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={async (createdId?: string) => {
          await loadDemandesDomiciliation();
          if (createdId) {
            navigate(`/app/admin/domiciliations/${createdId}`);
          }
        }}
      />

      {previewDemande && (
        <QuickPreviewPanel
          demande={previewDemande}
          onClose={() => setPreviewId(null)}
          onNavigate={(id) => {
            navigate(`/app/admin/domiciliations/${id}`);
            setPreviewId(null);
          }}
        />
      )}
    </div>
  );
}

function DomiciliationRow({
  demande,
  onDetail,
  onPreview,
}: {
  demande: DemandeDomiciliation;
  onDetail: () => void;
  onPreview: () => void;
}) {
  const name = getDisplayName(demande);
  const createdTs = demande.dateCreation ? new Date(demande.dateCreation as string).getTime() : Date.now();
  const ageJours = Math.floor((Date.now() - createdTs) / (1000 * 60 * 60 * 24));
  const isStale =
    !["active", "refusee", "resiliee", "expiree"].includes(demande.statut) && ageJours > 7;
  const isVeryStale = isStale && ageJours > 30;
  const daysUntilExpiry =
    demande.statut === "active" && demande.dateFinContrat
      ? differenceInDays(new Date(demande.dateFinContrat as string), new Date())
      : null;
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;

  const cfg = STATUT_CONFIG[demande.statut];

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
        isVeryStale
          ? "bg-red-50/40"
          : isStale
          ? "bg-amber-50/40"
          : isExpiringSoon
          ? "bg-amber-50/30"
          : ""
      }`}
      onClick={onDetail}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {demande.typeStructure === "auto_entrepreneur" ? (
              <User className="w-5 h-5 text-amber-600" />
            ) : (
              <Building className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500">
              {demande.typeStructure === "auto_entrepreneur"
                ? "Auto-entrepreneur"
                : demande.formeJuridique || "Société"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-lg ${
            demande.situationAdministrative === "en_cours_creation"
              ? "bg-amber-100 text-amber-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          {getSituationLabel(demande.situationAdministrative)}
        </span>
      </td>
      <td className="px-4 py-4">
        {demande.numeroBureau ? (
          <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold text-sm">
            N°{demande.numeroBureau}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="font-medium text-gray-900 text-sm">
          {demande.representantLegal?.prenom || ""} {demande.representantLegal?.nom || ""}
        </p>
        <p className="text-xs text-gray-500">{demande.representantLegal?.telephone || "-"}</p>
      </td>
      <td className="px-4 py-4">
        {cfg ? <StatutBadge statut={demande.statut} /> : <span>{demande.statut}</span>}
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-gray-500">{formatDate(demande.dateCreation as string)}</div>
        {isStale && (
          <span
            className={`text-xs font-medium ${
              isVeryStale ? "text-red-600" : "text-amber-600"
            }`}
          >
            {ageJours}j {isVeryStale ? "(stagnant)" : "(en attente)"}
          </span>
        )}
        {isExpiringSoon && daysUntilExpiry !== null && (
          <div
            className={`text-xs font-bold ${
              daysUntilExpiry <= 7 ? "text-red-600" : "text-amber-600"
            }`}
          >
            Expire dans {daysUntilExpiry}j
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Aperçu rapide"
          >
            <Zap className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onDetail();
            }}
          >
            <Eye className="w-4 h-4" />
            Détails
          </Button>
        </div>
      </td>
    </motion.tr>
  );
}
