import React, { useReducer, useEffect } from "react";
import { Building2, Save, User, ChevronLeft, ChevronRight, Check, Users } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import { apiClient } from "../../lib/api-client";
import { UserSelector, type SelectedUser } from "./UserSelector";
import BureauSelector from "../../features/domiciliation/components/BureauSelector";
import ContratSummary from "../../features/domiciliation/components/ContratSummary";
import { useOccupiedBureaux } from "../../features/domiciliation/hooks";
import { FORMES_JURIDIQUES, OPTIONS_DOMICILIATION } from "../../features/domiciliation/constants";
import { calculateContractDurationMonths } from "../../features/domiciliation/utils";
import type { DomiciliationOptions } from "../../features/domiciliation/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (createdId?: string) => void;
}

type Step = "user" | "info" | "contrat" | "confirm";

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: "user", label: "Client", num: 1 },
  { id: "info", label: "Entreprise", num: 2 },
  { id: "contrat", label: "Contrat", num: 3 },
  { id: "confirm", label: "Confirmation", num: 4 },
];

interface FormState {
  step: Step;
  selectedUser: SelectedUser | null;
  situationAdministrative: "en_cours_creation" | "deja_creee";
  typeStructure: "societe" | "auto_entrepreneur";
  raisonSociale: string;
  formeJuridique: string;
  nif: string;
  nis: string;
  registreCommerce: string;
  articleImposition: string;
  codeNae: string;
  activiteExercee: string;
  numeroAutoEntrepreneur: string;
  repNom: string;
  repPrenom: string;
  repTel: string;
  repEmail: string;
  repVille: string;
  repAdresse: string;
  repFonction: string;
  numeroBureau: number;
  referenceContratNotarie: string;
  dateDebutContrat: string;
  dateFinContrat: string;
  montantMensuel: number;
  options: DomiciliationOptions;
}

const INITIAL_STATE: FormState = {
  step: "user",
  selectedUser: null,
  situationAdministrative: "en_cours_creation",
  typeStructure: "societe",
  raisonSociale: "",
  formeJuridique: "SARL",
  nif: "",
  nis: "",
  registreCommerce: "",
  articleImposition: "",
  codeNae: "",
  activiteExercee: "",
  numeroAutoEntrepreneur: "",
  repNom: "",
  repPrenom: "",
  repTel: "",
  repEmail: "",
  repVille: "",
  repAdresse: "",
  repFonction: "",
  numeroBureau: 0,
  referenceContratNotarie: "",
  dateDebutContrat: new Date().toISOString().split("T")[0],
  dateFinContrat: new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  montantMensuel: 12000,
  options: {
    domiciliationSimple: true,
    receptionCourrier: false,
    scanNotificationEmail: false,
    reexpeditionCourrier: false,
    accesPonctuelEspaces: false,
  },
};

type Action =
  | { type: "RESET" }
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_USER"; payload: SelectedUser | null }
  | { type: "SET_FIELD"; field: keyof FormState; value: unknown }
  | { type: "TOGGLE_OPTION"; key: keyof DomiciliationOptions };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "RESET":
      return INITIAL_STATE;
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_USER": {
      const u = action.payload;
      return {
        ...state,
        selectedUser: u,
        repNom: u?.nom || state.repNom,
        repPrenom: u?.prenom || state.repPrenom,
        repTel: u?.telephone || state.repTel,
        repEmail: u?.email || state.repEmail,
      };
    }
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "TOGGLE_OPTION":
      return {
        ...state,
        options: { ...state.options, [action.key]: !state.options[action.key] },
      };
    default:
      return state;
  }
}

export default function AdminCreateDomiciliationModal({ isOpen, onClose, onCreated }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [submitting, setSubmitting] = React.useState(false);
  const occupiedBureaux = useOccupiedBureaux();

  useEffect(() => {
    if (isOpen) dispatch({ type: "RESET" });
  }, [isOpen]);

  const set = (field: keyof FormState, value: unknown) =>
    dispatch({ type: "SET_FIELD", field, value });

  const currentStepIdx = STEPS.findIndex((s) => s.id === state.step);

  const canGoNext = () => {
    if (state.step === "user") return !!state.selectedUser;
    if (state.step === "info")
      return !!state.raisonSociale.trim() && !!state.repNom.trim() && !!state.repPrenom.trim();
    return true;
  };

  const goNext = () => {
    if (currentStepIdx < STEPS.length - 1) {
      dispatch({ type: "SET_STEP", payload: STEPS[currentStepIdx + 1].id });
    }
  };
  const goBack = () => {
    if (currentStepIdx > 0) {
      dispatch({ type: "SET_STEP", payload: STEPS[currentStepIdx - 1].id });
    }
  };

  const months = calculateContractDurationMonths(state.dateDebutContrat, state.dateFinContrat);
  const montantTotal = state.montantMensuel * months;

  const handleSubmit = async () => {
    if (!state.selectedUser) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        userId: state.selectedUser.id,
        situationAdministrative: state.situationAdministrative,
        typeStructure: state.typeStructure,
        raisonSociale: state.raisonSociale,
        formeJuridique: state.formeJuridique || undefined,
        nif: state.nif || undefined,
        nis: state.nis || undefined,
        registreCommerce: state.registreCommerce || undefined,
        articleImposition: state.articleImposition || undefined,
        codeNae: state.codeNae || undefined,
        activiteExercee: state.activiteExercee || undefined,
        numeroAutoEntrepreneur: state.numeroAutoEntrepreneur || undefined,
        representantLegal: {
          nom: state.repNom,
          prenom: state.repPrenom,
          telephone: state.repTel,
          email: state.repEmail,
          ville: state.repVille,
          adresseResidence: state.repAdresse,
          fonction: state.repFonction || undefined,
        },
        options: state.options,
        cguAcceptees: true,
        dateDebutSouhaitee: state.dateDebutContrat || undefined,
      };

      if (state.numeroBureau > 0) payload.numeroBureau = state.numeroBureau;
      if (state.referenceContratNotarie) payload.referenceContratNotarie = state.referenceContratNotarie;
      if (state.dateDebutContrat) payload.dateDebutContrat = state.dateDebutContrat;
      if (state.dateFinContrat) payload.dateFinContrat = state.dateFinContrat;
      if (state.montantMensuel) payload.montantMensuel = state.montantMensuel;

      const res = await apiClient.createDemandeDomiciliation(payload);
      if ((res as { success: boolean }).success) {
        toast.success("Domiciliation créée avec succès");
        const createdId = (res as { data?: { id?: string } }).data?.id;
        onCreated(createdId);
        onClose();
      } else {
        toast.error((res as { error?: string }).error || "Erreur lors de la création");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" noPadding>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nouvelle domiciliation</h3>
            <p className="text-sm text-gray-500">Créer une domiciliation pour un client</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const isActive = s.id === state.step;
            const isPast = currentStepIdx > i;
            return (
              <React.Fragment key={s.id}>
                {i > 0 && (
                  <div className={`flex-1 h-0.5 ${isPast ? "bg-amber-400" : "bg-gray-200"}`} />
                )}
                <button
                  onClick={() => isPast && dispatch({ type: "SET_STEP", payload: s.id })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-500 text-white"
                      : isPast
                      ? "bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200"
                      : "text-gray-400 cursor-default"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isActive
                        ? "bg-white text-amber-600"
                        : isPast
                        ? "bg-amber-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
        {state.step === "user" && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Sélectionner ou créer un client</p>
                <p className="text-xs text-blue-700 mt-1">
                  Recherchez parmi les utilisateurs existants. Si le client n'a pas encore de compte, cliquez sur "Nouveau" pour créer un contact et générer ses accès.
                </p>
              </div>
            </div>
            <UserSelector
              value={state.selectedUser}
              onChange={(u) => dispatch({ type: "SET_USER", payload: u })}
              label="Client"
              required
            />
          </div>
        )}

        {state.step === "info" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Situation administrative
                </label>
                <select
                  value={state.situationAdministrative}
                  onChange={(e) =>
                    set("situationAdministrative", e.target.value as "en_cours_creation" | "deja_creee")
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-sm"
                >
                  <option value="en_cours_creation">En cours de création</option>
                  <option value="deja_creee">Déjà créée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de structure
                </label>
                <select
                  value={state.typeStructure}
                  onChange={(e) =>
                    set("typeStructure", e.target.value as "societe" | "auto_entrepreneur")
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-sm"
                >
                  <option value="societe">Société</option>
                  <option value="auto_entrepreneur">Auto-entrepreneur</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Raison sociale / Dénomination"
                value={state.raisonSociale}
                onChange={(e) => set("raisonSociale", e.target.value)}
                required
              />
              {state.typeStructure === "societe" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Forme juridique
                  </label>
                  <select
                    value={state.formeJuridique}
                    onChange={(e) => set("formeJuridique", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-sm"
                  >
                    {FORMES_JURIDIQUES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}
              {state.typeStructure === "societe" && (
                <>
                  <Input label="NIF" value={state.nif} onChange={(e) => set("nif", e.target.value)} maxLength={20} />
                  <Input label="NIS" value={state.nis} onChange={(e) => set("nis", e.target.value)} maxLength={15} />
                  <Input label="Registre de commerce" value={state.registreCommerce} onChange={(e) => set("registreCommerce", e.target.value)} />
                  <Input label="Article d'imposition" value={state.articleImposition} onChange={(e) => set("articleImposition", e.target.value)} />
                  <Input label="Code NAE" value={state.codeNae} onChange={(e) => set("codeNae", e.target.value)} />
                </>
              )}
              {state.typeStructure === "auto_entrepreneur" && (
                <>
                  <Input label="N° Auto-entrepreneur" value={state.numeroAutoEntrepreneur} onChange={(e) => set("numeroAutoEntrepreneur", e.target.value)} />
                  <Input label="Activité exercée" value={state.activiteExercee} onChange={(e) => set("activiteExercee", e.target.value)} />
                </>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                Représentant légal
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" value={state.repPrenom} onChange={(e) => set("repPrenom", e.target.value)} required />
                <Input label="Nom" value={state.repNom} onChange={(e) => set("repNom", e.target.value)} required />
                <Input label="Téléphone" value={state.repTel} onChange={(e) => set("repTel", e.target.value)} />
                <Input label="Email" value={state.repEmail} onChange={(e) => set("repEmail", e.target.value)} />
                <Input label="Fonction" value={state.repFonction} onChange={(e) => set("repFonction", e.target.value)} placeholder="Ex : Gérant" />
                <Input label="Ville" value={state.repVille} onChange={(e) => set("repVille", e.target.value)} />
                <div className="col-span-2">
                  <Input label="Adresse de résidence" value={state.repAdresse} onChange={(e) => set("repAdresse", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Services souhaités</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OPTIONS_DOMICILIATION.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={state.options[opt.key]}
                      onChange={() => dispatch({ type: "TOGGLE_OPTION", key: opt.key })}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.step === "contrat" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Ces informations peuvent être renseignées maintenant ou plus tard depuis la fiche de domiciliation.
            </div>
            <BureauSelector
              value={state.numeroBureau}
              onChange={(val) => set("numeroBureau", val)}
              occupiedBureaux={occupiedBureaux}
              showEmpty
              label="Numéro de bureau (optionnel)"
            />
            <Input
              label="Référence contrat notarié (optionnel)"
              value={state.referenceContratNotarie}
              onChange={(e) => set("referenceContratNotarie", e.target.value)}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Date début" type="date" value={state.dateDebutContrat} onChange={(e) => set("dateDebutContrat", e.target.value)} />
              <Input label="Date fin" type="date" value={state.dateFinContrat} onChange={(e) => set("dateFinContrat", e.target.value)} />
              <Input label="Montant mensuel (DA)" type="number" value={state.montantMensuel.toString()} onChange={(e) => set("montantMensuel", parseInt(e.target.value) || 0)} />
            </div>
            {state.dateDebutContrat && state.dateFinContrat && state.montantMensuel > 0 && (
              <ContratSummary
                dateDebut={state.dateDebutContrat}
                dateFin={state.dateFinContrat}
                montantMensuel={state.montantMensuel}
              />
            )}
          </div>
        )}

        {state.step === "confirm" && state.selectedUser && (
          <Card className="p-5 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-4">Récapitulatif</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Client</p>
                <p className="font-semibold text-gray-900">{state.selectedUser.prenom} {state.selectedUser.nom}</p>
                <p className="text-xs text-gray-500">{state.selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Structure</p>
                <p className="font-semibold text-gray-900">{state.raisonSociale}</p>
                <p className="text-xs text-gray-500">{state.typeStructure === "auto_entrepreneur" ? "Auto-entrepreneur" : state.formeJuridique}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Situation</p>
                <Badge variant={state.situationAdministrative === "en_cours_creation" ? "warning" : "info"} size="sm">
                  {state.situationAdministrative === "en_cours_creation" ? "En cours de création" : "Déjà créée"}
                </Badge>
              </div>
              {state.numeroBureau > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bureau</p>
                  <p className="font-bold text-amber-700">N°{state.numeroBureau}</p>
                </div>
              )}
              {state.montantMensuel > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Montant</p>
                  <p className="font-semibold text-gray-900">{state.montantMensuel.toLocaleString("fr-DZ")} DA/mois</p>
                  {months > 0 && (
                    <p className="text-xs text-emerald-600 font-medium">Total : {montantTotal.toLocaleString("fr-DZ")} DA ({months} mois)</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Représentant</p>
                <p className="font-semibold text-gray-900">{state.repPrenom} {state.repNom}</p>
                <p className="text-xs text-gray-500">{state.repEmail}{state.repTel && ` / ${state.repTel}`}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONS_DOMICILIATION.filter((o) => state.options[o.key]).map((o) => (
                    <Badge key={o.key} variant="info" size="sm">{o.label}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          {state.step !== "user" && (
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          {state.step === "confirm" ? (
            <Button onClick={handleSubmit} loading={submitting} disabled={!state.selectedUser}>
              <Save className="w-4 h-4" /> Créer la domiciliation
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext()}>
              Suivant <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
