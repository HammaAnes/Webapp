import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { format, isToday, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useAppStore } from '../../../store/store';
import { apiClient } from '../../../lib/api-client';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Reservation } from '../../../types';

export default function Aujourdhui() {
  const { reservations, initializeData, loadUsers } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([initializeData(), loadUsers()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([initializeData(), loadUsers()]);
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

  const categorizedReservations = useMemo(() => {
    const activeNow: Reservation[] = [];
    const arrivingSoon: Reservation[] = [];
    const leavingSoon: Reservation[] = [];
    const upcoming: Reservation[] = [];
    const completed: Reservation[] = [];
    const cancelled: Reservation[] = [];

    todayReservations.forEach((res) => {
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
  }, [todayReservations, now]);

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
          ? `Check-in effectue (retard: ${retard} min)`
          : "Check-in effectue";
        toast.success(msg);
        await refreshData();
      } else {
        toast.error((response as Record<string, string>).error || "Erreur lors du check-in");
      }
    } catch {
      toast.error("Erreur lors du check-in");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = async (reservation: Reservation) => {
    if (!reservation.checkinId) {
      toast.error("Aucun check-in trouve pour cette reservation");
      return;
    }
    setActionLoading(`checkout-${reservation.id}`);
    try {
      const response = await apiClient.checkout(reservation.checkinId);
      if (response.success) {
        toast.success("Check-out effectue");
        await refreshData();
      } else {
        toast.error((response as Record<string, string>).error || "Erreur lors du check-out");
      }
    } catch {
      toast.error("Erreur lors du check-out");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (reservation: Reservation) => {
    setActionLoading(`noshow-${reservation.id}`);
    try {
      const response = await apiClient.updateReservation(reservation.id, { statut: 'no_show' });
      if (response.success) {
        toast.success("Reservation marquee comme no-show");
        await refreshData();
      } else {
        toast.error((response as Record<string, string>).error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors du marquage no-show");
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
      if (reservation.statut === 'annulee') return <Badge variant="danger">Annulee</Badge>;
      if (reservation.statut === 'no_show') return <Badge variant="danger">No-show</Badge>;
      if (reservation.statut === 'en_cours') {
        if (minutesUntilEnd <= 30 && minutesUntilEnd > 0) {
          return <Badge className="bg-amber-100 text-amber-700">Fin dans {minutesUntilEnd}min</Badge>;
        }
        return <Badge variant="success">En cours</Badge>;
      }
      if (reservation.statut === 'terminee') return <Badge variant="default">Terminee</Badge>;
      if (minutesUntilStart > 0 && minutesUntilStart <= 60) return <Badge variant="warning">Dans {minutesUntilStart}min</Badge>;
      if (reservation.statut === 'en_attente') return <Badge variant="warning">En attente</Badge>;
      if (isPast) return <Badge variant="default">Terminee</Badge>;
      return <Badge variant="info">A venir</Badge>;
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
          <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
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
          <p className="text-gray-600">
            {format(now, 'EEEE d MMMM yyyy', { locale: fr })} - {format(now, 'HH:mm')}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-white/80" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-white/80 text-sm">Reservations</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-8 h-8 text-white/80" />
            <span className="text-2xl font-bold">{stats.activeNow}</span>
          </div>
          <p className="text-white/80 text-sm">Presents maintenant</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
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

      {categorizedReservations.activeNow.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Presents maintenant</h2>
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
            <h2 className="text-lg font-bold text-gray-900">Arrivent bientot</h2>
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
            <h2 className="text-lg font-bold text-gray-900">Partent bientot</h2>
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
            <h2 className="text-lg font-bold text-gray-900">A venir</h2>
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
                  Voir toutes les reservations ({categorizedReservations.upcoming.length})
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
            <h2 className="text-lg font-bold text-gray-900">Terminees</h2>
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune reservation aujourd'hui</h3>
          <p className="text-gray-500 mb-6">Il n'y a pas de reservations prevues pour aujourd'hui.</p>
          <Link to="/app/admin/reservations">
            <Button variant="outline">
              Voir toutes les reservations
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
