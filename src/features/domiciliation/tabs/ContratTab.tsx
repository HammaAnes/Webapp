import React, { useState, useEffect } from "react";
import { FileCheck, Pencil, X, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import BureauSelector from "../components/BureauSelector";
import ContratSummary from "../components/ContratSummary";
import { useOccupiedBureaux } from "../hooks";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import type { DemandeDomiciliation } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

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

function DisplayField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl">
        <p className="font-medium text-gray-900">{value || "-"}</p>
      </div>
    </div>
  );
}

export default function ContratTab({ demande, onUpdate, loading }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const occupiedBureaux = useOccupiedBureaux(demande.id);

  const getInitialForm = () => ({
    numeroBureau: demande.numeroBureau?.toString() || "",
    referenceContratNotarie: demande.referenceContratNotarie || "",
    dateDebutContrat: demande.dateDebutContrat ? String(demande.dateDebutContrat).split("T")[0] : "",
    dateFinContrat: demande.dateFinContrat ? String(demande.dateFinContrat).split("T")[0] : "",
    montantMensuel: demande.montantMensuel?.toString() || "",
    visibleSurSite: demande.visibleSurSite ?? false,
  });

  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    setForm(getInitialForm());
    setIsEditing(false);
  }, [demande.id, demande.numeroBureau, demande.montantMensuel]);

  const handleCancel = () => {
    setForm(getInitialForm());
    setIsEditing(false);
  };

  const validate = (): boolean => {
    if (form.numeroBureau && occupiedBureaux.includes(Number(form.numeroBureau))) {
      toast.error(`Le bureau ${form.numeroBureau} est déjà attribué à une autre domiciliation`);
      return false;
    }
    if (form.dateDebutContrat && form.dateFinContrat) {
      const debut = new Date(form.dateDebutContrat);
      const fin = new Date(form.dateFinContrat);
      if (fin <= debut) {
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
      // error already toasted
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader icon={FileCheck} title="Détails du contrat" gradient="from-emerald-500 to-teal-500" />
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4" /> Modifier
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={handleCancel}>
            <X className="w-4 h-4" /> Annuler
          </Button>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isEditing ? (
            <BureauSelector
              value={form.numeroBureau || ""}
              onChange={(val) => setForm((p) => ({ ...p, numeroBureau: val.toString() }))}
              occupiedBureaux={occupiedBureaux}
              showEmpty
            />
          ) : (
            <DisplayField
              label="Numéro de bureau"
              value={demande.numeroBureau ? `Bureau ${demande.numeroBureau}` : "Non attribué"}
            />
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Référence contrat notarié
            </label>
            {isEditing ? (
              <input
                type="text"
                value={form.referenceContratNotarie}
                onChange={(e) => setForm((p) => ({ ...p, referenceContratNotarie: e.target.value }))}
                placeholder="Ex : CONT-2026-001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            ) : (
              <DisplayField label="" value={demande.referenceContratNotarie || "-"} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["dateDebutContrat", "dateFinContrat"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field === "dateDebutContrat" ? "Date de début" : "Date de fin"}
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={form[field as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              ) : (
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl">
                  <p className="font-medium text-gray-900">
                    {demande[field as keyof DemandeDomiciliation]
                      ? formatDate(demande[field as keyof DemandeDomiciliation] as string)
                      : "-"}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Montant mensuel (DA)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={form.montantMensuel}
                onChange={(e) => setForm((p) => ({ ...p, montantMensuel: e.target.value }))}
                placeholder="15000"
                min="0"
                step="1000"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            ) : (
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl">
                <p className="font-medium text-gray-900">
                  {demande.montantMensuel ? formatCurrency(demande.montantMensuel) : "-"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && form.dateDebutContrat && form.dateFinContrat && form.montantMensuel && (
        <ContratSummary
          dateDebut={form.dateDebutContrat}
          dateFin={form.dateFinContrat}
          montantMensuel={Number(form.montantMensuel)}
        />
      )}

      {!isEditing && demande.dateDebutContrat && demande.dateFinContrat && demande.montantMensuel && (
        <ContratSummary
          dateDebut={String(demande.dateDebutContrat).split("T")[0]}
          dateFin={String(demande.dateFinContrat).split("T")[0]}
          montantMensuel={demande.montantMensuel}
        />
      )}

      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">Visible sur le site</p>
              {form.visibleSurSite && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  Public
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Afficher cette domiciliation dans la liste publique des entreprises domiciliées
            </p>
          </div>
          <button
            onClick={() =>
              isEditing && setForm((p) => ({ ...p, visibleSurSite: !p.visibleSurSite }))
            }
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-sm ${
              form.visibleSurSite ? "bg-emerald-500" : "bg-gray-300"
            } ${!isEditing ? "cursor-default opacity-70" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                form.visibleSurSite ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} loading={isSaving || loading}>
            <Save className="w-4 h-4" /> Enregistrer les modifications
          </Button>
        </div>
      )}
    </div>
  );
}
