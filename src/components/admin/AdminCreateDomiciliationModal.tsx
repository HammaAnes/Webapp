import React, { useState, useEffect } from "react";
import { Building, Save, User, ChevronLeft, ChevronRight, Check } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import { apiClient } from "../../lib/api-client";
import { UserSelector, type SelectedUser } from "./UserSelector";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "user" | "info" | "contrat" | "confirm";

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: "user", label: "Utilisateur", num: 1 },
  { id: "info", label: "Entreprise", num: 2 },
  { id: "contrat", label: "Contrat", num: 3 },
  { id: "confirm", label: "Confirmation", num: 4 },
];

const FORMES_JURIDIQUES = ["SARL", "EURL", "SPA", "SNC", "SCS", "SCA", "Micro-entreprise", "Autre"];

export default function AdminCreateDomiciliationModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("user");
  const [submitting, setSubmitting] = useState(false);

  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const [situationAdministrative, setSituationAdministrative] = useState<"en_cours_creation" | "deja_creee">("en_cours_creation");
  const [typeStructure, setTypeStructure] = useState<"societe" | "auto_entrepreneur">("societe");
  const [info, setInfo] = useState({
    raisonSociale: "", formeJuridique: "SARL", nif: "", nis: "", registreCommerce: "",
    articleImposition: "", codeNae: "", activiteExercee: "", numeroAutoEntrepreneur: "",
    repNom: "", repPrenom: "", repTel: "", repEmail: "", repVille: "", repAdresse: "", repFonction: "",
  });

  const [contrat, setContrat] = useState({
    numeroBureau: "",
    referenceContratNotarie: "",
    dateDebutContrat: new Date().toISOString().split("T")[0],
    dateFinContrat: new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    montantMensuel: "12000",
  });

  const [options, setOptions] = useState({
    domiciliationSimple: true, receptionCourrier: false,
    scanNotificationEmail: false, reexpeditionCourrier: false, accesPonctuelEspaces: false,
  });

  const [occupiedBureaux, setOccupiedBureaux] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep("user");
      setSelectedUser(null);
      setSituationAdministrative("en_cours_creation");
      setTypeStructure("societe");
      setInfo({ raisonSociale: "", formeJuridique: "SARL", nif: "", nis: "", registreCommerce: "", articleImposition: "", codeNae: "", activiteExercee: "", numeroAutoEntrepreneur: "", repNom: "", repPrenom: "", repTel: "", repEmail: "", repVille: "", repAdresse: "", repFonction: "" });
      setContrat({ numeroBureau: "", referenceContratNotarie: "", dateDebutContrat: new Date().toISOString().split("T")[0], dateFinContrat: new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], montantMensuel: "12000" });
      setOptions({ domiciliationSimple: true, receptionCourrier: false, scanNotificationEmail: false, reexpeditionCourrier: false, accesPonctuelEspaces: false });

      apiClient.getDomiciliations().then(res => {
        if (res.success && res.data) {
          const all = (Array.isArray(res.data) ? res.data : (res.data as Record<string, unknown>).data as unknown[] || []) as Record<string, unknown>[];
          const occupied = all
            .filter(d => ["active", "domiciliation_creee", "en_attente_complements", "en_attente_signature"].includes(String(d.statut || "")) && d.numero_bureau)
            .map(d => Number(d.numero_bureau));
          setOccupiedBureaux(occupied);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleUserSelected = (u: SelectedUser | null) => {
    setSelectedUser(u);
    if (u) {
      setInfo(prev => ({ ...prev, repNom: u.nom, repPrenom: u.prenom, repTel: u.telephone || "", repEmail: u.email }));
    }
  };

  const mois = contrat.dateDebutContrat && contrat.dateFinContrat
    ? Math.max(1, Math.round((new Date(contrat.dateFinContrat).getTime() - new Date(contrat.dateDebutContrat).getTime()) / (30.44 * 24 * 60 * 60 * 1000)))
    : 6;
  const montantTotal = contrat.montantMensuel ? Number(contrat.montantMensuel) * mois : 0;

  const canGoToInfo = !!selectedUser;
  const canGoToContrat = canGoToInfo && info.raisonSociale.trim() && info.repNom.trim() && info.repPrenom.trim();
  const canSubmit = canGoToContrat;

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        userId: selectedUser.id,
        situationAdministrative,
        typeStructure,
        raisonSociale: info.raisonSociale,
        formeJuridique: info.formeJuridique,
        nif: info.nif || undefined,
        nis: info.nis || undefined,
        registreCommerce: info.registreCommerce || undefined,
        articleImposition: info.articleImposition || undefined,
        codeNae: info.codeNae || undefined,
        activiteExercee: info.activiteExercee || undefined,
        numeroAutoEntrepreneur: info.numeroAutoEntrepreneur || undefined,
        representantLegal: {
          nom: info.repNom, prenom: info.repPrenom, telephone: info.repTel,
          email: info.repEmail, ville: info.repVille, adresseResidence: info.repAdresse,
          fonction: info.repFonction,
        },
        options,
        cguAcceptees: true,
        dateDebutSouhaitee: contrat.dateDebutContrat || undefined,
      };

      if (contrat.numeroBureau) payload.numeroBureau = Number(contrat.numeroBureau);
      if (contrat.referenceContratNotarie) payload.referenceContratNotarie = contrat.referenceContratNotarie;
      if (contrat.dateDebutContrat) payload.dateDebutContrat = contrat.dateDebutContrat;
      if (contrat.dateFinContrat) payload.dateFinContrat = contrat.dateFinContrat;
      if (contrat.montantMensuel) payload.montantMensuel = Number(contrat.montantMensuel);

      const res = await apiClient.createDemandeDomiciliation(payload);
      if (res.success) {
        toast.success("Domiciliation creee avec succes");
        onCreated();
        onClose();
      } else {
        toast.error(res.error || "Erreur lors de la creation");
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setSubmitting(false); }
  };

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };
  const goBack = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" noPadding>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nouvelle domiciliation</h3>
            <p className="text-sm text-gray-500">Creer une domiciliation pour un client</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isActive = s.id === step;
            const isPast = STEPS.findIndex(x => x.id === step) > i;
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <div className={`flex-1 h-0.5 ${isPast ? "bg-amber-400" : "bg-gray-200"}`} />}
                <button
                  onClick={() => {
                    if (isPast) setStep(s.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-amber-500 text-white" : isPast ? "bg-amber-100 text-amber-700 cursor-pointer" : "text-gray-400 cursor-default"}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-white text-amber-600" : isPast ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"}`}>
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
        {step === "user" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Recherchez un client existant ou créez-en un nouveau via "Nouveau".
            </p>
            <UserSelector
              value={selectedUser}
              onChange={handleUserSelected}
              label="Client"
              required
            />
          </div>
        )}

        {step === "info" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Situation administrative</label>
                <select value={situationAdministrative} onChange={(e) => setSituationAdministrative(e.target.value as "en_cours_creation" | "deja_creee")} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
                  <option value="en_cours_creation">En cours de creation</option>
                  <option value="deja_creee">Deja creee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de structure</label>
                <select value={typeStructure} onChange={(e) => setTypeStructure(e.target.value as "societe" | "auto_entrepreneur")} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
                  <option value="societe">Societe</option>
                  <option value="auto_entrepreneur">Auto-entrepreneur</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Raison sociale / Denomination" value={info.raisonSociale} onChange={(e) => setInfo({ ...info, raisonSociale: e.target.value })} required />
              {typeStructure === "societe" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
                  <select value={info.formeJuridique} onChange={(e) => setInfo({ ...info, formeJuridique: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
                    {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              {typeStructure === "societe" && (
                <>
                  <Input label="NIF" value={info.nif} onChange={(e) => setInfo({ ...info, nif: e.target.value })} maxLength={20} />
                  <Input label="NIS" value={info.nis} onChange={(e) => setInfo({ ...info, nis: e.target.value })} maxLength={15} />
                  <Input label="Registre Commerce" value={info.registreCommerce} onChange={(e) => setInfo({ ...info, registreCommerce: e.target.value })} />
                  <Input label="Article Imposition" value={info.articleImposition} onChange={(e) => setInfo({ ...info, articleImposition: e.target.value })} />
                  <Input label="Code NAE" value={info.codeNae} onChange={(e) => setInfo({ ...info, codeNae: e.target.value })} />
                </>
              )}
              {typeStructure === "auto_entrepreneur" && (
                <>
                  <Input label="N. Auto-entrepreneur" value={info.numeroAutoEntrepreneur} onChange={(e) => setInfo({ ...info, numeroAutoEntrepreneur: e.target.value })} />
                  <Input label="Activite exercee" value={info.activiteExercee} onChange={(e) => setInfo({ ...info, activiteExercee: e.target.value })} />
                </>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-sky-600" /> Representant legal</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prenom" value={info.repPrenom} onChange={(e) => setInfo({ ...info, repPrenom: e.target.value })} required />
                <Input label="Nom" value={info.repNom} onChange={(e) => setInfo({ ...info, repNom: e.target.value })} required />
                <Input label="Telephone" value={info.repTel} onChange={(e) => setInfo({ ...info, repTel: e.target.value })} />
                <Input label="Email" value={info.repEmail} onChange={(e) => setInfo({ ...info, repEmail: e.target.value })} />
                <Input label="Fonction" value={info.repFonction} onChange={(e) => setInfo({ ...info, repFonction: e.target.value })} placeholder="Ex: Gerant" />
                <Input label="Ville" value={info.repVille} onChange={(e) => setInfo({ ...info, repVille: e.target.value })} />
                <div className="col-span-2">
                  <Input label="Adresse de residence" value={info.repAdresse} onChange={(e) => setInfo({ ...info, repAdresse: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Options</h4>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "domiciliationSimple", label: "Domiciliation simple" },
                  { key: "receptionCourrier", label: "Reception courrier" },
                  { key: "scanNotificationEmail", label: "Scan + notification email" },
                  { key: "reexpeditionCourrier", label: "Reexpedition courrier" },
                  { key: "accesPonctuelEspaces", label: "Acces ponctuel espaces" },
                ] as { key: keyof typeof options; label: string }[]).map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={options[opt.key]} onChange={(e) => setOptions({ ...options, [opt.key]: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "contrat" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero de bureau</label>
                <select value={contrat.numeroBureau} onChange={(e) => setContrat({ ...contrat, numeroBureau: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
                  <option value="">Non attribue</option>
                  {Array.from({ length: 36 }, (_, i) => i + 1).map(n => {
                    const isOccupied = occupiedBureaux.includes(n);
                    return <option key={n} value={n} className={isOccupied ? "text-red-500" : ""}>Bureau {n}{isOccupied ? " (occupe)" : ""}</option>;
                  })}
                </select>
                {contrat.numeroBureau && occupiedBureaux.includes(Number(contrat.numeroBureau)) && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Ce bureau est deja attribue</p>
                )}
              </div>
              <Input label="Reference contrat notarie" value={contrat.referenceContratNotarie} onChange={(e) => setContrat({ ...contrat, referenceContratNotarie: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Date debut" type="date" value={contrat.dateDebutContrat} onChange={(e) => setContrat({ ...contrat, dateDebutContrat: e.target.value })} />
              <Input label="Date fin" type="date" value={contrat.dateFinContrat} onChange={(e) => setContrat({ ...contrat, dateFinContrat: e.target.value })} />
              <Input label="Montant mensuel (DA)" type="number" value={contrat.montantMensuel} onChange={(e) => setContrat({ ...contrat, montantMensuel: e.target.value })} />
            </div>
            {contrat.montantMensuel && contrat.dateDebutContrat && contrat.dateFinContrat && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Montant total ({mois} mois)</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Paiement unique lors de la signature notariale</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-800">{montantTotal.toLocaleString("fr-DZ")} DA</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && selectedUser && (
          <div className="space-y-4">
            <Card className="p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-3">Recapitulatif</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Client</p>
                  <p className="font-medium">{selectedUser.prenom} {selectedUser.nom}</p>
                  <p className="text-xs text-gray-400">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Structure</p>
                  <p className="font-medium">{info.raisonSociale}</p>
                  <p className="text-xs text-gray-400">{typeStructure === "auto_entrepreneur" ? "Auto-entrepreneur" : info.formeJuridique}</p>
                </div>
                <div>
                  <p className="text-gray-500">Situation</p>
                  <Badge variant={situationAdministrative === "en_cours_creation" ? "warning" : "info"}>
                    {situationAdministrative === "en_cours_creation" ? "En cours de creation" : "Deja creee"}
                  </Badge>
                </div>
                {contrat.numeroBureau && (
                  <div>
                    <p className="text-gray-500">Bureau</p>
                    <p className="font-bold text-amber-700">N{contrat.numeroBureau}</p>
                  </div>
                )}
                {contrat.referenceContratNotarie && (
                  <div>
                    <p className="text-gray-500">Ref. contrat</p>
                    <p className="font-medium">{contrat.referenceContratNotarie}</p>
                  </div>
                )}
                {contrat.montantMensuel && (
                  <div>
                    <p className="text-gray-500">Montant</p>
                    <p className="font-medium">{Number(contrat.montantMensuel).toLocaleString("fr-DZ")} DA/mois</p>
                    <p className="text-xs text-emerald-600 font-medium">Total: {montantTotal.toLocaleString("fr-DZ")} DA ({mois} mois)</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Representant</p>
                  <p className="font-medium">{info.repPrenom} {info.repNom}</p>
                  <p className="text-xs text-gray-400">{info.repEmail} {info.repTel && `/ ${info.repTel}`}</p>
                </div>
                <div>
                  <p className="text-gray-500">Options</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {options.domiciliationSimple && <Badge variant="success" size="sm">Domiciliation</Badge>}
                    {options.receptionCourrier && <Badge variant="info" size="sm">Courrier</Badge>}
                    {options.scanNotificationEmail && <Badge variant="info" size="sm">Scan email</Badge>}
                    {options.reexpeditionCourrier && <Badge variant="info" size="sm">Reexpedition</Badge>}
                    {options.accesPonctuelEspaces && <Badge variant="teal" size="sm">Espaces</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          {step !== "user" && (
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          {step === "confirm" ? (
            <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
              <Save className="w-4 h-4" /> Creer la domiciliation
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={
                (step === "user" && !canGoToInfo) ||
                (step === "info" && !canGoToContrat)
              }
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
