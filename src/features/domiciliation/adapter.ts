import type { DemandeDomiciliation, DomiciliationOptions } from "../../types";

function parseOptions(raw: unknown): DomiciliationOptions | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as DomiciliationOptions;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object") return raw as DomiciliationOptions;
  return undefined;
}

export function fromAPI(raw: Record<string, unknown>): DemandeDomiciliation {
  return {
    id: String(raw.id || ""),
    userId: raw.user_id ? String(raw.user_id) : undefined,
    contactId: raw.contact_id ? String(raw.contact_id) : undefined,
    utilisateur: raw.utilisateur as DemandeDomiciliation["utilisateur"],
    contact: raw.contact as DemandeDomiciliation["contact"],
    situationAdministrative: (raw.situation_administrative || "deja_creee") as DemandeDomiciliation["situationAdministrative"],
    typeStructure: (raw.type_structure || "societe") as DemandeDomiciliation["typeStructure"],
    raisonSociale: String(raw.raison_sociale || ""),
    formeJuridique: String(raw.forme_juridique || ""),
    nif: raw.nif ? String(raw.nif) : undefined,
    nis: raw.nis ? String(raw.nis) : undefined,
    registreCommerce: raw.registre_commerce ? String(raw.registre_commerce) : undefined,
    articleImposition: raw.article_imposition ? String(raw.article_imposition) : undefined,
    codeNae: raw.code_nae ? String(raw.code_nae) : undefined,
    activiteExercee: raw.activite_exercee ? String(raw.activite_exercee) : undefined,
    descriptionActivite: raw.description_activite ? String(raw.description_activite) : undefined,
    numeroAutoEntrepreneur: raw.numero_auto_entrepreneur ? String(raw.numero_auto_entrepreneur) : undefined,
    dateCreationEntreprise: raw.date_creation_entreprise ? String(raw.date_creation_entreprise) : undefined,
    villeImmatriculation: raw.ville_immatriculation ? String(raw.ville_immatriculation) : undefined,
    representantLegal: {
      nom: String(raw.representant_nom || ""),
      prenom: String(raw.representant_prenom || ""),
      fonction: raw.representant_fonction ? String(raw.representant_fonction) : undefined,
      telephone: String(raw.representant_telephone || ""),
      email: String(raw.representant_email || ""),
      adresseResidence: raw.representant_adresse_residence ? String(raw.representant_adresse_residence) : undefined,
      ville: raw.representant_ville ? String(raw.representant_ville) : undefined,
    },
    domaineActivite: raw.domaine_activite ? String(raw.domaine_activite) : undefined,
    adresseSiegeSocial: raw.adresse_siege_social ? String(raw.adresse_siege_social) : undefined,
    capital: raw.capital ? Number(raw.capital) : undefined,
    numeroBureau: raw.numero_bureau ? Number(raw.numero_bureau) : undefined,
    referenceContratNotarie: raw.reference_contrat_notarie ? String(raw.reference_contrat_notarie) : undefined,
    dateDebutContrat: raw.date_debut_contrat ? String(raw.date_debut_contrat) : undefined,
    dateFinContrat: raw.date_fin_contrat ? String(raw.date_fin_contrat) : undefined,
    options: parseOptions(raw.options),
    cguAcceptees: Boolean(raw.cgu_acceptees),
    dateCguAcceptation: raw.date_cgu_acceptation ? String(raw.date_cgu_acceptation) : undefined,
    statut: (raw.statut || "dossier_preparatoire") as DemandeDomiciliation["statut"],
    commentaireAdmin: raw.commentaire_admin ? String(raw.commentaire_admin) : undefined,
    dateCreation: String(raw.created_at || raw.dateCreation || ""),
    updatedAt: String(raw.updated_at || raw.updatedAt || ""),
    montantMensuel: raw.montant_mensuel ? Number(raw.montant_mensuel) : undefined,
    dateDebut: raw.date_debut ? String(raw.date_debut) : undefined,
    dateFin: raw.date_fin ? String(raw.date_fin) : undefined,
    wilaya: raw.wilaya ? String(raw.wilaya) : undefined,
    commune: raw.commune ? String(raw.commune) : undefined,
    adresseActuelle: raw.adresse_actuelle ? String(raw.adresse_actuelle) : undefined,
    activitePrincipale: raw.activite_principale ? String(raw.activite_principale) : undefined,
    visibleSurSite: Boolean(raw.visible_sur_site),
    dateDebutSouhaitee: raw.date_debut_souhaitee ? String(raw.date_debut_souhaitee) : undefined,
  };
}

export function toAPI(data: Partial<DemandeDomiciliation>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (data.id !== undefined) result.id = data.id;
  if (data.userId !== undefined) result.user_id = data.userId;
  if (data.contactId !== undefined) result.contact_id = data.contactId;
  if (data.situationAdministrative !== undefined) result.situation_administrative = data.situationAdministrative;
  if (data.typeStructure !== undefined) result.type_structure = data.typeStructure;
  if (data.raisonSociale !== undefined) result.raison_sociale = data.raisonSociale;
  if (data.formeJuridique !== undefined) result.forme_juridique = data.formeJuridique;
  if (data.nif !== undefined) result.nif = data.nif;
  if (data.nis !== undefined) result.nis = data.nis;
  if (data.registreCommerce !== undefined) result.registre_commerce = data.registreCommerce;
  if (data.articleImposition !== undefined) result.article_imposition = data.articleImposition;
  if (data.codeNae !== undefined) result.code_nae = data.codeNae;
  if (data.activiteExercee !== undefined) result.activite_exercee = data.activiteExercee;
  if (data.descriptionActivite !== undefined) result.description_activite = data.descriptionActivite;
  if (data.numeroAutoEntrepreneur !== undefined) result.numero_auto_entrepreneur = data.numeroAutoEntrepreneur;
  if (data.dateCreationEntreprise !== undefined) result.date_creation_entreprise = data.dateCreationEntreprise;
  if (data.villeImmatriculation !== undefined) result.ville_immatriculation = data.villeImmatriculation;
  if (data.domaineActivite !== undefined) result.domaine_activite = data.domaineActivite;
  if (data.adresseSiegeSocial !== undefined) result.adresse_siege_social = data.adresseSiegeSocial;
  if (data.capital !== undefined) result.capital = data.capital;
  if (data.numeroBureau !== undefined) result.numero_bureau = data.numeroBureau;
  if (data.referenceContratNotarie !== undefined) result.reference_contrat_notarie = data.referenceContratNotarie;
  if (data.dateDebutContrat !== undefined) result.date_debut_contrat = data.dateDebutContrat;
  if (data.dateFinContrat !== undefined) result.date_fin_contrat = data.dateFinContrat;
  if (data.montantMensuel !== undefined) result.montant_mensuel = data.montantMensuel;
  if (data.dateDebut !== undefined) result.date_debut = data.dateDebut;
  if (data.dateFin !== undefined) result.date_fin = data.dateFin;
  if (data.wilaya !== undefined) result.wilaya = data.wilaya;
  if (data.commune !== undefined) result.commune = data.commune;
  if (data.adresseActuelle !== undefined) result.adresse_actuelle = data.adresseActuelle;
  if (data.activitePrincipale !== undefined) result.activite_principale = data.activitePrincipale;
  if (data.visibleSurSite !== undefined) result.visible_sur_site = data.visibleSurSite;
  if (data.commentaireAdmin !== undefined) result.commentaire_admin = data.commentaireAdmin;
  if (data.cguAcceptees !== undefined) result.cgu_acceptees = data.cguAcceptees;
  if (data.dateDebutSouhaitee !== undefined) result.date_debut_souhaitee = data.dateDebutSouhaitee;
  if (data.statut !== undefined) result.statut = data.statut;

  if (data.options !== undefined) {
    result.options = typeof data.options === "string" ? data.options : JSON.stringify(data.options);
  }

  if (data.representantLegal !== undefined) {
    const rep = data.representantLegal;
    if (rep.nom !== undefined) result.representant_nom = rep.nom;
    if (rep.prenom !== undefined) result.representant_prenom = rep.prenom;
    if (rep.fonction !== undefined) result.representant_fonction = rep.fonction;
    if (rep.telephone !== undefined) result.representant_telephone = rep.telephone;
    if (rep.email !== undefined) result.representant_email = rep.email;
    if (rep.adresseResidence !== undefined) result.representant_adresse_residence = rep.adresseResidence;
    if (rep.ville !== undefined) result.representant_ville = rep.ville;
  }

  return result;
}

export const domiciliationAdapter = { fromAPI, toAPI };
