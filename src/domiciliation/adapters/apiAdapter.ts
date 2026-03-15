import type {
  DemandeDomiciliation,
  DomiciliationOptions,
  DocumentRecord,
  CourrierItem,
  SituationAdministrative,
  TypeStructure,
  DomiciliationStatut,
  CourrierType,
  CourrierStatut,
  DocumentStatus,
} from '../domain/types';

function str(v: unknown, fallback = ''): string {
  return v != null ? String(v) : fallback;
}

function strOrUndefined(v: unknown): string | undefined {
  return v != null && v !== '' ? String(v) : undefined;
}

function numOrUndefined(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v === 'true';
  return false;
}

function parseOptions(raw: unknown): DomiciliationOptions | undefined {
  if (!raw) return undefined;
  let obj: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  } else if (typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  } else {
    return undefined;
  }
  return {
    domiciliationSimple: bool(obj.domiciliationSimple ?? obj.domiciliation_simple ?? true),
    receptionCourrier: bool(obj.receptionCourrier ?? obj.reception_courrier),
    scanNotificationEmail: bool(obj.scanNotificationEmail ?? obj.scan_notification_email),
    reexpeditionCourrier: bool(obj.reexpeditionCourrier ?? obj.reexpedition_courrier),
    accesPonctuelEspaces: bool(obj.accesPonctuelEspaces ?? obj.acces_ponctuel_espaces),
  };
}

export function fromAPI(raw: Record<string, unknown>): DemandeDomiciliation {
  const utilisateur = raw.utilisateur as Record<string, unknown> | undefined;
  const contact = raw.contact as Record<string, unknown> | undefined;

  return {
    id: str(raw.id),
    userId: strOrUndefined(raw.user_id),
    contactId: strOrUndefined(raw.contact_id),
    utilisateur: utilisateur
      ? {
          id: str(utilisateur.id),
          nom: str(utilisateur.nom),
          prenom: str(utilisateur.prenom),
          email: str(utilisateur.email),
          telephone: strOrUndefined(utilisateur.telephone),
        }
      : undefined,
    contact: contact
      ? {
          id: str(contact.id),
          nom: str(contact.nom),
          prenom: str(contact.prenom),
          email: strOrUndefined(contact.email),
          telephone: strOrUndefined(contact.telephone),
        }
      : undefined,
    situationAdministrative: (raw.situation_administrative || 'deja_creee') as SituationAdministrative,
    typeStructure: (raw.type_structure || 'societe') as TypeStructure,
    raisonSociale: str(raw.raison_sociale),
    formeJuridique: str(raw.forme_juridique),
    nif: strOrUndefined(raw.nif),
    nis: strOrUndefined(raw.nis),
    registreCommerce: strOrUndefined(raw.registre_commerce),
    articleImposition: strOrUndefined(raw.article_imposition),
    codeNae: strOrUndefined(raw.code_nae),
    activiteExercee: strOrUndefined(raw.activite_exercee),
    descriptionActivite: strOrUndefined(raw.description_activite),
    numeroAutoEntrepreneur: strOrUndefined(raw.numero_auto_entrepreneur),
    dateCreationEntreprise: strOrUndefined(raw.date_creation_entreprise),
    villeImmatriculation: strOrUndefined(raw.ville_immatriculation),
    activitePrincipale: strOrUndefined(raw.activite_principale),
    domaineActivite: strOrUndefined(raw.domaine_activite),
    adresseSiegeSocial: strOrUndefined(raw.adresse_siege_social),
    capital: numOrUndefined(raw.capital),
    representantLegal: {
      nom: str(raw.representant_nom),
      prenom: str(raw.representant_prenom),
      telephone: str(raw.representant_telephone),
      email: str(raw.representant_email),
      adresseResidence: str(raw.representant_adresse_residence),
      ville: str(raw.representant_ville),
      fonction: strOrUndefined(raw.representant_fonction),
    },
    numeroBureau: numOrUndefined(raw.numero_bureau),
    referenceContratNotarie: strOrUndefined(raw.reference_contrat_notarie),
    dateDebutContrat: strOrUndefined(raw.date_debut_contrat),
    dateFinContrat: strOrUndefined(raw.date_fin_contrat),
    montantMensuel: numOrUndefined(raw.montant_mensuel),
    options: parseOptions(raw.options),
    cguAcceptees: bool(raw.cgu_acceptees),
    dateCguAcceptation: strOrUndefined(raw.date_cgu_acceptation),
    statut: (raw.statut || 'dossier_preparatoire') as DomiciliationStatut,
    commentaireAdmin: strOrUndefined(raw.commentaire_admin),
    dateValidation: strOrUndefined(raw.date_validation),
    dateCreation: str(raw.created_at || raw.dateCreation),
    updatedAt: str(raw.updated_at || raw.updatedAt),
    dateDebut: strOrUndefined(raw.date_debut),
    dateFin: strOrUndefined(raw.date_fin),
    dateDebutSouhaitee: strOrUndefined(raw.date_debut_souhaitee),
    wilaya: strOrUndefined(raw.wilaya),
    commune: strOrUndefined(raw.commune),
    adresseActuelle: strOrUndefined(raw.adresse_actuelle),
    visibleSurSite: bool(raw.visible_sur_site),
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
    result.options = typeof data.options === 'string' ? data.options : JSON.stringify(data.options);
  }

  if (data.representantLegal !== undefined) {
    const rep = data.representantLegal;
    result.representant_nom = rep.nom;
    result.representant_prenom = rep.prenom;
    result.representant_telephone = rep.telephone;
    result.representant_email = rep.email;
    result.representant_adresse_residence = rep.adresseResidence;
    result.representant_ville = rep.ville;
    if (rep.fonction) result.representant_fonction = rep.fonction;
  }

  return result;
}

export function documentFromAPI(raw: Record<string, unknown>): DocumentRecord {
  return {
    id: str(raw.id),
    documentType: str(raw.type_document || raw.document_type || raw.documentType || 'autre'),
    fileName: str(raw.nom_original || raw.nom_fichier || raw.file_name || raw.fileName),
    fileSize: numOrUndefined(raw.taille || raw.file_size || raw.fileSize),
    createdAt: str(raw.created_at || raw.uploaded_at || raw.createdAt),
    url: strOrUndefined(raw.download_url || raw.url),
    status: str(raw.statut || raw.status || 'en_attente') as DocumentStatus,
    commentaireRejet: strOrUndefined(raw.commentaire_rejet || raw.commentaireRejet),
  };
}

export function courrierFromAPI(raw: Record<string, unknown>): CourrierItem {
  return {
    id: str(raw.id),
    type: str(raw.type || 'autre') as CourrierType,
    expediteur: str(raw.expediteur),
    description: str(raw.description),
    statut: str(raw.statut || 'recu') as CourrierStatut,
    dateReception: str(raw.date_reception || raw.dateReception || raw.created_at),
    dateRetrait: strOrUndefined(raw.date_retrait),
    instructionClient: strOrUndefined(raw.instruction_client || raw.instructionClient),
  };
}
