import React, { useState, useEffect, useMemo } from "react";
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
  FileCheck,
  Hash,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import DomiciliationDetailModal from "../../../components/admin/DomiciliationDetailModal";
import { useAppStore } from "../../../store/store";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import toast from "react-hot-toast";
import type { DemandeDomiciliation } from "../../../types";
import { apiClient } from "../../../lib/api-client";
import { DOMICILIATION_STATUT_LABELS } from "../../../constants";
import { emailService } from "../../../services/email-service";

const PAGE_SIZE = 15;

type SortKey = "entreprise" | "bureau" | "statut" | "date";
type SortDir = "asc" | "desc";

const STATUS_BADGES: Record<string, { variant: "warning" | "success" | "danger" | "default" | "info" | "teal"; icon: React.ReactNode; label: string }> = {
  dossier_preparatoire: { variant: "warning", icon: <Clock className="w-3 h-3 mr-1" />, label: "Dossier preparatoire" },
  en_attente_signature: { variant: "info", icon: <Scale className="w-3 h-3 mr-1" />, label: "Attente signature" },
  domiciliation_creee: { variant: "teal", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Domiciliation creee" },
  en_attente_complements: { variant: "warning", icon: <FileText className="w-3 h-3 mr-1" />, label: "Attente complements" },
  active: { variant: "success", icon: <PlayCircle className="w-3 h-3 mr-1" />, label: "Active" },
  refusee: { variant: "danger", icon: <XCircle className="w-3 h-3 mr-1" />, label: "Refusee" },
  expiree: { variant: "default", icon: <AlertCircle className="w-3 h-3 mr-1" />, label: "Expiree" },
  resiliee: { variant: "danger", icon: <Ban className="w-3 h-3 mr-1" />, label: "Resiliee" },
};

const STATUS_FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "dossier_preparatoire", label: "Preparatoires" },
  { key: "en_attente_signature", label: "Att. signature" },
  { key: "domiciliation_creee", label: "Creees" },
  { key: "en_attente_complements", label: "Att. complements" },
  { key: "active", label: "Actives" },
  { key: "refusee", label: "Refusees" },
  { key: "resiliee", label: "Resiliees" },
  { key: "expiree", label: "Expirees" },
];

function getDisplayName(d: DemandeDomiciliation) {
  return d.raisonSociale || (d.typeStructure === "auto_entrepreneur"
    ? `${d.representantLegal?.prenom || ""} ${d.representantLegal?.nom || ""}`.trim() || "Non renseigne"
    : "Non renseigne"
  );
}

function getSituationLabel(s: string) {
  return s === "en_cours_creation" ? "En cours de creation" : "Deja creee";
}

function getTypeLabel(t: string) {
  return t === "auto_entrepreneur" ? "Auto-entrepreneur" : "Societe";
}

const AdminDomiciliations = () => {
  const { demandesDomiciliation, loadDemandesDomiciliation } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedDemande, setSelectedDemande] = useState<DemandeDomiciliation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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
    bureauOccupes: new Set(
      demandesDomiciliation
        .filter((d) => ["active", "domiciliation_creee", "en_attente_complements", "en_attente_signature"].includes(d.statut) && d.numeroBureau)
        .map((d) => d.numeroBureau)
    ).size,
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
    try {
      await loadDemandesDomiciliation();
    } catch {
      toast.error("Erreur lors du rafraichissement");
    } finally {
      setRefreshing(false);
    }
  };

  const openDetail = (d: DemandeDomiciliation) => {
    setSelectedDemande(d);
    setShowModal(true);
  };

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    if (!selectedDemande) return;
    setActionLoading(true);
    try {
      let response;
      const motif = (data?.motif as string) || "";

      switch (action) {
        case "valider":
          response = await apiClient.validateDomiciliation(selectedDemande.id, motif || undefined);
          break;
        case "rejeter":
          response = await apiClient.rejectDomiciliation(selectedDemande.id, motif);
          break;
        case "signer":
          response = await apiClient.updateDemandeDomiciliation(selectedDemande.id, {
            statut: "domiciliation_creee",
            numeroBureau: data?.numeroBureau as number,
            referenceContratNotarie: data?.referenceContratNotarie as string,
            dateDebutContrat: data?.dateDebutContrat as string,
            dateFinContrat: data?.dateFinContrat as string,
            montantMensuel: data?.montantMensuel as number,
          });
          break;
        case "activer":
          response = await apiClient.activateDomiciliation(selectedDemande.id);
          break;
        case "resilier":
          response = await apiClient.updateDemandeDomiciliation(selectedDemande.id, {
            statut: "resiliee",
            commentaireAdmin: motif,
          });
          break;
        default:
          return;
      }

      if (response?.success) {
        const msgs: Record<string, string> = {
          valider: "Dossier valide - en attente de signature notariale",
          rejeter: "Demande refusee",
          signer: "Domiciliation creee - contrat enregistre",
          activer: "Domiciliation activee",
          resilier: "Domiciliation resiliee",
        };
        toast.success(msgs[action] || "Action effectuee");

        const email = selectedDemande.representantLegal?.email;
        if (email) {
          const statusMap: Record<string, string> = {
            valider: "en_attente_signature", rejeter: "refusee",
            signer: "domiciliation_creee",
            activer: "active", resilier: "resiliee",
          };
          const newStatut = statusMap[action];
          emailService.onDomiciliationStatusUpdate(email, {
            prenom: selectedDemande.representantLegal?.prenom || "",
            raisonSociale: selectedDemande.raisonSociale || "",
            formeJuridique: selectedDemande.formeJuridique,
            statut: newStatut,
            statutLabel: (DOMICILIATION_STATUT_LABELS as Record<string, string>)[newStatut] || newStatut,
            montantMensuel: action === "signer" ? (data?.montantMensuel as number) : selectedDemande.montantMensuel,
            commentaire: motif || undefined,
            dateDebut: action === "signer" ? (data?.dateDebutContrat as string) : undefined,
            dateFin: action === "signer" ? (data?.dateFinContrat as string) : undefined,
          });
        }

        await loadDemandesDomiciliation();
        setSelectedDemande(null);
        setShowModal(false);
      } else {
        toast.error(response?.error || "Une erreur est survenue");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du traitement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!selectedDemande) return;
    setActionLoading(true);
    try {
      const response = await apiClient.updateDemandeDomiciliation(selectedDemande.id, data);
      if (response?.success) {
        toast.success("Domiciliation mise a jour");
        await loadDemandesDomiciliation();
        const freshData = useAppStore.getState().demandesDomiciliation;
        const updated = freshData.find((d) => d.id === selectedDemande.id);
        if (updated) setSelectedDemande(updated);
      } else {
        const msg = response?.error || "Erreur lors de la mise a jour";
        toast.error(msg);
        throw new Error(msg);
      }
    } catch (err) {
      if (!(err instanceof Error && err.message.includes("Erreur"))) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de la mise a jour");
      }
      throw err;
    } finally {
      setActionLoading(false);
    }
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
        </div>
      </div>

      <StatsCards stats={stats} activeFilter={statusFilter} onFilter={setStatusFilter} />

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
            {STATUS_FILTERS.map(({ key, label }) => {
              const count = key === "tous"
                ? demandesDomiciliation.length
                : demandesDomiciliation.filter((d) => d.statut === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all whitespace-nowrap ${
                    statusFilter === key
                      ? "bg-gray-900 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                  <span className={`ml-1.5 text-xs ${statusFilter === key ? "text-gray-300" : "opacity-60"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Representant</th>
                <SortableHeader label="Statut" col="statut" onSort={handleSort}><SortIcon col="statut" /></SortableHeader>
                <SortableHeader label="Date" col="date" onSort={handleSort}><SortIcon col="date" /></SortableHeader>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Aucune domiciliation trouvee
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
                        page === p ? "bg-gray-900 text-white" : "hover:bg-gray-200 text-gray-600"
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

      <DomiciliationDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        demande={selectedDemande}
        onAction={handleAction}
        onUpdate={handleUpdate}
        loading={actionLoading}
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
  const isPending = !["active", "refusee", "resiliee", "expiree"].includes(demande.statut);
  const isStale = isPending && ageJours > 7;
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
        <Badge variant={demande.situationAdministrative === "en_cours_creation" ? "warning" : "info"} size="sm">
          {getSituationLabel(demande.situationAdministrative)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        {demande.numeroBureau ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold text-sm">
            <Hash className="w-3 h-3" />
            {demande.numeroBureau}
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

function StatsCards({ stats, activeFilter, onFilter }: { stats: Record<string, number>; activeFilter: string; onFilter: (v: string) => void }) {
  const cards = [
    { value: stats.preparatoires, label: "Preparatoires", icon: Clock, bg: "from-amber-50 to-orange-50", border: "border-amber-200", text: "text-amber-700", sub: "text-amber-600", iconBg: "bg-amber-100", iconColor: "text-amber-600", filter: "dossier_preparatoire", activeBorder: "ring-2 ring-amber-400" },
    { value: stats.enAttenteSignature, label: "Att. signature", icon: Scale, bg: "from-sky-50 to-cyan-50", border: "border-sky-200", text: "text-sky-700", sub: "text-sky-600", iconBg: "bg-sky-100", iconColor: "text-sky-600", filter: "en_attente_signature", activeBorder: "ring-2 ring-sky-400" },
    { value: stats.actives, label: "Actives", icon: PlayCircle, bg: "from-emerald-50 to-green-50", border: "border-emerald-200", text: "text-emerald-700", sub: "text-emerald-600", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", filter: "active", activeBorder: "ring-2 ring-emerald-400" },
    { value: stats.expirees, label: "Expirees", icon: AlertCircle, bg: "from-gray-50 to-slate-50", border: "border-gray-300", text: "text-gray-700", sub: "text-gray-600", iconBg: "bg-gray-200", iconColor: "text-gray-600", filter: "expiree", activeBorder: "ring-2 ring-gray-400" },
    { value: stats.refusees, label: "Refusees", icon: XCircle, bg: "from-red-50 to-rose-50", border: "border-red-200", text: "text-red-700", sub: "text-red-600", iconBg: "bg-red-100", iconColor: "text-red-600", filter: "refusee", activeBorder: "ring-2 ring-red-400" },
    { value: stats.resiliees, label: "Resiliees", icon: Ban, bg: "from-rose-50 to-red-50", border: "border-rose-200", text: "text-rose-700", sub: "text-rose-600", iconBg: "bg-rose-100", iconColor: "text-rose-600", filter: "resiliee", activeBorder: "ring-2 ring-rose-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map(({ value, label, icon: Icon, bg, border, text, sub, iconBg, iconColor, filter, activeBorder }) => (
        <Card
          key={label}
          className={`p-4 bg-gradient-to-br ${bg} ${border} cursor-pointer hover:shadow-md transition-all ${activeFilter === filter ? activeBorder : ""}`}
          onClick={() => onFilter(activeFilter === filter ? "tous" : filter)}
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
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.revenuMensuel)}</p>
            <p className="text-xs text-emerald-600">Rev. mensuel</p>
            <p className="text-[10px] text-emerald-500">{stats.bureauOccupes}/36 bureaux</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdminDomiciliations;
