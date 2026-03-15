import React, { useState, useEffect, useCallback } from "react";
import { Briefcase, User, CheckCircle, Pencil, X, Save } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import type { DemandeDomiciliation } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
      <p className="font-medium text-gray-900 text-sm">{value || "-"}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-bold text-gray-900 text-base">{title}</h4>
    </div>
  );
}

export default function InformationsTab({ demande, onUpdate, loading }: Props) {
  const [editing, setEditing] = useState(false);

  const initForm = useCallback(
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
      repNom: demande.representantLegal?.nom || "",
      repPrenom: demande.representantLegal?.prenom || "",
      repTel: demande.representantLegal?.telephone || "",
      repEmail: demande.representantLegal?.email || "",
      repVille: demande.representantLegal?.ville || "",
      repAdresse: demande.representantLegal?.adresseResidence || "",
    }),
    [demande]
  );

  const [form, setForm] = useState(initForm);

  useEffect(() => {
    setForm(initForm());
  }, [initForm]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    try {
      await onUpdate({
        raisonSociale: form.raisonSociale,
        formeJuridique: form.formeJuridique,
        nif: form.nif,
        nis: form.nis,
        registreCommerce: form.registreCommerce,
        articleImposition: form.articleImposition,
        codeNae: form.codeNae,
        activiteExercee: form.activiteExercee,
        numeroAutoEntrepreneur: form.numeroAutoEntrepreneur,
        representantLegal: {
          nom: form.repNom,
          prenom: form.repPrenom,
          telephone: form.repTel,
          email: form.repEmail,
          ville: form.repVille,
          adresseResidence: form.repAdresse,
        },
      });
      setEditing(false);
    } catch {
      // error already toasted
    }
  };

  const isSociete = demande.typeStructure === "societe";
  const isAE = demande.typeStructure === "auto_entrepreneur";
  const rep = demande.representantLegal || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant={editing ? "danger" : "outline"}
          onClick={() => {
            if (editing) setForm(initForm());
            setEditing(!editing);
          }}
        >
          {editing ? (
            <>
              <X className="w-4 h-4" /> Annuler
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" /> Modifier
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Situation</p>
          <p className="font-semibold text-amber-900 text-sm mt-1">
            {demande.situationAdministrative === "en_cours_creation"
              ? "En cours de création"
              : "Déjà créée"}
          </p>
        </div>
        <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
          <p className="text-xs text-sky-700 uppercase tracking-wide font-semibold">Type</p>
          <p className="font-semibold text-sky-900 text-sm mt-1">
            {isAE ? "Auto-entrepreneur" : "Société"}
          </p>
        </div>
      </div>

      <div>
        <SectionHeader icon={Briefcase} title="Entreprise" gradient="from-amber-500 to-orange-500" />
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Raison sociale"
              value={form.raisonSociale}
              onChange={(e) => set("raisonSociale", e.target.value)}
            />
            <Input
              label="Forme juridique"
              value={form.formeJuridique}
              onChange={(e) => set("formeJuridique", e.target.value)}
            />
            {isSociete && (
              <>
                <Input
                  label="NIF"
                  value={form.nif}
                  onChange={(e) => set("nif", e.target.value)}
                  maxLength={20}
                />
                <Input
                  label="NIS"
                  value={form.nis}
                  onChange={(e) => set("nis", e.target.value)}
                  maxLength={15}
                />
                <Input
                  label="Registre de Commerce"
                  value={form.registreCommerce}
                  onChange={(e) => set("registreCommerce", e.target.value)}
                />
                <Input
                  label="Article d'imposition"
                  value={form.articleImposition}
                  onChange={(e) => set("articleImposition", e.target.value)}
                />
                <Input
                  label="Code NAE"
                  value={form.codeNae}
                  onChange={(e) => set("codeNae", e.target.value)}
                />
              </>
            )}
            {isAE && (
              <>
                <Input
                  label="Activité exercée"
                  value={form.activiteExercee}
                  onChange={(e) => set("activiteExercee", e.target.value)}
                />
                <Input
                  label="N° Auto-entrepreneur"
                  value={form.numeroAutoEntrepreneur}
                  onChange={(e) => set("numeroAutoEntrepreneur", e.target.value)}
                />
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Raison sociale" value={demande.raisonSociale} />
            <Field label="Forme juridique" value={demande.formeJuridique} />
            {isSociete && (
              <>
                <Field label="NIF" value={demande.nif} />
                <Field label="NIS" value={demande.nis} />
                <Field label="Registre de Commerce" value={demande.registreCommerce} />
                <Field label="Article d'imposition" value={demande.articleImposition} />
                <Field label="Code NAE" value={demande.codeNae} />
              </>
            )}
            {isAE && (
              <>
                <Field label="Activité exercée" value={demande.activiteExercee} />
                <Field label="N° Auto-entrepreneur" value={demande.numeroAutoEntrepreneur} />
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <SectionHeader icon={User} title="Représentant légal" gradient="from-sky-500 to-cyan-500" />
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={form.repPrenom}
              onChange={(e) => set("repPrenom", e.target.value)}
            />
            <Input
              label="Nom"
              value={form.repNom}
              onChange={(e) => set("repNom", e.target.value)}
            />
            <Input
              label="Téléphone"
              value={form.repTel}
              onChange={(e) => set("repTel", e.target.value)}
            />
            <Input
              label="Email"
              value={form.repEmail}
              onChange={(e) => set("repEmail", e.target.value)}
            />
            <Input
              label="Ville"
              value={form.repVille}
              onChange={(e) => set("repVille", e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Adresse de résidence"
                value={form.repAdresse}
                onChange={(e) => set("repAdresse", e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field
              label="Nom complet"
              value={`${rep.prenom || ""} ${rep.nom || ""}`.trim()}
            />
            <Field label="Téléphone" value={rep.telephone} />
            <Field label="Email" value={rep.email} />
            <Field label="Ville" value={rep.ville} />
            {rep.adresseResidence && (
              <Field label="Adresse de résidence" value={rep.adresseResidence} />
            )}
          </div>
        )}
      </div>

      {demande.options && (
        <div>
          <SectionHeader
            icon={CheckCircle}
            title="Options sélectionnées"
            gradient="from-teal-500 to-emerald-500"
          />
          <div className="flex flex-wrap gap-2">
            {demande.options.domiciliationSimple && (
              <Badge variant="success">Domiciliation simple</Badge>
            )}
            {demande.options.receptionCourrier && (
              <Badge variant="info">Réception courrier</Badge>
            )}
            {demande.options.scanNotificationEmail && (
              <Badge variant="info">Scan email</Badge>
            )}
            {demande.options.reexpeditionCourrier && (
              <Badge variant="info">Réexpédition</Badge>
            )}
            {demande.options.accesPonctuelEspaces && (
              <Badge variant="teal">Accès espaces</Badge>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={loading}>
            <Save className="w-4 h-4" /> Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
