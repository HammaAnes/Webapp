import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Clock,
  Banknote,
  Phone,
  Building,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Timer,
  ArrowRight,
  Edit,
  Trash2,
  Download,
  Search,
  RefreshCw,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { format, differenceInMinutes, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { apiClient } from '../../../lib/api-client';
import { buildCsvContent } from '../../../utils/formatters';
import toast from 'react-hot-toast';

interface WalkIn {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  entreprise?: string;
  espace_id: string;
  espace_nom?: string;
  heure_arrivee: string;
  heure_depart?: string;
  duree_estimee: number;
  duree_reelle?: number;
  montant: number;
  mode_paiement?: string;
  statut_paiement: string;
  notes?: string;
}

interface Espace {
  id: string;
  nom: string;
  type: string;
  prix_heure: number;
  disponible: boolean;
}

const PAIEMENT_LABELS: Record<string, { label: string; color: string }> = {
  cash: { label: 'Cash', color: 'bg-emerald-100 text-emerald-700' },
  carte: { label: 'Carte', color: 'bg-blue-100 text-blue-700' },
  virement: { label: 'Virement', color: 'bg-teal-100 text-teal-700' },
  cheque: { label: 'Chèque', color: 'bg-gray-100 text-gray-700' },
};

export default function WalkIns() {
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWalkIn, setSelectedWalkIn] = useState<WalkIn | null>(null);
  const [filter, setFilter] = useState<'actifs' | 'tous' | 'today'>('actifs');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    entreprise: '',
    espace_id: '',
    duree_estimee: 2,
    montant: 0,
    mode_paiement: 'cash',
    statut_paiement: 'en_attente',
    notes: '',
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, [filter]);

  useEffect(() => {
    if (formData.espace_id && formData.duree_estimee) {
      const espace = espaces.find(e => e.id === formData.espace_id);
      if (espace) {
        const montant = espace.prix_heure * formData.duree_estimee;
        setFormData(prev => ({ ...prev, montant }));
      }
    }
  }, [formData.espace_id, formData.duree_estimee, espaces, selectedWalkIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      let walkInsEndpoint = '/admin/walk-ins.php';
      if (filter === 'actifs') walkInsEndpoint += '?filter=active';
      else if (filter === 'today') walkInsEndpoint += '?filter=today';

      const [walkInsRes, espacesRes] = await Promise.all([
        apiClient.get(walkInsEndpoint),
        apiClient.getEspaces()
      ]);

      const walkInsData = walkInsRes.data as Record<string, any>;
      setWalkIns(Array.isArray(walkInsData) ? walkInsData : walkInsData?.walk_ins || []);

      const espacesRaw = espacesRes.data as Record<string, any>;
      const espacesData = Array.isArray(espacesRaw) ? espacesRaw : espacesRaw?.espaces || [];
      const mapped = espacesData.map((e: Record<string, unknown>) => ({
        id: String(e.id || ""),
        nom: String(e.nom || ""),
        type: String(e.type || ""),
        prix_heure: Number(e.prix_heure || e.prixHeure || 0),
        disponible: e.disponible !== false && e.disponible !== 0,
      }));
      setEspaces(mapped);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données');
      setWalkIns([]);
      setEspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.prenom || !formData.espace_id) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      if (selectedWalkIn) {
        await apiClient.updateWalkIn(selectedWalkIn.id, formData);
        toast.success('Walk-in mis à jour');
      } else {
        await apiClient.createWalkIn(formData);
        toast.success('Walk-in enregistré');
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleCheckout = async (walkInId: string) => {
    try {
      await apiClient.put(`/admin/walk-ins.php?id=${walkInId}`, { action: 'checkout' });
      toast.success('Départ enregistré');
      loadData();
    } catch (error: any) {
      toast.error('Erreur lors de l\'enregistrement du départ');
    }
  };

  const handleMarkPaid = async (walkInId: string) => {
    try {
      await apiClient.put(`/admin/walk-ins.php?id=${walkInId}`, { action: 'mark_paid' });
      toast.success('Paiement enregistré');
      loadData();
    } catch (error: any) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleDelete = async (walkInId: string) => {
    if (!confirm('Supprimer ce walk-in ?')) return;

    try {
      await apiClient.delete(`/admin/walk-ins.php?id=${walkInId}`);
      toast.success('Walk-in supprimé');
      loadData();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openModal = (walkIn?: WalkIn) => {
    if (walkIn) {
      setSelectedWalkIn(walkIn);
      setFormData({
        nom: walkIn.nom,
        prenom: walkIn.prenom,
        telephone: walkIn.telephone,
        email: walkIn.email || '',
        entreprise: walkIn.entreprise || '',
        espace_id: walkIn.espace_id,
        duree_estimee: walkIn.duree_estimee,
        montant: walkIn.montant,
        mode_paiement: walkIn.mode_paiement || 'cash',
        statut_paiement: walkIn.statut_paiement,
        notes: walkIn.notes || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedWalkIn(null);
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      entreprise: '',
      espace_id: '',
      duree_estimee: 2,
      montant: 0,
      mode_paiement: 'cash',
      statut_paiement: 'en_attente',
      notes: '',
    });
  };

  const getDureeActuelle = (walkIn: WalkIn) => {
    if (walkIn.heure_depart) {
      return walkIn.duree_reelle || differenceInMinutes(
        new Date(walkIn.heure_depart),
        new Date(walkIn.heure_arrivee)
      );
    }
    return differenceInMinutes(now, new Date(walkIn.heure_arrivee));
  };

  const actifs = useMemo(() => walkIns.filter(w => !w.heure_depart), [walkIns]);
  const termines = useMemo(() => walkIns.filter(w => w.heure_depart), [walkIns]);

  const filteredActifs = useMemo(() =>
    actifs.filter(w =>
      !searchQuery ||
      `${w.prenom} ${w.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.espace_nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.telephone?.includes(searchQuery)
    ), [actifs, searchQuery]);

  const filteredTermines = useMemo(() =>
    termines.filter(w =>
      !searchQuery ||
      `${w.prenom} ${w.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.espace_nom?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [termines, searchQuery]);

  const stats = useMemo(() => {
    const todayWalkIns = walkIns.filter(w => isToday(new Date(w.heure_arrivee)));
    const revenueToday = todayWalkIns.reduce((sum, w) => sum + (w.montant || 0), 0);
    const revenuePaid = todayWalkIns.filter(w => w.statut_paiement === 'paye').reduce((sum, w) => sum + (w.montant || 0), 0);
    const unpaidCount = walkIns.filter(w => w.statut_paiement !== 'paye' && w.statut_paiement !== 'gratuit').length;

    return {
      activeCount: actifs.length,
      todayCount: todayWalkIns.length,
      revenueToday,
      revenuePaid,
      unpaidCount,
      totalAll: walkIns.length,
    };
  }, [walkIns, actifs]);

  const exportToCSV = () => {
    const headers = ['Prénom', 'Nom', 'Téléphone', 'Espace', 'Arrivée', 'Départ', 'Durée (min)', 'Montant (DA)', 'Paiement', 'Statut'];
    const rows = walkIns.map(w => [
      w.prenom,
      w.nom,
      w.telephone || '',
      w.espace_nom || '',
      format(new Date(w.heure_arrivee), 'dd/MM/yyyy HH:mm'),
      w.heure_depart ? format(new Date(w.heure_depart), 'dd/MM/yyyy HH:mm') : 'En cours',
      getDureeActuelle(w).toString(),
      w.montant.toString(),
      w.mode_paiement || '',
      w.statut_paiement,
    ]);
    const csv = buildCsvContent(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walk-ins_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV effectué');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Venues spontanées (Walk-ins)
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des visites sans réservation préalable
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
          <Button onClick={() => openModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle venue
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            {stats.activeCount > 0 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full animate-pulse">
                En cours
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm">Présents</p>
          <p className="text-2xl font-bold">{stats.activeCount}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-white/80 text-sm">Aujourd'hui</p>
          <p className="text-2xl font-bold">{stats.todayCount}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="text-white/80 text-sm">Revenu du jour</p>
          <p className="text-2xl font-bold">{stats.revenueToday.toLocaleString('fr-DZ')} DA</p>
          <p className="text-white/60 text-xs mt-1">{stats.revenuePaid.toLocaleString('fr-DZ')} DA encaissé</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-white/80 text-sm">Impayés</p>
          <p className="text-2xl font-bold">{stats.unpaidCount}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <Button
            variant={filter === 'actifs' ? 'primary' : 'outline'}
            onClick={() => setFilter('actifs')}
            size="sm"
          >
            Actifs ({actifs.length})
          </Button>
          <Button
            variant={filter === 'today' ? 'primary' : 'outline'}
            onClick={() => setFilter('today')}
            size="sm"
          >
            Aujourd'hui
          </Button>
          <Button
            variant={filter === 'tous' ? 'primary' : 'outline'}
            onClick={() => setFilter('tous')}
            size="sm"
          >
            Tous ({walkIns.length})
          </Button>
        </div>
        <div className="flex-1 max-w-xs">
          <Input
            type="search"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {filteredActifs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Timer className="w-5 h-5 text-emerald-600" />
            Présents maintenant
            <Badge variant="success">{filteredActifs.length}</Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredActifs.map(walkIn => {
              const dureeActuelle = getDureeActuelle(walkIn);
              const dureeEstimeeMin = walkIn.duree_estimee > 0 ? walkIn.duree_estimee * 60 : 120;
              const depasseDuree = dureeActuelle > dureeEstimeeMin;
              const progressPct = Math.min(100, (dureeActuelle / dureeEstimeeMin) * 100);
              const paiementInfo = PAIEMENT_LABELS[walkIn.mode_paiement || 'cash'];

              return (
                <Card key={walkIn.id} className={`p-4 border-l-4 ${depasseDuree ? 'border-red-500' : 'border-emerald-500'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {walkIn.prenom} {walkIn.nom}
                      </h3>
                      {walkIn.entreprise && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {walkIn.entreprise}
                        </p>
                      )}
                    </div>
                    <Badge variant={walkIn.statut_paiement === 'paye' ? 'success' : walkIn.statut_paiement === 'gratuit' ? 'info' : 'warning'}>
                      {walkIn.statut_paiement === 'paye' ? 'Payé' : walkIn.statut_paiement === 'gratuit' ? 'Gratuit' : 'À payer'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{walkIn.espace_nom}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Arrivé à {format(new Date(walkIn.heure_arrivee), 'HH:mm')}</span>
                      <span className={`font-semibold ${depasseDuree ? 'text-red-600' : 'text-emerald-600'}`}>
                        ({Math.floor(dureeActuelle / 60)}h{String(dureeActuelle % 60).padStart(2, '0')}m)
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progression</span>
                        <span className={depasseDuree ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          {depasseDuree ? 'Dépassé !' : `${Math.round(progressPct)}%`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${depasseDuree ? 'bg-red-500' : progressPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {walkIn.telephone && (
                      <a href={`tel:${walkIn.telephone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Phone className="w-4 h-4" />
                        <span>{walkIn.telephone}</span>
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        <Banknote className="w-4 h-4" />
                        <span>{walkIn.montant.toLocaleString('fr-DZ')} DA</span>
                      </div>
                      {paiementInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${paiementInfo.color}`}>
                          {paiementInfo.label}
                        </span>
                      )}
                    </div>

                    {walkIn.notes && (
                      <p className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2">
                        {walkIn.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    {walkIn.statut_paiement !== 'paye' && walkIn.statut_paiement !== 'gratuit' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleMarkPaid(walkIn.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Payé
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleCheckout(walkIn.id)}
                      className="flex-1"
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Départ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(walkIn)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {filteredTermines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Terminés
            <Badge className="bg-gray-100 text-gray-700">{filteredTermines.length}</Badge>
          </h2>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visiteur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espace</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horaires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTermines.map(walkIn => {
                    const duree = getDureeActuelle(walkIn);
                    return (
                      <tr key={walkIn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{walkIn.prenom} {walkIn.nom}</p>
                            {walkIn.telephone && <p className="text-xs text-gray-500">{walkIn.telephone}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{walkIn.espace_nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(walkIn.heure_arrivee), 'HH:mm')} - {walkIn.heure_depart && format(new Date(walkIn.heure_depart), 'HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {Math.floor(duree / 60)}h{String(duree % 60).padStart(2, '0')}m
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                          {walkIn.montant.toLocaleString('fr-DZ')} DA
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={walkIn.statut_paiement === 'paye' ? 'success' : 'warning'} className="text-xs">
                            {walkIn.statut_paiement === 'paye' ? 'Payé' : 'Impayé'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {walkIn.statut_paiement !== 'paye' && (
                              <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(walkIn.id)}>
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(walkIn.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {walkIns.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucune venue spontanée
          </h3>
          <p className="text-gray-500 mb-4">
            Commencez par enregistrer une nouvelle venue spontanée
          </p>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle venue
          </Button>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedWalkIn ? 'Modifier la venue' : 'Nouvelle venue spontanée'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              required
            />
            <Input
              label="Nom *"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Entreprise"
            value={formData.entreprise}
            onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Espace *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.espace_id}
                onChange={(e) => setFormData({ ...formData, espace_id: e.target.value })}
                required
              >
                <option value="">Sélectionner un espace</option>
                {espaces.map(espace => (
                  <option key={espace.id} value={espace.id}>
                    {espace.nom} ({espace.prix_heure} DA/h)
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Durée estimée (heures)"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.duree_estimee}
              onChange={(e) => setFormData({ ...formData, duree_estimee: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Montant (DA)"
              type="number"
              min="0"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode de paiement
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.mode_paiement}
                onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="carte">Carte bancaire</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut paiement
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.statut_paiement}
                onChange={(e) => setFormData({ ...formData, statut_paiement: e.target.value })}
              >
                <option value="en_attente">En attente</option>
                <option value="paye">Payé</option>
                <option value="gratuit">Gratuit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes ou observations..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {selectedWalkIn ? 'Modifier' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
