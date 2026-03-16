import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import OnboardingChecklist from "./OnboardingChecklist";
import {
  Calendar,
  Users,
  Building,
  Banknote,
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  FileText,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Mail,
  CalendarDays,
  Lock,
  UserPlus,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import { apiClient } from "../../lib/api-client";
import { formatDate, formatCurrency, formatTime } from "../../utils/formatters";
import { format, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "../../utils/logger";

interface AdminStats {
  users: { total: number; active: number; growth: number };
  reservations: { today: number; month: number; growth: number; pending: number };
  revenue: { month: number; growth: number };
  subscriptions: { active: number };
  domiciliations: { pending: number; active: number };
  occupancy: { rate: number; occupied: number; total: number; growth: number };
}

import type { Reservation } from "../../types";

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { reservations, espaces, demandesDomiciliation, initializeData, loadUsers, loadDemandesDomiciliation } = useAppStore();

  const loadStats = async () => {
    try {
      const response = await apiClient.getAdminStats();
      if (response.success && response.data) {
        setStats(response.data as AdminStats);
      }
    } catch (error) {
      logger.error("Erreur chargement stats admin:", error instanceof Error ? error : new Error(String(error)));
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadStats(),
        initializeData(),
        loadUsers(),
        loadDemandesDomiciliation(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    apiClient.getAdminStats().then((response) => {
      if (!mounted) return;
      if (response.success && response.data) {
        setStats(response.data as AdminStats);
      }
    }).catch((error) => {
      logger.error("Erreur chargement stats admin:", error instanceof Error ? error : new Error(String(error)));
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const todayReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = new Date(r.dateDebut);
      return isToday(date) && r.statut !== "annulee";
    }).sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }, [reservations]);

  const tomorrowReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = new Date(r.dateDebut);
      return isTomorrow(date) && r.statut !== "annulee";
    }).sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }, [reservations]);

  const pendingReservations = useMemo(() => {
    return reservations.filter((r) => r.statut === "en_attente").length;
  }, [reservations]);

  const pendingDomiciliations = useMemo(() => {
    return demandesDomiciliation.filter((d) =>
      d.statut === "dossier_preparatoire" ||
      d.statut === "en_attente_signature" ||
      d.statut === "en_attente_complements"
    ).length;
  }, [demandesDomiciliation]);

  const activeNow = useMemo(() => {
    const now = new Date();
    return reservations.filter((r) => {
      const start = new Date(r.dateDebut);
      const end = new Date(r.dateFin);
      return start <= now && end >= now && r.statut === "confirmee";
    });
  }, [reservations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const getReservationBadge = (reservation: Reservation) => {
    const now = new Date();
    const start = new Date(reservation.dateDebut);
    const end = new Date(reservation.dateFin);
    const minutesUntilStart = differenceInMinutes(start, now);

    if (start <= now && end >= now) {
      return <Badge variant="success">En cours</Badge>;
    } else if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
      return <Badge variant="warning">Dans {minutesUntilStart} min</Badge>;
    } else if (reservation.statut === "en_attente") {
      return <Badge variant="warning">En attente</Badge>;
    } else if (reservation.statut === "confirmee") {
      return <Badge variant="success">Confirmée</Badge>;
    }
    return <Badge variant="neutral">{reservation.statut}</Badge>;
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <Button
          onClick={refreshData}
          variant="outline"
          disabled={refreshing}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </motion.div>

      {/* Alertes importantes */}
      {(pendingReservations > 0 || pendingDomiciliations > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 border-l-4 border-amber-500 bg-amber-50">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-3">
                  Actions requises
                </h3>
                <div className="flex flex-wrap gap-3">
                  {pendingReservations > 0 && (
                    <Link to="/app/admin/reservations">
                      <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100">
                        <Calendar className="w-4 h-4 mr-2" />
                        {pendingReservations} réservation(s) en attente
                      </Button>
                    </Link>
                  )}
                  {pendingDomiciliations > 0 && (
                    <Link to="/app/admin/domiciliations">
                      <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100">
                        <Mail className="w-4 h-4 mr-2" />
                        {pendingDomiciliations} demande(s) de domiciliation
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              {stats && stats.users.growth !== 0 && (
                <div className={`flex items-center text-xs ${stats.users.growth > 0 ? "text-green-200" : "text-red-200"}`}>
                  {stats.users.growth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(stats.users.growth)}%
                </div>
              )}
            </div>
            <p className="text-white/80 text-sm">Utilisateurs</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats?.users.total || 0}</p>
            <p className="text-white/60 text-xs mt-1">{stats?.users.active || 0} actifs</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              {stats && stats.revenue.growth !== 0 && (
                <div className={`flex items-center text-xs ${stats.revenue.growth > 0 ? "text-green-200" : "text-red-200"}`}>
                  {stats.revenue.growth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(stats.revenue.growth)}%
                </div>
              )}
            </div>
            <p className="text-white/80 text-sm">Revenus du mois</p>
            <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats?.revenue.month || 0)}</p>
            <p className="text-white/60 text-xs mt-1">vs mois précédent</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                +{stats?.reservations.growth || todayReservations.length} aujourd'hui
              </span>
            </div>
            <p className="text-white/80 text-sm">Réservations</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats?.reservations.month || reservations.length}</p>
            <p className="text-white/60 text-xs mt-1">{pendingReservations} en attente</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              {activeNow.length > 0 && (
                <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full animate-pulse">
                  {activeNow.length} en cours
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm">Taux d'occupation</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats?.occupancy.rate || 0}%</p>
            <p className="text-white/60 text-xs mt-1">
              {stats?.occupancy.occupied || 0}/{stats?.occupancy.total || espaces.length} espaces
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Réservations du jour et de demain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aujourd'hui */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-500" />
                Aujourd'hui
                {todayReservations.length > 0 && (
                  <Badge variant="warning">{todayReservations.length}</Badge>
                )}
              </h3>
              <Link to="/app/admin/reservations" className="text-sm text-amber-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {todayReservations.length > 0 ? (
              <div className="space-y-3">
                {todayReservations.slice(0, 5).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {reservation.utilisateur?.prenom} {reservation.utilisateur?.nom}
                        </p>
                        <p className="text-xs text-gray-600">
                          {reservation.espace?.nom} - {format(new Date(reservation.dateDebut), "HH:mm")} - {format(new Date(reservation.dateFin), "HH:mm")}
                        </p>
                      </div>
                    </div>
                    {getReservationBadge(reservation)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune réservation aujourd'hui</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Demain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                Demain
                {tomorrowReservations.length > 0 && (
                  <Badge variant="info">{tomorrowReservations.length}</Badge>
                )}
              </h3>
            </div>

            {tomorrowReservations.length > 0 ? (
              <div className="space-y-3">
                {tomorrowReservations.slice(0, 5).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {reservation.utilisateur?.prenom} {reservation.utilisateur?.nom}
                        </p>
                        <p className="text-xs text-gray-600">
                          {reservation.espace?.nom} - {format(new Date(reservation.dateDebut), "HH:mm")} - {format(new Date(reservation.dateFin), "HH:mm")}
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
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune réservation demain</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Accès rapide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Accès rapide</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link to="/app/admin/aujourdhui">
              <div className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors text-center">
                <CalendarDays className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="font-medium text-amber-900 text-sm">Aujourd'hui</p>
                <p className="text-xs text-amber-600">{todayReservations.length} réservations</p>
              </div>
            </Link>

            <Link to="/app/admin/reservations">
              <div className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-blue-900 text-sm">Réservations</p>
                <p className="text-xs text-blue-600">{pendingReservations} en attente</p>
              </div>
            </Link>

            <Link to="/app/admin/caisse">
              <div className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-center">
                <UserPlus className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-medium text-emerald-900 text-sm">Caisse</p>
                <p className="text-xs text-emerald-600">Transactions</p>
              </div>
            </Link>

            <Link to="/app/admin/users">
              <div className="p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors text-center">
                <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-medium text-teal-900 text-sm">Utilisateurs</p>
                <p className="text-xs text-teal-600">{stats?.users.total || 0}</p>
              </div>
            </Link>

            <Link to="/app/admin/spaces">
              <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-center">
                <Building className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900 text-sm">Espaces</p>
                <p className="text-xs text-gray-600">{espaces.length}</p>
              </div>
            </Link>

            <Link to="/app/admin/domiciliations">
              <div className="p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors text-center">
                <Mail className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-medium text-teal-900 text-sm">Domiciliations</p>
                <p className="text-xs text-teal-600">{pendingDomiciliations} en attente</p>
              </div>
            </Link>

            <Link to="/app/admin/settings">
              <div className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-center">
                <Lock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-medium text-red-900 text-sm">Paramètres</p>
                <p className="text-xs text-red-600">Configuration</p>
              </div>
            </Link>

            <Link to="/app/admin/codes-promo">
              <div className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center">
                <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-medium text-orange-900 text-sm">Codes promo</p>
                <p className="text-xs text-orange-600">Gérer</p>
              </div>
            </Link>

            <Link to="/app/admin/parrainages">
              <div className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
                <Gift className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-blue-900 text-sm">Parrainages</p>
                <p className="text-xs text-blue-600">Suivi</p>
              </div>
            </Link>

            <Link to="/app/admin/reports">
              <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-center">
                <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900 text-sm">Rapports</p>
                <p className="text-xs text-gray-600">Statistiques</p>
              </div>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

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

  const userReservations = reservations.filter((r) => r.userId === user.id);
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
    (s) => s.userId === user.id && s.statut === "actif"
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
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${nextReservation.statut === "confirmee" ? "bg-white/20 text-white" : "bg-white/30 text-white"}`}>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link to="/app/reservations">
          <Card
            hover
            className="p-4 sm:p-6 border-2 border-transparent hover:border-amber-500 group transition-all"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg">
              Nouvelle Réservation
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
              Réserver un espace
            </p>
            <div className="flex items-center text-amber-600 text-xs sm:text-sm font-semibold">
              Commencer <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link to="/app/mon-espace">
          <Card
            hover
            className="p-4 sm:p-6 border-2 border-transparent hover:border-teal-500 group transition-all"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Building className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg">
              Mon Espace Pro
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
              Domiciliation & Entreprise
            </p>
            <div className="flex items-center text-teal-600 text-xs sm:text-sm font-semibold">
              Accéder <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link to="/app/profil">
          <Card
            hover
            className="p-4 sm:p-6 border-2 border-transparent hover:border-emerald-500 group transition-all"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg">
              Mon Profil
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">Gérer mes informations</p>
            <div className="flex items-center text-emerald-600 text-xs sm:text-sm font-semibold">
              Modifier <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        </Link>

      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
          Mes Réservations Récentes
        </h3>

        {upcomingReservations.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {upcomingReservations.slice(0, 3).map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 hidden sm:block" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {reservation.espace?.nom || "Espace"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatDate(reservation.dateDebut)} à{" "}
                      {formatTime(reservation.dateDebut)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    reservation.statut === "confirmee" ? "success" : "warning"
                  }
                >
                  {reservation.statut === "confirmee"
                    ? "Confirmée"
                    : "En attente"}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Erreur d'authentification
        </h2>
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
