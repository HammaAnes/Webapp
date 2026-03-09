import React from "react";
import { motion } from "framer-motion";
import {
  Building,
  Calendar,
  User,
  Phone,
  Mail,
  AlertCircle,
  CreditCard,
  Plus,
  FileCheck,
  FileText,
  MapPin,
  Package,
  Copy,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import WorkflowTracker from "./WorkflowTracker";
import PostCreationForm from "./PostCreationForm";
import { getStatusInfo, OPTIONS_PRICING, BASE_MONTHLY_PRICE, calculateTotalMonthly } from "./constants";
import type { DemandeDomiciliation } from "../../types";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

interface DemandeSummaryProps {
  demande: DemandeDomiciliation;
  loading: boolean;
  onPostCreationSubmit: (data: Record<string, string>) => void;
  onNewDemande: () => void;
  onRenewalRequest?: () => void;
}

const parseDocuments = (documents: unknown): Array<{ type: string; name: string }> => {
  if (!documents) return [];
  if (Array.isArray(documents)) return documents;
  if (typeof documents === "string") {
    try {
      const parsed = JSON.parse(documents);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const NEXT_STEPS: Record<string, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  dossier_preparatoire: {
    title: "En attente de validation",
    description: "Notre équipe examine votre dossier. Vous recevrez une notification dès que le dossier sera validé. Délai moyen : 24-48h.",
    icon: Clock,
  },
  en_attente_signature: {
    title: "Signature chez le notaire requise",
    description: "Votre dossier a été validé. Veuillez vous rendre chez le notaire pour la signature du contrat de domiciliation. Contactez-nous pour convenir d'un rendez-vous.",
    icon: FileCheck,
  },
  domiciliation_creee: {
    title: "Complétez vos démarches administratives",
    description: "Votre domiciliation est juridiquement créée. Effectuez vos démarches d'immatriculation (RC, NIF, NIS) puis complétez les informations ci-dessous.",
    icon: FileText,
  },
  en_attente_complements: {
    title: "Complétez vos informations",
    description: "Renseignez vos identifiants administratifs obtenus après la création de votre entreprise pour activer pleinement votre domiciliation.",
    icon: ArrowRight,
  },
  active: {
    title: "Domiciliation active",
    description: "Votre domiciliation est pleinement opérationnelle. Consultez votre courrier et vos documents dans les onglets dédiés.",
    icon: Building,
  },
};

const DemandeSummary: React.FC<DemandeSummaryProps> = ({
  demande,
  loading,
  onPostCreationSubmit,
  onNewDemande,
  onRenewalRequest,
}) => {
  const status = getStatusInfo(demande.statut);
  const StatusIcon = status.icon;

  const getBadgeVariant = () => {
    if (demande.statut === "active") return "success";
    if (demande.statut === "domiciliation_creee" || demande.statut === "en_attente_complements") return "info";
    if (demande.statut === "refusee" || demande.statut === "resiliee") return "danger";
    if (demande.statut === "expiree") return "warning";
    return "warning";
  };

  const isTerminal = demande.statut === "refusee" || demande.statut === "expiree" || demande.statut === "resiliee";
  const showContract = ["active", "domiciliation_creee", "en_attente_complements", "expiree"].includes(demande.statut) && demande.montantMensuel;
  const showPostCreation =
    (demande.statut === "domiciliation_creee" || demande.statut === "en_attente_complements") &&
    demande.situationAdministrative === "en_cours_creation";

  const docs = parseDocuments(demande.documents);

  const selectedOptions = demande.options
    ? Object.entries(demande.options)
        .filter(([, v]) => v === true)
        .map(([k]) => ({
          key: k,
          label: OPTIONS_PRICING[k]?.label || k,
          price: OPTIONS_PRICING[k]?.price || 0,
          included: OPTIONS_PRICING[k]?.included || false,
        }))
    : [];

  const estimatedTotal = demande.options
    ? calculateTotalMonthly(demande.options as unknown as Record<string, boolean>)
    : BASE_MONTHLY_PRICE;

  const daysUntilExpiry = demande.dateFinContrat
    ? differenceInDays(new Date(demande.dateFinContrat), new Date())
    : null;

  const nextStep = NEXT_STEPS[demande.statut];

  const copyAddress = () => {
    const addr = `Coffice - Bureau ${demande.numeroBureau}, 4\u00e8me \u00e9tage, Mohammadia Mall, Alger`;
    navigator.clipboard.writeText(addr);
    toast.success("Adresse copiée");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className={`p-0 overflow-hidden border-2 ${status.border}`}>
        <div className={`p-6 md:p-8 ${status.bg}`}>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${status.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <StatusIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{status.label}</h3>
                <Badge variant={getBadgeVariant()} className="text-sm px-4 py-2">
                  {status.label}
                </Badge>
              </div>
              <p className="text-gray-700 mb-4">{status.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Demande créée le{" "}
                    {format(new Date(demande.dateCreation), "dd MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                {demande.numeroBureau && (
                  <div className="flex items-center gap-2 font-semibold text-amber-700">
                    <Building className="w-4 h-4" />
                    <span>Bureau n&#176;{demande.numeroBureau}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <WorkflowTracker statut={demande.statut} />

      {demande.statut === "active" && demande.numeroBureau && (
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 text-lg mb-1">Votre adresse de domiciliation</h3>
              <p className="text-emerald-800 font-medium text-base">
                Coffice - Bureau {demande.numeroBureau}
              </p>
              <p className="text-emerald-700 text-sm">4ème étage, Mohammadia Mall</p>
              <p className="text-emerald-700 text-sm">Alger, Algérie</p>
              <button
                onClick={copyAddress}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copier l'adresse
              </button>
            </div>
          </div>
        </Card>
      )}

      {nextStep && !isTerminal && (
        <Card className="p-5 border border-sky-200 bg-sky-50/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <nextStep.icon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h4 className="font-bold text-sky-900 mb-1">{nextStep.title}</h4>
              <p className="text-sm text-sky-700">{nextStep.description}</p>
            </div>
          </div>
        </Card>
      )}

      {daysUntilExpiry !== null && daysUntilExpiry <= 60 && (demande.statut === "active" || demande.statut === "expiree") && (() => {
        const urgency = daysUntilExpiry <= 0 ? "expired" : daysUntilExpiry <= 7 ? "critical" : daysUntilExpiry <= 15 ? "high" : daysUntilExpiry <= 30 ? "medium" : "low";
        const colors = {
          expired: { border: "border-red-400", bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600", title: "text-red-900", text: "text-red-700" },
          critical: { border: "border-red-400", bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600", title: "text-red-900", text: "text-red-700" },
          high: { border: "border-orange-400", bg: "bg-orange-50", iconBg: "bg-orange-100", iconColor: "text-orange-600", title: "text-orange-900", text: "text-orange-700" },
          medium: { border: "border-amber-300", bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "text-amber-900", text: "text-amber-700" },
          low: { border: "border-sky-200", bg: "bg-sky-50", iconBg: "bg-sky-100", iconColor: "text-sky-600", title: "text-sky-900", text: "text-sky-700" },
        };
        const c = colors[urgency];
        const titles: Record<string, string> = {
          expired: "Contrat expire",
          critical: "Expiration imminente",
          high: "Expiration tres proche",
          medium: "Contrat bientot a echeance",
          low: "Contrat bientot a echeance",
        };
        return (
          <Card className={`p-5 border-2 ${c.border} ${c.bg}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <AlertTriangle className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${c.title} mb-1`}>{titles[urgency]}</h4>
                <p className={`text-sm ${c.text}`}>
                  {daysUntilExpiry <= 0 ? (
                    <>Votre contrat a expire le {format(new Date(demande.dateFinContrat!), "dd MMMM yyyy", { locale: fr })}.</>
                  ) : (
                    <>Votre contrat expire dans <strong>{daysUntilExpiry} jour{daysUntilExpiry > 1 ? "s" : ""}</strong> (le {format(new Date(demande.dateFinContrat!), "dd MMMM yyyy", { locale: fr })}).</>
                  )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompanyInfoCard demande={demande} />
        {demande.representantLegal && <ContactCard demande={demande} />}
      </div>

      {docs.length > 0 && <DocumentsCard docs={docs} />}

      {selectedOptions.length > 0 && <OptionsCard options={selectedOptions} estimatedTotal={estimatedTotal} />}

      {(demande.statut === "refusee" || demande.statut === "resiliee") && demande.commentaireAdmin && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 mb-2 text-lg">
                {demande.statut === "refusee" ? "Raison du refus" : "Motif de la résiliation"}
              </h3>
              <p className="text-red-700">{demande.commentaireAdmin}</p>
            </div>
          </div>
        </Card>
      )}

      {showContract && <ContractCard demande={demande} />}

      {showPostCreation && (
        <PostCreationForm demande={demande} loading={loading} onSubmit={onPostCreationSubmit} />
      )}

      {isTerminal && demande.statut !== "expiree" && (
        <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <FileCheck className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Soumettre une nouvelle demande</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {demande.statut === "refusee"
              ? "Vous pouvez corriger les informations et soumettre une nouvelle demande."
              : "Vous pouvez soumettre une nouvelle demande de domiciliation."
            }
          </p>
          <Button
            onClick={onNewDemande}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle demande
          </Button>
        </Card>
      )}

      {demande.statut === "expiree" && (
        <Card className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <RefreshCw className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Renouveler votre domiciliation</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Votre contrat a expire. Contactez notre equipe ou soumettez une demande de renouvellement.
          </p>
          <div className="flex items-center justify-center gap-3">
            {onRenewalRequest && (
              <Button
                onClick={onRenewalRequest}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Demander le renouvellement
              </Button>
            )}
            <Button variant="outline" onClick={onNewDemande}>
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
};

const ContractCard: React.FC<{ demande: DemandeDomiciliation }> = ({ demande }) => (
  <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <CreditCard className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-emerald-900 mb-2 text-lg">Contrat de domiciliation</h3>
        <p className="text-3xl font-bold text-emerald-700">
          {Number(demande.montantMensuel).toLocaleString()} DA
          <span className="text-base font-normal text-emerald-600"> / mois</span>
        </p>
        {demande.referenceContratNotarie && (
          <p className="text-sm text-emerald-600 mt-2">
            Référence contrat : <span className="font-semibold text-emerald-800">{demande.referenceContratNotarie}</span>
          </p>
        )}
        {demande.dateDebutContrat && demande.dateFinContrat && (
          <div className="mt-4 pt-4 border-t border-emerald-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-emerald-600">Date de début :</span>
                <p className="font-semibold text-emerald-900">
                  {format(new Date(demande.dateDebutContrat), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <span className="text-emerald-600">Date de fin :</span>
                <p className="font-semibold text-emerald-900">
                  {format(new Date(demande.dateFinContrat), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </Card>
);

const DocumentsCard: React.FC<{ docs: Array<{ type: string; name: string }> }> = ({ docs }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
        <FileText className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Documents fournis</h2>
        <p className="text-sm text-gray-500">{docs.length} document(s) soumis</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {docs.map((doc, idx) => (
        <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
            <p className="text-xs text-gray-500">{doc.type}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const OptionsCard: React.FC<{ options: Array<{ key: string; label: string; price: number; included: boolean }>; estimatedTotal: number }> = ({ options, estimatedTotal }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
        <Package className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Options selectionnees</h2>
        <p className="text-sm text-gray-500">Services inclus dans votre contrat</p>
      </div>
    </div>
    <div className="space-y-2">
      {options.map((opt) => (
        <div key={opt.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-500" />
            <span className="text-sm font-medium text-gray-900">{opt.label}</span>
          </div>
          <span className={`text-sm font-semibold ${opt.included ? "text-emerald-600" : "text-gray-700"}`}>
            {opt.included ? "Inclus" : `+${opt.price.toLocaleString()} DA/mois`}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-600">Total estime mensuel</span>
      <span className="text-lg font-bold text-gray-900">{estimatedTotal.toLocaleString()} DA/mois</span>
    </div>
  </Card>
);

const CompanyInfoCard: React.FC<{ demande: DemandeDomiciliation }> = ({ demande }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
        <Building className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Informations Entreprise</h2>
        <p className="text-sm text-gray-500">Détails de votre demande</p>
      </div>
    </div>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InfoField label="Raison Sociale" value={demande.raisonSociale || "Non renseigné"} />
        <InfoField label="Forme Juridique" value={demande.formeJuridique || "Non renseigné"} />
      </div>
      {demande.numeroBureau && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-xs text-amber-700 mb-1 uppercase tracking-wide font-medium">Numéro de Bureau</p>
          <p className="text-2xl font-bold text-amber-800">Bureau {demande.numeroBureau}</p>
          <p className="text-xs text-amber-600 mt-1">
            <MapPin className="w-3 h-3 inline mr-1" />
            Mohammadia Mall, 4e étage
          </p>
        </div>
      )}
      {demande.typeStructure === "auto_entrepreneur" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Activité" value={demande.activiteExercee || demande.domaineActivite || "Non renseigné"} />
          {demande.numeroAutoEntrepreneur && (
            <InfoField label="N. Auto-Entrepreneur" value={demande.numeroAutoEntrepreneur} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="NIF" value={demande.nif || "Non renseigné"} />
          <InfoField label="NIS" value={demande.nis || "Non renseigné"} />
          {demande.registreCommerce && <InfoField label="Registre Commerce" value={demande.registreCommerce} />}
          {demande.articleImposition && <InfoField label="Article Imposition" value={demande.articleImposition} />}
        </div>
      )}
    </div>
  </Card>
);

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">{label}</p>
    <p className="font-semibold text-gray-900">{value}</p>
  </div>
);

const ContactCard: React.FC<{ demande: DemandeDomiciliation }> = ({ demande }) => {
  if (!demande.representantLegal) return null;
  const rep = demande.representantLegal;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Représentant Légal</h2>
          <p className="text-sm text-gray-500">Contact principal</p>
        </div>
      </div>
      <div className="bg-sky-50 rounded-xl p-5 border border-sky-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sky-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{rep.prenom} {rep.nom}</p>
            {rep.fonction && <p className="text-sm text-gray-600">{rep.fonction}</p>}
          </div>
        </div>
        <div className="space-y-3 pt-3 border-t border-sky-200">
          {rep.email && (
            <a href={`mailto:${rep.email}`} className="flex items-center gap-2 text-sky-700 hover:text-sky-800 transition-colors">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">{rep.email}</span>
            </a>
          )}
          {rep.telephone && (
            <a href={`tel:${rep.telephone}`} className="flex items-center gap-2 text-sky-700 hover:text-sky-800 transition-colors">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">{rep.telephone}</span>
            </a>
          )}
          {rep.ville && (
            <div className="flex items-center gap-2 text-sky-700">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{rep.ville}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DemandeSummary;
