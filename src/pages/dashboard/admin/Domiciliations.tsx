import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  AlertCircle,
  Banknote,
  Ban,
  PlayCircle,
  Scale,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Plus,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import AdminCreateDomiciliationModal from "../../../components/admin/AdminCreateDomiciliationModal";
import { useAppStore } from "../../../store/store";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import toast from "react-hot-toast";
import type { DemandeDomiciliation } from "../../../types";
import { DOMICILIATION_STATUT_LABELS } from "../../../constants";

const PAGE_SIZE = 15;

type SortKey = "entreprise" | "bureau" | "statut" | "date";
type SortDir = "asc" | "desc";

const STATUS_BADGES: Record<string, { variant: "warning" | "success" | "danger" | "default" | "info" | "teal"; icon: React.ReactNode; label: string }> = {
  dossier_preparatoire: { variant: "warning", icon: <Clock className="w-3 h-3 mr-1" />, label: "Dossier préparatoire" },
  en_attente_signature: { variant: "info", icon: <Scale className="w-3 h-3 mr-1" />, label: "Attente signature" },
  domiciliation_creee: { variant: "teal", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Domiciliation créée" },
  en_attente_complements: { variant: "warning", icon: <FileText className="w-3 h-3 mr-1" />, label: "Attente compléments" },
  active: { variant: "success", icon: <PlayCircle className="w-3 h-3 mr-1" />, label: "Active" },
  refusee: { variant: "danger", icon: <XCircle className="w-3 h-3 mr-1" />, label: "Refusée" },
  expiree: { variant: "default", icon: <AlertCircle className="w-3 h-3 mr-1" />, label: "Expirée" },
  resiliee: { variant: "danger", icon: <Ban className="w-3 h-3 mr-1" />, label: "Résiliée" },
};

const STATUS_FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "dossier_preparatoire", label: "Préparatoires" },
  { key: "en_attente_signature", label: "Att. signature" },
  { key: "domiciliation_creee", label: "Créées" },
  { key: "en_attente_complements", label: "Att. compléments" },
  { key: "active", label: "Actives" },
  { key: "refusee", label: "Refusées" },
  { key: "resiliee", label: "Résiliées" },
  { key: "expiree", label: "Expirées" },
];

function getDisplayName(d: DemandeDomiciliation) {
  return d.raisonSociale || (d.typeStructure === "auto_entrepreneur"
    ? `${d.representantLegal?.prenom || ""} ${d.representantLegal?.nom || ""}`.trim() || "Non renseigné"
    : "Non renseigné"
  );
}

function getSituationLabel(s: string) {
  return s === "en_cours_creation" ? "En cours de création" : "Déjà créée";
}

function getTypeLabel(t: string) {
  return t === "auto_entrepreneur" ? "Auto-entrepreneur" : "Société";
}

const AdminDomiciliations = () => {
  const navigate = useNavigate();
  const { demandesDomiciliation, loadDemandesDomiciliation } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadDemandesDomiciliation(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return demandesDomiciliation.filter((d) => {
      const matchSearch = !q || [
        d.raisonSociale, d.nif, d.representantLegal?.nom,
        d.representantLegal?.prenom, d.representantLegal?.email,
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
          cmp = new Date(a.dateCreation as string).getTime() - new Date(b.dateCreation as string).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    preparatoires: demandesDomiciliation.filter((d) => d.statut === "dossier_preparatoire").length,
    enAttenteSignature: demandesDomiciliation.filter((d) => d.statut === "en_attente_signature").length,
    creees: demandesDomiciliation.filter((d) => d.statut === "domiciliation_creee").length,
    enAttenteComplements: demandesDomiciliation.filter((d) => d.statut === "en_attente_complements").length,
    actives: demandesDomiciliation.filter((d) => d.statut === "active").length,
    refusees: demandesDomiciliation.filter((d) => d.statut === "refusee").length,
    expirees: demandesDomiciliation.filter((d) => d.statut === "expiree").length,
    resiliees: demandesDomiciliation.filter((d) => d.statut === "resiliee").length,
    revenuMensuel: demandesDomiciliation
      .filter((d) => d.statut === "active")
      .reduce((sum, d) => sum + (d.montantMensuel || 0), 0),
  }), [demandesDomiciliation]);

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

  const openDetail = (d: DemandeDomiciliation) => {
    navigate(`/app/admin/domiciliations/${d.id}`);
  };

  const exportCSV = () => {
    const esc = (v: string) => (v.includes(";") || v.includes('"') || v.includes("\n")) ? `"${v.replace(/"/g, '""')}"` : v;
    const formatOpts = (opts: Record<string, boolean> | undefined) => {
      if (!opts) return "";
      return Object.entries(opts).filter(([, v]) => v).map(([k]) => k).join(", ");
    };
    const headers = ["Raison Sociale", "Situation", "Type", "Forme Juridique", "NIF", "NIS", "Bureau", "Statut", "Representant", "Email", "Telephone", "Date Creation", "Date Debut Contrat", "Date Fin Contrat", "Montant Mensuel", "Ref. Contrat", "Options", "Anciennete (jours)"];
    const rows = filtered.map((d) => {
      const ageJours = Math.floor((Date.now() - new Date(d.dateCreation).getTime()) / (1000 * 60 * 60 * 24));
      return [
        esc(getDisplayName(d)),
        esc(getSituationLabel(d.situationAdministrative)),
        esc(getTypeLabel(d.typeStructure)),
        esc(d.formeJuridique || ""),
        esc(d.nif || ""),
        esc(d.nis || ""),
        d.numeroBureau?.toString() || "",
        esc((DOMICILIATION_STATUT_LABELS as Record<string, string>)[d.statut] || d.statut),
        esc(`${d.representantLegal?.prenom || ""} ${d.representantLegal?.nom || ""}`),
        esc(d.representantLegal?.email || ""),
        esc(d.representantLegal?.telephone || ""),
        formatDate(d.dateCreation),
        d.dateDebutContrat ? formatDate(d.dateDebutContrat) : "",
        d.dateFinContrat ? formatDate(d.dateFinContrat) : "",
        d.montantMensuel ? formatCurrency(d.montantMensuel) : "",
        esc(d.referenceContratNotarie || ""),
        esc(formatOpts(d.options as unknown as Record<string, boolean>)),
        ageJours.toString(),
      ];
    });
    const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `domiciliations_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV genere");
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Domiciliations</h1>
          <p className="text-gray-500 mt-1">{demandesDomiciliation.length} domiciliation{demandesDomiciliation.length !== 1 ? "s" : ""} au total</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle domiciliation
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} onFilter={setStatusFilter} />

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <SortableHeader label="Entreprise" col="entreprise" onSort={handleSort}><SortIcon col="entreprise" /></SortableHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Situation/Type</th>
                <SortableHeader label="Bureau" col="bureau" onSort={handleSort}><SortIcon col="bureau" /></SortableHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Représentant</th>
                <SortableHeader label="Statut" col="statut" onSort={handleSort}><SortIcon col="statut" /></SortableHeader>
                <SortableHeader label="Date" col="date" onSort={handleSort}><SortIcon col="date" /></SortableHeader>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Aucune domiciliation trouvée
                  </td>
                </tr>
              ) : paginated.map((demande) => (
                <DomiciliationRow key={demande.id} demande={demande} onDetail={openDetail} />
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sorted.length)} sur {sorted.length}
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
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === p ? "bg-amber-500 text-white" : "hover:bg-gray-200 text-gray-600"
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

      <AdminCreateDomiciliationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={async () => {
          await loadDemandesDomiciliation();
        }}
      />
    </div>
  );
};

function SortableHeader({ label, col, onSort, children }: { label: string; col: SortKey; onSort: (k: SortKey) => void; children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
      <button onClick={() => onSort(col)} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
        {label}
        {children}
      </button>
    </th>
  );
}

function DomiciliationRow({ demande, onDetail }: { demande: DemandeDomiciliation; onDetail: (d: DemandeDomiciliation) => void }) {
  const badge = STATUS_BADGES[demande.statut] || STATUS_BADGES.dossier_preparatoire;
  const name = getDisplayName(demande);
  const ageJours = Math.floor((Date.now() - new Date(demande.dateCreation).getTime()) / (1000 * 60 * 60 * 24));
  const isStale = !["active", "refusee", "resiliee", "expiree"].includes(demande.statut) && ageJours > 7;
  const isVeryStale = isStale && ageJours > 30;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isVeryStale ? "bg-red-50/40" : isStale ? "bg-amber-50/40" : ""}`}
      onClick={() => onDetail(demande)}
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
              {demande.typeStructure === "auto_entrepreneur" ? "Auto-entrepreneur" : (demande.formeJuridique || "Societe")}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <Badge variant={demande.situationAdministrative === "en_cours_creation" ? "warning" : "info"} size="sm">
            {getSituationLabel(demande.situationAdministrative)}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-4">
        {demande.numeroBureau ? (
          <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold text-sm">
            N{demande.numeroBureau}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
      <td className="px-4 py-4">
        <div>
          <p className="font-medium text-gray-900 text-sm">
            {demande.representantLegal?.prenom} {demande.representantLegal?.nom}
          </p>
          <p className="text-xs text-gray-500">{demande.representantLegal?.telephone}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge variant={badge.variant}>
          {badge.icon}
          {badge.label}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-gray-500">{formatDate(demande.dateCreation)}</div>
        {isStale && (
          <span className={`text-xs font-medium ${isVeryStale ? "text-red-600" : "text-amber-600"}`}>
            {ageJours}j {isVeryStale ? "(stagnant)" : "(en attente)"}
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onDetail(demande); }}
        >
          <Eye className="w-4 h-4 mr-1" />
          Details
        </Button>
      </td>
    </motion.tr>
  );
}

function StatsCards({ stats, onFilter }: { stats: Record<string, number>; onFilter: (v: string) => void }) {
  const cards = [
    { value: stats.preparatoires, label: "Préparatoires", icon: Clock, bg: "from-amber-50 to-orange-50", border: "border-amber-200", text: "text-amber-700", sub: "text-amber-600", iconBg: "bg-amber-100", iconColor: "text-amber-600", filter: "dossier_preparatoire" },
    { value: stats.enAttenteSignature, label: "Att. signature", icon: Scale, bg: "from-sky-50 to-cyan-50", border: "border-sky-200", text: "text-sky-700", sub: "text-sky-600", iconBg: "bg-sky-100", iconColor: "text-sky-600", filter: "en_attente_signature" },
    { value: stats.actives, label: "Actives", icon: PlayCircle, bg: "from-emerald-50 to-green-50", border: "border-emerald-200", text: "text-emerald-700", sub: "text-emerald-600", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", filter: "active" },
    { value: stats.expirees, label: "Expirées", icon: AlertCircle, bg: "from-gray-50 to-slate-50", border: "border-gray-300", text: "text-gray-700", sub: "text-gray-600", iconBg: "bg-gray-200", iconColor: "text-gray-600", filter: "expiree" },
    { value: stats.refusees + stats.resiliees, label: "Refusées/Résiliées", icon: XCircle, bg: "from-red-50 to-rose-50", border: "border-red-200", text: "text-red-700", sub: "text-red-600", iconBg: "bg-red-100", iconColor: "text-red-600", filter: "refusee" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ value, label, icon: Icon, bg, border, text, sub, iconBg, iconColor, filter }) => (
        <Card
          key={label}
          className={`p-4 bg-gradient-to-br ${bg} ${border} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => onFilter(filter)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
              <p className={`text-xs ${sub}`}>{label}</p>
            </div>
          </div>
        </Card>
      ))}
      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(stats.revenuMensuel)}</p>
            <p className="text-xs text-emerald-600">Rev. mensuel</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdminDomiciliations;
