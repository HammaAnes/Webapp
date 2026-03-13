import { logger } from "../utils/logger";
import { apiClient } from "../lib/api-client";
import toast from "react-hot-toast";
import {
  reservationCreatedEmail,
  reservationConfirmedEmail,
  reservationCancelledEmail,
  domiciliationSubmittedEmail,
  domiciliationStatusEmail,
  domiciliationActivatedEmail,
  domiciliationRejectedEmail,
} from "./email-templates";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function sendViaEdgeFunction(to: string, subject: string, html: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.warn("[Email] Supabase not configured, skipping Edge Function");
    return false;
  }

  const url = `${SUPABASE_URL}/functions/v1/send-email`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ to, subject, html }),
  });

  const data = await response.json();
  if (data.success) {
    logger.info("[Email] Sent via Edge Function", { to, subject });
    return true;
  }
  logger.warn("[Email] Edge Function failed:", data.error);
  return false;
}

async function sendViaPhpBackend(to: string, subject: string, html: string): Promise<boolean> {
  const response = await apiClient.sendEmail(to, subject, html);
  if (response.success) {
    logger.info("[Email] Sent via PHP backend", { to, subject });
    return true;
  }
  logger.warn("[Email] PHP backend failed:", response.error);
  return false;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const edgeResult = await sendViaEdgeFunction(to, subject, html);
    if (edgeResult) return true;
  } catch (error) {
    logger.warn("[Email] Edge Function error:", error instanceof Error ? error.message : String(error));
  }

  try {
    return await sendViaPhpBackend(to, subject, html);
  } catch (error) {
    logger.error("[Email] PHP fallback error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function dispatchViaEdgeFunction(type: string, data: Record<string, unknown>): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;

  const url = `${SUPABASE_URL}/functions/v1/send-email`;

  const template = buildTemplateFromType(type, data);
  if (!template) return false;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      to: (data.user_email as string) || "",
      subject: template.subject,
      html: template.html,
    }),
  });

  const result = await response.json();
  return result.success === true;
}

async function dispatchViaPhp(type: string, data: Record<string, unknown>): Promise<boolean> {
  const response = await apiClient.dispatchEmail(type, data);
  return response.success === true;
}

async function dispatch(type: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    const edgeResult = await dispatchViaEdgeFunction(type, data);
    if (edgeResult) {
      logger.info(`[Email] Dispatched via Edge Function: ${type}`);
      return true;
    }
  } catch (error) {
    logger.warn("[Email] Edge Function dispatch error:", error instanceof Error ? error.message : String(error));
  }

  try {
    const phpResult = await dispatchViaPhp(type, data);
    if (phpResult) {
      logger.info(`[Email] Dispatched via PHP: ${type}`);
      return true;
    }
    logger.error(`[Email] PHP dispatch also failed: ${type}`);
    return false;
  } catch (error) {
    logger.error("[Email] PHP dispatch error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function dispatchSafe(type: string, data: Record<string, unknown>, silent = false): Promise<void> {
  try {
    const sent = await dispatch(type, data);
    if (!sent && !silent) {
      logger.warn(`[Email] Echec dispatch: ${type}`);
    }
  } catch (error) {
    logger.error("[Email] dispatchSafe error:", error instanceof Error ? error.message : String(error));
    if (!silent) {
      toast.error("L'envoi de l'email a echoue. Veuillez reessayer.");
    }
  }
}

function buildTemplateFromType(type: string, data: Record<string, unknown>): { subject: string; html: string } | null {
  switch (type) {
    case "reservation_created":
      return reservationCreatedEmail({
        prenom: data.prenom as string,
        espaceName: data.espace_name as string,
        espaceType: (data.espace_type as string) || "",
        dateDebut: data.date_debut as string,
        dateFin: (data.date_fin as string) || "",
        heureDebut: data.heure_debut as string,
        heureFin: data.heure_fin as string,
        duree: (data.duree as string) || "",
        participants: (data.participants as number) || 1,
        montant: (data.montant as number) || 0,
        notes: data.notes as string,
      });
    case "reservation_confirmed":
      return reservationConfirmedEmail({
        prenom: data.prenom as string,
        espaceName: data.espace_name as string,
        espaceType: (data.espace_type as string) || "",
        dateDebut: data.date_debut as string,
        dateFin: (data.date_fin as string) || "",
        heureDebut: data.heure_debut as string,
        heureFin: data.heure_fin as string,
        duree: (data.duree as string) || "",
        participants: (data.participants as number) || 1,
        montant: (data.montant as number) || 0,
      });
    case "reservation_cancelled":
      return reservationCancelledEmail({
        prenom: data.prenom as string,
        espaceName: data.espace_name as string,
        espaceType: (data.espace_type as string) || "",
        dateDebut: data.date_debut as string,
        dateFin: (data.date_fin as string) || "",
        heureDebut: data.heure_debut as string,
        heureFin: data.heure_fin as string,
        duree: (data.duree as string) || "",
        participants: (data.participants as number) || 1,
        montant: (data.montant as number) || 0,
        raison: data.raison as string,
      });
    case "domiciliation_submitted":
      return domiciliationSubmittedEmail({
        prenom: data.prenom as string,
        raisonSociale: data.raison_sociale as string,
        formeJuridique: data.forme_juridique as string,
        statut: "dossier_preparatoire",
        statutLabel: "En cours de traitement",
      });
    case "domiciliation_status_update": {
      const statut = data.statut as string;
      if (statut === "active" || statut === "domiciliation_creee") {
        return domiciliationActivatedEmail({
          prenom: data.prenom as string,
          raisonSociale: data.raison_sociale as string,
          statut,
          statutLabel: data.statut_label as string,
          montantMensuel: data.montant_mensuel as number,
          dateDebut: data.date_debut as string,
          dateFin: data.date_fin as string,
        });
      }
      if (statut === "refusee" || statut === "rejetee" || statut === "resiliee") {
        return domiciliationRejectedEmail({
          prenom: data.prenom as string,
          raisonSociale: data.raison_sociale as string,
          statut,
          statutLabel: data.statut_label as string,
          commentaire: data.commentaire as string,
        });
      }
      return domiciliationStatusEmail({
        prenom: data.prenom as string,
        raisonSociale: data.raison_sociale as string,
        statut,
        statutLabel: data.statut_label as string,
        montantMensuel: data.montant_mensuel as number,
        commentaire: data.commentaire as string,
        dateDebut: data.date_debut as string,
        dateFin: data.date_fin as string,
      });
    }
    default:
      logger.warn(`[Email] Unknown template type: ${type}`);
      return null;
  }
}

export interface ReservationEmailData {
  prenom: string;
  espaceName: string;
  espaceType: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  duree: string;
  participants: number;
  montant: number;
  reservationId?: string;
  notes?: string;
}

export interface DomiciliationEmailData {
  prenom: string;
  raisonSociale: string;
  formeJuridique?: string;
  statut: string;
  statutLabel: string;
  montantMensuel?: number;
  commentaire?: string;
  dateDebut?: string;
  dateFin?: string;
}

export const emailService = {
  async onReservationCreated(userEmail: string, data: ReservationEmailData) {
    await dispatchSafe("reservation_created", {
      prenom: data.prenom,
      espace_name: data.espaceName,
      date_debut: data.dateDebut,
      heure_debut: data.heureDebut,
      heure_fin: data.heureFin,
      duree: data.duree,
      participants: data.participants,
      montant: data.montant,
      user_email: userEmail,
      notes: data.notes,
    });
  },

  async onReservationConfirmed(userEmail: string, data: ReservationEmailData) {
    await dispatchSafe("reservation_confirmed", {
      prenom: data.prenom,
      espace_name: data.espaceName,
      date_debut: data.dateDebut,
      heure_debut: data.heureDebut,
      heure_fin: data.heureFin,
      participants: data.participants,
      montant: data.montant,
      user_email: userEmail,
    });
  },

  async onReservationCancelled(userEmail: string, data: ReservationEmailData & { raison?: string }) {
    await dispatchSafe("reservation_cancelled", {
      prenom: data.prenom,
      espace_name: data.espaceName,
      date_debut: data.dateDebut,
      heure_debut: data.heureDebut,
      heure_fin: data.heureFin,
      montant: data.montant,
      raison: data.raison,
      user_email: userEmail,
    });
  },

  async onDomiciliationSubmitted(userEmail: string, data: DomiciliationEmailData) {
    await dispatchSafe("domiciliation_submitted", {
      prenom: data.prenom,
      raison_sociale: data.raisonSociale,
      forme_juridique: data.formeJuridique,
      user_email: userEmail,
    });
  },

  async onDomiciliationStatusUpdate(userEmail: string, data: DomiciliationEmailData) {
    await dispatchSafe("domiciliation_status_update", {
      prenom: data.prenom,
      raison_sociale: data.raisonSociale,
      statut: data.statut,
      statut_label: data.statutLabel,
      montant_mensuel: data.montantMensuel,
      commentaire: data.commentaire,
      date_debut: data.dateDebut,
      date_fin: data.dateFin,
      user_email: userEmail,
    });
  },

  async sendCustom(to: string, subject: string, html: string) {
    return sendEmail(to, subject, html);
  },

  sendViaEdgeFunction,
};
