import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Eye,
  XCircle,
  RefreshCw,
  AlertCircle,
  MapPin,
  Users,
  CreditCard,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Timer,
  TrendingUp,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../lib/api-client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import ReservationForm from "../../components/dashboard/ReservationForm";
import { format, isPast, isFuture, isToday, differenceInDays, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { emailService } from "../../services/email-service";
import { useAuthStore } from "../../store/authStore";

interface Reservation {
  id: string;
  user_id: string;
  espace_id: string;
  espace_nom?: string;
  espace_type?: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  montant_total: number | string;
  participants: number;
  notes?: string;
}

type FilterType = "all" | "upcoming" | "past" | "cancelled";
type ViewMode = "cards" | "list";

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ElementType }> = {
  en_attente: {
    label: "En attente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: Timer,
  },
  confirmee: {
    label: "Confirmée",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  en_cours: {
    label: "En cours",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    icon: Sparkles,
  },
  terminee: {
    label: "Terminée",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    icon: CheckCircle2,
  },
  annulee: {
    label: "Annulée",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: XCircle,
  },
};

const formatMontant = (value: number | string | null | undefined): string => {
  if (value == null) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("fr-DZ");
};

const formatDateDisplay = (dateStr: string): string => {
  try {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return format(date, "EEE d MMM yyyy", { locale: fr });
  } catch {
    return dateStr || "-";
  }
};

const formatTimeDisplay = (dateStr: string): string => {
  try {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return format(date, "HH:mm", { locale: fr });
  } catch {
    return "";
  }
};

const getTimeLabel = (dateDebut: string): { text: string; color: string; urgent: boolean } => {
  try {
    const date = new Date(dateDebut);
    if (isToday(date)) return { text: "Aujourd'hui", color: "bg-emerald-500 text-white", urgent: true };
    if (isFuture(date)) {
      const days = differenceInDays(date, new Date());
      if (days === 0) {
        const hours = differenceInHours(date, new Date());
        if (hours < 1) return { text: "Imminent", color: "bg-emerald-500 text-white", urgent: true };
        return { text: `Dans ${hours}h`, color: "bg-emerald-500 text-white", urgent: true };
      }
      if (days === 1) return { text: "Demain", color: "bg-blue-500 text-white", urgent: false };
      if (days <= 3) return { text: `Dans ${days} jours`, color: "bg-blue-100 text-blue-700", urgent: false };
      if (days <= 7) return { text: `Dans ${days} jours`, color: "bg-gray-100 text-gray-600", urgent: false };
    }
    return { text: "", color: "", urgent: false };
  } catch {
    return { text: "", color: "", urgent: false };
  }
};

const getDuration = (dateDebut: string, dateFin: string): string => {
  try {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const hours = differenceInHours(end, start);
    if (hours < 24) return `${hours}h`;
    const days = Math.ceil(hours / 24);
    return `${days}j`;
  } catch {
    return "-";
  }
};

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const loadReservations = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiClient.getReservations();

      if (response.success) {
        let data = response.data;
        if (!Array.isArray(data)) data = [];
        setReservations(data as Reservation[]);
      } else {
        setError(response.error || response.message || "Erreur lors du chargement");
        setReservations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
      setReservations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleCancelReservation = async () => {
    if (!cancelId || cancelling) return;

    try {
      setCancelling(true);
      const response = await apiClient.cancelReservation(cancelId);

      if (response.success) {
        toast.success("Réservation annulée avec succès");
        const cancelledRes = reservations.find((r) => r.id === cancelId);
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.email && cancelledRes) {
          const start = new Date(cancelledRes.date_debut);
          const end = new Date(cancelledRes.date_fin);
          const diffH = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
          const dureeStr = diffH < 24 ? `${diffH}h` : `${Math.ceil(diffH / 24)} jour${Math.ceil(diffH / 24) > 1 ? "s" : ""}`;
          emailService.onReservationCancelled(currentUser.email, {
            prenom: currentUser.prenom || currentUser.nom || "",
            espaceName: cancelledRes.espace_nom || "",
            espaceType: cancelledRes.espace_type || "",
            dateDebut: format(start, "EEEE d MMMM yyyy", { locale: fr }),
            dateFin: format(end, "EEEE d MMMM yyyy", { locale: fr }),
            heureDebut: format(start, "HH:mm"),
            heureFin: format(end, "HH:mm"),
            duree: dureeStr,
            participants: cancelledRes.participants || 1,
            montant: parseFloat(String(cancelledRes.montant_total) || "0"),
          });
        }
        setCancelId(null);
        await loadReservations(true);
      } else {
        toast.error(response.error || response.message || "Erreur lors de l'annulation");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (reservation: Reservation): boolean => {
    return ["en_attente", "confirmee"].includes(reservation.statut);
  };

  const handleFormClose = () => {
    setShowForm(false);
    loadReservations(true);
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (filter === "all") return true;
      if (filter === "cancelled") return r.statut === "annulee";
      if (filter === "upcoming") {
        return (
          r.statut !== "annulee" &&
          r.statut !== "terminee" &&
          (isFuture(new Date(r.date_debut)) || isToday(new Date(r.date_debut)))
        );
      }
      if (filter === "past") {
        return r.statut === "terminee" || isPast(new Date(r.date_fin));
      }
      return true;
    });
  }, [reservations, filter]);

  const stats = useMemo(() => {
    const upcoming = reservations.filter(
      (r) =>
        r.statut !== "annulee" &&
        r.statut !== "terminee" &&
        (isFuture(new Date(r.date_debut)) || isToday(new Date(r.date_debut)))
    ).length;

    const completed = reservations.filter((r) => r.statut === "terminee").length;
    const cancelled = reservations.filter((r) => r.statut === "annulee").length;

    const totalSpent = reservations
      .filter((r) => r.statut === "terminee" || r.statut === "confirmee")
      .reduce((sum, r) => {
        const amount = typeof r.montant_total === "string" ? parseFloat(r.montant_total) : r.montant_total;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    return {
      total: reservations.length,
      upcoming,
      completed,
      cancelled,
      totalSpent,
    };
  }, [reservations]);

  const nextReservation = useMemo(() => {
    return reservations
      .filter((r) => r.statut !== "annulee" && r.statut !== "terminee" && isFuture(new Date(r.date_debut)))
      .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())[0];
  }, [reservations]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-200 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 mt-4 font-medium">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Impossible de charger les réservations
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => loadReservations()} className="bg-amber-500 hover:bg-amber-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Réservations</h1>
          <p className="text-gray-500 mt-1">
            {stats.upcoming > 0
              ? `${stats.upcoming} réservation${stats.upcoming > 1 ? "s" : ""} à venir`
              : "Aucune réservation à venir"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {reservations.length > 0 && (
            <button
              onClick={() => loadReservations(true)}
              disabled={refreshing}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              title="Actualiser"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Réservation
          </Button>
        </div>
      </div>

      {nextReservation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <Card className="p-0 overflow-hidden border-0 shadow-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIG9wYWNpdHk9Ii4xIiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium uppercase tracking-wide mb-1">
                      Prochaine réservation
                    </p>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {nextReservation.espace_nom || "Espace"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-white/90">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {formatDateDisplay(nextReservation.date_debut)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatTimeDisplay(nextReservation.date_debut)} - {formatTimeDisplay(nextReservation.date_fin)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-white/70 text-sm">Montant</p>
                    <p className="text-2xl font-bold text-white">{formatMontant(nextReservation.montant_total)} DA</p>
                  </div>
                  <Link to={`/app/reservations/${nextReservation.id}`}>
                    <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 shadow-none">
                      Voir détails
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {reservations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Réservations</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Actif</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
              <p className="text-sm text-gray-500 mt-1">À venir</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5 bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Passé</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500 mt-1">Terminées</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatMontant(stats.totalSpent)}</p>
              <p className="text-sm text-gray-500 mt-1">DA dépensées</p>
            </Card>
          </motion.div>
        </div>
      )}

      {reservations.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-2 border border-gray-200">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: "all", label: "Toutes", count: stats.total },
              { key: "upcoming", label: "À venir", count: stats.upcoming },
              { key: "past", label: "Passées", count: stats.completed },
              { key: "cancelled", label: "Annulées", count: stats.cancelled },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as FilterType)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                  ${
                    filter === item.key
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Filter className="w-4 h-4" />
                {item.label}
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${filter === item.key ? "bg-white/20" : "bg-gray-200"}
                `}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-lg transition-all ${viewMode === "cards" ? "bg-white shadow text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
              title="Vue cartes"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
              title="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            filter === "all"
              ? "Aucune réservation"
              : `Aucune réservation ${
                  filter === "upcoming"
                    ? "à venir"
                    : filter === "past"
                    ? "passée"
                    : "annulée"
                }`
          }
          description={
            filter === "all"
              ? "Réservez un espace de travail pour commencer votre expérience Coffice"
              : "Changez de filtre pour voir d'autres réservations"
          }
          action={
            filter === "all"
              ? {
                  label: "Réserver maintenant",
                  onClick: () => setShowForm(true),
                }
              : undefined
          }
        />
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredReservations.map((reservation, index) => {
              const status = statusConfig[reservation.statut] || statusConfig.en_attente;
              const timeLabel = getTimeLabel(reservation.date_debut);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 ${
                    reservation.statut === "confirmee" || reservation.statut === "en_cours"
                      ? "border-l-emerald-500"
                      : reservation.statut === "annulee"
                      ? "border-l-red-500"
                      : reservation.statut === "terminee"
                      ? "border-l-gray-400"
                      : "border-l-amber-500"
                  }`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {reservation.espace_nom || "Espace"}
                            </h3>
                            {timeLabel.text && (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${timeLabel.color}`}>
                                {timeLabel.text}
                              </span>
                            )}
                          </div>
                          {reservation.espace_type && (
                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {reservation.espace_type}
                            </p>
                          )}
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium">Date</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {formatDateDisplay(reservation.date_debut)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">Horaire</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatTimeDisplay(reservation.date_debut)} - {formatTimeDisplay(reservation.date_fin)}
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-medium">Total</span>
                          </div>
                          <p className="text-sm font-bold text-amber-700">
                            {formatMontant(reservation.montant_total)} DA
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {reservation.participants > 1 && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {reservation.participants} pers.
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Timer className="w-4 h-4" />
                            {getDuration(reservation.date_debut, reservation.date_fin)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/app/reservations/${reservation.id}`}>
                            <Button variant="secondary" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              Détails
                            </Button>
                          </Link>
                          {canCancel(reservation) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setCancelId(reservation.id)}
                              className="gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Espace</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Horaire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <AnimatePresence mode="popLayout">
                  {filteredReservations.map((reservation) => {
                    const status = statusConfig[reservation.statut] || statusConfig.en_attente;
                    const timeLabel = getTimeLabel(reservation.date_debut);

                    return (
                      <motion.tr
                        key={reservation.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{reservation.espace_nom || "Espace"}</p>
                              <p className="text-xs text-gray-500">{reservation.espace_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formatDateDisplay(reservation.date_debut)}</span>
                            {timeLabel.text && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${timeLabel.color}`}>
                                {timeLabel.text}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatTimeDisplay(reservation.date_debut)} - {formatTimeDisplay(reservation.date_fin)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatMontant(reservation.montant_total)} DA
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/app/reservations/${reservation.id}`}>
                              <Button variant="secondary" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {canCancel(reservation) && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setCancelId(reservation.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ReservationForm isOpen={showForm} onClose={handleFormClose} />

      <Modal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        title="Annuler la réservation"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                Confirmer l'annulation
              </h3>
              <p className="text-gray-500 mt-1">
                Cette action est irréversible. Vous devrez créer une nouvelle
                réservation si vous changez d'avis.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setCancelId(null)}
              disabled={cancelling}
            >
              Conserver ma réservation
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelReservation}
              disabled={cancelling}
              className="min-w-[140px]"
            >
              {cancelling ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Annulation...
                </span>
              ) : (
                "Confirmer l'annulation"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;
