import React, { useState, useEffect } from 'react';
import {
  Lock,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  Wrench,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { format, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { apiClient } from '../../../lib/api-client';
import toast from 'react-hot-toast';

interface Blocage {
  id: string;
  espace_id: string;
  espace_nom?: string;
  espace_type?: string;
  date_debut: string;
  date_fin: string;
  type: string;
  raison: string;
  priorite: string;
  statut: string;
  notes?: string;
  bloque_par_nom?: string;
  created_at: string;
}

interface Espace {
  id: string;
  nom: string;
  type: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'text-blue-600' },
  reparation: { label: 'Réparation', icon: AlertCircle, color: 'text-orange-600' },
  nettoyage: { label: 'Nettoyage', icon: CheckCircle, color: 'text-emerald-600' },
  event_prive: { label: 'Événement privé', icon: Lock, color: 'text-teal-600' },
  autre: { label: 'Autre', icon: XCircle, color: 'text-gray-600' },
};

const PRIORITE_LABELS: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'bg-gray-100 text-gray-700' },
  normale: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  haute: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "error" | "teal";

const STATUT_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  planifie: { label: 'Planifié', variant: 'info' },
  en_cours: { label: 'En cours', variant: 'warning' },
  termine: { label: 'Terminé', variant: 'success' },
  annule: { label: 'Annulé', variant: 'default' },
};

export default function Blocages() {
  const [blocages, setBlocages] = useState<Blocage[]>([]);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBlocage, setSelectedBlocage] = useState<Blocage | null>(null);
  const [filter, setFilter] = useState<'actifs' | 'tous' | 'planifies'>('actifs');

  const [formData, setFormData] = useState({
    espace_id: '',
    date_debut: '',
    date_fin: '',
    type: 'maintenance',
    raison: '',
    priorite: 'normale',
    statut: 'planifie',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      let endpoint = '/admin/blocages.php';
      if (filter === 'actifs') endpoint += '?statut=en_cours,planifie';
      else if (filter === 'planifies') endpoint += '?statut=planifie';

      const [blocagesRes, espacesRes] = await Promise.all([
        apiClient.get(endpoint),
        apiClient.getEspaces()
      ]);

      const blocagesData = blocagesRes.data as Record<string, unknown>;
      const espacesData = espacesRes.data as Record<string, unknown>;
      setBlocages((blocagesData?.blocages || []) as Blocage[]);
      setEspaces(((espacesData?.espaces || espacesRes.data || []) as Espace[]));
    } catch {
      toast.error('Erreur lors du chargement des blocages');
      setBlocages([]);
      setEspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.espace_id || !formData.date_debut || !formData.date_fin || !formData.raison) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (new Date(formData.date_debut) >= new Date(formData.date_fin)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    try {
      if (selectedBlocage) {
        await apiClient.put(`/admin/blocages.php?id=${selectedBlocage.id}`, formData);
        toast.success('Blocage mis à jour');
      } else {
        await apiClient.post('/admin/blocages.php', formData);
        toast.success('Blocage créé');
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce blocage ?')) return;

    try {
      await apiClient.delete(`/admin/blocages.php?id=${id}`);
      toast.success('Blocage supprimé');
      loadData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleChangeStatus = async (id: string, statut: string) => {
    try {
      await apiClient.put(`/admin/blocages.php?id=${id}`, { statut });
      toast.success('Statut mis à jour');
      loadData();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openModal = (blocage?: Blocage) => {
    if (blocage) {
      setSelectedBlocage(blocage);
      setFormData({
        espace_id: blocage.espace_id,
        date_debut: format(new Date(blocage.date_debut), "yyyy-MM-dd'T'HH:mm"),
        date_fin: format(new Date(blocage.date_fin), "yyyy-MM-dd'T'HH:mm"),
        type: blocage.type,
        raison: blocage.raison,
        priorite: blocage.priorite,
        statut: blocage.statut,
        notes: blocage.notes || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedBlocage(null);
    setFormData({
      espace_id: '',
      date_debut: '',
      date_fin: '',
      type: 'maintenance',
      raison: '',
      priorite: 'normale',
      statut: 'planifie',
      notes: '',
    });
  };

  const getBlocageStatus = (blocage: Blocage) => {
    const now = new Date();
    const debut = new Date(blocage.date_debut);
    const fin = new Date(blocage.date_fin);

    if (blocage.statut === 'termine' || blocage.statut === 'annule') {
      return blocage.statut;
    }

    if (isWithinInterval(now, { start: debut, end: fin })) {
      return 'en_cours';
    }

    if (isBefore(now, debut)) {
      return 'planifie';
    }

    return 'termine';
  };

  const actifs = blocages.filter(b => ['planifie', 'en_cours'].includes(getBlocageStatus(b)));
  const termines = blocages.filter(b => ['termine', 'annule'].includes(getBlocageStatus(b)));
  const enCours = actifs.filter(b => getBlocageStatus(b) === 'en_cours');
  const planifies = actifs.filter(b => getBlocageStatus(b) === 'planifie');
  const espacesAffectes = new Set(actifs.map(b => b.espace_id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="w-10 h-10 animate-pulse text-amber-500 mx-auto mb-3" />
          <p className="text-gray-500">Chargement des blocages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-7 h-7" />
            Blocages d'espaces
          </h1>
          <p className="text-gray-600 mt-1">
            Maintenance, réparations et événements privés
          </p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau blocage
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">En cours</p>
          <p className="text-2xl font-bold text-orange-600">{enCours.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Planifiés</p>
          <p className="text-2xl font-bold text-blue-600">{planifies.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Espaces affectés</p>
          <p className="text-2xl font-bold text-red-600">{espacesAffectes}</p>
        </Card>
        <Card className="p-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600">Historique</p>
          <p className="text-2xl font-bold text-gray-600">{termines.length}</p>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'actifs' ? 'primary' : 'outline'}
          onClick={() => setFilter('actifs')}
          size="sm"
        >
          Actifs ({actifs.length})
        </Button>
        <Button
          variant={filter === 'planifies' ? 'primary' : 'outline'}
          onClick={() => setFilter('planifies')}
          size="sm"
        >
          Planifiés
        </Button>
        <Button
          variant={filter === 'tous' ? 'primary' : 'outline'}
          onClick={() => setFilter('tous')}
          size="sm"
        >
          Tous
        </Button>
      </div>

      {/* Blocages actifs */}
      {actifs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Blocages actifs et planifiés
            <Badge variant="warning">{actifs.length}</Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actifs.map(blocage => {
              const typeConfig = TYPE_LABELS[blocage.type] || TYPE_LABELS.autre;
              const prioriteConfig = PRIORITE_LABELS[blocage.priorite] || PRIORITE_LABELS.normale;
              const statutActuel = getBlocageStatus(blocage);
              const statutConfig = STATUT_LABELS[statutActuel] || STATUT_LABELS.planifie;
              const Icon = typeConfig.icon;

              return (
                <Card key={blocage.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100`}>
                        <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{typeConfig.label}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {blocage.espace_nom}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statutConfig.variant}>
                      {statutConfig.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(blocage.date_debut), 'd MMM yyyy', { locale: fr })} -{' '}
                        {format(new Date(blocage.date_fin), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(blocage.date_debut), 'HH:mm')} -{' '}
                        {format(new Date(blocage.date_fin), 'HH:mm')}
                      </span>
                    </div>

                    <div className="mt-2">
                      <Badge className={prioriteConfig.color}>
                        {prioriteConfig.label}
                      </Badge>
                    </div>

                    <div className="bg-gray-50 p-2 rounded mt-2">
                      <p className="text-xs text-gray-700 font-medium">Raison :</p>
                      <p className="text-sm text-gray-600">{blocage.raison}</p>
                    </div>

                    {blocage.notes && (
                      <p className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2 mt-2">
                        {blocage.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {statutActuel === 'planifie' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleChangeStatus(blocage.id, 'en_cours')}
                        className="flex-1"
                      >
                        Démarrer
                      </Button>
                    )}
                    {statutActuel === 'en_cours' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleChangeStatus(blocage.id, 'termine')}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Terminer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(blocage)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleChangeStatus(blocage.id, 'annule')}
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Blocages terminés */}
      {termines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Historique
            <Badge className="ml-2 bg-gray-100 text-gray-700">{termines.length}</Badge>
          </h2>

          <div className="space-y-2">
            {termines.slice(0, 10).map(blocage => {
              const typeConfig = TYPE_LABELS[blocage.type] || TYPE_LABELS.autre;
              const statutActuel = getBlocageStatus(blocage);
              const statutConfig = STATUT_LABELS[statutActuel] || STATUT_LABELS.planifie;

              return (
                <Card key={blocage.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-4">
                      <Badge variant={statutConfig.variant} className="w-20">
                        {statutConfig.label}
                      </Badge>
                      <span className="font-medium">{blocage.espace_nom}</span>
                      <span className="text-sm text-gray-600">{typeConfig.label}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(blocage.date_debut), 'd MMM', { locale: fr })} -{' '}
                        {format(new Date(blocage.date_fin), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(blocage.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* État vide */}
      {blocages.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun blocage d'espace
          </h3>
          <p className="text-gray-500 mb-4">
            Créez un blocage pour maintenance, réparation ou événement privé
          </p>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau blocage
          </Button>
        </Card>
      )}

      {/* Modal de formulaire */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedBlocage ? 'Modifier le blocage' : 'Nouveau blocage'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  {espace.nom} ({espace.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date et heure de début *"
              type="datetime-local"
              value={formData.date_debut}
              onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              required
            />
            <Input
              label="Date et heure de fin *"
              type="datetime-local"
              value={formData.date_fin}
              onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                {Object.entries(TYPE_LABELS).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
              >
                {Object.entries(PRIORITE_LABELS).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Raison *"
            value={formData.raison}
            onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
            placeholder="Ex: Réparation climatisation, Nettoyage approfondi..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {selectedBlocage ? 'Modifier' : 'Créer le blocage'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
