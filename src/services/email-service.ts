import { logger } from "../utils/logger";
import { apiClient } from "../lib/api-client";
import {
  reservationCreatedEmail,
  reservationConfirmedEmail,
  reservationCancelledEmail,
  domiciliationSubmittedEmail,
  domiciliationStatusEmail,
  domiciliationActivatedEmail,
  domiciliationRejectedEmail,
} from "./email-templates";

async function dispatchViaPhp(type: string, data: Record<string, unknown>): Promise<boolean> {
  const response = await apiClient.dispatchEmail(type, data);
  return response.success === true;
}

async function dispatch(type: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    const result = await dispatchViaPhp(type, data);
    if (result) {
      logger.info(`[Email] Dispatched: ${type}`);
      return true;
    }
    logger.error(`[Email] Dispatch failed: ${type}`);
    return false;
  } catch (error) {
    logger.error("[Email] Dispatch error:", error instanceof Error ? error.message : String(error));
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
  }
}

export function buildTemplateFromType(type: string, data: Record<string, unknown>): { subject: string; html: string } | null {
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

export interface CourrierEmailData {
  prenom: string;
  expediteur: string;
  typeCourrier: string;
  dateReception: string;
  raisonSociale: string;
  userEmail: string;
}

export interface AbonnementExpirationData {
  prenom: string;
  planNom: string;
  prixMensuel?: number;
  dateFin: string;
  joursRestants: number;
  userEmail: string;
}

export interface ParrainageBonusData {
  prenom: string;
  filleulPrenom: string;
  filleulNom: string;
  bonusMontant: number;
  userEmail: string;
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

  async onCourrierRecu(data: CourrierEmailData) {
    await dispatchSafe("courrier_recu", {
      prenom: data.prenom,
      expediteur: data.expediteur,
      type_courrier: data.typeCourrier,
      date_reception: data.dateReception,
      raison_sociale: data.raisonSociale,
      user_email: data.userEmail,
    }, true);
  },

  async onAbonnementExpiration(data: AbonnementExpirationData) {
    await dispatchSafe("abonnement_expiration", {
      prenom: data.prenom,
      plan_nom: data.planNom,
      prix_mensuel: data.prixMensuel,
      date_fin: data.dateFin,
      jours_restants: data.joursRestants,
      user_email: data.userEmail,
    }, true);
  },

  async onParrainageBonus(data: ParrainageBonusData) {
    await dispatchSafe("parrainage_bonus", {
      prenom: data.prenom,
      filleul_prenom: data.filleulPrenom,
      filleul_nom: data.filleulNom,
      bonus_montant: data.bonusMontant,
      user_email: data.userEmail,
    }, true);
  },

  async sendCustom(to: string, subject: string, html: string) {
    const response = await apiClient.sendEmail(to, subject, html);
    return response.success;
  },
};
