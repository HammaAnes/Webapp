export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre connexion internet.",
  SERVER_ERROR: "Erreur serveur. Veuillez réessayer plus tard.",
  SESSION_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
  UNAUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action.",
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect.",
  EMAIL_ALREADY_EXISTS: "Cet email est déjà utilisé.",
  USER_NOT_FOUND: "Utilisateur introuvable.",
  INVALID_EMAIL: "Adresse email invalide.",
  INVALID_PHONE: "Numéro de téléphone invalide.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 6 caractères.",
  PASSWORDS_DONT_MATCH: "Les mots de passe ne correspondent pas.",
  REQUIRED_FIELD: "Ce champ est requis.",
  INVALID_DATE: "Date invalide.",
  DATE_IN_PAST: "La date doit être dans le futur.",
  END_DATE_BEFORE_START: "La date de fin doit être après la date de début.",
  SPACE_NOT_AVAILABLE: "Cet espace n'est pas disponible pour ces dates.",
  INVALID_PROMO_CODE: "Code promo invalide ou expiré.",
  PROMO_CODE_ALREADY_USED: "Vous avez déjà utilisé ce code promo.",
  PROMO_CODE_LIMIT_REACHED: "Ce code promo a atteint sa limite d'utilisations.",
  AMOUNT_TOO_LOW: "Le montant minimum n'est pas atteint pour ce code promo.",
  FILE_TOO_LARGE: "Le fichier est trop volumineux.",
  FILE_INVALID_TYPE: "Type de fichier non supporté.",
  UNKNOWN_ERROR: "Une erreur est survenue. Veuillez réessayer.",
} as const;

export const STATUS_LABELS = {
  RESERVATION: {
    confirmee: "Confirmée",
    en_attente: "En attente",
    en_cours: "En cours",
    annulee: "Annulée",
    terminee: "Terminée",
  },
  DOMICILIATION: {
    dossier_preparatoire: "Dossier préparatoire",
    en_attente_signature: "En attente de signature notariale",
    domiciliation_creee: "Domiciliation créée",
    en_attente_complements: "En attente de compléments",
    active: "Domiciliation active",
    refusee: "Refusée",
    expiree: "Expirée",
    resiliee: "Résiliée",
  },
  USER: {
    actif: "Actif",
    inactif: "Inactif",
    suspendu: "Suspendu",
  },
  PAYMENT: {
    en_attente: "En attente",
    validee: "Validé",
    echouee: "Échoué",
    rembourse: "Remboursé",
  },
} as const;

export const VALIDATION_MESSAGES = {
  PHONE: {
    INVALID:
      "Numéro de téléphone invalide (formats acceptés: +213555123456, +33612345678 ou 0555123456)",
    REQUIRED: "Le numéro de téléphone est requis",
  },
  NIF: {
    INVALID: "NIF invalide (20 caractères numériques requis)",
    REQUIRED: "Le NIF est requis",
  },
  NIS: {
    INVALID: "NIS invalide (15 caractères numériques requis)",
    REQUIRED: "Le NIS est requis",
  },
  RC: {
    INVALID: "Numéro de registre de commerce invalide",
    REQUIRED: "Le numéro de registre de commerce est requis",
  },
  AMOUNT: {
    INVALID: "Montant invalide",
    POSITIVE: "Le montant doit être positif",
    REQUIRED: "Le montant est requis",
  },
} as const;
