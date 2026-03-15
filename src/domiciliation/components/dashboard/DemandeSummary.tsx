import React from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Calendar,
  MapPin,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  RefreshCw,
  Star,
  ExternalLink,
  Clock,
  FileText,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import WorkflowTracker from './WorkflowTracker';
import PostCreationForm from './PostCreationForm';
import { getStatutMeta, isTerminal } from '../../domain/stateMachine';
import { OPTIONS_CONFIG, calculateMonthlyTotal, formatPriceWithUnit, BASE_MONTHLY_PRICE } from '../../domain/pricing';
import type { DemandeDomiciliation, TypeStructure } from '../../domain/types';

interface ChecklistItem {
  label: string;
  done: boolean;
  note?: string;
  urgent?: boolean;
}

function getChecklist(demande: DemandeDomiciliation): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const isAE = demande.typeStructure === 'auto_entrepreneur';

  switch (demande.statut) {
    case 'dossier_preparatoire':
      items.push({ label: 'Dossier soumis', done: true });
      items.push({ label: 'Examen du dossier par Coffice', done: false, note: '24–48h ouvrées' });
      items.push({ label: 'Validation et passage en signature', done: false });
      break;
    case 'en_attente_signature':
      items.push({ label: 'Dossier validé par Coffice', done: true });
      items.push({ label: 'Prise de rendez-vous chez le notaire', done: false, urgent: true, note: 'Contactez-nous pour convenir d\'une date' });
      items.push({ label: 'Signature du contrat de domiciliation', done: false });
      break;
    case 'domiciliation_creee':
      items.push({ label: 'Contrat signé chez le notaire', done: true });
      items.push({ label: isAE ? 'Obtenir votre numéro d\'auto-entrepreneur' : 'Immatriculation au CNRC (Registre de Commerce)', done: false, urgent: true });
      if (!isAE) items.push({ label: 'Obtenir le NIF et NIS auprès des impôts', done: false });
      items.push({ label: 'Renseigner vos identifiants dans l\'espace pro', done: false, note: 'Formulaire ci-dessous' });
      break;
    case 'en_attente_complements':
      items.push({ label: 'Contrat signé chez le notaire', done: true });
      items.push({
        label: isAE ? 'Numéro d\'auto-entrepreneur renseigné' : 'NIF et NIS renseignés',
        done: !!(isAE ? demande.numeroAutoEntrepreneur : demande.nif && demande.nis),
        urgent: !(isAE ? demande.numeroAutoEntrepreneur : demande.nif && demande.nis),
      });
      if (!isAE) items.push({ label: 'Registre de Commerce renseigné', done: !!demande.registreCommerce, urgent: !demande.registreCommerce });
      items.push({ label: 'Validation finale par Coffice', done: false });
      break;
    case 'active':
      items.push({ label: 'Domiciliation active', done: true });
      items.push({ label: 'Adresse enregistrée au siège social', done: true });
      if (demande.options?.receptionCourrier) items.push({ label: 'Service courrier activé', done: true });
      if (demande.dateFinContrat) {
        const days = differenceInDays(new Date(demande.dateFinContrat), new Date());
        items.push({
          label: `Contrat valide jusqu'au ${format(new Date(demande.dateFinContrat), 'dd MMM yyyy', { locale: fr })}`,
          done: days > 30,
          urgent: days <= 30 && days > 0,
          note: days <= 0 ? 'Expiré' : days <= 30 ? `Expire dans ${days}j` : undefined,
        });
      }
      break;
  }
  return items;
}

interface DemandeSummaryProps {
  demande: DemandeDomiciliation;
  loading: boolean;
  onPostCreationSubmit: (data: Record<string, string>) => Promise<void>;
  onNewDemande: () => void;
  onRenewalRequest?: () => void;
}

const DemandeSummary: React.FC<DemandeSummaryProps> = ({
  demande,
  loading,
  onPostCreationSubmit,
  onNewDemande,
  onRenewalRequest,
}) => {
  const meta = getStatutMeta(demande.statut);
  const terminal = isTerminal(demande.statut);

  const needsFiscalIds = demande.typeStructure === 'societe'
    ? !demande.nif || !demande.nis || !demande.registreCommerce
    : !demande.numeroAutoEntrepreneur;

  const showPostCreation =
    (demande.statut === 'domiciliation_creee' || demande.statut === 'en_attente_complements') &&
    needsFiscalIds;

  const options = demande.options;
  const monthlyTotal = options ? calculateMonthlyTotal(options) : BASE_MONTHLY_PRICE;
  const checklist = getChecklist(demande);

  const copyAddress = () => {
    const addr = `Coffice — Bureau ${demande.numeroBureau}, 4ème étage, Mohammadia Mall, 16000 Alger`;
    navigator.clipboard.writeText(addr);
    toast.success('Adresse copiée !');
  };

  const daysUntilExpiry = demande.dateFinContrat
    ? differenceInDays(new Date(demande.dateFinContrat), new Date())
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className={`p-0 overflow-hidden border-2 ${meta.border}`}>
        <div className={`p-6 md:p-8 ${meta.bg}`}>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <Building className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {demande.raisonSociale || `${demande.representantLegal.prenom} ${demande.representantLegal.nom}`}
                  </h3>
                  {demande.formeJuridique && (
                    <p className="text-sm text-gray-500">{demande.formeJuridique}</p>
                  )}
                </div>
                <Badge variant={meta.badgeVariant} className="self-start md:self-center">{meta.label}</Badge>
              </div>
              <p className="text-gray-600 text-sm mb-4">{meta.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Créée le {format(new Date(demande.dateCreation), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {demande.numeroBureau && (
                  <div className="flex items-center gap-1.5 font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">
                    <Building className="w-4 h-4" />
                    <span>Bureau n°{demande.numeroBureau}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {demande.commentaireAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Message de Coffice</p>
            <p className="text-sm text-amber-700 mt-1">{demande.commentaireAdmin}</p>
          </div>
        </div>
      )}

      {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && demande.statut === 'active' && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Contrat bientôt expiré</p>
            <p className="text-sm text-red-700 mt-1">
              Votre contrat expire dans <strong>{daysUntilExpiry} jour(s)</strong>. Renouvelez dès maintenant.
            </p>
            {onRenewalRequest && (
              <Button variant="outline" size="sm" onClick={onRenewalRequest} className="mt-2 text-red-700 border-red-300">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Demander un renouvellement
              </Button>
            )}
          </div>
        </div>
      )}

      {!terminal && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            Progression de votre dossier
          </h4>
          <WorkflowTracker statut={demande.statut} />
        </Card>
      )}

      <Card className="p-6">
        <h4 className="font-semibold text-gray-800 mb-4">Checklist</h4>
        <div className="space-y-2">
          {checklist.map((item, idx) => (
            <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${item.done ? 'bg-emerald-50' : item.urgent ? 'bg-orange-50' : 'bg-gray-50'}`}>
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : item.urgent ? (
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.done ? 'text-emerald-700 line-through' : item.urgent ? 'text-orange-700 font-medium' : 'text-gray-600'}`}>
                  {item.label}
                </p>
                {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {demande.statut === 'active' && demande.numeroBureau && (
        <Card className="p-0 overflow-hidden border-2 border-emerald-200">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-emerald-900">Votre adresse de domiciliation</h4>
                  <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                </div>
                <p className="text-emerald-800 font-semibold">Coffice — Bureau {demande.numeroBureau}</p>
                <p className="text-emerald-700 text-sm">4ème étage, Mohammadia Mall</p>
                <p className="text-emerald-700 text-sm">16000 Alger, Algérie</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={copyAddress}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
                  >
                    <Copy className="w-3 h-3" /> Copier l'adresse
                  </button>
                  <a
                    href="https://maps.google.com/?q=Mohammadia+Mall+Alger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors border border-sky-200"
                  >
                    <ExternalLink className="w-3 h-3" /> Voir sur la carte
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {options && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Services actifs</h4>
          <div className="space-y-2">
            {OPTIONS_CONFIG.filter((c) => options[c.key]).map((c) => (
              <div key={c.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.description}</p>
                </div>
                <div className="text-right">
                  {c.included ? (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Inclus</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">+{c.price.toLocaleString('fr-DZ')} DA</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">Total mensuel</span>
            <span className="text-lg font-bold text-gray-800">{formatPriceWithUnit(monthlyTotal)}</span>
          </div>
        </Card>
      )}

      {(demande.dateDebutContrat || demande.dateFinContrat || demande.referenceContratNotarie) && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Contrat
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {demande.referenceContratNotarie && (
              <div>
                <p className="text-xs text-gray-500">Référence notaire</p>
                <p className="text-sm font-medium text-gray-800">{demande.referenceContratNotarie}</p>
              </div>
            )}
            {demande.dateDebutContrat && (
              <div>
                <p className="text-xs text-gray-500">Date de début</p>
                <p className="text-sm font-medium text-gray-800">
                  {format(new Date(demande.dateDebutContrat), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}
            {demande.dateFinContrat && (
              <div>
                <p className="text-xs text-gray-500">Date de fin</p>
                <p className="text-sm font-medium text-gray-800">
                  {format(new Date(demande.dateFinContrat), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}
            {demande.montantMensuel && (
              <div>
                <p className="text-xs text-gray-500">Montant mensuel</p>
                <p className="text-sm font-bold text-gray-800">{demande.montantMensuel.toLocaleString('fr-DZ')} DA HT</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {showPostCreation && (
        <Card className="p-6 border-2 border-amber-200 bg-amber-50/30">
          <h4 className="font-semibold text-amber-800 mb-1">Complétez votre dossier</h4>
          <p className="text-sm text-amber-700 mb-4">
            Maintenant que votre domiciliation est créée, renseignez vos identifiants fiscaux.
          </p>
          <PostCreationForm
            typeStructure={demande.typeStructure as TypeStructure}
            onSubmit={onPostCreationSubmit}
            loading={loading}
          />
        </Card>
      )}

      {terminal && (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">
            {demande.statut === 'refusee'
              ? 'Votre demande a été refusée. Vous pouvez en soumettre une nouvelle.'
              : 'Votre domiciliation est terminée. Vous pouvez en créer une nouvelle.'}
          </p>
          <Button variant="primary" onClick={onNewDemande} className="flex items-center gap-2 mx-auto">
            <ArrowRight className="w-4 h-4" />
            Nouvelle demande
          </Button>
        </Card>
      )}
    </motion.div>
  );
};

export default DemandeSummary;
