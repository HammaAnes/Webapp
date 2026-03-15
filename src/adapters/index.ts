import type {
  Espace,
  Reservation,
  User,
  Abonnement,
  DemandeDomiciliation,
  Contact,
  CodePromo,
  ContactSource,
  ContactStatut,
  EspaceType,
  TypeReservation,
} from "../types";

type ApiRecord = Record<string, unknown>;

export const espaceAdapter = {
  fromAPI: (apiData: ApiRecord): Espace => ({
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

  toAPI: (espace: Partial<Espace>): ApiRecord => {
    const data: ApiRecord = {};
    if (espace.nom !== undefined) data.nom = espace.nom;
    if (espace.type !== undefined) data.type = espace.type;
    if (espace.capacite !== undefined) data.capacite = espace.capacite;
    if (espace.prixHeure !== undefined) data.prix_heure = espace.prixHeure;
    if (espace.prixDemiJournee !== undefined) data.prix_demi_journee = espace.prixDemiJournee;
    if (espace.prixJour !== undefined) data.prix_jour = espace.prixJour;
    if (espace.prixSemaine !== undefined) data.prix_semaine = espace.prixSemaine;
    if (espace.prixMois !== undefined) data.prix_mois = espace.prixMois;
    if (espace.description !== undefined) data.description = espace.description;
    if (espace.equipements !== undefined) data.equipements = espace.equipements;
    if (espace.disponible !== undefined) data.disponible = espace.disponible;
    if (espace.etage !== undefined) data.etage = String(espace.etage);
    if (espace.imageUrl !== undefined) data.image_url = espace.imageUrl;
    return data;
  },
};

function parseDate(value: unknown): Date {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(" ", "T");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
  }
  throw new Error(`parseDate: valeur invalide "${value}"`);
}

function parseDateSafe(value: unknown, fallback: Date = new Date()): Date {
  try {
    return parseDate(value);
  } catch {
    if (value !== undefined && value !== null && value !== "") {
      console.warn("[parseDateSafe] Could not parse date value:", value, "— using fallback");
    }
    return fallback;
  }
}

export const reservationAdapter = {
  fromAPI: (apiData: ApiRecord): Reservation => ({
    id: String(apiData.id || ""),
    userId: String(apiData.user_id || ""),
    espaceId: String(apiData.espace_id || ""),
    dateDebut: parseDateSafe(apiData.date_debut),
    dateFin: parseDateSafe(apiData.date_fin),
    statut: String(apiData.statut || "en_attente") as Reservation["statut"],
    typeReservation: apiData.type_reservation as TypeReservation | undefined,
    montantTotal: parseFloat(String(apiData.montant_total || 0)),
    reduction: parseFloat(String(apiData.reduction || 0)),
    montantPaye: parseFloat(String(apiData.montant_paye || 0)),
    modePaiement: apiData.mode_paiement as string | undefined,
    participants: apiData.participants != null ? parseInt(String(apiData.participants), 10) || 1 : 1,
    notes: apiData.notes as string | undefined,
    codePromo: (apiData.code_promo_id || apiData.code_promo) as string | undefined,
    checkinId: apiData.checkin_id ? String(apiData.checkin_id) : undefined,
    dateCreation: apiData.created_at ? parseDate(apiData.created_at) : undefined,
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
      ? ({
          id: String(apiData.user_id || ""),
          nom: String(apiData.user_nom || ""),
          prenom: String(apiData.user_prenom || ""),
          email: String(apiData.user_email || ""),
          role: (String(apiData.user_role || "user")) as "admin" | "user",
        } as User)
      : undefined,
  }),

  toAPI: (reservation: Partial<Reservation>): ApiRecord => {
    const data: ApiRecord = {};
    if (reservation.userId !== undefined) data.user_id = reservation.userId;
    if (reservation.espaceId !== undefined) data.espace_id = reservation.espaceId;
    if (reservation.dateDebut !== undefined) {
      data.date_debut = reservation.dateDebut instanceof Date
        ? reservation.dateDebut.toISOString()
        : new Date(reservation.dateDebut as string).toISOString();
    }
    if (reservation.dateFin !== undefined) {
      data.date_fin = reservation.dateFin instanceof Date
        ? reservation.dateFin.toISOString()
        : new Date(reservation.dateFin as string).toISOString();
    }
    if (reservation.statut !== undefined) data.statut = reservation.statut;
    if (reservation.notes !== undefined) data.notes = reservation.notes;
    if (reservation.montantTotal !== undefined) data.montant_total = reservation.montantTotal;
    if (reservation.montantPaye !== undefined) data.montant_paye = reservation.montantPaye;
    if (reservation.modePaiement !== undefined) data.mode_paiement = reservation.modePaiement;
    if (reservation.participants !== undefined) data.participants = reservation.participants;
    if (reservation.reduction !== undefined) data.reduction = reservation.reduction;
    if (reservation.codePromo !== undefined) data.code_promo = reservation.codePromo;
    if (reservation.typeReservation !== undefined) data.type_reservation = reservation.typeReservation;
    return data;
  },
};

export const abonnementAdapter = {
  fromAPI: (apiData: ApiRecord): Abonnement => {
    const avantagesRaw = apiData.avantages;
    let avantages: string[] = [];
    if (Array.isArray(avantagesRaw)) {
      avantages = avantagesRaw as string[];
    } else if (typeof avantagesRaw === "string" && avantagesRaw) {
      try { avantages = JSON.parse(avantagesRaw); } catch (e) {
        console.warn("[abonnementAdapter] Invalid avantages JSON:", String(e));
        avantages = [];
      }
    }
    return {
      id: String(apiData.id || ""),
      nom: String(apiData.nom || ""),
      type: String(apiData.type || ""),
      prix: Number(apiData.prix || 0),
      prixAvecDomiciliation: Number(apiData.prix_avec_domiciliation || 0),
      creditsMensuels: Number(apiData.credits_mensuels || 0),
      dureeMois: Number(apiData.duree_mois || 1),
      description: String(apiData.description || ""),
      avantages,
      statut: (apiData.statut as string) || "actif",
      actif: apiData.actif !== false && apiData.actif !== 0 && apiData.actif !== "0",
      couleur: String(apiData.couleur || "#3B82F6"),
      ordre: Number(apiData.ordre || 0),
      createdAt: apiData.created_at ? String(apiData.created_at) : undefined,
      updatedAt: apiData.updated_at ? String(apiData.updated_at) : (apiData.created_at ? String(apiData.created_at) : undefined),
    };
  },

  toAPI: (abonnement: Partial<Abonnement>): ApiRecord => {
    const data: ApiRecord = {};
    if (abonnement.nom !== undefined) data.nom = abonnement.nom;
    if (abonnement.type !== undefined) data.type = abonnement.type;
    if (abonnement.prix !== undefined) data.prix = abonnement.prix;
    if (abonnement.prixAvecDomiciliation !== undefined) data.prix_avec_domiciliation = abonnement.prixAvecDomiciliation;
    if (abonnement.creditsMensuels !== undefined) data.credits_mensuels = abonnement.creditsMensuels;
    if (abonnement.dureeMois !== undefined) data.duree_mois = abonnement.dureeMois;
    if (abonnement.description !== undefined) data.description = abonnement.description;
    if (abonnement.avantages !== undefined) data.avantages = abonnement.avantages;
    if (abonnement.actif !== undefined) data.actif = abonnement.actif;
    if (abonnement.couleur !== undefined) data.couleur = abonnement.couleur;
    if (abonnement.ordre !== undefined) data.ordre = abonnement.ordre;
    return data;
  },
};

export const userAdapter = {
  fromAPI: (apiData: ApiRecord): User => ({
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

  toAPI: (user: Partial<User>): ApiRecord => {
    const data: ApiRecord = {};
    const fieldMapping: Record<string, string> = {
      nom: "nom",
      prenom: "prenom",
      email: "email",
      telephone: "telephone",
      profession: "profession",
      entreprise: "entreprise",
      adresse: "adresse",
      bio: "bio",
      wilaya: "wilaya",
      commune: "commune",
      avatar: "avatar",
      role: "role",
      statut: "statut",
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
        data[snakeKey] = user[camelKey as keyof User];
      }
    });

    if (user.password) data.password = user.password;
    return data;
  },
};

export const domiciliationAdapter = {
  fromAPI: (apiData: ApiRecord): DemandeDomiciliation => {
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

    let documents: Array<{ type: string; name: string }> = [];
    if (apiData.documents) {
      if (Array.isArray(apiData.documents)) {
        documents = apiData.documents as Array<{ type: string; name: string }>;
      } else if (typeof apiData.documents === "string") {
        try {
          const parsed = JSON.parse(apiData.documents);
          documents = Array.isArray(parsed) ? parsed : [];
        } catch {
          documents = [];
        }
      }
    }

    let utilisateur: User | undefined;
    if (apiData.utilisateur && typeof apiData.utilisateur === "object") {
      utilisateur = userAdapter.fromAPI(apiData.utilisateur as ApiRecord);
    } else if (apiData.user_nom) {
      utilisateur = {
        id: String(apiData.user_id || ""),
        nom: String(apiData.user_nom || ""),
        prenom: String(apiData.user_prenom || ""),
        email: String(apiData.user_email || ""),
        role: "user" as const,
      };
    }

    return {
      id: String(apiData.id || ""),
      userId: String(apiData.user_id || ""),
      utilisateur,
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

  toAPI: (domiciliation: Partial<DemandeDomiciliation>): ApiRecord => {
    const data: ApiRecord = {};
    const toDateStr = (v: Date | string | undefined) => {
      if (!v) return undefined;
      return v instanceof Date ? v.toISOString().split("T")[0] : String(v);
    };

    if (domiciliation.situationAdministrative !== undefined) data.situation_administrative = domiciliation.situationAdministrative;
    if (domiciliation.typeStructure !== undefined) data.type_structure = domiciliation.typeStructure;
    if (domiciliation.raisonSociale !== undefined) data.raison_sociale = domiciliation.raisonSociale;
    if (domiciliation.formeJuridique !== undefined) data.forme_juridique = domiciliation.formeJuridique;
    if (domiciliation.nif !== undefined) data.nif = domiciliation.nif;
    if (domiciliation.nis !== undefined) data.nis = domiciliation.nis;
    if (domiciliation.registreCommerce !== undefined) data.registre_commerce = domiciliation.registreCommerce;
    if (domiciliation.articleImposition !== undefined) data.article_imposition = domiciliation.articleImposition;
    if (domiciliation.codeNae !== undefined) data.code_nae = domiciliation.codeNae;
    if (domiciliation.activiteExercee !== undefined) data.activite_exercee = domiciliation.activiteExercee;
    if (domiciliation.descriptionActivite !== undefined) data.description_activite = domiciliation.descriptionActivite;
    if (domiciliation.numeroAutoEntrepreneur !== undefined) data.numero_auto_entrepreneur = domiciliation.numeroAutoEntrepreneur;
    if (domiciliation.dateCreationEntreprise !== undefined) data.date_creation_entreprise = toDateStr(domiciliation.dateCreationEntreprise);
    if (domiciliation.villeImmatriculation !== undefined) data.ville_immatriculation = domiciliation.villeImmatriculation;
    if (domiciliation.dateInscriptionAutoEntrepreneur !== undefined) data.date_inscription_auto_entrepreneur = toDateStr(domiciliation.dateInscriptionAutoEntrepreneur);
    if (domiciliation.representantLegal !== undefined) data.representant_legal = domiciliation.representantLegal;
    if (domiciliation.domaineActivite !== undefined) data.domaine_activite = domiciliation.domaineActivite;
    if (domiciliation.adresseSiegeSocial !== undefined) data.adresse_siege_social = domiciliation.adresseSiegeSocial;
    if (domiciliation.capital !== undefined) data.capital = String(domiciliation.capital);
    if (domiciliation.numeroBureau !== undefined) data.numero_bureau = domiciliation.numeroBureau;
    if (domiciliation.referenceContratNotarie !== undefined) data.reference_contrat_notarie = domiciliation.referenceContratNotarie;
    if (domiciliation.dateDebutContrat !== undefined) data.date_debut_contrat = toDateStr(domiciliation.dateDebutContrat);
    if (domiciliation.dateFinContrat !== undefined) data.date_fin_contrat = toDateStr(domiciliation.dateFinContrat);
    if (domiciliation.options !== undefined) data.options = domiciliation.options;
    if (domiciliation.cguAcceptees !== undefined) data.cgu_acceptees = domiciliation.cguAcceptees;
    if (domiciliation.statut !== undefined) data.statut = domiciliation.statut;
    if (domiciliation.commentaireAdmin !== undefined) data.commentaire_admin = domiciliation.commentaireAdmin;
    if (domiciliation.montantMensuel !== undefined) data.montant_mensuel = domiciliation.montantMensuel;
    if (domiciliation.dateDebut !== undefined) data.date_debut = toDateStr(domiciliation.dateDebut);
    if (domiciliation.dateFin !== undefined) data.date_fin = toDateStr(domiciliation.dateFin);
    if (domiciliation.modePaiement !== undefined) data.mode_paiement = domiciliation.modePaiement;
    if (domiciliation.wilaya !== undefined) data.wilaya = domiciliation.wilaya;
    if (domiciliation.commune !== undefined) data.commune = domiciliation.commune;
    if (domiciliation.adresseActuelle !== undefined) data.adresse_actuelle = domiciliation.adresseActuelle;
    if (domiciliation.activitePrincipale !== undefined) data.activite_principale = domiciliation.activitePrincipale;
    if (domiciliation.dateDebutSouhaitee !== undefined) data.date_debut_souhaitee = toDateStr(domiciliation.dateDebutSouhaitee);
    if (domiciliation.visibleSurSite !== undefined) data.visible_sur_site = domiciliation.visibleSurSite;
    if (domiciliation.userId !== undefined) data.user_id = domiciliation.userId;

    return data;
  },
};

export const contactAdapter = {
  fromAPI: (apiData: ApiRecord): Contact => ({
    id: String(apiData.id || ""),
    nom: String(apiData.nom || ""),
    prenom: String(apiData.prenom || ""),
    email: apiData.email as string | undefined,
    telephone: apiData.telephone as string | undefined,
    entreprise: apiData.entreprise as string | undefined,
    source: (String(apiData.source || "autre")) as ContactSource,
    statut: (String(apiData.statut || "prospect")) as ContactStatut,
    notes: apiData.notes as string | undefined,
    userId: apiData.user_id ? String(apiData.user_id) : undefined,
    createdBy: String(apiData.created_by || ""),
    createdAt: String(apiData.created_at || ""),
    updatedAt: String(apiData.updated_at || ""),
  }),

  toAPI: (contact: Partial<Contact>): ApiRecord => {
    const data: ApiRecord = {};
    if (contact.nom !== undefined) data.nom = contact.nom;
    if (contact.prenom !== undefined) data.prenom = contact.prenom;
    if (contact.email !== undefined) data.email = contact.email;
    if (contact.telephone !== undefined) data.telephone = contact.telephone;
    if (contact.entreprise !== undefined) data.entreprise = contact.entreprise;
    if (contact.source !== undefined) data.source = contact.source;
    if (contact.statut !== undefined) data.statut = contact.statut;
    if (contact.notes !== undefined) data.notes = contact.notes;
    if (contact.userId !== undefined) data.user_id = contact.userId;
    return data;
  },
};

export const codePromoAdapter = {
  fromAPI: (apiData: ApiRecord): CodePromo => ({
    id: String(apiData.id || ""),
    code: String(apiData.code || ""),
    type: String(apiData.type || "pourcentage") as CodePromo["type"],
    valeur: Number(apiData.valeur || 0),
    dateDebut: parseDateSafe(apiData.date_debut),
    dateFin: parseDateSafe(apiData.date_fin),
    utilisationsMax: Number(apiData.utilisations_max || 0),
    utilisationsActuelles: Number(apiData.utilisations_actuelles || 0),
    actif: Boolean(apiData.actif),
    description: apiData.description as string | undefined,
    conditions: apiData.conditions as string | undefined,
    montantMin: apiData.montant_min != null ? Number(apiData.montant_min) : undefined,
    montantMaxReduction: apiData.montant_max_reduction != null ? Number(apiData.montant_max_reduction) : undefined,
    utilisationsParUser: apiData.utilisations_par_user != null ? Number(apiData.utilisations_par_user) : undefined,
    createdAt: apiData.created_at ? String(apiData.created_at) : undefined,
    updatedAt: apiData.updated_at ? String(apiData.updated_at) : undefined,
  }),

  toAPI: (code: Partial<CodePromo>): ApiRecord => {
    const data: ApiRecord = {};
    if (code.code !== undefined) data.code = code.code;
    if (code.type !== undefined) data.type = code.type;
    if (code.valeur !== undefined) data.valeur = code.valeur;
    if (code.dateDebut !== undefined) data.date_debut = code.dateDebut instanceof Date ? code.dateDebut.toISOString().split("T")[0] : code.dateDebut;
    if (code.dateFin !== undefined) data.date_fin = code.dateFin instanceof Date ? code.dateFin.toISOString().split("T")[0] : code.dateFin;
    if (code.utilisationsMax !== undefined) data.utilisations_max = code.utilisationsMax;
    if (code.actif !== undefined) data.actif = code.actif;
    if (code.description !== undefined) data.description = code.description;
    if (code.conditions !== undefined) data.conditions = code.conditions;
    if (code.montantMin !== undefined) data.montant_min = code.montantMin;
    if (code.montantMaxReduction !== undefined) data.montant_max_reduction = code.montantMaxReduction;
    if (code.utilisationsParUser !== undefined) data.utilisations_par_user = code.utilisationsParUser;
    return data;
  },
};
