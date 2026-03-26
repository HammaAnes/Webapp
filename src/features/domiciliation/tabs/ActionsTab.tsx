import React, { useState } from "react";
import {
  Scale,
  CheckCircle,
  XCircle,
  PlayCircle,
  RefreshCw,
  Ban,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import BureauSelector from "../components/BureauSelector";
import ContratSummary from "../components/ContratSummary";
import { useOccupiedBureaux } from "../hooks";
import { toDateInputValue } from "../utils";
import type { DemandeDomiciliation, ActionKey, ActionData } from "../../../domiciliation/domain/types";

interface Props {
  demande: DemandeDomiciliation;
  onAction: (action: ActionKey, data?: ActionData) => Promise<void>;
  loading: boolean;
}

interface ActionDef {
  key: ActionKey;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  buttonVariant: "success" | "danger" | "primary";
  statuts: DemandeDomiciliation["statut"][];
  destructive?: boolean;
  needsMotif?: boolean;
  motifLabel?: string;
  motifPlaceholder?: string;
  needsContratData?: boolean;
  needsBureau?: boolean;
}

const ACTION_DEFS: ActionDef[] = [
  {
    key: "valider",
    label: "Valider le dossier",
    description: "Le dossier est complet et validé. Il passe en attente de signature notariale.",
    icon: CheckCircle,
    color: "text-emerald-700",
    iconBg: "bg-emerald-100",
    buttonVariant: "success",
    statuts: ["dossier_preparatoire"],
  },
  {
    key: "complements",
    label: "Demander des compléments",
    description: "Des informations ou documents manquent. Le client sera notifié.",
    icon: MessageSquare,
    color: "text-sky-700",
    iconBg: "bg-sky-100",
    buttonVariant: "primary",
    statuts: ["dossier_preparatoire", "domiciliation_creee"],
    needsMotif: true,
    motifLabel: "Informations manquantes",
    motifPlaceholder: "Préciser les informations ou documents manquants...",
  },
  {
    key: "rejeter",
    label: "Refuser la demande",
    description: "La demande ne peut pas être acceptée. Cette action est irréversible.",
    icon: XCircle,
    color: "text-red-700",
    iconBg: "bg-red-100",
    buttonVariant: "danger",
    statuts: ["dossier_preparatoire", "en_attente_complements", "en_attente_signature", "domiciliation_creee"],
    destructive: true,
    needsMotif: true,
    motifLabel: "Motif du refus",
    motifPlaceholder: "Raison précise du refus...",
  },
  {
    key: "signer",
    label: "Enregistrer la signature notariale",
    description: "Le contrat a été signé chez le notaire. Renseignez les informations contractuelles.",
    icon: Scale,
    color: "text-sky-700",
    iconBg: "bg-sky-100",
    buttonVariant: "primary",
    statuts: ["en_attente_signature"],
    needsContratData: true,
  },
  {
    key: "activer",
    label: "Activer la domiciliation",
    description: "La domiciliation est officiellement active. Le service courrier peut démarrer.",
    icon: PlayCircle,
    color: "text-emerald-700",
    iconBg: "bg-emerald-100",
    buttonVariant: "success",
    statuts: ["domiciliation_creee", "en_attente_complements"],
    needsBureau: true,
  },
  {
    key: "renouveler",
    label: "Renouveler le contrat",
    description: "Renouveler les termes du contrat de domiciliation pour une nouvelle période.",
    icon: RefreshCw,
    color: "text-sky-700",
    iconBg: "bg-sky-100",
    buttonVariant: "primary",
    statuts: ["expiree", "active"],
    needsContratData: true,
  },
  {
    key: "resilier",
    label: "Résilier la domiciliation",
    description: "Mettre fin définitivement à la domiciliation. Cette action est irréversible.",
    icon: Ban,
    color: "text-red-700",
    iconBg: "bg-red-100",
    buttonVariant: "danger",
    statuts: ["active"],
    destructive: true,
    needsMotif: true,
    motifLabel: "Motif de la résiliation",
    motifPlaceholder: "Raison de la résiliation...",
  },
];

const DEFAULT_DATE_DEBUT = new Date().toISOString().split("T")[0];
const DEFAULT_DATE_FIN = new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function ActionsTab({ demande, onAction, loading }: Props) {
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [confirmAction, setConfirmAction] = useState<ActionKey | null>(null);
  const [motif, setMotif] = useState("");
  const occupiedBureaux = useOccupiedBureaux(demande.id);

  const [contratData, setContratData] = useState({
    numeroBureau: demande.numeroBureau ?? 1,
    referenceContratNotarie: demande.referenceContratNotarie ?? "",
    dateDebutContrat: toDateInputValue(demande.dateDebutContrat as string | undefined) || DEFAULT_DATE_DEBUT,
    dateFinContrat: toDateInputValue(demande.dateFinContrat as string | undefined) || DEFAULT_DATE_FIN,
    montantMensuel: demande.montantMensuel ?? 12000,
  });

  const available = ACTION_DEFS.filter((a) => a.statuts.includes(demande.statut));

  const validate = (def: ActionDef): boolean => {
    if (def.needsMotif && !motif.trim()) {
      toast.error(`Veuillez préciser : ${def.motifLabel || "le motif"}`);
      return false;
    }
    if (def.key === "signer" && !contratData.referenceContratNotarie.trim()) {
      toast.error("La référence du contrat notarié est requise");
      return false;
    }
    if (
      (def.key === "signer" || def.needsBureau) &&
      contratData.numeroBureau &&
      occupiedBureaux.includes(contratData.numeroBureau)
    ) {
      toast.error(`Le bureau ${contratData.numeroBureau} est déjà attribué`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (def: ActionDef) => {
    if (!validate(def)) return;

    const data: ActionData = {};
    if (def.needsMotif) data.motif = motif;
    if (def.needsContratData || def.key === "signer") {
      Object.assign(data, contratData);
    }
    if (def.needsBureau) {
      data.numeroBureau = contratData.numeroBureau;
    }

    await onAction(def.key, data);
    setActiveAction(null);
    setConfirmAction(null);
    setMotif("");
  };

  const toggleAction = (key: ActionKey) => {
    setActiveAction((prev) => (prev === key ? null : key));
    setConfirmAction(null);
    setMotif("");
  };

  if (available.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">Aucune action disponible</p>
          <p className="text-sm text-gray-500 mt-1">Ce statut ne permet pas d'actions supplémentaires</p>
        </div>
      </div>
    );
  }

  const normalActions = available.filter((a) => !a.destructive);
  const destructiveActions = available.filter((a) => a.destructive);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Actions disponibles</h3>
          <p className="text-xs text-gray-500">{available.length} action{available.length > 1 ? "s" : ""} possible{available.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {normalActions.length > 0 && (
        <div className="space-y-2">
          {normalActions.map((def) => {
            const Icon = def.icon;
            const isActive = activeAction === def.key;

            return (
              <div key={def.key} className={`border rounded-xl overflow-hidden transition-all ${isActive ? "border-sky-300 shadow-sm" : "border-gray-200"}`}>
                <button
                  onClick={() => toggleAction(def.key)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${def.iconBg}`}>
                    <Icon className={`w-5 h-5 ${def.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{def.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
                  </div>
                  {isActive ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {isActive && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50/50 pt-3">
                    {(def.needsContratData || def.key === "signer") && (
                      <div className="space-y-3">
                        <BureauSelector
                          value={contratData.numeroBureau}
                          onChange={(val) => setContratData((p) => ({ ...p, numeroBureau: Number(val) }))}
                          occupiedBureaux={occupiedBureaux}
                          label="Numéro de bureau"
                        />
                        <Input
                          label="Référence contrat notarié"
                          value={contratData.referenceContratNotarie}
                          onChange={(e) => setContratData((p) => ({ ...p, referenceContratNotarie: e.target.value }))}
                          required={def.key === "signer"}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Date de début"
                            type="date"
                            value={contratData.dateDebutContrat}
                            onChange={(e) => setContratData((p) => ({ ...p, dateDebutContrat: e.target.value }))}
                          />
                          <Input
                            label="Date de fin"
                            type="date"
                            value={contratData.dateFinContrat}
                            onChange={(e) => setContratData((p) => ({ ...p, dateFinContrat: e.target.value }))}
                          />
                        </div>
                        <Input
                          label="Montant mensuel (DA)"
                          type="number"
                          value={contratData.montantMensuel.toString()}
                          onChange={(e) => setContratData((p) => ({ ...p, montantMensuel: parseInt(e.target.value) || 0 }))}
                        />
                        <ContratSummary
                          dateDebut={contratData.dateDebutContrat}
                          dateFin={contratData.dateFinContrat}
                          montantMensuel={contratData.montantMensuel}
                        />
                      </div>
                    )}

                    {def.needsBureau && !def.needsContratData && (
                      <BureauSelector
                        value={contratData.numeroBureau}
                        onChange={(val) => setContratData((p) => ({ ...p, numeroBureau: Number(val) }))}
                        occupiedBureaux={occupiedBureaux}
                        label="Numéro de bureau (optionnel)"
                        showEmpty
                      />
                    )}

                    {def.needsMotif && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {def.motifLabel} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          rows={3}
                          placeholder={def.motifPlaceholder}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm resize-none"
                        />
                      </div>
                    )}

                    <Button
                      variant={def.buttonVariant === "primary" ? "primary" : "success"}
                      size="sm"
                      onClick={() => handleSubmit(def)}
                      loading={loading}
                      className="w-full"
                    >
                      <Icon className="w-4 h-4" />
                      {def.label}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {destructiveActions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-semibold text-red-700">Zone dangereuse</h4>
          </div>
          <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/30">
            {destructiveActions.map((def, i) => {
              const Icon = def.icon;
              const isActive = activeAction === def.key;
              const isFirst = i === 0;

              return (
                <div key={def.key} className={isFirst ? "" : "border-t border-red-200"}>
                  <button
                    onClick={() => toggleAction(def.key)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-red-800 text-sm">{def.label}</p>
                      <p className="text-xs text-red-600 mt-0.5">{def.description}</p>
                    </div>
                    {isActive ? (
                      <ChevronUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                  </button>

                  {isActive && (
                    <div className="px-4 pb-4 space-y-3 border-t border-red-200 bg-red-50/50 pt-3">
                      {def.needsMotif && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {def.motifLabel} <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            rows={3}
                            placeholder={def.motifPlaceholder}
                            className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none bg-white"
                          />
                        </div>
                      )}

                      {confirmAction === def.key ? (
                        <div className="space-y-2">
                          <p className="text-xs text-red-700 font-medium text-center">
                            Êtes-vous sûr ? Cette action est irréversible.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmAction(null)}
                              className="flex-1"
                            >
                              Annuler
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleSubmit(def)}
                              loading={loading}
                              className="flex-1"
                            >
                              Confirmer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmAction(def.key)}
                          className="w-full"
                        >
                          <Icon className="w-4 h-4" />
                          {def.label}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
