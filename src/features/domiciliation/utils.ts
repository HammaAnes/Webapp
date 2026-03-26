import { differenceInMonths, differenceInDays, addMonths } from "date-fns";
import type { DemandeDomiciliation, DocumentSlot } from "../../domiciliation/domain/types";
import {
  SOCIETE_DOCS,
  AUTO_ENTREPRENEUR_DOCS,
  COMMON_DOCS,
  REQUIRED_DOCS_NEW_SOCIETE,
  REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR,
  REQUIRED_DOCS_EXISTING_SOCIETE,
  REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR,
} from "./constants";
// Mappers consolidés — source unique dans apiAdapter
export { mapApiDocument, mapApiCourrier } from "../../domiciliation/adapters/apiAdapter";

export function getDisplayName(d: DemandeDomiciliation): string {
  if (d.raisonSociale) return d.raisonSociale;
  const rep = d.representantLegal;
  if (rep) {
    const name = `${rep.prenom || ""} ${rep.nom || ""}`.trim();
    if (name) return name;
  }
  return "Non renseigné";
}

export function getSituationLabel(s: string): string {
  return s === "en_cours_creation" ? "En cours de création" : "Déjà créée";
}

export function getTypeLabel(t: string): string {
  return t === "auto_entrepreneur" ? "Auto-entrepreneur" : "Société";
}

export function calculateContractDurationMonths(dateDebut: string, dateFin: string): number {
  if (!dateDebut || !dateFin) return 0;
  try {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const months = differenceInMonths(fin, debut);
    // Ceiling : si des jours restent après les mois complets, on arrondit au mois supérieur (identique à la logique PHP)
    const remainder = differenceInDays(fin, addMonths(debut, months));
    return Math.max(0, months + (remainder > 0 ? 1 : 0));
  } catch {
    return 0;
  }
}

export function calculateContractTotal(montantMensuel: number, months: number): number {
  return montantMensuel * months;
}

export function getContractExpirationAlert(demande: DemandeDomiciliation): {
  type: "expired" | "warning" | "critical";
  daysLeft: number;
  date: Date;
} | null {
  if (!demande.dateFinContrat || !["active", "domiciliation_creee"].includes(demande.statut)) {
    return null;
  }
  try {
    const fin = new Date(demande.dateFinContrat as string);
    const now = new Date();
    const daysLeft = differenceInDays(fin, now);
    if (daysLeft < 0) return { type: "expired", daysLeft, date: fin };
    if (daysLeft <= 7) return { type: "critical", daysLeft, date: fin };
    if (daysLeft <= 30) return { type: "warning", daysLeft, date: fin };
    return null;
  } catch {
    return null;
  }
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function getRequiredDocSlots(
  situation: string,
  typeStructure: string
): DocumentSlot[] {
  if (situation === "en_cours_creation") {
    return typeStructure === "societe"
      ? REQUIRED_DOCS_NEW_SOCIETE
      : REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR;
  }
  return typeStructure === "societe"
    ? REQUIRED_DOCS_EXISTING_SOCIETE
    : REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR;
}

export function getAllDocSlots(situation: string, typeStructure: string): DocumentSlot[] {
  // Slots requis selon la situation courante (ce que le wizard demande)
  const wizardSlots = getRequiredDocSlots(situation, typeStructure);

  // Slots additionnels du type de structure (pour complétion post-création), marqués non-requis
  const typeSlots = typeStructure === "auto_entrepreneur" ? AUTO_ENTREPRENEUR_DOCS : SOCIETE_DOCS;
  const extraSlots = typeSlots
    .filter((s) => !wizardSlots.some((w) => w.type === s.type))
    .map((s) => ({ ...s, required: false }));

  const all = [...wizardSlots, ...extraSlots];

  // Slot "autre" toujours en dernier
  if (!all.some((s) => s.type === "autre")) {
    all.push(...COMMON_DOCS);
  }

  return all;
}

export function exportDomiciliationsCSV(
  demandes: DemandeDomiciliation[],
  formatDate: (d: Date | string) => string,
  formatCurrency: (n: number) => string
): void {
  const esc = (v: string) =>
    v.includes(";") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;

  const formatOpts = (opts: Record<string, boolean> | undefined) => {
    if (!opts) return "";
    return Object.entries(opts)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");
  };

  const headers = [
    "Raison Sociale",
    "Situation",
    "Type",
    "Forme Juridique",
    "NIF",
    "NIS",
    "Bureau",
    "Statut",
    "Représentant",
    "Email",
    "Téléphone",
    "Date Création",
    "Date Début Contrat",
    "Date Fin Contrat",
    "Montant Mensuel",
    "Réf. Contrat",
    "Options",
  ];

  const rows = demandes.map((d) => [
    esc(getDisplayName(d)),
    esc(getSituationLabel(d.situationAdministrative)),
    esc(getTypeLabel(d.typeStructure)),
    esc(d.formeJuridique || ""),
    esc(d.nif || ""),
    esc(d.nis || ""),
    d.numeroBureau?.toString() || "",
    esc(d.statut),
    esc(`${d.representantLegal?.prenom || ""} ${d.representantLegal?.nom || ""}`),
    esc(d.representantLegal?.email || ""),
    esc(d.representantLegal?.telephone || ""),
    formatDate(d.dateCreation),
    d.dateDebutContrat ? formatDate(d.dateDebutContrat) : "",
    d.dateFinContrat ? formatDate(d.dateFinContrat) : "",
    d.montantMensuel ? formatCurrency(d.montantMensuel) : "",
    esc(d.referenceContratNotarie || ""),
    esc(formatOpts(d.options as unknown as Record<string, boolean>)),
  ]);

  const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `domiciliations_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function toDateInputValue(date: Date | string | undefined | null): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}
