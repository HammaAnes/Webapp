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
body{margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
.wrapper{max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.header{background:#ffffff;padding:32px 32px 24px;text-align:center;border-bottom:1px solid #e5e7eb}
.header img{height:48px;display:inline-block}
.body{padding:40px 32px 36px}
.body h2{font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.3}
.body p{font-size:15px;line-height:1.65;color:#4b5563;margin:0 0 16px}
.info-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:20px 0}
.info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
.info-row:last-child{border-bottom:none}
.info-label{color:#6b7280;font-weight:500}
.info-value{color:#111827;font-weight:600;text-align:right}
.cta-btn{display:inline-block;background:#0284c7;color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;margin:16px 0;text-align:center}
.cta-btn:hover{background:#0369a1}
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
.footer{background:#f9fafb;padding:28px 32px;text-align:center;border-top:1px solid #e5e7eb}
.footer p{font-size:12px;color:#9ca3af;margin:4px 0;line-height:1.5}
.footer a{color:#0284c7;text-decoration:none}
.contact-icon{display:inline-block;width:32px;height:32px;border-radius:8px;background:#0284c7;color:#ffffff;text-align:center;line-height:32px;font-size:16px;text-decoration:none;vertical-align:middle}
.preheader{display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f0f2f5}
@media(max-width:640px){.wrapper{margin:0 12px;border-radius:0}.body{padding:24px 20px}.header{padding:20px}.footer{padding:20px}.info-row{flex-direction:column;gap:4px}.info-value{text-align:left}}
</style>
</head>
<body style="margin:0;padding:20px 0;background:#f0f2f5">
<div class="preheader">${preheader}</div>
<div class="wrapper">
<div class="header">
<a href="${COFFICE_URL}" style="text-decoration:none"><img src="${COFFICE_URL}/logo_coffice.png" alt="Coffice" style="height:48px;display:inline-block" /></a>
</div>
<div class="body">${content}</div>
<div class="footer">
<a href="${COFFICE_URL}" style="text-decoration:none"><img src="${COFFICE_URL}/logo_coffice.png" alt="Coffice" style="height:28px;display:inline-block;margin-bottom:12px;opacity:0.5" /></a>
<p>${COFFICE_ADDRESS}</p>
<p>T\u00e9l. : ${COFFICE_PHONE} | Mobile : ${COFFICE_MOBILE}</p>
<div style="margin:16px 0">
<table style="margin:0 auto;border-spacing:0" role="presentation">
<tr>
<td style="padding:0 6px" valign="middle"><a href="mailto:${COFFICE_EMAIL}" class="contact-icon" style="display:inline-block;width:32px;height:32px;border-radius:8px;background:#0284c7;color:#ffffff;text-align:center;line-height:32px;font-size:16px;text-decoration:none">&#9993;</a></td>
<td style="padding:0 6px" valign="middle"><a href="mailto:${COFFICE_EMAIL}" style="color:#0284c7;text-decoration:none;font-size:13px;font-weight:600">${COFFICE_EMAIL}</a></td>
<td style="padding:0 12px;color:#d1d5db" valign="middle">|</td>
<td style="padding:0 6px" valign="middle"><a href="${COFFICE_URL}" class="contact-icon" style="display:inline-block;width:32px;height:32px;border-radius:8px;background:#0284c7;color:#ffffff;text-align:center;line-height:32px;font-size:16px;text-decoration:none">&#9737;</a></td>
<td style="padding:0 6px" valign="middle"><a href="${COFFICE_URL}" style="color:#0284c7;text-decoration:none;font-size:13px;font-weight:600">coffice.dz</a></td>
</tr>
</table>
</div>
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

export interface WelcomeOnboardingData extends WelcomeData {
  codeParrainage?: string;
  hasReferralBonus?: boolean;
  referralBonus?: number;
}

export function welcomeEmail(data: WelcomeOnboardingData): EmailTemplate {
  const referralSection = data.codeParrainage ? `
<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin:20px 0">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px">Votre code de parrainage</p>
<p style="margin:0 0 12px;font-size:14px;color:#374151">Partagez ce code et gagnez <strong>3 000 DA</strong> pour chaque ami qui s'inscrit.</p>
<div style="background:#0284c7;border-radius:8px;padding:12px 20px;text-align:center;display:inline-block;width:100%">
<p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;font-family:monospace">${data.codeParrainage}</p>
</div>
</div>` : '';

  const bonusSection = data.hasReferralBonus && data.referralBonus ? `
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:20px 0">
<p style="margin:0;font-size:14px;color:#166534"><strong>🎁 Bonus de bienvenue :</strong> ${(data.referralBonus).toLocaleString('fr-DZ')} DA ont été crédités sur votre compte !</p>
</div>` : '';

  const stepsSection = `
<div style="margin:24px 0">
<p style="font-size:15px;font-weight:600;color:#111827;margin:0 0 16px">Vos 3 premières étapes chez Coffice :</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr>
  <td style="width:36px;vertical-align:top;padding:2px 12px 16px 0">
    <div style="width:28px;height:28px;border-radius:50%;background:#0284c7;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff">1</div>
  </td>
  <td style="vertical-align:top;padding-bottom:16px">
    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827">Complétez votre profil</p>
    <p style="margin:0;font-size:13px;color:#6b7280">Ajoutez votre photo, entreprise et informations de contact.</p>
  </td>
</tr>
<tr>
  <td style="width:36px;vertical-align:top;padding:2px 12px 16px 0">
    <div style="width:28px;height:28px;border-radius:50%;background:#0284c7;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff">2</div>
  </td>
  <td style="vertical-align:top;padding-bottom:16px">
    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827">Explorez nos espaces</p>
    <p style="margin:0;font-size:13px;color:#6b7280">Box privés, open space, salles de réunion — trouvez l'espace qui vous correspond.</p>
  </td>
</tr>
<tr>
  <td style="width:36px;vertical-align:top;padding:2px 12px 0 0">
    <div style="width:28px;height:28px;border-radius:50%;background:#0284c7;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#ffffff">3</div>
  </td>
  <td style="vertical-align:top">
    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827">Effectuez votre première réservation</p>
    <p style="margin:0;font-size:13px;color:#6b7280">Réservez en quelques clics et commencez à travailler dans un cadre inspirant.</p>
  </td>
</tr>
</table>
</div>`;

  const content = `
<h2>Bienvenue chez Coffice, ${data.prenom}\u00a0!</h2>
<p>Nous sommes ravis de vous compter parmi nos membres. Votre compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.</p>
${infoBox([
  { label: "Nom complet", value: `${data.prenom} ${data.nom}` },
  { label: "E-mail", value: data.email },
])}
${bonusSection}
${stepsSection}
${referralSection}
<div style="text-align:center;margin-top:8px">
<a href="${COFFICE_URL}/app" class="cta-btn">Acc\u00e9der \u00e0 mon espace</a>
</div>
<p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:20px">Des questions ? Appelez-nous au ${COFFICE_MOBILE} ou écrivez à ${COFFICE_EMAIL}</p>`;

  return {
    subject: "Bienvenue chez Coffice\u00a0!",
    html: baseLayout("Bienvenue chez Coffice", content, "Votre compte Coffice a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s"),
  };
}

export interface OnboardingDiscoverData {
  prenom: string;
}

export function onboardingDiscoverEmail(data: OnboardingDiscoverData): EmailTemplate {
  const content = `
<h2>D\u00e9couvrez vos espaces de travail</h2>
<p>Bonjour ${data.prenom}, avez-vous d\u00e9j\u00e0 explor\u00e9 nos espaces\u00a0?</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0">
<tr>
  <td style="padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px">
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827">Box priv\u00e9e</p>
    <p style="margin:0;font-size:13px;color:#6b7280">Votre espace ind\u00e9pendant pour travailler sans interruption. Id\u00e9al pour les r\u00e9unions et la concentration.</p>
  </td>
</tr>
<tr><td style="height:8px"></td></tr>
<tr>
  <td style="padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px">
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827">Open Space</p>
    <p style="margin:0;font-size:13px;color:#6b7280">Un environnement dynamique pour travailler en communaut\u00e9. WiFi haut d\u00e9bit, caf\u00e9 et ambiance stimulante.</p>
  </td>
</tr>
<tr><td style="height:8px"></td></tr>
<tr>
  <td style="padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px">
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827">Salle de r\u00e9union</p>
    <p style="margin:0;font-size:13px;color:#6b7280">\u00c9quip\u00e9e d'un \u00e9cran et visioc\u00f3nf\u00e9rence. Parfaite pour recevoir vos clients et partenaires.</p>
  </td>
</tr>
</table>

<p style="font-size:14px;color:#6b7280">R\u00e9servez \u00e0 l'heure, \u00e0 la demi-journ\u00e9e ou \u00e0 la journ\u00e9e \u2014 en quelques clics depuis votre espace personnel.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/espaces" class="cta-btn">Voir les espaces</a>
</div>`;

  return {
    subject: "Explorez vos espaces de travail chez Coffice",
    html: baseLayout("D\u00e9couvrez Coffice", content, "Box priv\u00e9es, open space, salles de r\u00e9union \u2014 trouvez l\u2019espace id\u00e9al"),
  };
}

export interface OnboardingProfileData {
  prenom: string;
  profileComplete: boolean;
  hasReservation: boolean;
}

export function onboardingProfileEmail(data: OnboardingProfileData): EmailTemplate {
  const pendingSteps: string[] = [];
  if (!data.profileComplete) pendingSteps.push('Compl\u00e9tez votre profil (entreprise, t\u00e9l\u00e9phone, adresse)');
  if (!data.hasReservation) pendingSteps.push('Effectuez votre premi\u00e8re r\u00e9servation');

  const stepsHtml = pendingSteps.length > 0 ? `
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px;margin:20px 0">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#92400e">Il vous reste quelques \u00e9tapes :</p>
${pendingSteps.map(s => `<p style="margin:0 0 8px;font-size:14px;color:#78350f">&#8226; ${s}</p>`).join('')}
</div>` : `
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:20px 0">
<p style="margin:0;font-size:14px;color:#166534;font-weight:600">Votre profil est complet \u2014 vous \u00eates pr\u00eat(e) !</p>
</div>`;

  const content = `
<h2>Comment se passe votre exp\u00e9rience\u00a0?</h2>
<p>Bonjour ${data.prenom}, voil\u00e0 quelques jours que vous avez rejoint Coffice.</p>
<p>Pour profiter pleinement de votre espace de travail, voici o\u00f9 vous en \u00eates :</p>
${stepsHtml}
<p style="font-size:14px;color:#6b7280">N'h\u00e9sitez pas \u00e0 nous contacter si vous avez des questions \u2014 l'\u00e9quipe du desk est l\u00e0 pour vous aider.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app" class="cta-btn">Mon espace Coffice</a>
</div>`;

  return {
    subject: "Comment se passe votre expérience chez Coffice ?",
    html: baseLayout("Votre onboarding Coffice", content, "Quelques \u00e9tapes pour profiter pleinement de Coffice"),
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

export interface CourrierEmailData {
  prenom: string;
  raisonSociale: string;
  expediteur: string;
  typeCourrier: string;
  dateReception: string;
  description?: string;
}

export function courrierRecuEmail(data: CourrierEmailData): EmailTemplate {
  const content = `
<h2>Nouveau courrier re\u00e7u</h2>
<p>Bonjour ${data.prenom}, un courrier a \u00e9t\u00e9 re\u00e7u pour votre entreprise.</p>
${infoBox([
  { label: "Entreprise", value: data.raisonSociale },
  { label: "Exp\u00e9diteur", value: data.expediteur },
  { label: "Type", value: data.typeCourrier },
  { label: "Date de r\u00e9ception", value: data.dateReception },
])}
${data.description ? `<div class="info-box"><p style="margin:0;font-size:14px;color:#374151"><strong>Description\u00a0:</strong> ${data.description}</p></div>` : ""}
<p>Vous pouvez r\u00e9cup\u00e9rer votre courrier au bureau Coffice ou demander une r\u00e9exp\u00e9dition depuis votre espace personnel.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/mon-espace?tab=domiciliation" class="cta-btn">Voir mon courrier</a>
</div>`;

  return {
    subject: `Nouveau courrier re\u00e7u \u2013 ${data.raisonSociale}`,
    html: baseLayout("Nouveau courrier", content, `Un courrier de ${data.expediteur} vous attend`),
  };
}

export interface AbonnementExpirationData {
  prenom: string;
  nomPlan: string;
  dateExpiration: string;
  joursRestants: number;
  montant?: number;
}

export function abonnementExpirationEmail(data: AbonnementExpirationData): EmailTemplate {
  const urgency = data.joursRestants <= 1 ? "danger" : data.joursRestants <= 7 ? "warning" : "info";
  const urgencyLabel = data.joursRestants <= 1 ? "Expire aujourd\u2019hui" : data.joursRestants <= 7 ? `Expire dans ${data.joursRestants} jours` : `Expire dans ${data.joursRestants} jours`;
  const urgencyClass = urgency === "danger" ? "status-danger" : urgency === "warning" ? "status-warning" : "status-info";

  const content = `
<h2>Votre abonnement arrive \u00e0 \u00e9ch\u00e9ance</h2>
<p>Bonjour ${data.prenom}, votre abonnement <strong>${data.nomPlan}</strong> arrive bient\u00f4t \u00e0 expiration.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge ${urgencyClass}">${urgencyLabel}</span>
</div>
${infoBox([
  { label: "Plan", value: data.nomPlan },
  { label: "Date d\u2019expiration", value: data.dateExpiration },
  ...(data.montant ? [{ label: "Tarif mensuel", value: `${data.montant.toLocaleString("fr-DZ")} DA` }] : []),
])}
<p>Pour continuer \u00e0 profiter des services Coffice sans interruption, renouvelez votre abonnement d\u00e8s maintenant.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/abonnements" class="cta-btn">Renouveler mon abonnement</a>
</div>`;

  return {
    subject: `Votre abonnement ${data.nomPlan} expire ${data.joursRestants <= 1 ? "aujourd\u2019hui" : `dans ${data.joursRestants} jours`}`,
    html: baseLayout("Abonnement \u00e0 renouveler", content, `Votre abonnement ${data.nomPlan} expire le ${data.dateExpiration}`),
  };
}

export interface DomiciliationExpirationData {
  prenom: string;
  raisonSociale: string;
  dateExpiration: string;
  joursRestants: number;
}

export function domiciliationExpirationEmail(data: DomiciliationExpirationData): EmailTemplate {
  const content = `
<h2>Votre contrat de domiciliation arrive \u00e0 \u00e9ch\u00e9ance</h2>
<p>Bonjour ${data.prenom}, le contrat de domiciliation de votre entreprise arrive bient\u00f4t \u00e0 expiration.</p>
<div style="text-align:center;margin:20px 0">
<span class="status-badge status-warning">Expire dans ${data.joursRestants} jours</span>
</div>
${infoBox([
  { label: "Entreprise", value: data.raisonSociale },
  { label: "Date d\u2019expiration", value: data.dateExpiration },
])}
<p>Pour maintenir votre domiciliation et conserver l\u2019adresse de Coffice comme si\u00e8ge social, veuillez contacter notre \u00e9quipe pour le renouvellement.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/mon-espace?tab=domiciliation" class="cta-btn">Renouveler ma domiciliation</a>
</div>
<p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:16px">Contactez-nous au ${COFFICE_MOBILE} ou \u00e0 ${COFFICE_EMAIL}</p>`;

  return {
    subject: `Domiciliation \u2013 expiration dans ${data.joursRestants} jours`,
    html: baseLayout("Domiciliation \u00e0 renouveler", content, `Le contrat de ${data.raisonSociale} expire dans ${data.joursRestants} jours`),
  };
}

export interface ParrainageBonusData {
  prenom: string;
  prenomFilleul: string;
  montantBonus: number;
}

export function parainageBonusEmail(data: ParrainageBonusData): EmailTemplate {
  const content = `
<h2>Votre bonus de parrainage est arriv\u00e9\u00a0!</h2>
<p>Bonjour ${data.prenom}, bonne nouvelle\u00a0! ${data.prenomFilleul} a effectu\u00e9 sa premi\u00e8re r\u00e9servation gr\u00e2ce \u00e0 votre code de parrainage.</p>
<div class="highlight-box">
<p class="label">Bonus de parrainage</p>
<p class="amount">+${data.montantBonus.toLocaleString("fr-DZ")} DA</p>
</div>
<p>Ce montant a \u00e9t\u00e9 cr\u00e9dit\u00e9 sur votre compte. Vous pouvez l\u2019utiliser pour vos prochaines r\u00e9servations.</p>
<p style="font-size:14px;color:#6b7280">Continuez \u00e0 parrainer vos contacts et cumulez des bonus\u00a0!</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/app/parrainage" class="cta-btn">Mon programme parrainage</a>
</div>`;

  return {
    subject: `+${data.montantBonus.toLocaleString("fr-DZ")} DA \u2013 Bonus parrainage re\u00e7u\u00a0!`,
    html: baseLayout("Bonus de parrainage", content, `${data.prenomFilleul} a rejoint Coffice gr\u00e2ce \u00e0 vous`),
  };
}

export interface CodePromoAttribueData {
  prenom: string;
  code: string;
  reduction: string;
  dateExpiration?: string;
  description?: string;
}

export function codePromoAttribueEmail(data: CodePromoAttribueData): EmailTemplate {
  const content = `
<h2>Un code promo vous a \u00e9t\u00e9 attribu\u00e9\u00a0!</h2>
<p>Bonjour ${data.prenom}, b\u00e9n\u00e9ficiez d\u2019une remise exclusive sur votre prochaine r\u00e9servation.</p>
${data.description ? `<p style="font-size:14px;color:#6b7280">${data.description}</p>` : ""}
<div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:1px">Votre code promotionnel</p>
<p style="margin:0;font-size:28px;font-weight:800;color:#1d4ed8;letter-spacing:3px;font-family:monospace">${data.code}</p>
<p style="margin:8px 0 0;font-size:15px;font-weight:600;color:#1e40af">${data.reduction} de r\u00e9duction</p>
</div>
${data.dateExpiration ? `<p style="text-align:center;font-size:13px;color:#9ca3af">Valable jusqu\u2019au ${data.dateExpiration}</p>` : ""}
<p>Utilisez ce code lors de votre prochaine r\u00e9servation pour profiter de votre remise.</p>
<div style="text-align:center">
<a href="${COFFICE_URL}/espaces" class="cta-btn">R\u00e9server maintenant</a>
</div>`;

  return {
    subject: `Code promo ${data.code} \u2013 ${data.reduction} sur votre prochaine r\u00e9servation`,
    html: baseLayout("Code promo Coffice", content, `Votre code ${data.code} offre ${data.reduction} sur votre prochaine r\u00e9servation`),
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
