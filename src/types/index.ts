import type {
  EspaceType,
  ReservationStatut,
  UserRole,
  UserStatut,
  DomiciliationStatut,
  TypeReservation,
} from "../constants";

export type {
  EspaceType,
  ReservationStatut,
  UserRole,
  UserStatut,
  DomiciliationStatut,
  TypeReservation,
};

export type ContactSource =
  | 'whatsapp'
  | 'instagram'
  | 'tiktok'
  | 'fixe'
  | 'mobile'
  | 'physique'
  | 'email'
  | 'autre';

export type ContactStatut = 'prospect' | 'client' | 'perdu';

export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  source: ContactSource;
  statut: ContactStatut;
  notes?: string;
  userId?: string;
  user?: User;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactHistory {
  type: 'reservation' | 'domiciliation' | 'abonnement';
  entityId: string;
  date: string;
  description: string;
  montant?: number;
  statut: string;
}

export type TypeEntreprise =
  | "auto_entrepreneur"
  | "eurl"
  | "sarl"
  | "spa"
  | "snc"
  | "scs"
  | "startup"
  | "freelance"
  | "autre";

export interface IdentificationEntreprise {
  typeEntreprise: TypeEntreprise;
  nif?: string; // Numéro d'Identification Fiscale (20 caractères)
  nis?: string; // Numéro d'Identification Statistique (15 caractères)
  registreCommerce?: string; // Numéro du Registre du Commerce
  articleImposition?: string; // Article d'imposition
  numeroAutoEntrepreneur?: string; // Pour les auto-entrepreneurs
  raisonSociale?: string;
  dateCreation?: Date;
  capital?: number;
  siegeSocial?: string;
  activitePrincipale?: string;
  formeJuridique?: string;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: "admin" | "user";
  statut?: "actif" | "inactif" | "suspendu";
  password?: string;
  createdAt?: string;
  updatedAt?: string;
  derniereConnexion?: Date;
  dateCreation?: Date;
  avatar?: string | null;
  profession?: string;
  entreprise?: string;
  adresse?: string;
  bio?: string;
  wilaya?: string;
  commune?: string;
  typeEntreprise?: string;
  nif?: string;
  nis?: string;
  registreCommerce?: string;
  articleImposition?: string;
  numeroAutoEntrepreneur?: string;
  raisonSociale?: string;
  dateCreationEntreprise?: string;
  capital?: string;
  siegeSocial?: string;
  activitePrincipale?: string;
  formeJuridique?: string;
  identificationEntreprise?: IdentificationEntreprise;
  absences?: number;
  bannedUntil?: Date | null;
  codeParrainage?: string;
  parrainId?: string;
  nombreParrainages?: number;
  companyName?: string;
  billingAddress?: string;
  carteIdentiteUrl?: string | null;
}

export interface Espace {
  id: string;
  nom: string;
  type: EspaceType;
  capacite: number;
  prixHeure: number;
  prixDemiJournee: number;
  prixJour: number;
  prixSemaine: number;
  prixMois?: number;
  disponible: boolean;
  description: string;
  equipements: string[];
  createdAt: Date;
  updatedAt: Date;
  image?: string;
  imageUrl?: string;
  etage?: number;
}

export interface Reservation {
  id: string;
  userId?: string;
  contactId?: string;
  espaceId: string;
  utilisateur?: User;
  contact?: Contact;
  espace?: Espace | { id: string; nom: string; type: EspaceType };
  dateDebut: Date;
  dateFin: Date;
  statut: ReservationStatut;
  typeReservation?: TypeReservation;
  montantTotal: number;
  montantPaye?: number;
  modePaiement?: string;
  reduction?: number;
  codePromo?: string;
  notes?: string;
  participants?: number;
  noShow?: boolean;
  checkinId?: string;
  dateCreation?: Date;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface Transaction {
  id: string;
  utilisateur?: User;
  userId?: string;
  type: "reservation" | "domiciliation" | "abonnement" | "remboursement";
  montant: number;
  statut: "en_attente" | "completee" | "echouee" | "remboursee";
  modePaiement?: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  datePaiement?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentLegal {
  id: string;
  type:
    | "statuts"
    | "kbis"
    | "nif"
    | "nis"
    | "rc"
    | "article_imposition"
    | "carte_auto_entrepreneur"
    | "autre";
  nom: string;
  url?: string;
  dateUpload: Date;
  statut: "en_attente" | "valide" | "rejete";
  commentaire?: string;
}

export interface DomiciliationOptions {
  domiciliationSimple: boolean;
  receptionCourrier: boolean;
  scanNotificationEmail: boolean;
  reexpeditionCourrier: boolean;
  accesPonctuelEspaces: boolean;
}

export interface RepresentantLegal {
  nom: string;
  prenom: string;
  fonction?: string;
  telephone: string;
  email: string;
  adresseResidence?: string;
  ville?: string;
}

export interface DemandeDomiciliation {
  id: string;
  userId?: string;
  contactId?: string;
  utilisateur?: User;
  contact?: Contact;

  situationAdministrative: "en_cours_creation" | "deja_creee";
  typeStructure: "societe" | "auto_entrepreneur";

  raisonSociale: string;
  formeJuridique: string;
  capital?: number;
  activitePrincipale?: string;
  domaineActivite?: string;
  activiteExercee?: string;
  descriptionActivite?: string;

  nif?: string;
  nis?: string;
  registreCommerce?: string;
  articleImposition?: string;
  numeroAutoEntrepreneur?: string;
  codeNae?: string;

  wilaya?: string;
  commune?: string;
  adresseActuelle?: string;
  adresseSiegeSocial?: string;

  representantLegal: RepresentantLegal;

  dateCreationEntreprise?: string;
  villeImmatriculation?: string;
  dateInscriptionAutoEntrepreneur?: string;

  numeroBureau?: number;
  referenceContratNotarie?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  dateDebutSouhaitee?: string;
  dateDebut?: string;
  dateFin?: string;

  options?: DomiciliationOptions;
  montantMensuel?: number;
  modePaiement?: string;

  cguAcceptees: boolean;
  dateCguAcceptation?: string;

  statut: DomiciliationStatut;

  dateValidation?: string;
  dateActivation?: string;
  dateExpiration?: string;

  notesAdmin?: string;
  commentaireAdmin?: string;
  motifRefus?: string;
  complementsDemandes?: string;

  visibleSurSite?: boolean;
  documents?: Array<{ type: string; name: string }>;

  dateCreation: string;
  updatedAt: string;
}

export interface CodePromo {
  id: string;
  code: string;
  type: "pourcentage" | "montant_fixe";
  valeur: number;
  dateDebut: Date | string;
  dateFin: Date | string;
  utilisationsMax: number;
  utilisationsActuelles: number;
  actif: boolean;
  description?: string;
  conditions?: string;
  montantMin?: number;
  typesApplication?: ("reservation" | "domiciliation")[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserForm {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profession?: string;
  entreprise?: string;
  codeParrainage?: string;
}

export type RegisterData = UserForm;

export interface CreateReservationData {
  userId?: string;
  espaceId: string;
  dateDebut: Date;
  dateFin: Date;
  montantTotal?: number;
  notes?: string;
  codePromo?: string;
  participants?: number;
  reduction?: number;
}

export interface CreateDomiciliationData {
  userId?: string;
  contactId?: string;
  situationAdministrative: "en_cours_creation" | "deja_creee";
  typeStructure: "societe" | "auto_entrepreneur";
  raisonSociale?: string;
  formeJuridique?: string;
  capital?: number;
  activitePrincipale?: string;
  domaineActivite?: string;
  activiteExercee?: string;
  descriptionActivite?: string;
  nif?: string;
  nis?: string;
  registreCommerce?: string;
  articleImposition?: string;
  numeroAutoEntrepreneur?: string;
  codeNae?: string;
  wilaya?: string;
  commune?: string;
  adresseActuelle?: string;
  dateCreationEntreprise?: string;
  villeImmatriculation?: string;
  dateInscriptionAutoEntrepreneur?: string;
  representantLegal: RepresentantLegal;
  options?: DomiciliationOptions;
  cguAcceptees: boolean;
  dateDebutSouhaitee?: string;
  numeroBureau?: number;
  montantMensuel?: number;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: DomiciliationStatut;
  modePaiement?: string;
  notesAdmin?: string;
  commentaireAdmin?: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalReservations: number;
  totalUsers: number;
  activeUsers: number;
  occupancyRate: number;
  monthlyRevenue: number;
  reservationsCeMois?: number;
  popularSpaces: Array<{ name: string; count: number }>;
  recentActivity: Array<{ type: string; description: string; date: Date }>;
}

export interface Abonnement {
  id: string;
  nom: string;
  type: string;
  prix: number;
  prixAvecDomiciliation?: number;
  creditsMensuels?: number;
  dureeMois: number;
  description: string;
  avantages: string[];
  actif: boolean;
  statut?: string;
  couleur?: string;
  ordre: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AbonnementUtilisateur {
  id: string;
  userId: string;
  abonnementId: string;
  utilisateur?: User;
  abonnement?: Abonnement;
  dateDebut: string;
  dateFin: string;
  statut: "actif" | "expire" | "suspendu" | "annule";
  autoRenouvellement: boolean;
  creditsRestants?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  reservationReminders: boolean;
  paymentNotifications: boolean;
  maintenanceAlerts: boolean;
}
