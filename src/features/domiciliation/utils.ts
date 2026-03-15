import type { DemandeDomiciliation } from "./types";
import type { DocumentRecord, DocumentSlot } from "./types";
import {
  SOCIETE_DOCS,
  AUTO_ENTREPRENEUR_DOCS,
  COMMON_DOCS,
  REQUIRED_DOCS_NEW_SOCIETE,
  REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR,
  REQUIRED_DOCS_EXISTING_SOCIETE,
  REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR,
} from "./constants";

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
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  return Math.max(0, Math.round((fin.getTime() - debut.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
}

export function calculateContractTotal(montantMensuel: number, months: number): number {
  return montantMensuel * months;
}

export function getContractExpirationAlert(demande: DemandeDomiciliation): {
  type: "expired" | "warning";
  daysLeft: number;
  date: Date;
} | null {
  if (!demande.dateFinContrat || !["active", "domiciliation_creee"].includes(demande.statut)) {
    return null;
  }
  const fin = new Date(demande.dateFinContrat as string);
  const now = new Date();
  const daysLeft = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { type: "expired", daysLeft, date: fin };
  if (daysLeft <= 30) return { type: "warning", daysLeft, date: fin };
  return null;
}

export function mapApiDocument(raw: Record<string, unknown>): DocumentRecord {
  return {
    id: String(raw.id || ""),
    document_type: String(raw.type_document || raw.document_type || "autre"),
    file_name: String(raw.nom_original || raw.nom_fichier || raw.file_name || ""),
    file_size: raw.taille ? Number(raw.taille) : (raw.file_size ? Number(raw.file_size) : undefined),
    created_at: String(raw.created_at || raw.uploaded_at || ""),
    url: String(raw.download_url || raw.url || ""),
    status: (raw.statut || raw.status || "en_attente") as DocumentRecord["status"],
    commentaire_rejet: raw.commentaire_rejet ? String(raw.commentaire_rejet) : undefined,
  };
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

export function getAllDocSlots(
  situation: string,
  typeStructure: string
): DocumentSlot[] {
  const apiSlots = typeStructure === "auto_entrepreneur" ? AUTO_ENTREPRENEUR_DOCS : SOCIETE_DOCS;
  const wizardSlots = getRequiredDocSlots(situation, typeStructure);
  const all = [...apiSlots, ...COMMON_DOCS];
  for (const ws of wizardSlots) {
    if (!all.some((s) => s.type === ws.type)) {
      all.push(ws);
    }
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
    "Ancienneté (jours)",
  ];

  const rows = demandes.map((d) => {
    const ageJours = Math.floor(
      (Date.now() - new Date(d.dateCreation as string).getTime()) / (1000 * 60 * 60 * 24)
    );
    return [
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
      ageJours.toString(),
    ];
  });

  const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `domiciliations_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
