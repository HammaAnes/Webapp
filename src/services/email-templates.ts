const COFFICE_ADDRESS = "Mohammadia Mall, 4\u00e8me \u00e9tage, Bureau 1178, Alger";
const COFFICE_PHONE = "+213 23 804 924";
const COFFICE_MOBILE = "+213 795 38 01 24";
const COFFICE_EMAIL = "desk@coffice.dz";
const COFFICE_URL = "https://coffice.dz";

function baseLayout(title: string, content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<style>
body{margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
.wrapper{max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.header{background:#ffffff;padding:32px 32px 24px;text-align:center;border-bottom:1px solid #e5e7eb}
.header img{height:48px;display:inline-block}
.header h1{color:#111827;font-size:18px;font-weight:700;margin:12px 0 0;letter-spacing:-0.3px}
.body{padding:32px}
.body h2{font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.3}
.body p{font-size:15px;line-height:1.65;color:#4b5563;margin:0 0 16px}
.info-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:20px 0}
.info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
.info-row:last-child{border-bottom:none}
.info-label{color:#6b7280;font-weight:500}
.info-value{color:#111827;font-weight:600;text-align:right}
.cta-btn{display:inline-block;background:#059669;color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;margin:16px 0;text-align:center}
.cta-btn:hover{background:#047857}
.cta-secondary{background:#111827}
.cta-secondary:hover{background:#1f2937}
.status-badge{display:inline-block;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600}
.status-success{background:#ecfdf5;color:#059669}
.status-warning{background:#fffbeb;color:#d97706}
.status-danger{background:#fef2f2;color:#dc2626}
.status-info{background:#eff6ff;color:#2563eb}
.highlight-box{background:#111827;border-radius:10px;padding:24px;margin:20px 0;text-align:center}
.highlight-box .amount{font-size:32px;font-weight:800;color:#ffffff;margin:0}
.highlight-box .label{font-size:13px;color:#9ca3af;margin:4px 0 0}
.divider{height:1px;background:#e5e7eb;margin:24px 0}
.footer{background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb}
.footer p{font-size:12px;color:#9ca3af;margin:4px 0;line-height:1.5}
.footer a{color:#059669;text-decoration:none}
.preheader{display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7}
@media(max-width:640px){.wrapper{margin:0 12px;border-radius:0}.body{padding:24px 20px}.header{padding:20px}.info-row{flex-direction:column;gap:4px}.info-value{text-align:left}}
</style>
</head>
<body style="margin:0;padding:20px 0;background:#f4f5f7">
<div class="preheader">${preheader}</div>
<div class="wrapper">
<div class="header">
<a href="${COFFICE_URL}" style="text-decoration:none"><img src="${COFFICE_URL}/logo-web-transparent-black.png" alt="Coffice" style="height:48px;display:inline-block" /></a>
</div>
<div class="body">${content}</div>
<div class="footer">
<a href="${COFFICE_URL}" style="text-decoration:none"><img src="${COFFICE_URL}/logo-web-transparent-black.png" alt="Coffice" style="height:28px;display:inline-block;margin-bottom:12px;opacity:0.6" /></a>
<p>${COFFICE_ADDRESS}</p>
<p>T\u00e9l\u00e9phone : ${COFFICE_PHONE} | Mobile : ${COFFICE_MOBILE}</p>
<p>Email : <a href="mailto:${COFFICE_EMAIL}">${COFFICE_EMAIL}</a> | <a href="${COFFICE_URL}">${COFFICE_URL}</a></p>
<div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
<p style="font-size:11px">Vous recevez cet e-mail car vous disposez d\u2019un compte sur Coffice.</p>
</div>
</div>
</div>
</body>
</html>`;
}

function infoBox(rows: { label: string; value: string }[]): string {
  return `<div class="info-box">
${rows.map((r) => `<div class="info-row"><span class="info-label">${r.label}</span><span class="info-value">${r.value}</span></div>`).join("\n")}
</div>`;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface WelcomeData {
  prenom: string;
  nom: string;
  email: string;
}

export function welcomeEmail(data: WelcomeData): EmailTemplate {
  const content = `
<h2>Bienvenue chez Coffice, ${data.prenom}\u00a0!</h2>
<p>Nous sommes ravis de vous compter parmi nos membres. Votre compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.</p>
${infoBox([
  { label: "Nom complet", value: `${data.prenom} ${data.nom}` },
  { label: "E-mail", value: data.email },
])}
<p>Vous pouvez d\u00e8s maintenant acc\u00e9der \u00e0 notre plateforme pour\u00a0:</p>
<ul style="color:#4b5563;font-size:15px;line-height:2;padding-left:20px">
<li>R\u00e9server un espace de travail (box, open space, salle de r\u00e9union)</li>
<li>Consulter les disponibilit\u00e9s en temps r\u00e9el</li>
<li>Demander une domiciliation commerciale</li>
<li>G\u00e9rer vos r\u00e9servations et abonnements</li>
</ul>
<div style="text-align:center">
<a href="${COFFICE_URL}/connexion" class="cta-btn">Acc\u00e9der \u00e0 mon espace</a>
</div>`;

  return {
    subject: "Bienvenue chez Coffice\u00a0!",
    html: baseLayout("Bienvenue chez Coffice", content, "Votre compte Coffice a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s"),
  };
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

export function reservationCreatedEmail(data: ReservationEmailData): EmailTemplate {
  const content = `
<h2>R\u00e9servation enregistr\u00e9e</h2>
<p>Bonjour ${data.prenom}, votre r\u00e9servation a bien \u00e9t\u00e9 enregistr\u00e9e et est en attente de confirmation.</p>
${infoBox([
  { label: "Espace", value: data.espaceName },
  { label: "Type", value: data.espaceType },
  { label: "Date", value: data.dateDebut },
  { label: "Horaire", value: `${data.heureDebut} \u2013 ${data.heureFin}` },
  { label: "Dur\u00e9e", value: data.duree },
  { label: "Participants", value: `${data.participants} personne${data.participants > 1 ? "s" : ""}` },
])}
<div class="highlight-box">
<p class="label">Montant estim\u00e9</p>
<p class="amount">${data.montant.toLocaleString("fr-DZ")} DA</p>
</div>
${data.notes ? `<p style="font-style:italic;color:#6b7280;font-size:14px">Notes\u00a0: ${data.notes}</p>` : ""}
<p>Vous recevrez une confirmation par e-mail d\u00e8s que votre r\u00e9servation sera valid\u00e9e par notre \u00e9quipe.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/reservations" class="cta-btn">Voir mes r\u00e9servations</a>
</div>`;

  return {
    subject: `R\u00e9servation enregistr\u00e9e \u2013 ${data.espaceName}`,
    html: baseLayout("R\u00e9servation enregistr\u00e9e", content, `Votre r\u00e9servation pour ${data.espaceName} a \u00e9t\u00e9 enregistr\u00e9e`),
  };
}

export function reservationConfirmedEmail(data: ReservationEmailData): EmailTemplate {
  const content = `
<h2>R\u00e9servation confirm\u00e9e\u00a0!</h2>
<p>Bonjour ${data.prenom}, bonne nouvelle\u00a0! Votre r\u00e9servation a \u00e9t\u00e9 confirm\u00e9e.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge status-success">Confirm\u00e9e</span>
</div>
${infoBox([
  { label: "Espace", value: data.espaceName },
  { label: "Date", value: data.dateDebut },
  { label: "Horaire", value: `${data.heureDebut} \u2013 ${data.heureFin}` },
  { label: "Participants", value: `${data.participants} personne${data.participants > 1 ? "s" : ""}` },
  { label: "Montant", value: `${data.montant.toLocaleString("fr-DZ")} DA` },
])}
<p>Nous vous attendons au 4\u00e8me \u00e9tage du Mohammadia Mall, Bureau 1178.</p>
<p style="font-size:14px;color:#6b7280">En cas de besoin, contactez-nous au ${COFFICE_MOBILE} ou par e-mail \u00e0 ${COFFICE_EMAIL}.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/reservations" class="cta-btn">Voir ma r\u00e9servation</a>
</div>`;

  return {
    subject: `R\u00e9servation confirm\u00e9e \u2013 ${data.espaceName}`,
    html: baseLayout("R\u00e9servation confirm\u00e9e", content, `Votre r\u00e9servation pour ${data.espaceName} est confirm\u00e9e`),
  };
}

export function reservationCancelledEmail(data: ReservationEmailData & { raison?: string }): EmailTemplate {
  const content = `
<h2>R\u00e9servation annul\u00e9e</h2>
<p>Bonjour ${data.prenom}, votre r\u00e9servation a \u00e9t\u00e9 annul\u00e9e.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge status-danger">Annul\u00e9e</span>
</div>
${infoBox([
  { label: "Espace", value: data.espaceName },
  { label: "Date", value: data.dateDebut },
  { label: "Horaire", value: `${data.heureDebut} \u2013 ${data.heureFin}` },
  { label: "Montant", value: `${data.montant.toLocaleString("fr-DZ")} DA` },
])}
${data.raison ? `<div class="info-box" style="border-color:#fecaca;background:#fef2f2"><p style="margin:0;font-size:14px;color:#991b1b"><strong>Motif\u00a0:</strong> ${data.raison}</p></div>` : ""}
<p>Si vous souhaitez effectuer une nouvelle r\u00e9servation, n\u2019h\u00e9sitez pas \u00e0 acc\u00e9der \u00e0 votre espace personnel.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/reservations" class="cta-btn cta-secondary">Nouvelle r\u00e9servation</a>
</div>`;

  return {
    subject: `R\u00e9servation annul\u00e9e \u2013 ${data.espaceName}`,
    html: baseLayout("R\u00e9servation annul\u00e9e", content, `Votre r\u00e9servation pour ${data.espaceName} a \u00e9t\u00e9 annul\u00e9e`),
  };
}

export function reservationReminderEmail(data: ReservationEmailData): EmailTemplate {
  const content = `
<h2>Rappel\u00a0: r\u00e9servation demain</h2>
<p>Bonjour ${data.prenom}, nous vous rappelons que votre r\u00e9servation est pr\u00e9vue pour demain.</p>
${infoBox([
  { label: "Espace", value: data.espaceName },
  { label: "Date", value: data.dateDebut },
  { label: "Horaire", value: `${data.heureDebut} \u2013 ${data.heureFin}` },
  { label: "Participants", value: `${data.participants} personne${data.participants > 1 ? "s" : ""}` },
])}
<div class="info-box">
<p style="margin:0;font-size:14px;color:#374151"><strong>Adresse\u00a0:</strong> ${COFFICE_ADDRESS}</p>
<p style="margin:8px 0 0;font-size:14px;color:#374151"><strong>T\u00e9l\u00e9phone\u00a0:</strong> ${COFFICE_MOBILE}</p>
</div>
<p>\u00c0 demain chez Coffice\u00a0!</p>`;

  return {
    subject: `Rappel \u2013 R\u00e9servation demain \u00e0 ${data.heureDebut}`,
    html: baseLayout("Rappel de r\u00e9servation", content, `Rappel\u00a0: votre r\u00e9servation est pr\u00e9vue demain \u00e0 ${data.heureDebut}`),
  };
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

export function domiciliationSubmittedEmail(data: DomiciliationEmailData): EmailTemplate {
  const content = `
<h2>Demande de domiciliation re\u00e7ue</h2>
<p>Bonjour ${data.prenom}, votre demande de domiciliation commerciale a bien \u00e9t\u00e9 enregistr\u00e9e.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge status-warning">En cours de traitement</span>
</div>
${infoBox([
  { label: "Raison sociale", value: data.raisonSociale },
  { label: "Forme juridique", value: data.formeJuridique || "\u2014" },
  { label: "Adresse de domiciliation", value: COFFICE_ADDRESS },
])}
<p>Notre \u00e9quipe va examiner votre dossier dans les meilleurs d\u00e9lais. Vous serez notifi\u00e9(e) \u00e0 chaque \u00e9tape de la progression.</p>
<p style="font-size:14px;color:#6b7280">Pour toute question, contactez-nous au ${COFFICE_MOBILE} ou \u00e0 ${COFFICE_EMAIL}.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/mon-espace?tab=domiciliation" class="cta-btn">Suivre ma demande</a>
</div>`;

  return {
    subject: `Demande de domiciliation enregistr\u00e9e \u2013 ${data.raisonSociale}`,
    html: baseLayout("Demande de domiciliation", content, `Votre demande de domiciliation pour ${data.raisonSociale} a \u00e9t\u00e9 enregistr\u00e9e`),
  };
}

export function domiciliationStatusEmail(data: DomiciliationEmailData): EmailTemplate {
  const statusClass =
    data.statut === "active" || data.statut === "domiciliation_creee"
      ? "status-success"
      : data.statut === "refusee" || data.statut === "resiliee"
      ? "status-danger"
      : "status-warning";

  const rows = [
    { label: "Raison sociale", value: data.raisonSociale },
    { label: "Statut", value: data.statutLabel },
  ];
  if (data.montantMensuel) rows.push({ label: "Montant mensuel", value: `${data.montantMensuel.toLocaleString("fr-DZ")} DA` });
  if (data.dateDebut) rows.push({ label: "Date de d\u00e9but", value: data.dateDebut });
  if (data.dateFin) rows.push({ label: "Date de fin", value: data.dateFin });

  const content = `
<h2>Mise \u00e0 jour de votre domiciliation</h2>
<p>Bonjour ${data.prenom}, le statut de votre domiciliation a \u00e9t\u00e9 mis \u00e0 jour.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge ${statusClass}">${data.statutLabel}</span>
</div>
${infoBox(rows)}
${data.commentaire ? `<div class="info-box"><p style="margin:0;font-size:14px;color:#374151"><strong>Commentaire\u00a0:</strong> ${data.commentaire}</p></div>` : ""}
<div style="text-align:center">
<a href="${COFFICE_URL}/app/mon-espace?tab=domiciliation" class="cta-btn">Voir les d\u00e9tails</a>
</div>`;

  return {
    subject: `Domiciliation \u2013 ${data.statutLabel}`,
    html: baseLayout("Mise \u00e0 jour domiciliation", content, `Votre domiciliation est maintenant\u00a0: ${data.statutLabel}`),
  };
}

export function domiciliationActivatedEmail(data: DomiciliationEmailData): EmailTemplate {
  const content = `
<h2>Domiciliation activ\u00e9e\u00a0!</h2>
<p>Bonjour ${data.prenom}, f\u00e9licitations\u00a0! Votre domiciliation commerciale est d\u00e9sormais active.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge status-success">Active</span>
</div>
${infoBox([
  { label: "Raison sociale", value: data.raisonSociale },
  { label: "Adresse", value: COFFICE_ADDRESS },
  { label: "Montant mensuel", value: data.montantMensuel ? `${data.montantMensuel.toLocaleString("fr-DZ")} DA` : "\u2014" },
  { label: "D\u00e9but du contrat", value: data.dateDebut || "\u2014" },
])}
<p>Vous pouvez d\u00e9sormais utiliser l\u2019adresse de Coffice comme si\u00e8ge social de votre entreprise.</p>
<p style="font-size:14px;color:#6b7280">Pour la r\u00e9ception de votre courrier et toute question administrative, contactez-nous au ${COFFICE_MOBILE} ou \u00e0 ${COFFICE_EMAIL}.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/mon-espace?tab=domiciliation" class="cta-btn">Mon espace domiciliation</a>
</div>`;

  return {
    subject: `Domiciliation activ\u00e9e \u2013 ${data.raisonSociale}`,
    html: baseLayout("Domiciliation activ\u00e9e", content, `Votre domiciliation pour ${data.raisonSociale} est d\u00e9sormais active`),
  };
}

export function domiciliationRejectedEmail(data: DomiciliationEmailData): EmailTemplate {
  const content = `
<h2>Demande de domiciliation refus\u00e9e</h2>
<p>Bonjour ${data.prenom}, nous sommes au regret de vous informer que votre demande de domiciliation n\u2019a pas pu \u00eatre accept\u00e9e.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge status-danger">Refus\u00e9e</span>
</div>
${infoBox([
  { label: "Raison sociale", value: data.raisonSociale },
])}
${data.commentaire ? `<div class="info-box" style="border-color:#fecaca;background:#fef2f2"><p style="margin:0;font-size:14px;color:#991b1b"><strong>Motif\u00a0:</strong> ${data.commentaire}</p></div>` : ""}
<p>Si vous pensez qu\u2019il s\u2019agit d\u2019une erreur ou si vous souhaitez soumettre une nouvelle demande, n\u2019h\u00e9sitez pas \u00e0 nous contacter au ${COFFICE_MOBILE} ou \u00e0 ${COFFICE_EMAIL}.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/mon-espace?tab=domiciliation" class="cta-btn cta-secondary">Nous contacter</a>
</div>`;

  return {
    subject: `Domiciliation refus\u00e9e \u2013 ${data.raisonSociale}`,
    html: baseLayout("Domiciliation refus\u00e9e", content, `Votre demande de domiciliation pour ${data.raisonSociale} a \u00e9t\u00e9 refus\u00e9e`),
  };
}

export interface PasswordResetData {
  prenom: string;
  resetLink: string;
}

export function passwordResetEmail(data: PasswordResetData): EmailTemplate {
  const content = `
<h2>R\u00e9initialisation de votre mot de passe</h2>
<p>Bonjour ${data.prenom}, vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe.</p>
<p>Cliquez sur le bouton ci-dessous pour d\u00e9finir un nouveau mot de passe\u00a0:</p>
<div style="text-align:center">
<a href="${data.resetLink}" class="cta-btn">R\u00e9initialiser mon mot de passe</a>
</div>
<p style="font-size:13px;color:#9ca3af;margin-top:24px">Ce lien est valable pendant 1 heure. Si vous n\u2019avez pas fait cette demande, ignorez simplement cet e-mail.</p>`;

  return {
    subject: "R\u00e9initialisation de votre mot de passe \u2013 Coffice",
    html: baseLayout("R\u00e9initialisation mot de passe", content, "R\u00e9initialisation de votre mot de passe Coffice"),
  };
}

export interface AdminNotificationData {
  type:
    | "new_user"
    | "new_reservation"
    | "new_domiciliation"
    | "reservation_cancelled"
    | "reservation_confirmed"
    | "domiciliation_status_update"
    | "password_reset_requested";
  userName: string;
  userEmail: string;
  details: { label: string; value: string }[];
}

export function adminNotificationEmail(data: AdminNotificationData): EmailTemplate {
  const titles: Record<string, string> = {
    new_user: "Nouvelle inscription",
    new_reservation: "Nouvelle r\u00e9servation",
    new_domiciliation: "Nouvelle demande de domiciliation",
    reservation_cancelled: "R\u00e9servation annul\u00e9e",
    reservation_confirmed: "R\u00e9servation confirm\u00e9e",
    domiciliation_status_update: "Mise \u00e0 jour domiciliation",
    password_reset_requested: "Demande de r\u00e9initialisation mot de passe",
  };

  const subjects: Record<string, string> = {
    new_user: `[Admin] Nouvelle inscription \u2013 ${data.userName}`,
    new_reservation: `[Admin] Nouvelle r\u00e9servation \u2013 ${data.userName}`,
    new_domiciliation: `[Admin] Nouvelle domiciliation \u2013 ${data.userName}`,
    reservation_cancelled: `[Admin] Annulation r\u00e9servation \u2013 ${data.userName}`,
    reservation_confirmed: `[Admin] R\u00e9servation confirm\u00e9e \u2013 ${data.userName}`,
    domiciliation_status_update: `[Admin] Domiciliation mise \u00e0 jour \u2013 ${data.userName}`,
    password_reset_requested: `[Admin] R\u00e9initialisation mot de passe \u2013 ${data.userName}`,
  };

  const content = `
<h2>${titles[data.type]}</h2>
<p style="font-size:14px;color:#6b7280">Notification automatique du syst\u00e8me Coffice</p>
${infoBox([
  { label: "Utilisateur", value: data.userName },
  { label: "E-mail", value: data.userEmail },
  ...data.details,
])}
<div style="text-align:center">
<a href="${COFFICE_URL}/erp" class="cta-btn cta-secondary">Acc\u00e9der au tableau de bord</a>
</div>`;

  return {
    subject: subjects[data.type],
    html: baseLayout(titles[data.type], content, `${titles[data.type]}\u00a0: ${data.userName}`),
  };
}
