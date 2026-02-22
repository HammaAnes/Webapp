import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RefreshCw,
  MoreHorizontal,
  CreditCard,
  Timer,
  Filter,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { useAppStore } from "../../../store/store";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { formatDate, formatTime, formatCurrency, buildCsvContent } from "../../../utils/formatters";
import toast from "react-hot-toast";
import {
  getReservationStatutColor,
  getReservationStatutLabel,
  RESERVATION_STATUTS,
  type ReservationStatut,
} from "../../../constants";
import { apiClient } from "../../../lib/api-client";
import { logger } from "../../../utils/logger";
import { emailService } from "../../../services/email-service";
import HotelCalendar from "../../../components/admin/HotelCalendar";
import ReservationDrawer from "../../../components/admin/ReservationDrawer";
import type { Reservation } from "../../../types";
import { WORKING_HOURS } from "../../../constants/algeria";

interface CreateReservationForm {
  user_id: string;
  espace_id: string;
  date_debut: string;
  heure_debut: string;
  date_fin: string;
  heure_fin: string;
  participants: number;
  notes: string;
}

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

type SortField = "date" | "user" | "space" | "amount" | "status";
type SortDirection = "asc" | "desc";
type StatusTab = "tous" | "en_attente" | "confirmee" | "en_cours" | "terminee" | "annulee";

const ITEMS_PER_PAGE = 15;

const STATUS_TABS: { key: StatusTab; label: string; color: string; dotColor: string }[] = [
  { key: "tous", label: "Toutes", color: "text-gray-700", dotColor: "bg-gray-400" },
  { key: "en_attente", label: "En attente", color: "text-amber-700", dotColor: "bg-amber-500" },
  { key: "confirmee", label: "Confirmées", color: "text-emerald-700", dotColor: "bg-emerald-500" },
  { key: "en_cours", label: "En cours", color: "text-blue-700", dotColor: "bg-blue-500" },
  { key: "terminee", label: "Terminées", color: "text-gray-600", dotColor: "bg-gray-400" },
  { key: "annulee", label: "Annulées", color: "text-red-700", dotColor: "bg-red-500" },
];

const Reservations = () => {
  const { reservations, updateReservation, espaces, loadReservations } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("tous");
  const [espaceFilter, setEspaceFilter] = useState<string>("tous");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [drawerReservation, setDrawerReservation] = useState<Reservation | null>(null);

  const [formData, setFormData] = useState<CreateReservationForm>({
    user_id: "",
    espace_id: "",
    date_debut: "",
    heure_debut: WORKING_HOURS.START,
    date_fin: "",
    heure_fin: WORKING_HOURS.END,
    participants: 1,
    notes: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiClient.getUsers();
      if (response.success && response.data) {
        const responseData = response.data as { data?: User[] } | User[];
        const userData = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        setUsers(userData);
      }
    } catch (error) {
      logger.error("Erreur chargement utilisateurs:", error as Error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
    toast.success("Données actualisées");
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      espace_id: "",
      date_debut: "",
      heure_debut: WORKING_HOURS.START,
      date_fin: "",
      heure_fin: WORKING_HOURS.END,
      participants: 1,
      notes: "",
    });
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.espace_id || !formData.date_debut || !formData.date_fin) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const [hDebutH, hDebutM] = formData.heure_debut.split(":").map(Number);
    const [hFinH, hFinM] = formData.heure_fin.split(":").map(Number);
    const debutMin = hDebutH * 60 + hDebutM;
    const finMin = hFinH * 60 + hFinM;
    const openMin = WORKING_HOURS.OPENING_HOUR * 60 + WORKING_HOURS.OPENING_MINUTE;
    const closeMin = WORKING_HOURS.CLOSING_HOUR * 60 + WORKING_HOURS.CLOSING_MINUTE;
    if (debutMin < openMin) {
      toast.error(`L'heure de début ne peut pas être avant ${WORKING_HOURS.START}`);
      return;
    }
    if (finMin > closeMin) {
      toast.error(`L'heure de fin ne peut pas être après ${WORKING_HOURS.END}`);
      return;
    }
    if (finMin <= debutMin) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }
    const selectedSpace = espaces.find((esp) => esp.id === formData.espace_id);
    const isOS = selectedSpace?.type === "open_space" || selectedSpace?.nom?.toLowerCase().includes("open");
    if (!isOS) {
      const reqStart = new Date(`${formData.date_debut}T${formData.heure_debut}:00`).getTime();
      const reqEnd = new Date(`${formData.date_fin}T${formData.heure_fin}:00`).getTime();
      const conflict = reservations.find((r) => {
        if (r.espaceId !== formData.espace_id) return false;
        if (r.statut === "annulee" || r.statut === "terminee") return false;
        const rStart = new Date(r.dateDebut).getTime();
        const rEnd = new Date(r.dateFin).getTime();
        return reqStart < rEnd && reqEnd > rStart;
      });
      if (conflict) {
        toast.error(`Cet espace est déjà réservé sur ce créneau. Choisissez un autre horaire ou espace.`);
        return;
      }
    }
    setCreateLoading(true);
    try {
      const dateDebut = `${formData.date_debut}T${formData.heure_debut}:00`;
      const dateFin = `${formData.date_fin}T${formData.heure_fin}:00`;
      const response = await apiClient.post("/reservations/create.php", {
        user_id: formData.user_id,
        espace_id: formData.espace_id,
        date_debut: dateDebut,
        date_fin: dateFin,
        participants: formData.participants,
        notes: formData.notes || null,
        statut: "confirmee",
      });
      if (response.success) {
        toast.success("Réservation créée avec succès");
        setShowCreateModal(false);
        resetForm();
        await loadReservations();
      } else {
        toast.error(response.message || "Erreur lors de la création");
      }
    } catch (error) {
      logger.error("Erreur création réservation :", error as Error);
      toast.error("Erreur lors de la création de la réservation");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteReservation = async () => {
    if (!selectedReservation) return;
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(`/reservations/cancel.php?id=${selectedReservation}`);
      if (response.success) {
        toast.success("Réservation supprimée");
        setShowDeleteModal(false);
        setSelectedReservation(null);
        await loadReservations();
      } else {
        toast.error(response.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      logger.error("Erreur suppression réservation :", error as Error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (id: string, statut: string) => {
    try {
      const result = await updateReservation(id, { statut: statut as ReservationStatut });
      if (result?.success === false) {
        toast.error(result.error || "Erreur lors de la mise à jour");
        return;
      }
      toast.success(`Réservation ${statut === "confirmee" ? "confirmée" : statut === "annulee" ? "refusée" : "mise à jour"}`);
      setActionMenu(null);

      const res = reservations.find((r) => r.id === id);
      if (res?.utilisateur?.email) {
        const start = new Date(res.dateDebut);
        const end = new Date(res.dateFin);
        const diffH = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        const dureeStr = diffH < 24 ? `${diffH}h` : `${Math.ceil(diffH / 24)} jour${Math.ceil(diffH / 24) > 1 ? "s" : ""}`;
        const emailData = {
          prenom: res.utilisateur.prenom || res.utilisateur.nom || "",
          espaceName: res.espace?.nom || "Espace",
          espaceType: res.espace?.type || "",
          dateDebut: formatDate(res.dateDebut),
          dateFin: formatDate(res.dateFin),
          heureDebut: formatTime(res.dateDebut),
          heureFin: formatTime(res.dateFin),
          duree: dureeStr,
          participants: res.participants || 1,
          montant: res.montantTotal || 0,
        };
        if (statut === "confirmee") {
          emailService.onReservationConfirmed(res.utilisateur.email, emailData);
        } else if (statut === "annulee") {
          emailService.onReservationCancelled(res.utilisateur.email, emailData);
        }
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleBulkAction = async (action: "confirmer" | "refuser") => {
    if (selectedIds.length === 0) {
      toast.error("Aucune réservation sélectionnée");
      return;
    }
    try {
      const statut = action === "confirmer" ? "confirmee" : "annulee";
      const results = await Promise.all(
        selectedIds.map((id) => updateReservation(id, { statut: statut as ReservationStatut })),
      );
      const failed = results.filter((r) => r?.success === false);
      if (failed.length > 0) {
        toast.error(`${failed.length} réservation(s) non mises à jour`);
        return;
      }
      toast.success(`${selectedIds.length} réservation(s) ${action === "confirmer" ? "confirmées" : "refusées"}`);
      setSelectedIds([]);
    } catch {
      toast.error("Erreur lors de l'action groupée");
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredReservations = useMemo(() => {
    let filtered = reservations.filter((res) => {
      const matchSearch =
        searchTerm === "" ||
        res.utilisateur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.utilisateur?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.utilisateur?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.espace?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatut = statusTab === "tous" || res.statut === statusTab;
      const matchEspace = espaceFilter === "tous" || res.espace?.id === espaceFilter;
      return matchSearch && matchStatut && matchEspace;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
          break;
        case "user":
          comparison = (a.utilisateur?.nom || "").localeCompare(b.utilisateur?.nom || "");
          break;
        case "space":
          comparison = (a.espace?.nom || "").localeCompare(b.espace?.nom || "");
          break;
        case "amount":
          comparison = (a.montantTotal || 0) - (b.montantTotal || 0);
          break;
        case "status":
          comparison = (a.statut || "").localeCompare(b.statut || "");
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [reservations, searchTerm, statusTab, espaceFilter, sortField, sortDirection]);

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage]);

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusTab, espaceFilter]);

  const stats = useMemo(() => {
    const total = reservations.length;
    const enAttente = reservations.filter((r) => r.statut === "en_attente").length;
    const confirmees = reservations.filter((r) => r.statut === "confirmee").length;
    const enCours = reservations.filter((r) => r.statut === "en_cours").length;
    const revenuTotal = reservations
      .filter((r) => r.statut === "confirmee" || r.statut === "terminee")
      .reduce((sum, r) => sum + r.montantTotal, 0);
    return { total, enAttente, confirmees, enCours, revenuTotal };
  }, [reservations]);

  const getStatusCount = (status: StatusTab): number => {
    if (status === "tous") return reservations.length;
    return reservations.filter((r) => r.statut === status).length;
  };

  const exportToCSV = () => {
    const headers = ["Date", "Utilisateur", "Email", "Espace", "Début", "Fin", "Participants", "Montant", "Statut"];
    const rows = filteredReservations.map((r) => [
      formatDate(r.dateCreation ?? new Date()),
      `${r.utilisateur?.prenom || ""} ${r.utilisateur?.nom || ""}`,
      r.utilisateur?.email || "",
      r.espace?.nom || "",
      formatDate(r.dateDebut),
      formatDate(r.dateFin),
      String(r.participants || 0),
      String(r.montantTotal || 0),
      getReservationStatutLabel(r.statut),
    ]);
    const csv = buildCsvContent(headers, rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV réussi");
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors group"
    >
      {children}
      {sortField === field ? (
        sortDirection === "desc" ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-gray-900" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
      )}
    </button>
  );

  const getInitials = (prenom?: string, nom?: string): string => {
    return `${(prenom || "?")[0]}${(nom || "?")[0]}`.toUpperCase();
  };

  const handleCalendarReservationClick = (reservation: Reservation) => {
    setDrawerReservation(reservation);
  };

  const handleCalendarCreateClick = (espaceId: string, date: string) => {
    setFormData({
      ...formData,
      espace_id: espaceId,
      date_debut: date,
      date_fin: date,
      heure_debut: WORKING_HOURS.START,
      heure_fin: WORKING_HOURS.END,
    });
    setShowCreateModal(true);
  };

  const handleDrawerStatusChange = async (id: string, statut: string) => {
    await handleStatusChange(id, statut);
    setDrawerReservation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} reservation{stats.total > 1 ? "s" : ""} au total
            {stats.enAttente > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                {stats.enAttente} en attente
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5 mr-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Calendrier
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Liste
            </button>
          </div>
          {viewMode === "list" && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              title="Actualiser"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2 bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4" />
            Nouvelle reservation
          </Button>
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Calendar, color: "bg-blue-50 text-blue-600", iconBg: "bg-blue-100" },
          { label: "En attente", value: stats.enAttente, icon: Clock, color: "bg-amber-50 text-amber-600", iconBg: "bg-amber-100" },
          { label: "Confirmées", value: stats.confirmees, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", iconBg: "bg-emerald-100" },
          { label: "Revenus", value: formatCurrency(stats.revenuTotal), icon: CreditCard, color: "bg-teal-50 text-teal-600", iconBg: "bg-teal-100" },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {viewMode === "calendar" && (
        <HotelCalendar
          onReservationClick={handleCalendarReservationClick}
          onCreateClick={handleCalendarCreateClick}
        />
      )}

      {viewMode === "list" && (
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          {/* Status tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const count = getStatusCount(tab.key);
              const isActive = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : tab.dotColor}`} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-white/20" : "bg-gray-200 text-gray-600"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou espace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={espaceFilter}
                onChange={(e) => setEspaceFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm bg-white appearance-none cursor-pointer"
              >
                <option value="tous">Tous les espaces</option>
                {espaces.map((espace) => (
                  <option key={espace.id} value={espace.id}>
                    {espace.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
                <span className="text-sm font-semibold text-blue-900">
                  {selectedIds.length} sélectionnée{selectedIds.length > 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleBulkAction("confirmer")} className="gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirmer
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleBulkAction("refuser")} className="gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Refuser
                  </Button>
                </div>
                <button
                  onClick={() => setSelectedIds([])}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Désélectionner
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {filteredReservations.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune réservation</h3>
            <p className="text-sm text-gray-500">
              {searchTerm || statusTab !== "tous" || espaceFilter !== "tous"
                ? "Aucune réservation ne correspond à vos filtres"
                : "Aucune réservation enregistrée"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedReservations.length && paginatedReservations.length > 0}
                        onChange={() => {
                          if (selectedIds.length === paginatedReservations.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(paginatedReservations.map((r) => r.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortButton field="user">Client</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortButton field="space">Espace</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortButton field="date">Date & Horaire</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortButton field="amount">Montant</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortButton field="status">Statut</SortButton>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReservations.map((res) => {
                    const isSelected = selectedIds.includes(res.id);
                    const isExpanded = expandedRow === res.id;
                    return (
                      <React.Fragment key={res.id}>
                        <tr
                          className={`border-b border-gray-50 transition-colors ${
                            isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/50"
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(res.id)}
                              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600">
                                {getInitials(res.utilisateur?.prenom, res.utilisateur?.nom)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {res.utilisateur?.prenom} {res.utilisateur?.nom}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{res.utilisateur?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{res.espace?.nom}</p>
                                <p className="text-xs text-gray-500">
                                  <Users className="w-3 h-3 inline mr-0.5" />
                                  {res.participants || 1} pers.
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{formatDate(res.dateDebut)}</p>
                              <p className="text-xs text-gray-500">
                                {formatTime(res.dateDebut)} - {formatTime(res.dateFin)}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(res.montantTotal)}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={getReservationStatutColor(res.statut)} size="sm">
                              {getReservationStatutLabel(res.statut)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              {res.statut === "en_attente" && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(res.id, "confirmee")}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    title="Confirmer"
                                  >
                                    <CheckCircle className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(res.id, "annulee")}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    title="Refuser"
                                  >
                                    <XCircle className="w-4.5 h-4.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : res.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                title="Détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenu(actionMenu === res.id ? null : res.id);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                  {actionMenu === res.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                      className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 w-48"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {res.statut !== "confirmee" && res.statut !== "terminee" && (
                                        <button
                                          onClick={() => handleStatusChange(res.id, "confirmee")}
                                          className="w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                                        >
                                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                                          Confirmer
                                        </button>
                                      )}
                                      {res.statut !== "en_cours" && res.statut !== "terminee" && res.statut !== "annulee" && (
                                        <button
                                          onClick={() => handleStatusChange(res.id, "en_cours")}
                                          className="w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                                        >
                                          <Timer className="w-4 h-4 text-blue-500" />
                                          Marquer en cours
                                        </button>
                                      )}
                                      {res.statut !== "terminee" && (
                                        <button
                                          onClick={() => handleStatusChange(res.id, "terminee")}
                                          className="w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                                        >
                                          <CheckCircle className="w-4 h-4 text-gray-500" />
                                          Marquer terminée
                                        </button>
                                      )}
                                      {res.statut !== "annulee" && (
                                        <button
                                          onClick={() => handleStatusChange(res.id, "annulee")}
                                          className="w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-red-600"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          Annuler
                                        </button>
                                      )}
                                      <div className="border-t border-gray-100 my-1" />
                                      <button
                                        onClick={() => {
                                          setSelectedReservation(res.id);
                                          setShowDeleteModal(true);
                                          setActionMenu(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-red-50 text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <td colSpan={7}>
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Début</p>
                                      <p className="text-sm font-semibold text-gray-900">{formatDate(res.dateDebut)}</p>
                                      <p className="text-sm text-gray-600">{formatTime(res.dateDebut)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fin</p>
                                      <p className="text-sm font-semibold text-gray-900">{formatDate(res.dateFin)}</p>
                                      <p className="text-sm text-gray-600">{formatTime(res.dateFin)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Participants</p>
                                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        {res.participants || 1} personne{(res.participants || 1) > 1 ? "s" : ""}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Créée le</p>
                                      <p className="text-sm text-gray-900">
                                        {res.dateCreation ? formatDate(res.dateCreation) : "-"}
                                      </p>
                                    </div>
                                  </div>
                                  {res.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                                      <p className="text-sm text-gray-700">{res.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length)} sur {filteredReservations.length}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
      )}

      <ReservationDrawer
        reservation={drawerReservation}
        onClose={() => setDrawerReservation(null)}
        onStatusChange={handleDrawerStatusChange}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Nouvelle Réservation"
        subtitle="Créer une réservation pour un client"
        size="lg"
      >
        <form onSubmit={handleCreateReservation} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm bg-white appearance-none cursor-pointer"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} - {user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Espace <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.espace_id}
                  onChange={(e) => setFormData({ ...formData, espace_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm bg-white appearance-none cursor-pointer"
                  required
                >
                  <option value="">Sélectionner un espace</option>
                  {espaces.map((espace) => (
                    <option key={espace.id} value={espace.id}>
                      {espace.nom} ({espace.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date début *</label>
              <input
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Heure début *</label>
              <input
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                min={WORKING_HOURS.START}
                max={WORKING_HOURS.END}
                step="1800"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date fin *</label>
              <input
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Heure fin *</label>
              <input
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                min={WORKING_HOURS.START}
                max={WORKING_HOURS.END}
                step="1800"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Participants</label>
              <input
                type="number"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes optionnelles..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1"
              disabled={createLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createLoading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              loading={createLoading}
            >
              Créer la réservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedReservation(null);
        }}
        title="Supprimer la réservation"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Cette action est irréversible. La réservation sera définitivement supprimée.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedReservation(null);
              }}
              className="flex-1"
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeleteReservation}
              disabled={deleteLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              loading={deleteLoading}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;
