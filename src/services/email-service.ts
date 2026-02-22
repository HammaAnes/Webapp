import { logger } from "../utils/logger";
import { apiClient } from "../lib/api-client";
import toast from "react-hot-toast";
import {
  welcomeEmail,
  reservationCreatedEmail,
  reservationConfirmedEmail,
  reservationCancelledEmail,
  reservationReminderEmail,
  domiciliationSubmittedEmail,
  domiciliationStatusEmail,
  domiciliationActivatedEmail,
  domiciliationRejectedEmail,
  passwordResetEmail,
  adminNotificationEmail,
} from "./email-templates";
import type {
  WelcomeData,
  ReservationEmailData,
  DomiciliationEmailData,
  PasswordResetData,
  AdminNotificationData,
  EmailTemplate,
} from "./email-templates";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "desk@coffice.dz";

async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    const response = await apiClient.sendEmail(to, template.subject, template.html);

    if (!response.success) {
      logger.error("[Email] Send failed:", response.error);
      return false;
    }

    logger.info(`[Email] Sent to ${to}: ${template.subject}`);
    return true;
  } catch (error) {
    logger.error("[Email] Error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function sendSafe(to: string, template: EmailTemplate, silent = false): Promise<void> {
  try {
    const sent = await sendEmail(to, template);
    if (!sent && !silent) {
      logger.warn(`[Email] Echec envoi a ${to}`);
    }
  } catch (error) {
    logger.error("[Email] sendSafe error:", error instanceof Error ? error.message : String(error));
    if (!silent) {
      toast.error("L'envoi de l'email a echoue. Veuillez reessayer.");
    }
  }
}

export const emailService = {
  async onUserRegistered(data: WelcomeData) {
    await Promise.all([
      sendSafe(data.email, welcomeEmail(data)),
      sendSafe(ADMIN_EMAIL, adminNotificationEmail({
        type: "new_user",
        userName: `${data.prenom} ${data.nom}`,
        userEmail: data.email,
        details: [
          { label: "Date", value: new Date().toLocaleDateString("fr-FR") },
        ],
      })),
    ]);
  },

  async onReservationCreated(userEmail: string, data: ReservationEmailData) {
    await Promise.all([
      sendSafe(userEmail, reservationCreatedEmail(data)),
      sendSafe(ADMIN_EMAIL, adminNotificationEmail({
        type: "new_reservation",
        userName: data.prenom,
        userEmail,
        details: [
          { label: "Espace", value: data.espaceName },
          { label: "Date", value: data.dateDebut },
          { label: "Horaire", value: `${data.heureDebut} - ${data.heureFin}` },
          { label: "Montant", value: `${data.montant.toLocaleString("fr-DZ")} DA` },
        ],
      })),
    ]);
  },

  async onReservationConfirmed(userEmail: string, data: ReservationEmailData) {
    await Promise.all([
      sendSafe(userEmail, reservationConfirmedEmail(data)),
      sendSafe(ADMIN_EMAIL, adminNotificationEmail({
        type: "reservation_confirmed",
        userName: data.prenom,
        userEmail,
        details: [
          { label: "Espace", value: data.espaceName },
          { label: "Date", value: data.dateDebut },
          { label: "Horaire", value: `${data.heureDebut} \u2013 ${data.heureFin}` },
          { label: "Montant", value: `${data.montant.toLocaleString("fr-DZ")} DA` },
        ],
      })),
    ]);
  },

  async onReservationCancelled(userEmail: string, data: ReservationEmailData & { raison?: string }) {
    await Promise.all([
      sendSafe(userEmail, reservationCancelledEmail(data)),
      sendSafe(ADMIN_EMAIL, adminNotificationEmail({
        type: "reservation_cancelled",
        userName: data.prenom,
        userEmail,
        details: [
          { label: "Espace", value: data.espaceName },
          { label: "Date", value: data.dateDebut },
          { label: "Montant", value: `${data.montant.toLocaleString("fr-DZ")} DA` },
        ],
      })),
    ]);
  },

  async onReservationReminder(userEmail: string, data: ReservationEmailData) {
    await sendSafe(userEmail, reservationReminderEmail(data));
  },

  async onDomiciliationSubmitted(userEmail: string, data: DomiciliationEmailData) {
    await Promise.all([
      sendSafe(userEmail, domiciliationSubmittedEmail(data)),
      sendSafe(ADMIN_EMAIL, adminNotificationEmail({
        type: "new_domiciliation",
        userName: data.prenom,
        userEmail,
        details: [
          { label: "Raison sociale", value: data.raisonSociale },
          { label: "Forme juridique", value: data.formeJuridique || "-" },
        ],
      })),
    ]);
  },

  async onDomiciliationStatusUpdate(userEmail: string, data: DomiciliationEmailData) {
    const userTemplate =
      data.statut === "active"
        ? domiciliationActivatedEmail(data)
        : data.statut === "refusee"
        ? domiciliationRejectedEmail(data)
        : domiciliationStatusEmail(data);

    await Promise.all([
      sendSafe(userEmail, userTemplate),
      sendSafe(ADMIN_EMAIL, adminNotificationEmail({
        type: "domiciliation_status_update",
        userName: data.prenom,
        userEmail,
        details: [
          { label: "Raison sociale", value: data.raisonSociale },
          { label: "Nouveau statut", value: data.statutLabel },
          ...(data.montantMensuel ? [{ label: "Montant mensuel", value: `${data.montantMensuel.toLocaleString("fr-DZ")} DA` }] : []),
          ...(data.commentaire ? [{ label: "Commentaire", value: data.commentaire }] : []),
        ],
      })),
    ]);
  },

  async onPasswordReset(userEmail: string, data: PasswordResetData) {
    await sendSafe(userEmail, passwordResetEmail(data));
  },

  async sendCustom(to: string, template: EmailTemplate) {
    await sendSafe(to, template);
  },
};

export type {
  WelcomeData,
  ReservationEmailData,
  DomiciliationEmailData,
  PasswordResetData,
  AdminNotificationData,
};
