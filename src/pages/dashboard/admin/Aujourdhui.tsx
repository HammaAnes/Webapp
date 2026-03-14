import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Banknote,
  UserCheck,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MapPin,
  Timer,
  ArrowRight,
  Eye,
  Phone,
  LogIn,
  LogOut,
  XCircle,
  Search,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { format, isToday, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useAppStore } from '../../../store/store';
import { apiClient } from '../../../lib/api-client';
import toast from 'react-hot-toast';
import type { Reservation } from '../../../types';

const AUTO_REFRESH_INTERVAL = 120000;

export default function Aujourdhui() {
  const { reservations, initializeData, loadUsers, updateReservation } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([initializeData(), loadUsers()]);
      } finally {
        setLoading(false);
        setLastRefresh(new Date());
      }
    };
    loadData();

    const clockInterval = setInterval(() => setNow(new Date()), 60000);

    autoRefreshRef.current = setInterval(async () => {
      try {
        await Promise.all([initializeData(), loadUsers()]);
        setLastRefresh(new Date());
      } catch {}
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(clockInterval);
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([initializeData(), loadUsers()]);
      setLastRefresh(new Date());
      toast.success('Données actualisées');
    } finally {
      setLoading(false);
    }
  };

  const todayReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = new Date(r.dateDebut);
      return isToday(date);
    });
  }, [reservations]);

  const pendingReservations = useMemo(() => {
    return reservations.filter(r => r.statut === 'en_attente');
  }, [reservations]);

  const categorizedReservations = useMemo(() => {
    const activeNow: Reservation[] = [];
    const arrivingSoon: Reservation[] = [];
    const leavingSoon: Reservation[] = [];
    const upcoming: Reservation[] = [];
    const completed: Reservation[] = [];
    const cancelled: Reservation[] = [];

    let filtered = todayReservations;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = todayReservations.filter(res =>
        res.utilisateur?.nom?.toLowerCase().includes(q) ||
        res.utilisateur?.prenom?.toLowerCase().includes(q) ||
        res.espace?.nom?.toLowerCase().includes(q) ||
        res.utilisateur?.telephone?.includes(q)
      );
    }

    filtered.forEach((res) => {
      const start = new Date(res.dateDebut);
      const end = new Date(res.dateFin);
      const minutesUntilStart = differenceInMinutes(start, now);
      const minutesUntilEnd = differenceInMinutes(end, now);

      if (res.statut === 'annulee') {
        cancelled.push(res);
      } else if (res.statut === 'en_cours' || (res.statut === 'confirmee' && start <= now && end >= now)) {
        activeNow.push(res);
        if (minutesUntilEnd <= 30 && minutesUntilEnd > 0) {
          leavingSoon.push(res);
        }
      } else if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
        arrivingSoon.push(res);
      } else if (isAfter(start, now)) {
        upcoming.push(res);
      } else if (isBefore(end, now)) {
        completed.push(res);
      }
    });

    return {
      activeNow: activeNow.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()),
      arrivingSoon: arrivingSoon.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()),
      leavingSoon: leavingSoon.sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime()),
      upcoming: upcoming.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()),
      completed: completed.sort((a, b) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime()),
      cancelled,
    };
  }, [todayReservations, now, searchQuery]);

  const stats = useMemo(() => {
    const confirmedToday = todayReservations.filter(r => r.statut === 'confirmee' || r.statut === 'terminee' || r.statut === 'en_cours');
    const pendingToday = todayReservations.filter(r => r.statut === 'en_attente');
    const revenueToday = confirmedToday.reduce((sum, r) => sum + (r.montantTotal || 0), 0);

    return {
      total: todayReservations.length,
      confirmed: confirmedToday.length,
      pending: pendingToday.length,
      cancelled: todayReservations.filter(r => r.statut === 'annulee').length,
      activeNow: categorizedReservations.activeNow.length,
      revenue: revenueToday,
    };
  }, [todayReservations, categorizedReservations]);

  const handleCheckin = async (reservation: Reservation) => {
    setActionLoading(`checkin-${reservation.id}`);
    try {
      const response = await apiClient.createCheckin({
        reservation_id: reservation.id,
        heure_arrivee_reelle: new Date().toISOString(),
      });
      if (response.success) {
        const retard = (response.data as Record<string, unknown>)?.retard_minutes;
        const msg = retard && (retard as number) > 0
          ? `Check-in effectué (retard: ${retard} min)`
          : 'Check-in effectué';
        toast.success(msg);
        await initializeData();
        setLastRefresh(new Date());
      } else {
        toast.error(response.error || 'Erreur lors du check-in');
      }
    } catch {
      toast.error('Erreur lors du check-in');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = async (reservation: Reservation) => {
    if (!reservation.checkinId) {
      toast.error('Aucun check-in trouvé pour cette réservation');
      return;
    }
    setActionLoading(`checkout-${reservation.id}`);
    try {
      const response = await apiClient.checkout(reservation.checkinId);
      if (response.success) {
        toast.success('Check-out effectué');
        await initializeData();
        setLastRefresh(new Date());
      } else {
        toast.error(response.error || 'Erreur lors du check-out');
      }
    } catch {
      toast.error('Erreur lors du check-out');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (reservation: Reservation) => {
    setActionLoading(`noshow-${reservation.id}`);
    try {
      const response = await apiClient.updateReservation(reservation.id, { statut: 'no_show' });
      if (response.success) {
        toast.success('Réservation marquée comme no-show');
        await initializeData();
        setLastRefresh(new Date());
      } else {
        toast.error(response.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors du marquage no-show');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReservation = async (id: string) => {
    setActionLoading(`confirm-${id}`);
    try {
      const result = await updateReservation(id, { statut: 'confirmee' });
      if (result?.success === false) {
        toast.error(result.error || 'Erreur');
      } else {
        toast.success('Réservation confirmée');
        setLastRefresh(new Date());
      }
    } catch {
      toast.error('Erreur lors de la confirmation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuseReservation = async (id: string) => {
    setActionLoading(`refuse-${id}`);
    try {
      const result = await updateReservation(id, { statut: 'annulee' });
      if (result?.success === false) {
        toast.error(result.error || 'Erreur');
      } else {
        toast.success('Réservation refusée');
        setLastRefresh(new Date());
      }
    } catch {
      toast.error('Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const ReservationCard = ({ reservation, showBadge = true }: { reservation: Reservation; showBadge?: boolean }) => {
    const start = new Date(reservation.dateDebut);
    const end = new Date(reservation.dateFin);
    const minutesUntilStart = differenceInMinutes(start, now);
    const minutesUntilEnd = differenceInMinutes(end, now);
    const isPast = isBefore(end, now);
    const canCheckin = reservation.statut === 'confirmee' && !reservation.checkinId;
    const canCheckout = reservation.statut === 'en_cours' && !!reservation.checkinId;
    const canNoShow = reservation.statut === 'confirmee' && isPast;

    const getBadge = () => {
      if (reservation.statut === 'annulee') return <Badge variant="danger">Annulée</Badge>;
      if (reservation.statut === 'no_show') return <Badge variant="danger">No-show</Badge>;
      if (reservation.statut === 'en_cours') {
        if (minutesUntilEnd <= 30 && minutesUntilEnd > 0) {
          return <Badge className="bg-amber-100 text-amber-700">Fin dans {minutesUntilEnd}min</Badge>;
        }
        return <Badge variant="success">En cours</Badge>;
      }
      if (reservation.statut === 'terminee') return <Badge variant="default">Terminée</Badge>;
      if (minutesUntilStart > 0 && minutesUntilStart <= 60) return <Badge variant="warning">Dans {minutesUntilStart}min</Badge>;
      if (reservation.statut === 'en_attente') return <Badge variant="warning">En attente</Badge>;
      if (isPast) return <Badge variant="default">Terminée</Badge>;
      return <Badge variant="info">À venir</Badge>;
    };

    return (
      <Card className={`p-4 hover:shadow-md transition-all ${reservation.statut === 'en_cours' ? 'border-l-4 border-emerald-500' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">
                {reservation.utilisateur?.prenom} {reservation.utilisateur?.nom}
              </h4>
              {showBadge && getBadge()}
            </div>

            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{reservation.espace?.nom || 'Espace'}</span>
                <span className="text-xs text-gray-400">({reservation.espace?.type})</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{reservation.participants ?? 0} personne{(reservation.participants ?? 0) > 1 ? 's' : ''}</span>
              </div>
              {reservation.utilisateur?.telephone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${reservation.utilisateur.telephone}`} className="text-emerald-600 hover:underline font-medium">
                    {reservation.utilisateur.telephone}
                  </a>
                </div>
              )}
            </div>

            {reservation.montantTotal > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-sm font-bold text-emerald-600">
                  {reservation.montantTotal.toLocaleString('fr-DZ')} DA
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {canCheckin && (
                <Button
                  size="sm"
                  variant="success"
                  loading={actionLoading === `checkin-${reservation.id}`}
                  onClick={(e) => { e.stopPropagation(); handleCheckin(reservation); }}
                >
                  <LogIn className="w-3.5 h-3.5" /> Check-in
                </Button>
              )}
              {canCheckout && (
                <Button
                  size="sm"
                  variant="primary"
                  loading={actionLoading === `checkout-${reservation.id}`}
                  onClick={(e) => { e.stopPropagation(); handleCheckout(reservation); }}
                >
                  <LogOut className="w-3.5 h-3.5" /> Check-out
                </Button>
              )}
              {canNoShow && (
                <Button
                  size="sm"
                  variant="danger"
                  loading={actionLoading === `noshow-${reservation.id}`}
                  onClick={(e) => { e.stopPropagation(); handleNoShow(reservation); }}
                >
                  <XCircle className="w-3.5 h-3.5" /> No-show
                </Button>
              )}
            </div>
          </div>

          <Link to="/app/admin/reservations">
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-accent mx-auto mb-3" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aujourd'hui</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-gray-600 text-sm">
              {format(now, 'EEEE d MMMM yyyy', { locale: fr })} — {format(now, 'HH:mm')}
            </p>
            <span className="text-xs text-gray-400 hidden sm:inline">
              Actualisé à {format(lastRefresh, 'HH:mm')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent w-48"
            />
          </div>
          <Button onClick={refreshData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1.5">Actualiser</span>
          </Button>
          <Link to="/app/admin/reservations">
            <Button size="sm" variant="primary">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5">Réservations</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-white/80" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-white/80 text-sm">Réservations</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-8 h-8 text-white/80" />
            <span className="text-2xl font-bold">{stats.activeNow}</span>
          </div>
          <p className="text-white/80 text-sm">Présents maintenant</p>
        </Card>

        <Card className={`p-4 text-white ${stats.pending > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-white/80" />
            <span className="text-2xl font-bold">{stats.pending}</span>
          </div>
          <p className="text-white/80 text-sm">En attente</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Banknote className="w-8 h-8 text-white/80" />
            <span className="text-xl font-bold">{stats.revenue.toLocaleString('fr-DZ')}</span>
          </div>
          <p className="text-white/80 text-sm">DA Revenus</p>
        </Card>
      </div>

      {pendingReservations.length > 0 && (
        <Card className="overflow-hidden border-amber-200">
          <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <h2 className="font-semibold text-amber-800 text-sm">
                {pendingReservations.length} réservation{pendingReservations.length > 1 ? 's' : ''} en attente de validation
              </h2>
            </div>
            <Link to="/app/admin/reservations" className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1">
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingReservations.slice(0, 5).map(res => {
              const start = new Date(res.dateDebut);
              const end = new Date(res.dateFin);
              return (
                <div key={res.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-700 text-sm font-semibold">
                      {res.utilisateur?.prenom?.charAt(0)}{res.utilisateur?.nom?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {res.utilisateur?.prenom} {res.utilisateur?.nom}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {res.espace?.nom} · {format(start, 'd MMM', { locale: fr })} {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
                    </p>
                  </div>
                  {res.montantTotal > 0 && (
                    <span className="text-sm font-semibold text-gray-700 hidden sm:block flex-shrink-0">
                      {res.montantTotal.toLocaleString('fr-DZ')} DA
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleConfirmReservation(res.id)}
                      disabled={actionLoading === `confirm-${res.id}` || actionLoading === `refuse-${res.id}`}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      title="Confirmer"
                    >
                      {actionLoading === `confirm-${res.id}` ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRefuseReservation(res.id)}
                      disabled={actionLoading === `confirm-${res.id}` || actionLoading === `refuse-${res.id}`}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                      title="Refuser"
                    >
                      {actionLoading === `refuse-${res.id}` ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {pendingReservations.length > 5 && (
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
              <Link to="/app/admin/reservations" className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                +{pendingReservations.length - 5} autres en attente <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </Card>
      )}

      {categorizedReservations.activeNow.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Présents maintenant</h2>
            <Badge variant="success">{categorizedReservations.activeNow.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedReservations.activeNow.map((res) => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
        </div>
      )}

      {categorizedReservations.arrivingSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">Arrivent bientôt</h2>
            <Badge variant="warning">{categorizedReservations.arrivingSoon.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedReservations.arrivingSoon.map((res) => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
        </div>
      )}

      {categorizedReservations.leavingSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Timer className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Partent bientôt</h2>
            <Badge className="bg-orange-100 text-orange-700">{categorizedReservations.leavingSoon.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedReservations.leavingSoon.map((res) => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
        </div>
      )}

      {categorizedReservations.upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">À venir</h2>
            <Badge variant="info">{categorizedReservations.upcoming.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedReservations.upcoming.slice(0, 6).map((res) => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
          {categorizedReservations.upcoming.length > 6 && (
            <div className="text-center mt-4">
              <Link to="/app/admin/reservations">
                <Button variant="outline">
                  Voir toutes les réservations ({categorizedReservations.upcoming.length})
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {categorizedReservations.completed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Terminées</h2>
            <Badge variant="default">{categorizedReservations.completed.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedReservations.completed.slice(0, 4).map((res) => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
        </div>
      )}

      {todayReservations.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune réservation aujourd'hui</h3>
          <p className="text-gray-500 mb-6">Il n'y a pas de réservations prévues pour aujourd'hui.</p>
          <Link to="/app/admin/reservations">
            <Button variant="outline">
              Voir toutes les réservations
            </Button>
          </Link>
        </Card>
      )}

      {searchQuery && todayReservations.length > 0 &&
        categorizedReservations.activeNow.length === 0 &&
        categorizedReservations.arrivingSoon.length === 0 &&
        categorizedReservations.leavingSoon.length === 0 &&
        categorizedReservations.upcoming.length === 0 &&
        categorizedReservations.completed.length === 0 &&
        categorizedReservations.cancelled.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun résultat pour "{searchQuery}"</p>
          <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-accent hover:underline">
            Effacer la recherche
          </button>
        </Card>
      )}
    </div>
  );
}
