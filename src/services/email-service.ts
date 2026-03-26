import { logger } from "../utils/logger";
import { apiClient } from "../lib/api-client";

async function dispatchSafe(type: string, data: Record<string, unknown>, silent = false): Promise<void> {
  try {
    const response = await apiClient.dispatchEmail(type, data);
    if (response.success) {
      logger.info(`[Email] Dispatched: ${type}`);
    } else if (!silent) {
      logger.warn(`[Email] Dispatch failed: ${type}`);
    }
  } catch (error) {
    if (!silent) {
      logger.error("[Email] Dispatch error:", error instanceof Error ? error.message : String(error));
    }
  }
}

export interface ReservationEmailData {
  prenom: string;
  espaceName: string;
  espaceType?: string;
  dateDebut: string;
  dateFin?: string;
  heureDebut: string;
  heureFin: string;
  duree?: string;
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

export interface DomiciliationExpirationData {
  prenom: string;
  raisonSociale: string;
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
      prenom:       data.prenom,
      espace_name:  data.espaceName,
      espace_type:  data.espaceType ?? "",
      date_debut:   data.dateDebut,
      date_fin:     data.dateFin ?? "",
      heure_debut:  data.heureDebut,
      heure_fin:    data.heureFin,
      duree:        data.duree ?? "",
      participants: data.participants,
      montant:      data.montant,
      user_email:   userEmail,
      notes:        data.notes ?? "",
    });
  },

  async onReservationConfirmed(userEmail: string, data: ReservationEmailData) {
    await dispatchSafe("reservation_confirmed", {
      prenom:       data.prenom,
      espace_name:  data.espaceName,
      espace_type:  data.espaceType ?? "",
      date_debut:   data.dateDebut,
      date_fin:     data.dateFin ?? "",
      heure_debut:  data.heureDebut,
      heure_fin:    data.heureFin,
      duree:        data.duree ?? "",
      participants: data.participants,
      montant:      data.montant,
      user_email:   userEmail,
    });
  },

  async onReservationCancelled(userEmail: string, data: ReservationEmailData & { raison?: string }) {
    await dispatchSafe("reservation_cancelled", {
      prenom:       data.prenom,
      espace_name:  data.espaceName,
      espace_type:  data.espaceType ?? "",
      date_debut:   data.dateDebut,
      date_fin:     data.dateFin ?? "",
      heure_debut:  data.heureDebut,
      heure_fin:    data.heureFin,
      montant:      data.montant,
      raison:       data.raison ?? "",
      user_email:   userEmail,
    });
  },

  async onDomiciliationSubmitted(userEmail: string, data: DomiciliationEmailData) {
    await dispatchSafe("domiciliation_submitted", {
      prenom:          data.prenom,
      raison_sociale:  data.raisonSociale,
      forme_juridique: data.formeJuridique ?? "",
      user_email:      userEmail,
    });
  },

  async onDomiciliationStatusUpdate(userEmail: string, data: DomiciliationEmailData) {
    await dispatchSafe("domiciliation_status_update", {
      prenom:           data.prenom,
      raison_sociale:   data.raisonSociale,
      statut:           data.statut,
      statut_label:     data.statutLabel,
      montant_mensuel:  data.montantMensuel ?? null,
      commentaire:      data.commentaire ?? "",
      date_debut:       data.dateDebut ?? "",
      date_fin:         data.dateFin ?? "",
      user_email:       userEmail,
    });
  },

  async onCourrierRecu(data: CourrierEmailData) {
    await dispatchSafe("courrier_recu", {
      prenom:         data.prenom,
      expediteur:     data.expediteur,
      type_courrier:  data.typeCourrier,
      date_reception: data.dateReception,
      raison_sociale: data.raisonSociale,
      user_email:     data.userEmail,
    }, true);
  },

  async onAbonnementExpiration(data: AbonnementExpirationData) {
    await dispatchSafe("abonnement_expiration", {
      prenom:         data.prenom,
      plan_nom:       data.planNom,
      prix_mensuel:   data.prixMensuel ?? null,
      date_fin:       data.dateFin,
      jours_restants: data.joursRestants,
      user_email:     data.userEmail,
    }, true);
  },

  async onDomiciliationExpiration(data: DomiciliationExpirationData) {
    await dispatchSafe("domiciliation_expiration", {
      prenom:          data.prenom,
      raison_sociale:  data.raisonSociale,
      date_fin:        data.dateFin,
      jours_restants:  data.joursRestants,
      user_email:      data.userEmail,
    }, true);
  },

  async onParrainageBonus(data: ParrainageBonusData) {
    await dispatchSafe("parrainage_bonus", {
      prenom:        data.prenom,
      filleul_prenom: data.filleulPrenom,
      filleul_nom:   data.filleulNom,
      bonus_montant: data.bonusMontant,
      user_email:    data.userEmail,
    }, true);
  },

  async sendCustom(to: string, subject: string, html: string): Promise<boolean> {
    const response = await apiClient.sendEmail(to, subject, html);
    return response.success === true;
  },
};
