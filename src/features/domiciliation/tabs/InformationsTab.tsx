import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  User,
  CheckCircle2,
  Pencil,
  X,
  Save,
  Building2,
  Lightbulb,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import { OPTIONS_DOMICILIATION } from "../constants";
import type { DemandeDomiciliation } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 flex items-center gap-3 border-b border-gray-100 ${accent}`}>
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function InformationsTab({ demande, onUpdate, loading }: Props) {
  const [editingEntreprise, setEditingEntreprise] = useState(false);
  const [editingRep, setEditingRep] = useState(false);

  const initEntrepriseForm = useCallback(
    () => ({
      raisonSociale: demande.raisonSociale || "",
      formeJuridique: demande.formeJuridique || "",
      nif: demande.nif || "",
      nis: demande.nis || "",
      registreCommerce: demande.registreCommerce || "",
      articleImposition: demande.articleImposition || "",
      codeNae: demande.codeNae || "",
      activiteExercee: demande.activiteExercee || "",
      numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur || "",
    }),
    [demande]
  );

  const initRepForm = useCallback(
    () => ({
      repNom: demande.representantLegal?.nom || "",
      repPrenom: demande.representantLegal?.prenom || "",
      repTel: demande.representantLegal?.telephone || "",
      repEmail: demande.representantLegal?.email || "",
      repVille: demande.representantLegal?.ville || "",
      repAdresse: demande.representantLegal?.adresseResidence || "",
      repFonction: demande.representantLegal?.fonction || "",
    }),
    [demande]
  );

  const [entrepriseForm, setEntrepriseForm] = useState(initEntrepriseForm);
  const [repForm, setRepForm] = useState(initRepForm);

  useEffect(() => {
    setEntrepriseForm(initEntrepriseForm());
    setEditingEntreprise(false);
  }, [initEntrepriseForm]);

  useEffect(() => {
    setRepForm(initRepForm());
    setEditingRep(false);
  }, [initRepForm]);

  const setE = (k: string, v: string) =>
    setEntrepriseForm((p) => ({ ...p, [k]: v }));
  const setR = (k: string, v: string) =>
    setRepForm((p) => ({ ...p, [k]: v }));

  const handleSaveEntreprise = async () => {
    try {
      await onUpdate({
        raisonSociale: entrepriseForm.raisonSociale,
        formeJuridique: entrepriseForm.formeJuridique,
        nif: entrepriseForm.nif,
        nis: entrepriseForm.nis,
        registreCommerce: entrepriseForm.registreCommerce,
        articleImposition: entrepriseForm.articleImposition,
        codeNae: entrepriseForm.codeNae,
        activiteExercee: entrepriseForm.activiteExercee,
        numeroAutoEntrepreneur: entrepriseForm.numeroAutoEntrepreneur,
      });
      setEditingEntreprise(false);
    } catch {
      // error already toasted
    }
  };

  const handleSaveRep = async () => {
    try {
      await onUpdate({
        representantLegal: {
          nom: repForm.repNom,
          prenom: repForm.repPrenom,
          telephone: repForm.repTel,
          email: repForm.repEmail,
          ville: repForm.repVille,
          adresseResidence: repForm.repAdresse,
          fonction: repForm.repFonction,
        },
      });
      setEditingRep(false);
    } catch {
      // error already toasted
    }
  };

  const isSociete = demande.typeStructure === "societe";
  const isAE = demande.typeStructure === "auto_entrepreneur";
  const isDejaCreee = demande.situationAdministrative === "deja_creee";
  const isEnCoursCreation = demande.situationAdministrative === "en_cours_creation";
  const rep = demande.representantLegal || {};
  const selectedOptions = OPTIONS_DOMICILIATION.filter(
    (o) => demande.options?.[o.key]
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            Situation
          </p>
          <p className="font-semibold text-amber-900 text-sm">
            {demande.situationAdministrative === "en_cours_creation"
              ? "En cours de création"
              : "Déjà créée"}
          </p>
        </div>
        <div className="bg-sky-50 rounded-xl px-4 py-3 border border-sky-100">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            Type de structure
          </p>
          <p className="font-semibold text-sky-900 text-sm">
            {isAE ? "Auto-entrepreneur" : "Société"}
          </p>
        </div>
      </div>

      <SectionCard title="Entreprise" icon={Briefcase} accent="bg-amber-50 text-amber-800">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">Informations légales de la structure</p>
          {editingEntreprise ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEntrepriseForm(initEntrepriseForm());
                  setEditingEntreprise(false);
                }}
              >
                <X className="w-3.5 h-3.5" /> Annuler
              </Button>
              <Button size="sm" variant="success" onClick={handleSaveEntreprise} loading={loading}>
                <Save className="w-3.5 h-3.5" /> Enregistrer
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingEntreprise(true)}>
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </Button>
          )}
        </div>

        {isEnCoursCreation && (
          <div className="mb-4 px-3 py-2 bg-sky-50 border border-sky-100 rounded-lg">
            <p className="text-xs text-sky-700">
              Structure en cours de création — les numéros d'immatriculation seront renseignés après création officielle.
            </p>
          </div>
        )}
        {editingEntreprise ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isSociete && (
              <Input
                label="Raison sociale"
                value={entrepriseForm.raisonSociale}
                onChange={(e) => setE("raisonSociale", e.target.value)}
              />
            )}
            {isSociete && (
              <Input
                label="Forme juridique"
                value={entrepriseForm.formeJuridique}
                onChange={(e) => setE("formeJuridique", e.target.value)}
              />
            )}
            {isSociete && (
              <Input
                label="Code NAE"
                value={entrepriseForm.codeNae}
                onChange={(e) => setE("codeNae", e.target.value)}
              />
            )}
            {isSociete && isDejaCreee && (
              <>
                <Input
                  label="NIF (20 chiffres)"
                  value={entrepriseForm.nif}
                  onChange={(e) => setE("nif", e.target.value)}
                  maxLength={20}
                />
                <Input
                  label="NIS (15 chiffres)"
                  value={entrepriseForm.nis}
                  onChange={(e) => setE("nis", e.target.value)}
                  maxLength={15}
                />
                <Input
                  label="Registre de Commerce"
                  value={entrepriseForm.registreCommerce}
                  onChange={(e) => setE("registreCommerce", e.target.value)}
                />
                <Input
                  label="Article d'imposition"
                  value={entrepriseForm.articleImposition}
                  onChange={(e) => setE("articleImposition", e.target.value)}
                />
                <Input
                  label="Activité exercée"
                  value={entrepriseForm.activiteExercee}
                  onChange={(e) => setE("activiteExercee", e.target.value)}
                />
              </>
            )}
            {isAE && isDejaCreee && (
              <Input
                label="N° Auto-entrepreneur"
                value={entrepriseForm.numeroAutoEntrepreneur}
                onChange={(e) => setE("numeroAutoEntrepreneur", e.target.value)}
              />
            )}
            {isAE && (
              <Input
                label="Activité exercée"
                value={entrepriseForm.activiteExercee}
                onChange={(e) => setE("activiteExercee", e.target.value)}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {isSociete && (
              <>
                <InfoField label="Raison sociale" value={demande.raisonSociale} />
                <InfoField label="Forme juridique" value={demande.formeJuridique} />
                {demande.codeNae && <InfoField label="Code NAE" value={demande.codeNae} />}
              </>
            )}
            {isSociete && isDejaCreee && (
              <>
                <InfoField label="NIF" value={demande.nif} />
                <InfoField label="NIS" value={demande.nis} />
                <InfoField label="RC" value={demande.registreCommerce} />
                <InfoField label="Art. d'imposition" value={demande.articleImposition} />
                <InfoField label="Activité" value={demande.activiteExercee} />
              </>
            )}
            {isSociete && isEnCoursCreation && demande.activiteExercee && (
              <InfoField label="Activité prévue" value={demande.activiteExercee} />
            )}
            {isAE && isDejaCreee && (
              <InfoField label="N° Auto-entrepreneur" value={demande.numeroAutoEntrepreneur} />
            )}
            {isAE && (
              <InfoField label="Activité" value={demande.activiteExercee} />
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Représentant légal" icon={User} accent="bg-sky-50 text-sky-800">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">Identité et coordonnées du représentant</p>
          {editingRep ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRepForm(initRepForm());
                  setEditingRep(false);
                }}
              >
                <X className="w-3.5 h-3.5" /> Annuler
              </Button>
              <Button size="sm" variant="success" onClick={handleSaveRep} loading={loading}>
                <Save className="w-3.5 h-3.5" /> Enregistrer
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingRep(true)}>
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </Button>
          )}
        </div>

        {editingRep ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={repForm.repPrenom}
              onChange={(e) => setR("repPrenom", e.target.value)}
            />
            <Input
              label="Nom"
              value={repForm.repNom}
              onChange={(e) => setR("repNom", e.target.value)}
            />
            <Input
              label="Téléphone"
              value={repForm.repTel}
              onChange={(e) => setR("repTel", e.target.value)}
            />
            <Input
              label="Email"
              value={repForm.repEmail}
              onChange={(e) => setR("repEmail", e.target.value)}
            />
            <Input
              label="Fonction"
              value={repForm.repFonction}
              onChange={(e) => setR("repFonction", e.target.value)}
              placeholder="Ex : Gérant"
            />
            <Input
              label="Ville"
              value={repForm.repVille}
              onChange={(e) => setR("repVille", e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Adresse de résidence"
                value={repForm.repAdresse}
                onChange={(e) => setR("repAdresse", e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <InfoField
              label="Nom complet"
              value={`${rep.prenom || ""} ${rep.nom || ""}`.trim()}
            />
            <InfoField label="Fonction" value={rep.fonction} />
            <InfoField label="Téléphone" value={rep.telephone} />
            <InfoField label="Email" value={rep.email} />
            <InfoField label="Ville" value={rep.ville} />
            <InfoField label="Adresse" value={rep.adresseResidence} />
          </div>
        )}
      </SectionCard>

      {selectedOptions.length > 0 && (
        <SectionCard
          title="Options souscrites"
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-800"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedOptions.map((opt) => (
              <div
                key={opt.key}
                className="flex items-center gap-3 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100"
              >
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900">{opt.label}</p>
                  <p className="text-xs text-emerald-600">{opt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {demande.dateCreationEntreprise && (
        <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            Entreprise créée le{" "}
            <span className="font-medium">
              {new Date(demande.dateCreationEntreprise as string).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
