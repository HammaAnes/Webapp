import type {
  Espace,
  Reservation,
  User,
  Abonnement,
  DemandeDomiciliation,
  EspaceType,
  TypeReservation,
} from "../types";

type ApiEspace = Record<string, unknown>;
type ApiReservation = Record<string, unknown>;
type ApiAbonnement = Record<string, unknown>;
type ApiUser = Record<string, unknown>;
type ApiDomiciliation = Record<string, unknown>;

interface ApiEspaceData {
  nom?: string;
  type?: string;
  capacite?: number;
  prix_heure?: number;
  prix_demi_journee?: number;
  prix_jour?: number;
  prix_semaine?: number;
  prix_mois?: number;
  description?: string;
  equipements?: string[];
  disponible?: boolean;
  etage?: string;
  image_url?: string;
}

interface ApiReservationData {
  espace_id?: string;
  date_debut?: string;
  date_fin?: string;
  statut?: string;
  notes?: string;
}

interface ApiAbonnementData {
  nom?: string;
  type?: string;
  prix?: number;
  prix_avec_domiciliation?: number;
  duree_mois?: number;
  description?: string;
  avantages?: string[];
  actif?: boolean;
  ordre?: number;
}


export const espaceAdapter = {
  fromAPI: (apiData: ApiEspace): Espace => ({
    id: String(apiData.id || ""),
    nom: String(apiData.nom || ""),
    type: String(apiData.type || "open_space") as EspaceType,
    capacite: Number(apiData.capacite || 0),
    prixHeure: Number(apiData.prix_heure || 0),
    prixDemiJournee: Number(apiData.prix_demi_journee || 0),
    prixJour: Number(apiData.prix_jour || 0),
    prixSemaine: Number(apiData.prix_semaine || 0),
    prixMois: apiData.prix_mois != null ? Number(apiData.prix_mois) : undefined,
    description: String(apiData.description || ""),
    equipements: (apiData.equipements as string[]) || [],
    disponible: apiData.disponible !== false && apiData.disponible !== 0 && apiData.disponible !== "0",
    etage: apiData.etage != null ? Number(apiData.etage) : undefined,
    imageUrl: apiData.image_url as string | undefined,
    createdAt: apiData.created_at ? new Date(String(apiData.created_at)) : new Date(),
    updatedAt: apiData.updated_at ? new Date(String(apiData.updated_at)) : new Date(),
  }),

  toAPI: (espace: Partial<Espace>): ApiEspaceData => ({
    nom: espace.nom,
    type: espace.type,
    capacite: espace.capacite,
    prix_heure: espace.prixHeure,
    prix_demi_journee: espace.prixDemiJournee,
    prix_jour: espace.prixJour,
    prix_semaine: espace.prixSemaine,
    prix_mois: espace.prixMois,
    description: espace.description,
    equipements: espace.equipements,
    disponible: espace.disponible,
    etage: espace.etage !== undefined ? String(espace.etage) : undefined,
    image_url: espace.imageUrl,
  }),
};

export const reservationAdapter = {
  fromAPI: (apiData: ApiReservation): Reservation => ({
    id: String(apiData.id || ""),
    userId: String(apiData.user_id || ""),
    espaceId: String(apiData.espace_id || ""),
    dateDebut: apiData.date_debut ? new Date(String(apiData.date_debut)) : new Date(),
    dateFin: apiData.date_fin ? new Date(String(apiData.date_fin)) : new Date(),
    statut: String(apiData.statut || "en_attente") as Reservation["statut"],
    typeReservation: apiData.type_reservation as TypeReservation | undefined,
    montantTotal: parseFloat(String(apiData.montant_total || 0)),
    reduction: parseFloat(String(apiData.reduction || 0)),
    montantPaye: parseFloat(String(apiData.montant_paye || 0)),
    modePaiement: apiData.mode_paiement as string | undefined,
    participants: apiData.participants != null ? parseInt(String(apiData.participants), 10) || 1 : 1,
    notes: apiData.notes as string | undefined,
    codePromo: apiData.code_promo_id as string | undefined,
    dateCreation: apiData.created_at ? new Date(String(apiData.created_at)) : undefined,
    createdAt: apiData.created_at ? String(apiData.created_at) : undefined,
    updatedAt: apiData.updated_at ? String(apiData.updated_at) : undefined,
    espace: apiData.espace_nom
      ? {
          id: String(apiData.espace_id || ""),
          nom: String(apiData.espace_nom || ""),
          type: String(apiData.espace_type || "bureau") as EspaceType,
        }
      : undefined,
    utilisateur: apiData.user_nom
      ? {
          id: String(apiData.user_id || ""),
          nom: String(apiData.user_nom || ""),
          prenom: String(apiData.user_prenom || ""),
          email: String(apiData.user_email || ""),
          role: "user" as const,
        }
      : undefined,
  }),

  toAPI: (reservation: Partial<Reservation>): ApiReservationData => ({
    espace_id: reservation.espaceId,
    date_debut: reservation.dateDebut instanceof Date ? reservation.dateDebut.toISOString() : String(reservation.dateDebut || ""),
    date_fin: reservation.dateFin instanceof Date ? reservation.dateFin.toISOString() : String(reservation.dateFin || ""),
    statut: reservation.statut,
    notes: reservation.notes,
  }),
};

export const abonnementAdapter = {
  fromAPI: (apiData: ApiAbonnement): Abonnement => ({
    id: String(apiData.id || ""),
    nom: String(apiData.nom || ""),
    type: String(apiData.type || ""),
    prix: Number(apiData.prix || 0),
    prixAvecDomiciliation: Number(apiData.prix_avec_domiciliation || 0),
    creditsMensuels: Number(apiData.credits_mensuels || 0),
    creditMensuel: Number(apiData.credits_mensuels || 0),
    dureeMois: Number(apiData.duree_mois || 1),
    dureeJours: (Number(apiData.duree_mois) || 1) * 30,
    description: String(apiData.description || ""),
    avantages: (apiData.avantages as string[]) || [],
    statut: (apiData.statut as string) || "actif",
    actif: apiData.actif !== false && apiData.actif !== 0 && apiData.actif !== "0",
    couleur: String(apiData.couleur || "#3B82F6"),
    ordre: Number(apiData.ordre || 0),
    createdAt: apiData.created_at as string | undefined,
    updatedAt: (apiData.updated_at || apiData.created_at) as string | undefined,
  }),

  toAPI: (abonnement: Partial<Abonnement>): ApiAbonnementData => ({
    nom: abonnement.nom,
    type: abonnement.type,
    prix: abonnement.prix,
    prix_avec_domiciliation: abonnement.prixAvecDomiciliation,
    duree_mois: abonnement.dureeMois,
    description: abonnement.description,
    avantages: abonnement.avantages,
    actif: abonnement.actif,
    ordre: abonnement.ordre,
  }),
};

export const userAdapter = {
  fromAPI: (apiData: ApiUser): User => ({
    id: String(apiData.id || ""),
    email: String(apiData.email || ""),
    nom: String(apiData.nom || ""),
    prenom: String(apiData.prenom || ""),
    telephone: apiData.telephone as string | undefined,
    role: String(apiData.role || "user") as User["role"],
    statut: String(apiData.statut || "actif") as User["statut"],
    avatar: apiData.avatar as string | undefined,
    profession: apiData.profession as string | undefined,
    entreprise: apiData.entreprise as string | undefined,
    adresse: apiData.adresse as string | undefined,
    bio: apiData.bio as string | undefined,
    wilaya: apiData.wilaya as string | undefined,
    commune: apiData.commune as string | undefined,
    typeEntreprise: apiData.type_entreprise as string | undefined,
    nif: apiData.nif as string | undefined,
    nis: apiData.nis as string | undefined,
    registreCommerce: apiData.registre_commerce as string | undefined,
    articleImposition: apiData.article_imposition as string | undefined,
    numeroAutoEntrepreneur: apiData.numero_auto_entrepreneur as string | undefined,
    raisonSociale: apiData.raison_sociale as string | undefined,
    dateCreationEntreprise: apiData.date_creation_entreprise as string | undefined,
    capital: apiData.capital as string | undefined,
    siegeSocial: apiData.siege_social as string | undefined,
    activitePrincipale: apiData.activite_principale as string | undefined,
    formeJuridique: apiData.forme_juridique as string | undefined,
    codeParrainage: apiData.code_parrainage as string | undefined,
    absences: apiData.absences as number | undefined,
    bannedUntil: apiData.banned_until ? new Date(apiData.banned_until as string) : undefined,
    derniereConnexion: apiData.derniere_connexion ? new Date(apiData.derniere_connexion as string) : undefined,
    dateCreation: apiData.created_at ? new Date(String(apiData.created_at)) : undefined,
    createdAt: apiData.created_at as string | undefined,
    updatedAt: apiData.updated_at as string | undefined,
  }),

  toAPI: (user: Partial<User>): Record<string, unknown> => {
    const apiData: Record<string, unknown> = {};

    const fieldMapping: Record<string, string> = {
      nom: "nom",
      prenom: "prenom",
      telephone: "telephone",
      profession: "profession",
      entreprise: "entreprise",
      adresse: "adresse",
      bio: "bio",
      wilaya: "wilaya",
      commune: "commune",
      avatar: "avatar",
      typeEntreprise: "type_entreprise",
      nif: "nif",
      nis: "nis",
      registreCommerce: "registre_commerce",
      articleImposition: "article_imposition",
      numeroAutoEntrepreneur: "numero_auto_entrepreneur",
      raisonSociale: "raison_sociale",
      dateCreationEntreprise: "date_creation_entreprise",
      capital: "capital",
      siegeSocial: "siege_social",
      activitePrincipale: "activite_principale",
      formeJuridique: "forme_juridique",
    };

    Object.entries(fieldMapping).forEach(([camelKey, snakeKey]) => {
      if (user[camelKey as keyof User] !== undefined) {
        apiData[snakeKey] = user[camelKey as keyof User];
      }
    });

    return apiData;
  },
};

export const domiciliationAdapter = {
  fromAPI: (apiData: ApiDomiciliation): DemandeDomiciliation => {
    const legacyStatusMap: Record<string, string> = {
      en_attente: "dossier_preparatoire",
      en_cours: "en_attente_signature",
      validee: "active",
    };
    const rawStatut = String(apiData.statut || "dossier_preparatoire");
    const statut = (legacyStatusMap[rawStatut] || rawStatut) as DemandeDomiciliation["statut"];

    let representantLegal: DemandeDomiciliation["representantLegal"];
    if (apiData.representant_legal) {
      if (typeof apiData.representant_legal === "string") {
        try { representantLegal = JSON.parse(apiData.representant_legal); } catch { representantLegal = { nom: "", prenom: "", telephone: "", email: "" }; }
      } else {
        representantLegal = apiData.representant_legal as DemandeDomiciliation["representantLegal"];
      }
    } else {
      representantLegal = {
        nom: String(apiData.representant_nom || ""),
        prenom: String(apiData.representant_prenom || ""),
        fonction: apiData.representant_fonction as string | undefined,
        telephone: String(apiData.representant_telephone || ""),
        email: String(apiData.representant_email || ""),
        adresseResidence: apiData.representant_adresse_residence as string | undefined,
        ville: apiData.representant_ville as string | undefined,
      };
    }

    let options: DemandeDomiciliation["options"];
    const defaultOptions = {
      domiciliationSimple: true,
      receptionCourrier: false,
      scanNotificationEmail: false,
      reexpeditionCourrier: false,
      accesPonctuelEspaces: false,
    };
    if (!apiData.options) {
      options = defaultOptions;
    } else if (typeof apiData.options === "object") {
      options = apiData.options as DemandeDomiciliation["options"];
    } else {
      try { options = JSON.parse(String(apiData.options)); } catch { options = defaultOptions; }
    }

    let documents: DemandeDomiciliation["documents"];
    if (!apiData.documents) {
      documents = [];
    } else if (Array.isArray(apiData.documents)) {
      documents = apiData.documents as DemandeDomiciliation["documents"];
    } else if (typeof apiData.documents === "string") {
      try { documents = JSON.parse(apiData.documents); } catch { documents = []; }
    } else {
      documents = [];
    }

    return {
      id: String(apiData.id || ""),
      userId: String(apiData.user_id || ""),
      utilisateur: apiData.utilisateur as User | undefined,
      situationAdministrative: (apiData.situation_administrative || "deja_creee") as DemandeDomiciliation["situationAdministrative"],
      typeStructure: (apiData.type_structure || "societe") as DemandeDomiciliation["typeStructure"],
      raisonSociale: String(apiData.raison_sociale || ""),
      formeJuridique: String(apiData.forme_juridique || ""),
      nif: String(apiData.nif || ""),
      nis: String(apiData.nis || ""),
      registreCommerce: String(apiData.registre_commerce || ""),
      articleImposition: String(apiData.article_imposition || ""),
      codeNae: apiData.code_nae as string | undefined,
      activiteExercee: apiData.activite_exercee as string | undefined,
      descriptionActivite: apiData.description_activite as string | undefined,
      numeroAutoEntrepreneur: apiData.numero_auto_entrepreneur as string | undefined,
      dateCreationEntreprise: apiData.date_creation_entreprise as string | undefined,
      villeImmatriculation: apiData.ville_immatriculation as string | undefined,
      dateInscriptionAutoEntrepreneur: apiData.date_inscription_auto_entrepreneur as string | undefined,
      representantLegal,
      domaineActivite: String(apiData.domaine_activite || ""),
      adresseSiegeSocial: String(apiData.adresse_siege_social || ""),
      capital: apiData.capital != null ? Number(apiData.capital) : undefined,
      numeroBureau: apiData.numero_bureau != null ? Number(apiData.numero_bureau) : undefined,
      referenceContratNotarie: apiData.reference_contrat_notarie as string | undefined,
      dateDebutContrat: apiData.date_debut_contrat as string | undefined,
      dateFinContrat: apiData.date_fin_contrat as string | undefined,
      options,
      cguAcceptees: apiData.cgu_acceptees === 1 || apiData.cgu_acceptees === true,
      dateCguAcceptation: apiData.date_cgu_acceptation as string | undefined,
      statut,
      commentaireAdmin: (apiData.commentaire_admin || apiData.notes_admin) as string | undefined,
      montantMensuel: apiData.montant_mensuel != null ? parseFloat(String(apiData.montant_mensuel)) : undefined,
      dateDebut: apiData.date_debut as string | undefined,
      dateFin: apiData.date_fin as string | undefined,
      modePaiement: apiData.mode_paiement as string | undefined,
      dateValidation: apiData.date_validation as string | undefined,
      dateCreation: String(apiData.created_at || ""),
      updatedAt: String(apiData.updated_at || ""),
      wilaya: apiData.wilaya as string | undefined,
      commune: apiData.commune as string | undefined,
      adresseActuelle: apiData.adresse_actuelle as string | undefined,
      activitePrincipale: apiData.activite_principale as string | undefined,
      dateDebutSouhaitee: apiData.date_debut_souhaitee as string | undefined,
      visibleSurSite: apiData.visible_sur_site === true || apiData.visible_sur_site === 1 || apiData.visible_sur_site === "1",
      documents,
    };
  },

};
