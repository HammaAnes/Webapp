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
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import BureauSelector from "../components/BureauSelector";
import ContratSummary from "../components/ContratSummary";
import { useOccupiedBureaux } from "../hooks";
import { calculateContractDurationMonths } from "../utils";
import type { DemandeDomiciliation, ActionKey, ActionData } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onAction: (action: ActionKey, data?: ActionData) => Promise<void>;
  loading: boolean;
}

interface ActionDef {
  key: ActionKey;
  label: string;
  icon: React.ElementType;
  variant: "success" | "danger" | "primary";
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
    icon: CheckCircle,
    variant: "success",
    statuts: ["dossier_preparatoire"],
  },
  {
    key: "complements",
    label: "Demander des compléments",
    icon: MessageSquare,
    variant: "primary",
    statuts: ["dossier_preparatoire", "domiciliation_creee"],
    needsMotif: true,
    motifLabel: "Informations manquantes",
    motifPlaceholder: "Préciser les informations ou documents manquants...",
  },
  {
    key: "rejeter",
    label: "Refuser la demande",
    icon: XCircle,
    variant: "danger",
    statuts: [
      "dossier_preparatoire",
      "en_attente_complements",
      "en_attente_signature",
      "domiciliation_creee",
    ],
    destructive: true,
    needsMotif: true,
    motifLabel: "Motif du refus",
    motifPlaceholder: "Raison du refus...",
  },
  {
    key: "signer",
    label: "Enregistrer la signature notariale",
    icon: Scale,
    variant: "primary",
    statuts: ["en_attente_signature"],
    needsContratData: true,
  },
  {
    key: "activer",
    label: "Activer la domiciliation",
    icon: PlayCircle,
    variant: "success",
    statuts: ["domiciliation_creee", "en_attente_complements"],
    needsBureau: true,
  },
  {
    key: "renouveler",
    label: "Renouveler le contrat",
    icon: RefreshCw,
    variant: "primary",
    statuts: ["expiree", "active"],
    needsContratData: true,
  },
  {
    key: "resilier",
    label: "Résilier la domiciliation",
    icon: Ban,
    variant: "danger",
    statuts: ["active"],
    destructive: true,
    needsMotif: true,
    motifLabel: "Motif de la résiliation",
    motifPlaceholder: "Raison de la résiliation...",
  },
];

function SectionHeader({ icon: Icon, title, gradient }: { icon: React.ElementType; title: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-bold text-gray-900 text-base">{title}</h4>
    </div>
  );
}

export default function ActionsTab({ demande, onAction, loading }: Props) {
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [confirmAction, setConfirmAction] = useState<ActionKey | null>(null);
  const [motif, setMotif] = useState("");
  const occupiedBureaux = useOccupiedBureaux(demande.id);

  const [contratData, setContratData] = useState({
    numeroBureau: demande.numeroBureau || 1,
    referenceContratNotarie: demande.referenceContratNotarie || "",
    dateDebutContrat:
      demande.dateDebutContrat
        ? String(demande.dateDebutContrat).split("T")[0]
        : new Date().toISOString().split("T")[0],
    dateFinContrat:
      demande.dateFinContrat
        ? String(demande.dateFinContrat).split("T")[0]
        : new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    montantMensuel: demande.montantMensuel || 12000,
  });

  const available = ACTION_DEFS.filter((a) => a.statuts.includes(demande.statut));

  const months = calculateContractDurationMonths(
    contratData.dateDebutContrat,
    contratData.dateFinContrat
  );

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
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">
          Aucune action disponible pour ce statut
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={Scale} title="Actions disponibles" gradient="from-sky-500 to-blue-500" />

      <div className="space-y-3">
        {available.map((def) => {
          const Icon = def.icon;
          const isActive = activeAction === def.key;
          const iconBg =
            def.variant === "danger"
              ? "bg-red-100 text-red-600"
              : def.variant === "success"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-sky-100 text-sky-600";

          return (
            <div key={def.key} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleAction(def.key)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900 flex-1">{def.label}</span>
                {def.destructive && (
                  <Badge variant="danger" size="sm">
                    Irréversible
                  </Badge>
                )}
              </button>

              {isActive && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {(def.needsContratData || def.key === "signer") && (
                    <div className="space-y-3">
                      <BureauSelector
                        value={contratData.numeroBureau}
                        onChange={(val) =>
                          setContratData((p) => ({ ...p, numeroBureau: val }))
                        }
                        occupiedBureaux={occupiedBureaux}
                        label="Numéro de bureau (1-60)"
                      />
                      <Input
                        label="Référence contrat notarié"
                        value={contratData.referenceContratNotarie}
                        onChange={(e) =>
                          setContratData((p) => ({
                            ...p,
                            referenceContratNotarie: e.target.value,
                          }))
                        }
                        required={def.key === "signer"}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Date de début"
                          type="date"
                          value={contratData.dateDebutContrat}
                          onChange={(e) =>
                            setContratData((p) => ({
                              ...p,
                              dateDebutContrat: e.target.value,
                            }))
                          }
                        />
                        <Input
                          label="Date de fin"
                          type="date"
                          value={contratData.dateFinContrat}
                          onChange={(e) =>
                            setContratData((p) => ({
                              ...p,
                              dateFinContrat: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Input
                        label="Montant mensuel (DA)"
                        type="number"
                        value={contratData.montantMensuel.toString()}
                        onChange={(e) =>
                          setContratData((p) => ({
                            ...p,
                            montantMensuel: parseInt(e.target.value) || 0,
                          }))
                        }
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
                      onChange={(val) =>
                        setContratData((p) => ({ ...p, numeroBureau: val }))
                      }
                      occupiedBureaux={occupiedBureaux}
                      label="Numéro de bureau (1-60) — optionnel"
                    />
                  )}

                  {def.needsMotif && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {def.motifLabel}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        rows={3}
                        placeholder={def.motifPlaceholder}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  )}

                  {def.destructive ? (
                    confirmAction === def.key ? (
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
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setConfirmAction(def.key)}
                        className="w-full"
                      >
                        {def.label}
                      </Button>
                    )
                  ) : (
                    <Button
                      variant={def.variant === "success" ? "success" : "primary"}
                      size="sm"
                      onClick={() => handleSubmit(def)}
                      loading={loading}
                      className="w-full"
                    >
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
  );
}
