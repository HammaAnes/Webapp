import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import OnboardingChecklist from "./OnboardingChecklist";
import {
  Calendar,
  Users,
  Building,
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  Mail,
  CalendarDays,
  LogIn,
  LogOut,
  XCircle,
  Search,
  Banknote,
  UserCheck,
  Phone,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import { apiClient } from "../../lib/api-client";
import { formatDate, formatCurrency, formatTime } from "../../utils/formatters";
import { format, isToday, isTomorrow, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "../../utils/logger";
import toast from "react-hot-toast";
import type { Reservation } from "../../types";

// ─── Types for operational data ──────────────────────────────────────────────

interface AbonnementEnAttente {
  id: string;
  user_prenom?: string;
  user_nom?: string;
  abonnement_nom?: string;
  created_at?: string;
}

interface DomiciliationExpirante {
  id: string;
  raison_sociale?: string;
  date_fin?: string;
  user_prenom?: string;
  user_nom?: string;
}

interface CourrierNonTraite {
  id: string;
  expediteur?: string;
  type?: string;
  date_reception?: string;
  raison_sociale?: string;
}

interface CaisseJour {
  total_general: number;
  nb_transactions: number;
  totaux?: { mode_paiement: string; total: number; nombre: number }[];
}

interface OperationalData {
  abonnements_en_attente: AbonnementEnAttente[];
  domiciliations_expirantes: DomiciliationExpirante[];
  courriers_non_traites: CourrierNonTraite[];
  caisse_jour: CaisseJour;
}

// ─── Admin Dashboard (unified operational view) ───────────────────────────────

const AdminDashboard = () => {
  const { reservations, espaces, initializeData, loadUsers, updateReservation } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [opData, setOpData] = useState<OperationalData | null>(null);
  const [opLoading, setOpLoading] = useState(true);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOpData = useCallback(async () => {
    try {
      const res = await apiClient.get<OperationalData>("/admin/reception.php");
      if (res.success && res.data) {
        setOpData({
          abonnements_en_attente: res.data.abonnements_en_attente ?? [],
          domiciliations_expirantes: res.data.domiciliations_expirantes ?? [],
          courriers_non_traites: res.data.courriers_non_traites ?? [],
          caisse_jour: res.data.caisse_jour ?? { total_general: 0, nb_transactions: 0 },
        });
      }
    } catch (error) {
      logger.warn("fetchOpData failed:", error instanceof Error ? error.message : String(error));
    } finally {
      setOpLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([initializeData(), loadUsers()]);
      } finally {
        setLoading(false);
      }
    };
    init();
    fetchOpData();

    clockRef.current = setInterval(() => setNow(new Date()), 60000);
    storeRef.current = setInterval(() => { initializeData(true); loadUsers(); }, 120000);
    opRef.current = setInterval(fetchOpData, 60000);

    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
      if (storeRef.current) clearInterval(storeRef.current);
      if (opRef.current) clearInterval(opRef.current);
    };
  }, [initializeData, loadUsers, fetchOpData]);

  const handleRefresh = async () => {
    setLoading(true);
    setOpLoading(true);
    try {
      await Promise.all([initializeData(true), loadUsers(), fetchOpData()]);
      toast.success("Données actualisées");
    } finally {
      setLoading(false);
    }
  };

  // ── Today's reservations ────────────────────────────────────────────────────

  const todayReservations = useMemo(() => {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    return reservations.filter(
      (r) => new Date(r.dateDebut) <= todayEnd && new Date(r.dateFin) >= todayStart
    );
  }, [reservations, now]);

  const categorized = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let src = todayReservations;
    if (q) {
      src = src.filter((r) =>
        r.utilisateur?.nom?.toLowerCase().includes(q) ||
        r.utilisateur?.prenom?.toLowerCase().includes(q) ||
        r.contact?.nom?.toLowerCase().includes(q) ||
        r.contact?.prenom?.toLowerCase().includes(q) ||
        r.espace?.nom?.toLowerCase().includes(q) ||
        r.utilisateur?.telephone?.includes(q)
      );
    }

    const activeNow: Reservation[] = [];
    const arrivingSoon: Reservation[] = [];
    const upcoming: Reservation[] = [];
    const completed: Reservation[] = [];
    const cancelled: Reservation[] = [];

    src.forEach((r) => {
      if (r.statut === "annulee" || r.statut === "no_show") { cancelled.push(r); return; }
      const start = new Date(r.dateDebut);
      const end = new Date(r.dateFin);
      const minUntilStart = differenceInMinutes(start, now);

      if (r.statut === "en_cours" || (r.statut === "confirmee" && start <= now && end >= now)) {
        activeNow.push(r);
      } else if (minUntilStart > 0 && minUntilStart <= 60) {
        arrivingSoon.push(r);
      } else if (isAfter(start, now)) {
        upcoming.push(r);
      } else {
        completed.push(r);
      }
    });

    const byStart = (a: Reservation, b: Reservation) =>
      new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
    return {
      activeNow: activeNow.sort(byStart),
      arrivingSoon: arrivingSoon.sort(byStart),
      upcoming: upcoming.sort(byStart),
      completed: completed.sort((a, b) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime()),
      cancelled,
    };
  }, [todayReservations, now, searchQuery]);

  // ── Space status ────────────────────────────────────────────────────────────

  const espacesStatus = useMemo(() => espaces.map((espace) => {
    const esRes = todayReservations.filter((r) => r.espaceId === espace.id);
    const occupantes = esRes.filter((r) => {
      const s = new Date(r.dateDebut), e = new Date(r.dateFin);
      return (r.statut === "en_cours" || r.statut === "confirmee") && s <= now && e >= now;
    });
    if (occupantes.length > 0) {
      const who = occupantes.map((r) =>
        `${r.utilisateur?.prenom || r.contact?.prenom || ""} ${r.utilisateur?.nom || r.contact?.nom || ""}`.trim()
      ).filter(Boolean);
      const capacite = espace.type === "open_space" ? (espace.capacite || 12) : undefined;
      return { espace, color: "red" as const, who, capacite };
    }
    const hasLater = esRes.some(
      (r) => r.statut !== "annulee" && r.statut !== "terminee" && isAfter(new Date(r.dateDebut), now)
    );
    return { espace, color: (hasLater ? "orange" : "green") as "green" | "orange" | "red", who: [] as string[], capacite: undefined };
  }), [espaces, todayReservations, now]);

  // ── Checkin / Checkout ──────────────────────────────────────────────────────

  const handleCheckin = async (r: Reservation) => {
    setActionLoading(`checkin-${r.id}`);
    try {
      const res = await apiClient.createCheckin({
        reservation_id: r.id,
        heure_arrivee_reelle: new Date().toISOString(),
      });
      if (res.success) {
        const retard = (res.data as Record<string, unknown>)?.retard_minutes;
        toast.success(retard && (retard as number) > 0 ? `Check-in · retard ${retard} min` : "Check-in effectué");
        await initializeData();
      } else toast.error(res.error || "Erreur check-in");
    } catch { toast.error("Erreur check-in"); }
    finally { setActionLoading(null); }
  };

  const handleCheckout = async (r: Reservation) => {
    if (!r.checkinId) { toast.error("Aucun check-in enregistré"); return; }
    setActionLoading(`checkout-${r.id}`);
    try {
      const res = await apiClient.checkout(r.checkinId);
      if (res.success) { toast.success("Check-out effectué"); await initializeData(); }
      else toast.error(res.error || "Erreur check-out");
    } catch { toast.error("Erreur check-out"); }
    finally { setActionLoading(null); }
  };

  const handleNoShow = async (r: Reservation) => {
    setActionLoading(`noshow-${r.id}`);
    try {
      const res = await updateReservation(r.id, { statut: "no_show" });
      if (res?.success === false) toast.error(res.error || "Erreur");
      else toast.success("Marqué no-show");
    } catch { toast.error("Erreur"); }
    finally { setActionLoading(null); }
  };

  const handleConfirm = async (id: string) => {
    setActionLoading(`confirm-${id}`);
    try {
      const res = await updateReservation(id, { statut: "confirmee" });
      if (res?.success === false) toast.error(res.error || "Erreur");
      else toast.success("Confirmée");
    } catch { toast.error("Erreur"); }
    finally { setActionLoading(null); }
  };

  // ── Reservation card ────────────────────────────────────────────────────────

  const ReservationRow = ({ r }: { r: Reservation }) => {
    const start = new Date(r.dateDebut);
    const end = new Date(r.dateFin);
    const minUntilStart = differenceInMinutes(start, now);
    const minUntilEnd = differenceInMinutes(end, now);
    const isPast = isBefore(end, now);

    const canCheckin = r.statut === "confirmee" && !r.checkinId && !isPast;
    const canCheckout = r.statut === "en_cours" && !!r.checkinId;
    const canNoShow = r.statut === "confirmee" && isPast;

    const getBadge = () => {
      if (r.statut === "en_cours") {
        if (minUntilEnd <= 30 && minUntilEnd > 0)
          return <Badge className="bg-amber-100 text-amber-700">Fin dans {minUntilEnd}min</Badge>;
        return <Badge variant="success">En cours</Badge>;
      }
      if (r.statut === "terminee") return <Badge variant="neutral">Terminée</Badge>;
      if (r.statut === "annulee") return <Badge variant="danger">Annulée</Badge>;
      if (r.statut === "no_show") return <Badge variant="danger">No-show</Badge>;
      if (minUntilStart > 0 && minUntilStart <= 60)
        return <Badge variant="warning">Dans {minUntilStart}min</Badge>;
      if (r.statut === "en_attente") return <Badge variant="warning">En attente</Badge>;
      if (r.statut === "confirmee" && isBefore(start, now)) return <Badge variant="info">Confirmée</Badge>;
      return <Badge variant="info">À venir</Badge>;
    };

    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl ${r.statut === "en_cours" ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 hover:bg-gray-100"} transition-colors`}>
        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
          {`${((r.utilisateur?.prenom || r.contact?.prenom || "?")[0] || "?")}${((r.utilisateur?.nom || r.contact?.nom || "?")[0] || "?")}`.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">
              {r.utilisateur?.prenom || r.contact?.prenom} {r.utilisateur?.nom || r.contact?.nom}
            </p>
            {getBadge()}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{r.espace?.nom || "Espace"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{format(start, "HH:mm")} – {format(end, "HH:mm")}
            </span>
            {r.utilisateur?.telephone && (
              <a href={`tel:${r.utilisateur.telephone}`} className="flex items-center gap-1 text-emerald-600 hover:underline">
                <Phone className="w-3 h-3" />{r.utilisateur.telephone}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {r.statut === "en_attente" && (
            <button
              onClick={() => handleConfirm(r.id)}
              disabled={!!actionLoading}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
              title="Confirmer"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {canCheckin && (
            <button
              onClick={() => handleCheckin(r)}
              disabled={actionLoading === `checkin-${r.id}`}
              className="px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" /> Check-in
            </button>
          )}
          {canCheckout && (
            <button
              onClick={() => handleCheckout(r)}
              disabled={actionLoading === `checkout-${r.id}`}
              className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Check-out
            </button>
          )}
          {canNoShow && (
            <button
              onClick={() => handleNoShow(r)}
              disabled={actionLoading === `noshow-${r.id}`}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
              title="No-show"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <Link to="/app/admin/reservations" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200">
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  // ── Derived stats ───────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    totalToday: todayReservations.length,
    activeNow: categorized.activeNow.length,
    pending: todayReservations.filter((r) => r.statut === "en_attente").length,
    alertes: (opData?.abonnements_en_attente.length ?? 0) +
             (opData?.domiciliations_expirantes.length ?? 0) +
             (opData?.courriers_non_traites.length ?? 0),
  }), [todayReservations, categorized, opData]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(now, "EEEE d MMMM yyyy", { locale: fr })}
            <span className="font-mono ml-2 text-gray-700">{format(now, "HH:mm")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link to="/app/admin/reservations">
            <Button size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
              <Calendar className="w-4 h-4" /> Réservations
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs du jour */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Réservations", sub: "aujourd'hui", value: kpis.totalToday, icon: Calendar, colors: "from-blue-500 to-blue-600" },
          { label: "Présents", sub: "en ce moment", value: kpis.activeNow, icon: UserCheck, colors: "from-emerald-500 to-emerald-600" },
          { label: "En attente", sub: "à confirmer", value: kpis.pending, icon: AlertCircle, colors: kpis.pending > 0 ? "from-amber-500 to-orange-500" : "from-gray-400 to-gray-500" },
          { label: "Alertes", sub: "actions requises", value: kpis.alertes, icon: Banknote, colors: kpis.alertes > 0 ? "from-red-500 to-red-600" : "from-gray-400 to-gray-500" },
        ].map(({ label, sub, value, icon: Icon, colors }) => (
          <Card key={label} className={`p-4 bg-gradient-to-br ${colors} text-white`}>
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-7 h-7 text-white/80" />
              {loading ? <Skeleton className="h-8 w-10 bg-white/20" /> : (
                <span className="text-2xl font-bold">{value}</span>
              )}
            </div>
            <p className="text-white/90 text-sm font-medium">{label}</p>
            <p className="text-white/60 text-xs">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Caisse du jour (inline) */}
      {!opLoading && opData && (
        <Card className="p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">Caisse du jour</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold text-emerald-700">{formatCurrency(opData.caisse_jour.total_general)}</span>
            <span className="text-sm text-gray-500">— {opData.caisse_jour.nb_transactions} transaction{opData.caisse_jour.nb_transactions !== 1 ? "s" : ""}</span>
          </div>
          {opData.caisse_jour.totaux && opData.caisse_jour.totaux.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {opData.caisse_jour.totaux.map((t) => (
                <span key={t.mode_paiement} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {t.mode_paiement}: {formatCurrency(t.total)}
                </span>
              ))}
            </div>
          )}
          <Link to="/app/admin/caisse" className="ml-auto text-xs text-amber-600 hover:underline flex items-center gap-1">
            Gérer la caisse <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      )}

      {/* Planning du jour */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <Clock className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">
            Planning du jour
            <span className="ml-2 text-gray-400 font-normal">
              {todayReservations.length} réservation{todayReservations.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <div className="ml-auto relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 w-44"
            />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : todayReservations.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune réservation aujourd'hui</p>
            </div>
          ) : (
            <>
              {categorized.activeNow.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    En cours ({categorized.activeNow.length})
                  </p>
                  <div className="space-y-2">
                    {categorized.activeNow.map((r) => <ReservationRow key={r.id} r={r} />)}
                  </div>
                </div>
              )}
              {categorized.arrivingSoon.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Arrive bientôt ({categorized.arrivingSoon.length})</p>
                  <div className="space-y-2">
                    {categorized.arrivingSoon.map((r) => <ReservationRow key={r.id} r={r} />)}
                  </div>
                </div>
              )}
              {categorized.upcoming.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">À venir ({categorized.upcoming.length})</p>
                  <div className="space-y-2">
                    {categorized.upcoming.slice(0, 5).map((r) => <ReservationRow key={r.id} r={r} />)}
                    {categorized.upcoming.length > 5 && (
                      <Link to="/app/admin/reservations" className="block text-center text-xs text-gray-500 hover:text-gray-700 py-1">
                        + {categorized.upcoming.length - 5} autres
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {categorized.completed.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Terminées ({categorized.completed.length})</p>
                  <div className="space-y-2">
                    {categorized.completed.slice(0, 3).map((r) => <ReservationRow key={r.id} r={r} />)}
                  </div>
                </div>
              )}
              {categorized.cancelled.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Annulées / No-show ({categorized.cancelled.length})</p>
                  <div className="space-y-2">
                    {categorized.cancelled.slice(0, 2).map((r) => <ReservationRow key={r.id} r={r} />)}
                  </div>
                </div>
              )}
              {searchQuery && categorized.activeNow.length === 0 && categorized.arrivingSoon.length === 0 && categorized.upcoming.length === 0 && categorized.completed.length === 0 && (
                <p className="text-sm text-center text-gray-400 py-6">Aucun résultat pour « {searchQuery} »</p>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Disponibilité espaces */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Disponibilité espaces</h2>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            {[
              { color: "bg-emerald-400", label: "Libre" },
              { color: "bg-orange-400", label: "Réservé + tard" },
              { color: "bg-red-400", label: "Occupé" },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />{label}
              </span>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : espaces.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun espace configuré</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {espacesStatus.map(({ espace, color, who, capacite }) => {
              const cm = {
                green:  { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400", text: "text-emerald-700", label: "Disponible" },
                orange: { bg: "bg-orange-50",  border: "border-orange-200",  dot: "bg-orange-400",  text: "text-orange-700",  label: "Réservé + tard" },
                red:    { bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-400",     text: "text-red-700",     label: "Occupé" },
              }[color];
              const isMulti = capacite !== undefined;
              return (
                <div key={espace.id} className={`rounded-lg border p-3 ${cm.bg} ${cm.border}`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${cm.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{espace.nom}</p>
                      <p className={`text-xs font-medium ${cm.text}`}>
                        {cm.label}{isMulti && who.length > 0 ? ` · ${who.length}/${capacite}` : ""}
                      </p>
                      {who.length > 0 && (
                        isMulti ? (
                          <div className="mt-1 space-y-0.5">
                            {who.map((name, i) => (
                              <p key={i} className="text-xs text-gray-500 truncate">{name}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{who[0]}</p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Abonnements en attente */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Abonnements à valider</h3>
            <span className="ml-auto">
              <Badge variant={opData && opData.abonnements_en_attente.length > 0 ? "warning" : "neutral"}>
                {opData?.abonnements_en_attente.length ?? "…"}
              </Badge>
            </span>
          </div>
          {opLoading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full rounded" /><Skeleton className="h-10 w-full rounded" /></div>
          ) : !opData || opData.abonnements_en_attente.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
              <CheckCircle className="w-4 h-4" /><span>Tout est traité</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {opData.abonnements_en_attente.map((a) => (
                  <div key={a.id} className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                    <p className="font-medium text-gray-900">{a.user_prenom} {a.user_nom}</p>
                    <p className="text-gray-500">{a.abonnement_nom || "Abonnement"}</p>
                  </div>
                ))}
              </div>
              <Link to="/app/admin/abonnements" className="mt-2 block text-xs text-amber-600 hover:underline">
                Gérer les souscriptions →
              </Link>
            </>
          )}
        </Card>

        {/* Domiciliations expirantes */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-gray-900">Domiciliations expirantes</h3>
            <span className="ml-auto">
              <Badge variant={opData && opData.domiciliations_expirantes.length > 0 ? "danger" : "neutral"}>
                {opData?.domiciliations_expirantes.length ?? "…"}
              </Badge>
            </span>
          </div>
          {opLoading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full rounded" /><Skeleton className="h-10 w-full rounded" /></div>
          ) : !opData || opData.domiciliations_expirantes.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
              <CheckCircle className="w-4 h-4" /><span>Aucune dans les 30 jours</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {opData.domiciliations_expirantes.map((d) => (
                  <div key={d.id} className="p-2 rounded-lg bg-red-50 border border-red-100 text-xs">
                    <p className="font-medium text-gray-900 truncate">{d.raison_sociale || "—"}</p>
                    <p className="text-gray-500">Expire le {formatDate(d.date_fin)}</p>
                  </div>
                ))}
              </div>
              <Link to="/app/admin/domiciliations" className="mt-2 block text-xs text-red-600 hover:underline">
                Gérer les domiciliations →
              </Link>
            </>
          )}
        </Card>

        {/* Courriers non traités */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900">Courriers non traités</h3>
            <span className="ml-auto">
              <Badge variant={opData && opData.courriers_non_traites.length > 0 ? "info" : "neutral"}>
                {opData?.courriers_non_traites.length ?? "…"}
              </Badge>
            </span>
          </div>
          {opLoading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full rounded" /><Skeleton className="h-10 w-full rounded" /></div>
          ) : !opData || opData.courriers_non_traites.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
              <CheckCircle className="w-4 h-4" /><span>Aucun courrier en attente</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {opData.courriers_non_traites.map((c) => (
                  <div key={c.id} className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs">
                    <p className="font-medium text-gray-900 truncate">{c.raison_sociale || c.expediteur || "—"}</p>
                    <p className="text-gray-500">{c.type} — {formatDate(c.date_reception)}</p>
                  </div>
                ))}
              </div>
              <Link to="/app/admin/courrier" className="mt-2 block text-xs text-blue-600 hover:underline">
                Gérer le courrier →
              </Link>
            </>
          )}
        </Card>
      </div>

      {/* Lien vers Rapports */}
      <Card className="p-4 flex items-center gap-4 bg-gray-50 border-dashed">
        <TrendingUp className="w-5 h-5 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">Analyses & KPIs mensuels</p>
          <p className="text-xs text-gray-500">Revenus, taux d'occupation, top clients et tendances dans les Rapports</p>
        </div>
        <Link to="/app/admin/reports">
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            Voir les rapports <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </Card>
    </div>
  );
};

// ─── User Dashboard ───────────────────────────────────────────────────────────

const UserDashboard = () => {
  const { user } = useAuthStore();
  const { reservations, espaces, initializeData, getUserDemandeDomiciliation, loadDemandesDomiciliation, abonnementsUtilisateurs } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      await Promise.all([initializeData(), loadDemandesDomiciliation()]);
      if (mounted) {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const userReservations = reservations.filter((r) => r.personId === user.id || r.userId === user.id);
  const upcomingReservations = userReservations.filter(
    (r) => new Date(r.dateDebut) > new Date() && r.statut !== "annulee",
  ).sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  const completedReservations = userReservations.filter(
    (r) => new Date(r.dateFin) < new Date() && r.statut === "confirmee",
  );
  const nextReservation = upcomingReservations[0] || null;
  const demande = getUserDemandeDomiciliation(user.id);

  const getHour = (date: string | Date) => format(new Date(date), "HH:mm");
  const getDay = (date: string | Date) => format(new Date(date), "EEEE d MMMM", { locale: fr });

  const domiciliationStatusColor = demande
    ? demande.statut === "active" ? "bg-emerald-500"
    : demande.statut === "refusee" || demande.statut === "resiliee" ? "bg-red-500"
    : "bg-amber-500"
    : null;

  const activeSubscription = abonnementsUtilisateurs.find(
    (s) => (s.personId === user.id || s.userId === user.id) && s.statut === "actif"
  );

  const subscriptionAlert = (() => {
    if (!activeSubscription?.dateFin) return null;
    const fin = new Date(activeSubscription.dateFin);
    const daysLeft = Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { type: "expired", daysLeft, fin };
    if (daysLeft <= 7) return { type: "warning", daysLeft, fin };
    return null;
  })();

  const domiciliationStatusLabel = demande
    ? demande.statut === "active" ? "Active"
    : demande.statut === "dossier_preparatoire" ? "En cours d'examen"
    : demande.statut === "en_attente_signature" ? "En attente de signature"
    : demande.statut === "en_attente_complements" ? "Compléments requis"
    : demande.statut === "domiciliation_creee" ? "Domiciliation créée"
    : demande.statut === "refusee" ? "Refusée"
    : demande.statut === "expiree" ? "Expirée"
    : demande.statut === "resiliee" ? "Résiliée"
    : demande.statut
    : null;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center md:text-left"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Bonjour {user.prenom} !
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Voici un aperçu de votre activité chez Coffice
        </p>
      </motion.div>

      {subscriptionAlert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
        >
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${subscriptionAlert.type === "expired" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${subscriptionAlert.type === "expired" ? "text-red-600" : "text-amber-600"}`} />
            <p className={`text-sm flex-1 ${subscriptionAlert.type === "expired" ? "text-red-700" : "text-amber-700"}`}>
              {subscriptionAlert.type === "expired"
                ? "Votre abonnement a expiré."
                : `Votre abonnement expire dans ${subscriptionAlert.daysLeft} jour${subscriptionAlert.daysLeft > 1 ? "s" : ""}.`
              }
            </p>
            <Link to="/app/abonnements">
              <Button size="sm" variant="outline" className={subscriptionAlert.type === "expired" ? "border-red-300 text-red-700 hover:bg-red-100" : "border-amber-300 text-amber-700 hover:bg-amber-100"}>
                Renouveler
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {nextReservation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
        >
          <Card className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10">
              <Calendar className="w-32 h-32 -translate-y-4 translate-x-8" />
            </div>
            <div className="flex items-start justify-between gap-4 relative">
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">Prochaine réservation</p>
                <h3 className="text-xl font-bold text-white">{nextReservation.espace?.nom || "Espace"}</h3>
                <p className="text-white/90 text-sm mt-1 capitalize">{getDay(nextReservation.dateDebut)}</p>
                <p className="text-white/80 text-sm">{getHour(nextReservation.dateDebut)} — {getHour(nextReservation.dateFin)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
                  {nextReservation.statut === "confirmee" ? "Confirmée" : "En attente"}
                </span>
                {nextReservation.montantTotal > 0 && (
                  <p className="text-white/70 text-xs mt-2">{nextReservation.montantTotal.toLocaleString()} DA</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <OnboardingChecklist />
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-white/80 text-xs sm:text-sm mb-1">Total Réservations</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {userReservations.length}
          </p>
          <p className="text-white/60 text-xs mt-1 sm:mt-2">
            Toutes périodes confondues
          </p>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-white/80 text-xs sm:text-sm mb-1">À Venir</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {upcomingReservations.length}
          </p>
          <p className="text-white/60 text-xs mt-1 sm:mt-2">Réservations planifiées</p>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <CheckCircle className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-white/80 text-xs sm:text-sm mb-1">Statut Compte</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">Actif</p>
          <p className="text-white/60 text-xs mt-1 sm:mt-2">
            Membre depuis{" "}
            {new Date(user.createdAt || Date.now()).toLocaleDateString(
              "fr-FR",
              { month: "short", year: "numeric" },
            )}
          </p>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-white/80 text-xs sm:text-sm mb-1">Sessions Complétées</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {completedReservations.length}
          </p>
          <p className="text-white/60 text-xs mt-1 sm:mt-2">Réservations terminées</p>
        </Card>
      </div>

      {demande && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Link to="/app/mon-espace">
            <Card hover className="p-5 border-2 border-transparent hover:border-teal-400 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${domiciliationStatusColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Domiciliation</p>
                  <p className="font-semibold text-gray-900 text-sm">{demande.raisonSociale || "Mon entreprise"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{domiciliationStatusLabel}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link to="/app/reservations">
          <Card hover className="p-4 sm:p-6 border-2 border-transparent hover:border-amber-500 group transition-all">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg">Nouvelle Réservation</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">Réserver un espace</p>
            <div className="flex items-center text-amber-600 text-xs sm:text-sm font-semibold">
              Commencer <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link to="/app/mon-espace">
          <Card hover className="p-4 sm:p-6 border-2 border-transparent hover:border-teal-500 group transition-all">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Building className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg">Mon Espace Pro</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">Domiciliation & Entreprise</p>
            <div className="flex items-center text-teal-600 text-xs sm:text-sm font-semibold">
              Accéder <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link to="/app/profil">
          <Card hover className="p-4 sm:p-6 border-2 border-transparent hover:border-emerald-500 group transition-all">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg">Mon Profil</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">Gérer mes informations</p>
            <div className="flex items-center text-emerald-600 text-xs sm:text-sm font-semibold">
              Modifier <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        </Link>
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Mes Réservations Récentes</h3>
        {upcomingReservations.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {upcomingReservations.slice(0, 3).map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 hidden sm:block" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {reservation.espace?.nom || "Espace"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatDate(reservation.dateDebut)} à {formatTime(reservation.dateDebut)}
                    </p>
                  </div>
                </div>
                <Badge variant={reservation.statut === "confirmee" ? "success" : "warning"}>
                  {reservation.statut === "confirmee" ? "Confirmée" : "En attente"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucune réservation à venir</p>
            <Link to="/app/reservations">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer une réservation
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Root entry ───────────────────────────────────────────────────────────────

const DashboardHome = () => {
  const { user } = useAuthStore();
  const { initializeData, loadUsers, loadDemandesDomiciliation } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await initializeData();
        if (user?.role === "admin") {
          await Promise.all([loadUsers(), loadDemandesDomiciliation()]);
        }
      } catch (error) {
        logger.error("Erreur chargement:", error instanceof Error ? error : new Error(String(error)));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur d'authentification</h2>
        <p className="text-gray-600">Veuillez vous reconnecter</p>
      </div>
    );
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

export default DashboardHome;
