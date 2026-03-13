import { logger } from "../utils/logger";
import { apiClient } from "../lib/api-client";
import toast from "react-hot-toast";

async function dispatch(type: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await apiClient.dispatchEmail(type, data);
    if (!response.success) {
      logger.error("[Email] Dispatch failed:", response.error);
      return false;
    }
    logger.info(`[Email] Dispatched: ${type}`);
    return true;
  } catch (error) {
    logger.error("[Email] Error:", error instanceof Error ? error.message : String(error));
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
    try {
      const response = await apiClient.sendEmail(to, subject, html);
      if (!response.success) {
        logger.error("[Email] Custom send failed:", response.error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error("[Email] Custom send error:", error instanceof Error ? error.message : String(error));
      return false;
    }
  },
};
