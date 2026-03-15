import React from 'react';
import { motion } from 'framer-motion';
import {
  Building, Calendar, User, Phone, Mail, AlertCircle, CreditCard,
  Plus, FileCheck, FileText, MapPin, Package, Copy, Clock,
  AlertTriangle, RefreshCw, CheckCircle2, Circle, ExternalLink, Hash, Star,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import WorkflowTracker from './WorkflowTracker';
import PostCreationForm from './PostCreationForm';
import { getStatutMeta, isTerminal as checkTerminal } from '../../domain/stateMachine';
import { OPTIONS_CONFIG, calculateMonthlyTotal, formatPrice } from '../../domain/pricing';
import type { DemandeDomiciliation } from '../../domain/types';

interface DemandeSummaryProps {
  demande: DemandeDomiciliation;
  loading: boolean;
  onPostCreationSubmit: (data: Record<string, string>) => void;
  onNewDemande: () => void;
  onRenewalRequest?: () => void;
}

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
      items.push({ label: isAE ? "Obtenir votre numéro d'auto-entrepreneur" : 'Immatriculation au CNRC (Registre de Commerce)', done: false, urgent: true });
      if (!isAE) items.push({ label: 'Obtenir le NIF et NIS auprès des impôts', done: false });
      items.push({ label: 'Renseigner vos identifiants dans l\'espace pro', done: false, note: 'Formulaire ci-dessous' });
      break;
    case 'en_attente_complements':
      items.push({ label: 'Dossier reçu par Coffice', done: true });
      items.push({
        label: 'Fournir les compléments demandés',
        done: false,
        urgent: true,
        note: demande.commentaireAdmin || 'Consultez le message de l\'équipe Coffice ci-dessous',
      });
      items.push({ label: 'Revalidation du dossier par Coffice', done: false });
      items.push({ label: 'Signature du contrat chez le notaire', done: false });
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

export default function DemandeSummary({ demande, loading, onPostCreationSubmit, onNewDemande, onRenewalRequest }: DemandeSummaryProps) {
  const meta = getStatutMeta(demande.statut);
  const terminal = checkTerminal(demande.statut);

  const showContract = ['active', 'domiciliation_creee', 'en_attente_complements'].includes(demande.statut) && !!demande.montantMensuel;
  const needsFiscalIds = demande.typeStructure === 'societe'
    ? !demande.nif || !demande.nis || !demande.registreCommerce
    : !demande.numeroAutoEntrepreneur;
  const showPostCreation = ['domiciliation_creee', 'en_attente_complements'].includes(demande.statut) && needsFiscalIds;

  const activeOptions = demande.options
    ? OPTIONS_CONFIG.filter(c => demande.options![c.key])
    : [];

  const estimatedTotal = demande.options
    ? calculateMonthlyTotal(demande.options)
    : 0;

  const daysUntilExpiry = demande.dateFinContrat
    ? differenceInDays(new Date(demande.dateFinContrat), new Date())
    : null;

  const checklist = getChecklist(demande);

  const copyAddress = () => {
    const addr = `Coffice - Bureau ${demande.numeroBureau}, 4ème étage, Mohammadia Mall, Alger`;
    navigator.clipboard.writeText(addr);
    toast.success('Adresse copiée !');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className={`p-0 overflow-hidden border-2 ${meta.border}`}>
        <div className={`p-6 md:p-8 ${meta.bg}`}>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <Building className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                <h3 className="text-2xl font-bold text-gray-900">{meta.label}</h3>
                <Badge variant={meta.badgeVariant} className="text-sm px-4 py-2 self-start md:self-center">
                  {meta.label}
                </Badge>
              </div>
              <p className="text-gray-700 mb-4">{meta.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Demande créée le {format(new Date(demande.dateCreation), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {demande.numeroBureau && (
                  <div className="flex items-center gap-2 font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">
                    <Building className="w-4 h-4" />
                    <span>Bureau n°{demande.numeroBureau}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {demande.statut === 'active' && demande.numeroBureau && (
        <Card className="p-0 overflow-hidden border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <MapPin className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-emerald-900 text-lg">Votre adresse de domiciliation</h3>
                  <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                </div>
                <p className="text-emerald-800 font-semibold text-base">Coffice — Bureau {demande.numeroBureau}</p>
                <p className="text-emerald-700 text-sm">4ème étage, Mohammadia Mall</p>
                <p className="text-emerald-700 text-sm">16000 Alger, Algérie</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={copyAddress}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier l'adresse
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Adresse officielle de votre siège
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry > 0 && demande.statut === 'active' && (() => {
        const urgency = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'high' : daysUntilExpiry <= 30 ? 'medium' : 'low';
        const colors = {
          critical: { border: 'border-red-400', bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', title: 'text-red-900', text: 'text-red-700' },
          high: { border: 'border-orange-400', bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', title: 'text-orange-900', text: 'text-orange-700' },
          medium: { border: 'border-amber-300', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', title: 'text-amber-900', text: 'text-amber-700' },
          low: { border: 'border-sky-200', bg: 'bg-sky-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', title: 'text-sky-900', text: 'text-sky-700' },
        };
        const c = colors[urgency];
        return (
          <Card className={`p-5 border-2 ${c.border} ${c.bg}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <AlertTriangle className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${c.title} mb-1`}>
                  {urgency === 'critical' ? 'Expiration imminente !' : urgency === 'high' ? 'Expiration très proche' : 'Contrat bientôt à échéance'}
                </h4>
                <p className={`text-sm ${c.text}`}>
                  Votre contrat expire dans <strong>{daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}</strong> (le{' '}
                  {format(new Date(demande.dateFinContrat!), 'dd MMMM yyyy', { locale: fr })}).
                </p>
                {onRenewalRequest && (
                  <Button
                    onClick={onRenewalRequest}
                    size="sm"
                    className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Demander le renouvellement
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })()}

      <WorkflowTracker statut={demande.statut} />

      {checklist.length > 0 && !terminal && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Prochaines étapes</h3>
              <p className="text-xs text-gray-500">
                {checklist.filter(i => i.done).length}/{checklist.length} accompli{checklist.filter(i => i.done).length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  item.done ? 'bg-emerald-50 border border-emerald-200'
                    : item.urgent ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : item.urgent ? (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.done ? 'text-emerald-800 line-through opacity-70' : item.urgent ? 'text-amber-900' : 'text-gray-700'}`}>
                    {item.label}
                  </p>
                  {item.note && (
                    <p className={`text-xs mt-0.5 ${item.done ? 'text-emerald-600' : item.urgent ? 'text-amber-600' : 'text-gray-500'}`}>
                      {item.note}
                    </p>
                  )}
                </div>
                {item.urgent && !item.done && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">À faire</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompanyInfoCard demande={demande} />
        {demande.representantLegal && <ContactCard rep={demande.representantLegal} />}
      </div>

      {activeOptions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Services souscrits</h2>
              <p className="text-xs text-gray-500">{activeOptions.length} service(s) inclus dans votre contrat</p>
            </div>
          </div>
          <div className="space-y-2">
            {activeOptions.map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${opt.included ? 'text-emerald-500' : 'text-sky-500'}`} />
                  <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                </div>
                <span className={`text-sm font-semibold ${opt.included ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {opt.included ? 'Inclus' : `+${formatPrice(opt.price)}/mois`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">Total estimé mensuel</span>
            <span className="text-lg font-bold text-gray-900">{formatPrice(estimatedTotal)}/mois</span>
          </div>
        </Card>
      )}

      {showContract && (
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 mb-3 text-lg">Contrat de domiciliation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/60 rounded-xl p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Montant mensuel</p>
                  <p className="text-xl font-bold text-emerald-800">{Number(demande.montantMensuel).toLocaleString('fr-DZ')} DA</p>
                </div>
                {demande.dateDebutContrat && (
                  <div className="bg-white/60 rounded-xl p-3 border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Début du contrat</p>
                    <p className="font-semibold text-emerald-900 text-sm">{format(new Date(demande.dateDebutContrat), 'dd MMM yyyy', { locale: fr })}</p>
                  </div>
                )}
                {demande.dateFinContrat && (
                  <div className={`bg-white/60 rounded-xl p-3 border ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'border-amber-300' : 'border-emerald-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>Fin du contrat</p>
                    <p className={`font-semibold text-sm ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-amber-900' : 'text-emerald-900'}`}>
                      {format(new Date(demande.dateFinContrat), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                      <p className="text-xs text-amber-600 mt-0.5 font-medium">Dans {daysUntilExpiry}j</p>
                    )}
                  </div>
                )}
              </div>
              {demande.referenceContratNotarie && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Référence : <span className="font-semibold">{demande.referenceContratNotarie}</span></span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {demande.statut === 'en_attente_complements' && demande.commentaireAdmin && (
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 mb-2 text-lg">Message de l'équipe Coffice</h3>
              <p className="text-amber-800">{demande.commentaireAdmin}</p>
              <p className="text-xs text-amber-600 mt-2">Merci de fournir les compléments demandés pour que votre dossier puisse avancer.</p>
            </div>
          </div>
        </Card>
      )}

      {(demande.statut === 'refusee' || demande.statut === 'resiliee') && demande.commentaireAdmin && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 mb-2 text-lg">
                {demande.statut === 'refusee' ? 'Raison du refus' : 'Motif de la résiliation'}
              </h3>
              <p className="text-red-700">{demande.commentaireAdmin}</p>
            </div>
          </div>
        </Card>
      )}

      {showPostCreation && (
        <PostCreationForm
          typeStructure={demande.typeStructure}
          initialData={{ nif: demande.nif, nis: demande.nis, registreCommerce: demande.registreCommerce, articleImposition: demande.articleImposition, numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur }}
          loading={loading}
          onSubmit={onPostCreationSubmit}
        />
      )}

      {terminal && (
        <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <FileCheck className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Soumettre une nouvelle demande</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {demande.statut === 'refusee'
              ? 'Corrigez les points signalés et soumettez une nouvelle demande.'
              : 'Votre contrat est terminé. Vous pouvez initier une nouvelle domiciliation.'}
          </p>
          <Button onClick={onNewDemande} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle demande
          </Button>
        </Card>
      )}

      {demande.statut === 'expiree' && onRenewalRequest && (
        <Card className="p-6 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Votre contrat a expiré</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Renouvelez votre domiciliation pour continuer à bénéficier de nos services.
          </p>
          <Button onClick={onRenewalRequest} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            <RefreshCw className="w-5 h-5 mr-2" />
            Demander le renouvellement
          </Button>
        </Card>
      )}
    </motion.div>
  );
}

const InfoField: React.FC<{ label: string; value?: string | null; missing?: boolean }> = ({ label, value, missing }) => (
  <div className={`rounded-xl p-3.5 border ${missing ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
    <p className={`text-xs mb-1 uppercase tracking-wide font-medium ${missing ? 'text-amber-600' : 'text-gray-500'}`}>{label}</p>
    <p className={`font-semibold text-sm ${missing ? 'text-amber-700 italic' : 'text-gray-900'}`}>{value || 'Non renseigné'}</p>
  </div>
);

const CompanyInfoCard: React.FC<{ demande: DemandeDomiciliation }> = ({ demande }) => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
        <Building className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">Informations entreprise</h2>
        <p className="text-xs text-gray-500">Données de votre dossier</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InfoField label="Raison Sociale" value={demande.raisonSociale || 'Non renseigné'} />
        <InfoField label="Forme Juridique" value={demande.formeJuridique || 'Non renseigné'} />
      </div>
      {demande.numeroBureau && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-xs text-amber-700 mb-1 uppercase tracking-wide font-semibold">Numéro de Bureau attribué</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-amber-800">Bureau {demande.numeroBureau}</p>
            <div className="text-right">
              <p className="text-xs text-amber-600 flex items-center gap-1"><MapPin className="w-3 h-3" />Mohammadia Mall, 4ème étage</p>
              <p className="text-xs text-amber-600">16000 Alger</p>
            </div>
          </div>
        </div>
      )}
      {demande.typeStructure === 'auto_entrepreneur' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoField label="Activité" value={demande.activiteExercee || demande.domaineActivite || 'Non renseigné'} />
          {demande.numeroAutoEntrepreneur && <InfoField label="N° Auto-Entrepreneur" value={demande.numeroAutoEntrepreneur} />}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="NIF" value={demande.nif} missing={!demande.nif} />
          <InfoField label="NIS" value={demande.nis} missing={!demande.nis} />
          {demande.registreCommerce && <InfoField label="Registre Commerce" value={demande.registreCommerce} />}
          {demande.articleImposition && <InfoField label="Article d'Imposition" value={demande.articleImposition} />}
        </div>
      )}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${demande.situationAdministrative === 'en_cours_creation' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
          {demande.situationAdministrative === 'en_cours_creation' ? 'En cours de création' : 'Déjà créée'}
        </span>
        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${demande.typeStructure === 'auto_entrepreneur' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
          {demande.typeStructure === 'auto_entrepreneur' ? 'Auto-entrepreneur' : 'Société'}
        </span>
      </div>
    </div>
  </Card>
);

const ContactCard: React.FC<{ rep: DemandeDomiciliation['representantLegal'] }> = ({ rep }) => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">Représentant légal</h2>
        <p className="text-xs text-gray-500">Contact principal du dossier</p>
      </div>
    </div>
    <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-sky-200 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-sky-700" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{rep.prenom} {rep.nom}</p>
          {rep.fonction && <p className="text-sm text-gray-500">{rep.fonction}</p>}
        </div>
      </div>
      <div className="space-y-2.5 pt-3 border-t border-sky-200">
        {rep.email && (
          <a href={`mailto:${rep.email}`} className="flex items-center gap-2 text-sky-700 hover:text-sky-900 transition-colors group">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate group-hover:underline">{rep.email}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
        )}
        {rep.telephone && (
          <a href={`tel:${rep.telephone}`} className="flex items-center gap-2 text-sky-700 hover:text-sky-900 transition-colors group">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium group-hover:underline">{rep.telephone}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
        )}
        {rep.ville && (
          <div className="flex items-center gap-2 text-sky-700">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{rep.ville}</span>
          </div>
        )}
      </div>
    </div>
  </Card>
);
