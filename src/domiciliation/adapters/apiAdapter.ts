import type { DemandeDomiciliation, DomiciliationOptions, DocumentRecord, CourrierItem } from '../domain/types';

function str(v: unknown): string {
  return v != null ? String(v) : '';
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
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { return undefined; }
  }
  if (typeof obj === 'object' && obj !== null) {
    const o = obj as Record<string, unknown>;
    return {
      domiciliationSimple: bool(o.domiciliationSimple ?? o.domiciliation_simple ?? true),
      receptionCourrier: bool(o.receptionCourrier ?? o.reception_courrier),
      scanNotificationEmail: bool(o.scanNotificationEmail ?? o.scan_notification_email),
      reexpeditionCourrier: bool(o.reexpeditionCourrier ?? o.reexpedition_courrier),
      accesPonctuelEspaces: bool(o.accesPonctuelEspaces ?? o.acces_ponctuel_espaces),
    };
  }
  return undefined;
}

export function fromAPI(raw: Record<string, unknown>): DemandeDomiciliation {
  const repLegal = (() => {
    if (raw.representant_legal && typeof raw.representant_legal === 'object') {
      const r = raw.representant_legal as Record<string, unknown>;
      return {
        nom: str(r.nom),
        prenom: str(r.prenom),
        telephone: str(r.telephone),
        email: str(r.email),
        adresseResidence: str(r.adresse_residence ?? r.adresseResidence),
        ville: str(r.ville),
        fonction: strOrUndefined(r.fonction),
      };
    }
    return {
      nom: str(raw.representant_nom),
      prenom: str(raw.representant_prenom),
      telephone: str(raw.representant_telephone),
      email: str(raw.representant_email),
      adresseResidence: str(raw.representant_adresse_residence),
      ville: str(raw.representant_ville),
      fonction: strOrUndefined(raw.representant_fonction),
    };
  })();

  return {
    id: str(raw.id),
    userId: strOrUndefined(raw.user_id),
    contactId: strOrUndefined(raw.contact_id),
    utilisateur: raw.utilisateur as DemandeDomiciliation['utilisateur'],
    contact: raw.contact as DemandeDomiciliation['contact'],
    situationAdministrative: (raw.situation_administrative || 'deja_creee') as DemandeDomiciliation['situationAdministrative'],
    typeStructure: (raw.type_structure || 'societe') as DemandeDomiciliation['typeStructure'],
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
    representantLegal: repLegal,
    numeroBureau: numOrUndefined(raw.numero_bureau),
    referenceContratNotarie: strOrUndefined(raw.reference_contrat_notarie),
    dateDebutContrat: strOrUndefined(raw.date_debut_contrat),
    dateFinContrat: strOrUndefined(raw.date_fin_contrat),
    montantMensuel: numOrUndefined(raw.montant_mensuel),
    options: parseOptions(raw.options),
    cguAcceptees: bool(raw.cgu_acceptees),
    dateCguAcceptation: strOrUndefined(raw.date_cgu_acceptation),
    statut: (raw.statut || 'dossier_preparatoire') as DemandeDomiciliation['statut'],
    commentaireAdmin: strOrUndefined(raw.commentaire_admin),
    dateValidation: strOrUndefined(raw.date_validation),
    dateCreation: str(raw.created_at ?? raw.date_creation ?? raw.dateCreation),
    updatedAt: str(raw.updated_at ?? raw.updatedAt),
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

  const set = (key: string, val: unknown) => { if (val !== undefined) result[key] = val; };

  set('id', data.id);
  set('user_id', data.userId);
  set('contact_id', data.contactId);
  set('situation_administrative', data.situationAdministrative);
  set('type_structure', data.typeStructure);
  set('raison_sociale', data.raisonSociale);
  set('forme_juridique', data.formeJuridique);
  set('nif', data.nif);
  set('nis', data.nis);
  set('registre_commerce', data.registreCommerce);
  set('article_imposition', data.articleImposition);
  set('code_nae', data.codeNae);
  set('activite_exercee', data.activiteExercee);
  set('description_activite', data.descriptionActivite);
  set('numero_auto_entrepreneur', data.numeroAutoEntrepreneur);
  set('date_creation_entreprise', data.dateCreationEntreprise);
  set('ville_immatriculation', data.villeImmatriculation);
  set('domaine_activite', data.domaineActivite);
  set('adresse_siege_social', data.adresseSiegeSocial);
  set('capital', data.capital);
  set('numero_bureau', data.numeroBureau);
  set('reference_contrat_notarie', data.referenceContratNotarie);
  set('date_debut_contrat', data.dateDebutContrat);
  set('date_fin_contrat', data.dateFinContrat);
  set('montant_mensuel', data.montantMensuel);
  set('date_debut', data.dateDebut);
  set('date_fin', data.dateFin);
  set('wilaya', data.wilaya);
  set('commune', data.commune);
  set('adresse_actuelle', data.adresseActuelle);
  set('activite_principale', data.activitePrincipale);
  set('visible_sur_site', data.visibleSurSite);
  set('commentaire_admin', data.commentaireAdmin);
  set('cgu_acceptees', data.cguAcceptees);
  set('date_debut_souhaitee', data.dateDebutSouhaitee);
  set('statut', data.statut);

  if (data.options !== undefined) {
    result.options = JSON.stringify(data.options);
  }

  if (data.representantLegal !== undefined) {
    const rep = data.representantLegal;
    set('representant_nom', rep.nom);
    set('representant_prenom', rep.prenom);
    set('representant_fonction', rep.fonction);
    set('representant_telephone', rep.telephone);
    set('representant_email', rep.email);
    set('representant_adresse_residence', rep.adresseResidence);
    set('representant_ville', rep.ville);
  }

  return result;
}

export function documentFromAPI(raw: Record<string, unknown>): DocumentRecord {
  return {
    id: str(raw.id),
    documentType: str(raw.document_type ?? raw.type),
    fileName: str(raw.file_name ?? raw.nom_fichier ?? raw.fileName),
    fileSize: numOrUndefined(raw.file_size ?? raw.taille),
    createdAt: str(raw.created_at ?? raw.date_upload),
    url: strOrUndefined(raw.url ?? raw.file_url),
    status: (raw.status ?? raw.statut ?? 'en_attente') as DocumentRecord['status'],
    commentaireRejet: strOrUndefined(raw.commentaire_rejet),
  };
}

export function courrierFromAPI(raw: Record<string, unknown>): CourrierItem {
  return {
    id: str(raw.id),
    type: (raw.type ?? 'autre') as CourrierItem['type'],
    expediteur: str(raw.expediteur),
    description: str(raw.description ?? raw.objet ?? ''),
    statut: (raw.statut ?? 'recu') as CourrierItem['statut'],
    dateReception: str(raw.date_reception ?? raw.created_at),
    dateRetrait: strOrUndefined(raw.date_retrait),
    instructionClient: strOrUndefined(raw.instruction_client),
  };
}
