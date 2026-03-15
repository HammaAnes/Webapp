import React, { useState, useCallback, useEffect } from "react";
import {
  FileCheck,
  Pencil,
  X,
  Save,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Hash,
  Banknote,
  Eye,
  EyeOff,
  FileSignature,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import BureauSelector from "../components/BureauSelector";
import ContratSummary from "../components/ContratSummary";
import { useOccupiedBureaux } from "../hooks";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { getContractExpirationAlert, toDateInputValue } from "../utils";
import type { DemandeDomiciliation } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

interface ContractFormState {
  numeroBureau: string;
  referenceContratNotarie: string;
  dateDebutContrat: string;
  dateFinContrat: string;
  montantMensuel: string;
  visibleSurSite: boolean;
}

function ContractField({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${highlight ? "bg-amber-100" : "bg-gray-50"}`}>
        <Icon className={`w-4 h-4 ${highlight ? "text-amber-600" : "text-gray-500"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-amber-700" : value === "—" ? "text-gray-400" : "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ContratTab({ demande, onUpdate, loading }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const occupiedBureaux = useOccupiedBureaux(demande.id);

  const getInitialForm = useCallback((): ContractFormState => ({
    numeroBureau: demande.numeroBureau?.toString() ?? "",
    referenceContratNotarie: demande.referenceContratNotarie ?? "",
    dateDebutContrat: toDateInputValue(demande.dateDebutContrat as string | undefined),
    dateFinContrat: toDateInputValue(demande.dateFinContrat as string | undefined),
    montantMensuel: demande.montantMensuel?.toString() ?? "",
    visibleSurSite: demande.visibleSurSite ?? false,
  }), [demande]);

  const [form, setForm] = useState<ContractFormState>(getInitialForm);

  useEffect(() => {
    setForm(getInitialForm());
    setIsEditing(false);
  }, [demande.id]);

  const handleCancel = () => {
    setForm(getInitialForm());
    setIsEditing(false);
  };

  const validate = (): boolean => {
    if (form.numeroBureau && occupiedBureaux.includes(Number(form.numeroBureau))) {
      toast.error(`Le bureau ${form.numeroBureau} est déjà attribué`);
      return false;
    }
    if (form.dateDebutContrat && form.dateFinContrat) {
      if (new Date(form.dateFinContrat) <= new Date(form.dateDebutContrat)) {
        toast.error("La date de fin doit être postérieure à la date de début");
        return false;
      }
    }
    if (form.montantMensuel && Number(form.montantMensuel) < 0) {
      toast.error("Le montant mensuel ne peut pas être négatif");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onUpdate({
        numeroBureau: form.numeroBureau ? Number(form.numeroBureau) : null,
        referenceContratNotarie: form.referenceContratNotarie || null,
        dateDebutContrat: form.dateDebutContrat || null,
        dateFinContrat: form.dateFinContrat || null,
        montantMensuel: form.montantMensuel ? Number(form.montantMensuel) : null,
        visibleSurSite: form.visibleSurSite,
      });
      setIsEditing(false);
    } catch {
      // error already toasted by parent
    } finally {
      setIsSaving(false);
    }
  };

  const expirationAlert = getContractExpirationAlert(demande);
  const hasContractData = demande.dateDebutContrat || demande.dateFinContrat || demande.montantMensuel;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Contrat de domiciliation</h3>
            <p className="text-xs text-gray-500">Informations contractuelles et notariales</p>
          </div>
        </div>
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4" />
            Modifier
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="w-4 h-4" />
            Annuler
          </Button>
        )}
      </div>

      {expirationAlert && !isEditing && (
        <div
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${
            expirationAlert.type === "expired"
              ? "bg-red-50 border-red-200"
              : expirationAlert.type === "critical"
              ? "bg-orange-50 border-orange-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              expirationAlert.type === "expired"
                ? "text-red-500"
                : expirationAlert.type === "critical"
                ? "text-orange-500"
                : "text-amber-500"
            }`}
          />
          <div>
            <p className={`text-sm font-semibold ${
              expirationAlert.type === "expired" ? "text-red-700" : expirationAlert.type === "critical" ? "text-orange-700" : "text-amber-700"
            }`}>
              {expirationAlert.type === "expired"
                ? "Contrat expiré"
                : expirationAlert.type === "critical"
                ? `Expire dans ${expirationAlert.daysLeft} jour${expirationAlert.daysLeft > 1 ? "s" : ""}`
                : `Expire dans ${expirationAlert.daysLeft} jours`}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Date de fin : {formatDate(expirationAlert.date)}
            </p>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BureauSelector
              value={form.numeroBureau}
              onChange={(val) => setForm((p) => ({ ...p, numeroBureau: val.toString() }))}
              occupiedBureaux={occupiedBureaux}
              showEmpty
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Référence contrat notarié
              </label>
              <input
                type="text"
                value={form.referenceContratNotarie}
                onChange={(e) => setForm((p) => ({ ...p, referenceContratNotarie: e.target.value }))}
                placeholder="Ex : CONT-2026-001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["dateDebutContrat", "dateFinContrat"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field === "dateDebutContrat" ? "Date de début" : "Date de fin"}
                </label>
                <input
                  type="date"
                  value={form[field]}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Montant mensuel (DA)
              </label>
              <input
                type="number"
                value={form.montantMensuel}
                onChange={(e) => setForm((p) => ({ ...p, montantMensuel: e.target.value }))}
                placeholder="15000"
                min="0"
                step="500"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">Visible sur le site public</p>
              <p className="text-xs text-gray-500 mt-0.5">Afficher dans la liste des entreprises domiciliées</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, visibleSurSite: !p.visibleSurSite }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                form.visibleSurSite ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.visibleSurSite ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {form.dateDebutContrat && form.dateFinContrat && form.montantMensuel && (
            <ContratSummary
              dateDebut={form.dateDebutContrat}
              dateFin={form.dateFinContrat}
              montantMensuel={Number(form.montantMensuel)}
            />
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} loading={isSaving || loading}>
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      ) : !hasContractData ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <FileSignature className="w-7 h-7 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">Aucun contrat renseigné</p>
            <p className="text-sm text-gray-500 mt-1">Complétez les informations contractuelles dès que le notaire est impliqué</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4" />
            Renseigner le contrat
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ContractField
              icon={Hash}
              label="Numéro de bureau"
              value={demande.numeroBureau ? `Bureau ${demande.numeroBureau}` : "—"}
              highlight={!!demande.numeroBureau}
            />
            <ContractField
              icon={FileSignature}
              label="Réf. contrat notarié"
              value={demande.referenceContratNotarie || "—"}
            />
            <ContractField
              icon={Banknote}
              label="Montant mensuel"
              value={demande.montantMensuel ? formatCurrency(demande.montantMensuel) : "—"}
              highlight={!!demande.montantMensuel}
            />
            <ContractField
              icon={Calendar}
              label="Date de début"
              value={demande.dateDebutContrat ? formatDate(demande.dateDebutContrat as string) : "—"}
            />
            <ContractField
              icon={Calendar}
              label="Date de fin"
              value={demande.dateFinContrat ? formatDate(demande.dateFinContrat as string) : "—"}
            />
            <ContractField
              icon={demande.visibleSurSite ? Eye : EyeOff}
              label="Visibilité site"
              value={demande.visibleSurSite ? "Public" : "Privé"}
              highlight={!!demande.visibleSurSite}
            />
          </div>

          {demande.dateDebutContrat && demande.dateFinContrat && demande.montantMensuel && (
            <ContratSummary
              dateDebut={toDateInputValue(demande.dateDebutContrat as string)}
              dateFin={toDateInputValue(demande.dateFinContrat as string)}
              montantMensuel={demande.montantMensuel}
            />
          )}
        </div>
      )}
    </div>
  );
}
