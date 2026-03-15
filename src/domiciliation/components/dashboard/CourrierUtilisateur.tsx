import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail, Package, FileText, Calendar, CheckCircle, Send, ScanLine,
  ChevronLeft, ChevronRight, Inbox, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { apiClient } from '../../../lib/api-client';
import { courrierFromAPI } from '../../adapters/apiAdapter';
import type { CourrierItem, DomiciliationOptions } from '../../domain/types';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lettre: { label: 'Lettre', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  colis: { label: 'Colis', icon: Package, color: 'text-teal-600 bg-teal-50' },
  recommande: { label: 'Recommandé', icon: FileText, color: 'text-red-600 bg-red-50' },
  autre: { label: 'Autre', icon: Mail, color: 'text-gray-600 bg-gray-50' },
};

const STATUT_CONFIG: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' | 'accent' }> = {
  recu: { label: 'Reçu', variant: 'neutral' },
  notifie: { label: 'Notifié', variant: 'info' },
  en_attente_instruction: { label: 'En attente', variant: 'warning' },
  recupere: { label: 'Récupéré', variant: 'success' },
  retire: { label: 'Retiré', variant: 'success' },
  scanne: { label: 'Scanné', variant: 'success' },
  reexpedier: { label: 'À réexpédier', variant: 'warning' },
  envoye: { label: 'Envoyé', variant: 'success' },
  traite: { label: 'Traité', variant: 'success' },
  archive: { label: 'Archivé', variant: 'neutral' },
};

const ITEMS_PER_PAGE = 10;

interface CourrierUtilisateurProps {
  domiciliationId: string;
  options?: Partial<DomiciliationOptions>;
}

const CourrierUtilisateur: React.FC<CourrierUtilisateurProps> = ({ domiciliationId, options }) => {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('tous');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getUserCourrier(domiciliationId);
      const data = res.data as Record<string, unknown> | unknown[] | undefined;
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        raw = data as Record<string, unknown>[];
      } else if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        raw = (Array.isArray(d.courriers) ? d.courriers : Array.isArray(d.data) ? d.data : []) as Record<string, unknown>[];
      }
      setCourriers(raw.map(courrierFromAPI));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return courriers.filter((c) => {
      if (filterType !== 'tous' && c.type !== filterType) return false;
      if (filterStatut !== 'tous' && c.statut !== filterStatut) return false;
      return true;
    });
  }, [courriers, filterType, filterStatut]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAction = async (courrierId: string, action: 'recuperer' | 'scanner' | 'reexpedier') => {
    setActionLoading(courrierId + action);
    try {
      const res = await apiClient.updateCourrier(courrierId, { action });
      if (res.success) {
        toast.success('Action effectuée');
        await load();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de l\'action');
    } finally {
      setActionLoading(null);
    }
  };

  const unresolvedCount = courriers.filter((c) => !['retire', 'envoye', 'traite', 'archive', 'recupere'].includes(c.statut)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <Button variant="outline" onClick={load} size="sm">Réessayer</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="tous">Tous les types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={filterStatut}
            onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="tous">Tous les statuts</option>
            {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        {unresolvedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 ml-auto">
            <span className="font-semibold">{unresolvedCount}</span> en attente d'action
          </div>
        )}
      </div>

      {paginated.length === 0 ? (
        <Card className="p-10 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Aucun courrier</p>
          <p className="text-gray-400 text-xs mt-1">
            {courriers.length === 0 ? 'Vous n\'avez pas encore reçu de courrier.' : 'Aucun courrier ne correspond aux filtres.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginated.map((courrier) => {
            const typeConf = TYPE_CONFIG[courrier.type] ?? TYPE_CONFIG.autre;
            const statutConf = STATUT_CONFIG[courrier.statut] ?? { label: courrier.statut, variant: 'neutral' as const };
            const Icon = typeConf.icon;
            const isActionable = ['recu', 'notifie', 'en_attente_instruction'].includes(courrier.statut);

            return (
              <Card key={courrier.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConf.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{courrier.expediteur || 'Expéditeur inconnu'}</p>
                      <Badge variant={statutConf.variant} className="text-xs">{statutConf.label}</Badge>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{typeConf.label}</span>
                    </div>
                    {courrier.description && (
                      <p className="text-sm text-gray-600 mb-1 truncate">{courrier.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {courrier.dateReception
                          ? format(new Date(courrier.dateReception), 'dd MMM yyyy', { locale: fr })
                          : '—'}
                      </span>
                      {courrier.dateRetrait && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Retiré le {format(new Date(courrier.dateRetrait), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  {isActionable && (
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(courrier.id, 'recuperer')}
                        disabled={!!actionLoading}
                        className="text-xs"
                      >
                        {actionLoading === courrier.id + 'recuperer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        Récupérer
                      </Button>
                      {options?.scanNotificationEmail && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(courrier.id, 'scanner')}
                          disabled={!!actionLoading}
                          className="text-xs"
                        >
                          {actionLoading === courrier.id + 'scanner' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanLine className="w-3 h-3 mr-1" />}
                          Scanner
                        </Button>
                      )}
                      {options?.reexpeditionCourrier && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(courrier.id, 'reexpedier')}
                          disabled={!!actionLoading}
                          className="text-xs"
                        >
                          {actionLoading === courrier.id + 'reexpedier' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                          Réexpédier
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">{filtered.length} résultat(s)</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600 font-medium">{currentPage} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourrierUtilisateur;
