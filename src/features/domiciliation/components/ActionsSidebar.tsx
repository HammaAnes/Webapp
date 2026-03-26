import React, { useState, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  PlayCircle,
  RefreshCw,
  Ban,
  MessageSquare,
  Scale,
  AlertTriangle,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import BureauSelector from "./BureauSelector";
import ContratSummary from "./ContratSummary";
import ActionHistoryLog from "./ActionHistoryLog";
import { useOccupiedBureaux } from "../hooks";
import { toDateInputValue } from "../utils";
import { apiClient } from "../../../lib/api-client";
import type { DemandeDomiciliation, ActionKey, ActionData } from "../../../domiciliation/domain/types";

interface Props {
  demande: DemandeDomiciliation;
  onAction: (action: ActionKey, data?: ActionData) => Promise<void>;
  loading: boolean;
}

const DEFAULT_DATE_DEBUT = new Date().toISOString().split("T")[0];
const DEFAULT_DATE_FIN = new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

function SidebarSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h4>
      )}
      {children}
    </div>
  );
}

export default function ActionsSidebar({ demande, onAction, loading }: Props) {
  const [openAction, setOpenAction] = useState<ActionKey | null>(null);
  const [confirmDestructive, setConfirmDestructive] = useState<ActionKey | null>(null);
  const [motif, setMotif] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractUploading, setContractUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const occupiedBureaux = useOccupiedBureaux(demande.id);

  const [contratData, setContratData] = useState({
    numeroBureau: demande.numeroBureau ?? undefined,
    referenceContratNotarie: demande.referenceContratNotarie ?? "",
    dateDebutContrat: toDateInputValue(demande.dateDebutContrat as string | undefined) || DEFAULT_DATE_DEBUT,
    dateFinContrat: toDateInputValue(demande.dateFinContrat as string | undefined) || DEFAULT_DATE_FIN,
    montantMensuel: demande.montantMensuel ?? 0,
  });

  const statut = demande.statut;

  const toggle = (key: ActionKey) => {
    setOpenAction((prev) => (prev === key ? null : key));
    setConfirmDestructive(null);
    setMotif("");
    if (key !== "signer") setContractFile(null);
  };

  const handleAction = async (action: ActionKey, data?: ActionData) => {
    try {
      await onAction(action, data);
      setOpenAction(null);
      setConfirmDestructive(null);
      setMotif("");
    } catch {
      // error handled upstream
    }
  };

  const validateAndSubmit = async (action: ActionKey) => {
    if ((action === "rejeter" || action === "resilier" || action === "complements") && !motif.trim()) {
      toast.error("Veuillez préciser le motif");
      return;
    }
    if (action === "signer" && !contratData.referenceContratNotarie.trim()) {
      toast.error("La référence du contrat notarié est requise");
      return;
    }
    if (
      (action === "signer" || action === "activer") &&
      contratData.numeroBureau &&
      occupiedBureaux.includes(contratData.numeroBureau)
    ) {
      toast.error(`Le bureau ${contratData.numeroBureau} est déjà attribué`);
      return;
    }

    const data: ActionData = {};
    if (motif) data.motif = motif;
    if (["signer", "activer", "renouveler"].includes(action)) {
      Object.assign(data, contratData);
    }

    if (action === "rejeter" || action === "resilier") {
      if (confirmDestructive !== action) {
        setConfirmDestructive(action);
        return;
      }
    }

    await handleAction(action, data);

    // Upload du contrat scanné après la signature
    if (action === "signer" && contractFile) {
      setContractUploading(true);
      try {
        await apiClient.uploadDocument(contractFile, "domiciliation", demande.id, "contrat");
        toast.success("Contrat scanné téléversé avec succès");
        setContractFile(null);
      } catch {
        toast.error("Erreur lors du téléversement du contrat — veuillez le téléverser manuellement dans l'onglet Documents");
      } finally {
        setContractUploading(false);
      }
    }
  };

  const canValider = ["dossier_preparatoire", "en_attente_complements"].includes(statut);
  const canComplements = ["dossier_preparatoire", "en_attente_signature"].includes(statut);
  const canRejeter = ["dossier_preparatoire", "en_attente_complements", "en_attente_signature"].includes(statut);
  const canSigner = statut === "en_attente_signature";
  const canActiver = statut === "domiciliation_creee";
  const canRenouveler = ["expiree", "active"].includes(statut);
  const canResilier = statut === "active";

  const hasNormalActions = canValider || canComplements || canSigner || canActiver || canRenouveler;
  const hasDestructiveActions = canRejeter || canResilier;
  const hasAnyAction = hasNormalActions || hasDestructiveActions;

  return (
    <div className="space-y-5">
      {!hasAnyAction ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Aucune action disponible</p>
          <p className="text-xs text-gray-400 mt-1">Ce statut ne permet pas d'actions supplémentaires</p>
        </div>
      ) : (
        <>
          {hasNormalActions && (
            <SidebarSection>
              <div className="space-y-2">
                {canValider && (
                  <ActionBlock
                    actionKey="valider"
                    label="Valider le dossier"
                    desc="Passe en attente de signature notariale"
                    icon={CheckCircle}
                    colorClass="bg-emerald-500 hover:bg-emerald-600"
                    open={openAction === "valider"}
                    onToggle={() => toggle("valider")}
                    loading={loading}
                    onSubmit={() => handleAction("valider")}
                  />
                )}

                {canSigner && (
                  <div className="border border-sky-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle("signer")}
                      className="w-full flex items-center gap-3 p-3.5 hover:bg-sky-50 transition-colors text-left"
                    >
                      <Scale className="w-5 h-5 text-sky-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">Enregistrer la signature</p>
                        <p className="text-xs text-gray-500 mt-0.5">Contrat notarié signé</p>
                      </div>
                    </button>
                    {openAction === "signer" && (
                      <div className="px-4 pb-4 pt-3 border-t border-sky-100 bg-sky-50/30 space-y-3">
                        <BureauSelector
                          value={contratData.numeroBureau?.toString() ?? ""}
                          onChange={(v) => setContratData((p) => ({ ...p, numeroBureau: Number(v) || undefined }))}
                          occupiedBureaux={occupiedBureaux}
                          label="Numéro de bureau *"
                          showEmpty
                        />
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Réf. contrat notarié *</label>
                          <input
                            type="text"
                            value={contratData.referenceContratNotarie}
                            onChange={(e) => setContratData((p) => ({ ...p, referenceContratNotarie: e.target.value }))}
                            placeholder="CONT-2026-001"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Date début</label>
                            <input type="date" value={contratData.dateDebutContrat} onChange={(e) => setContratData((p) => ({ ...p, dateDebutContrat: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Date fin</label>
                            <input type="date" value={contratData.dateFinContrat} onChange={(e) => setContratData((p) => ({ ...p, dateFinContrat: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Montant (DA/mois)</label>
                          <input type="number" value={contratData.montantMensuel} onChange={(e) => setContratData((p) => ({ ...p, montantMensuel: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400" />
                        </div>
                        <ContratSummary dateDebut={contratData.dateDebutContrat} dateFin={contratData.dateFinContrat} montantMensuel={contratData.montantMensuel} />
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Contrat scanné <span className="text-gray-400 font-normal">(PDF ou image — facultatif)</span>
                          </label>
                          <label className={`flex items-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${contractFile ? "border-sky-400 bg-sky-50" : "border-gray-200 hover:border-sky-300 hover:bg-sky-50/50"}`}>
                            <Upload className="w-4 h-4 text-sky-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate flex-1">
                              {contractFile ? contractFile.name : "Choisir le contrat notarié scanné…"}
                            </span>
                            {contractFile && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setContractFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                            />
                          </label>
                          {contractFile && (
                            <p className="text-xs text-sky-600 mt-1">
                              ✓ {(contractFile.size / 1024).toFixed(0)} Ko sélectionné
                            </p>
                          )}
                        </div>
                        <Button variant="primary" size="sm" className="w-full" onClick={() => validateAndSubmit("signer")} loading={loading || contractUploading}>
                          <Scale className="w-4 h-4" /> {contractUploading ? "Téléversement en cours…" : "Confirmer la signature"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {canActiver && (
                  <ActionBlock
                    actionKey="activer"
                    label="Activer la domiciliation"
                    desc="Démarre le service de domiciliation"
                    icon={PlayCircle}
                    colorClass="bg-emerald-500 hover:bg-emerald-600"
                    open={openAction === "activer"}
                    onToggle={() => toggle("activer")}
                    loading={loading}
                    onSubmit={() => validateAndSubmit("activer")}
                  />
                )}

                {canComplements && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle("complements")}
                      className="w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <MessageSquare className="w-5 h-5 text-sky-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">Demander des compléments</p>
                        <p className="text-xs text-gray-500 mt-0.5">Le client sera notifié</p>
                      </div>
                    </button>
                    {openAction === "complements" && (
                      <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50 space-y-3">
                        <MotifField value={motif} onChange={setMotif} label="Informations manquantes *" placeholder="Préciser les documents ou informations requis..." />
                        <Button variant="primary" size="sm" className="w-full" onClick={() => validateAndSubmit("complements")} loading={loading}>
                          <MessageSquare className="w-4 h-4" /> Envoyer la demande
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {canRenouveler && (
                  <div className="border border-sky-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle("renouveler")}
                      className="w-full flex items-center gap-3 p-3.5 hover:bg-sky-50 transition-colors text-left"
                    >
                      <RefreshCw className="w-5 h-5 text-sky-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">Renouveler le contrat</p>
                        <p className="text-xs text-gray-500 mt-0.5">Nouvelles dates + montant</p>
                      </div>
                    </button>
                    {openAction === "renouveler" && (
                      <div className="px-4 pb-4 pt-3 border-t border-sky-100 bg-sky-50/30 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Date début</label>
                            <input type="date" value={contratData.dateDebutContrat} onChange={(e) => setContratData((p) => ({ ...p, dateDebutContrat: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Date fin</label>
                            <input type="date" value={contratData.dateFinContrat} onChange={(e) => setContratData((p) => ({ ...p, dateFinContrat: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Montant (DA/mois)</label>
                          <input type="number" value={contratData.montantMensuel} onChange={(e) => setContratData((p) => ({ ...p, montantMensuel: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
                        </div>
                        <ContratSummary dateDebut={contratData.dateDebutContrat} dateFin={contratData.dateFinContrat} montantMensuel={contratData.montantMensuel} />
                        <Button variant="primary" size="sm" className="w-full" onClick={() => validateAndSubmit("renouveler")} loading={loading}>
                          <RefreshCw className="w-4 h-4" /> Confirmer le renouvellement
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SidebarSection>
          )}

          {hasDestructiveActions && (
            <SidebarSection>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-600">Zone dangereuse</span>
              </div>
              <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/20 space-y-0">
                {canRejeter && (
                  <div>
                    <button
                      onClick={() => toggle("rejeter")}
                      className="w-full flex items-center gap-3 p-3.5 hover:bg-red-50 transition-colors text-left"
                    >
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-red-800 text-sm">Refuser la demande</p>
                        <p className="text-xs text-red-500 mt-0.5">Action irréversible</p>
                      </div>
                    </button>
                    {openAction === "rejeter" && (
                      <div className="px-4 pb-4 pt-3 border-t border-red-200 bg-red-50/50 space-y-3">
                        <MotifField value={motif} onChange={setMotif} label="Motif du refus *" placeholder="Raison précise du refus..." danger />
                        {confirmDestructive === "rejeter" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-red-700 font-medium text-center">Confirmer le refus ? Action irréversible.</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDestructive(null)}>Annuler</Button>
                              <Button variant="danger" size="sm" className="flex-1" onClick={() => handleAction("rejeter", { motif })} loading={loading}>Confirmer</Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="danger" size="sm" className="w-full" onClick={() => validateAndSubmit("rejeter")} loading={loading}>
                            <XCircle className="w-4 h-4" /> Refuser
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {canRejeter && canResilier && <div className="border-t border-red-200" />}
                {canResilier && (
                  <div>
                    <button
                      onClick={() => toggle("resilier")}
                      className="w-full flex items-center gap-3 p-3.5 hover:bg-red-50 transition-colors text-left"
                    >
                      <Ban className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-red-800 text-sm">Résilier la domiciliation</p>
                        <p className="text-xs text-red-500 mt-0.5">Action irréversible</p>
                      </div>
                    </button>
                    {openAction === "resilier" && (
                      <div className="px-4 pb-4 pt-3 border-t border-red-200 bg-red-50/50 space-y-3">
                        <MotifField value={motif} onChange={setMotif} label="Motif de la résiliation *" placeholder="Raison de la résiliation..." danger />
                        {confirmDestructive === "resilier" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-red-700 font-medium text-center">Confirmer la résiliation ? Action irréversible.</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDestructive(null)}>Annuler</Button>
                              <Button variant="danger" size="sm" className="flex-1" onClick={() => handleAction("resilier", { motif })} loading={loading}>Confirmer</Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="danger" size="sm" className="w-full" onClick={() => validateAndSubmit("resilier")} loading={loading}>
                            <Ban className="w-4 h-4" /> Résilier
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SidebarSection>
          )}
        </>
      )}

      <SidebarSection title="Historique récent">
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
          <ActionHistoryLog demande={demande} compact />
        </div>
      </SidebarSection>
    </div>
  );
}

function ActionBlock({
  actionKey,
  label,
  desc,
  icon: Icon,
  colorClass,
  open,
  onToggle,
  loading,
  onSubmit,
}: {
  actionKey: ActionKey;
  label: string;
  desc: string;
  icon: React.ElementType;
  colorClass: string;
  open: boolean;
  onToggle: () => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        <Icon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
          <Button
            variant="success"
            size="sm"
            className="w-full"
            onClick={onSubmit}
            loading={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            {label}
          </Button>
        </div>
      )}
    </div>
  );
}

function MotifField({
  value,
  onChange,
  label,
  placeholder,
  danger = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
  danger?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 text-sm resize-none bg-white ${
          danger
            ? "border-red-200 focus:ring-red-400 focus:border-red-400"
            : "border-gray-200 focus:ring-sky-400 focus:border-sky-400"
        }`}
      />
    </div>
  );
}
