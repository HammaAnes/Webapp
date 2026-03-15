import type {
  SituationAdministrative,
  TypeStructure,
  WizardFormData,
  DonneesA1,
  DonneesA2,
  DonneesB1,
  DonneesB2,
  UploadedDocument,
} from './types';
import { getCasMetier } from './types';

export const RULES = {
  NIF_LENGTH: 20,
  NIS_LENGTH: 15,
  RC_MAX: 30,
  FILE_MAX_BYTES: 5 * 1024 * 1024,
  FILE_ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  BUREAU_MIN: 1,
  BUREAU_MAX: 60,
  RAISON_SOCIALE_MAX: 200,
} as const;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function ok(): ValidationResult {
  return { valid: true, errors: {} };
}

function fail(errors: Record<string, string>): ValidationResult {
  return { valid: false, errors };
}

export function isValidNif(nif: string): boolean {
  const cleaned = nif.replace(/\s/g, '');
  return /^\d{20}$/.test(cleaned);
}

export function isValidNis(nis: string): boolean {
  const cleaned = nis.replace(/\s/g, '');
  return /^\d{15}$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  const algerien = /^(\+213|0)(5|6|7)\d{8}$/;
  const francais = /^(\+33|0)[1-9]\d{8}$/;
  return algerien.test(cleaned) || francais.test(cleaned);
}

export function isValidBureau(num: number, occupied: number[] = []): boolean {
  return (
    !isNaN(num) &&
    num >= RULES.BUREAU_MIN &&
    num <= RULES.BUREAU_MAX &&
    !occupied.includes(num)
  );
}

export function isValidFile(file: File): boolean {
  return (
    file.size <= RULES.FILE_MAX_BYTES &&
    RULES.FILE_ALLOWED_TYPES.includes(file.type)
  );
}

export function validateStep1(data: WizardFormData): ValidationResult {
  if (!data.situation) {
    return fail({ situation: 'Veuillez choisir votre situation administrative' });
  }
  return ok();
}

export function validateStep2(data: WizardFormData): ValidationResult {
  if (!data.typeStructure) {
    return fail({ typeStructure: 'Veuillez choisir le type de structure' });
  }
  return ok();
}

export function validateStep3(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const { dirigeant, dateDebutSouhaitee } = data;

  if (!dirigeant.nom.trim()) errors['dirigeant.nom'] = 'Le nom est obligatoire';
  if (!dirigeant.prenom.trim()) errors['dirigeant.prenom'] = 'Le prénom est obligatoire';
  if (!dirigeant.telephone.trim()) {
    errors['dirigeant.telephone'] = 'Le téléphone est obligatoire';
  } else if (!isValidPhone(dirigeant.telephone)) {
    errors['dirigeant.telephone'] = 'Numéro invalide. Format: 05X XXX XX XX ou +213 5X XXX XX XX';
  }
  if (!dirigeant.adresseResidence.trim()) errors['dirigeant.adresseResidence'] = 'L\'adresse de résidence est obligatoire';
  if (!dirigeant.ville.trim()) errors['dirigeant.ville'] = 'La ville est obligatoire';
  if (!dateDebutSouhaitee) errors['dateDebutSouhaitee'] = 'La date de début souhaitée est obligatoire';

  return Object.keys(errors).length ? fail(errors) : ok();
}

export function validateStep4(data: WizardFormData): ValidationResult {
  if (!data.situation || !data.typeStructure || !data.entreprise) {
    return fail({ entreprise: 'Informations entreprise incomplètes' });
  }

  const cas = getCasMetier(data.situation as SituationAdministrative, data.typeStructure as TypeStructure);
  const errors: Record<string, string> = {};

  if (cas === 'A1') {
    const e = data.entreprise as DonneesA1;
    if (!e.denominationSociale.trim()) errors.denominationSociale = 'La dénomination sociale est obligatoire';
    if (!e.formeJuridique) errors.formeJuridique = 'La forme juridique est obligatoire';
  } else if (cas === 'A2') {
    const e = data.entreprise as DonneesA2;
    if (!e.activiteExercee.trim()) errors.activiteExercee = 'L\'activité exercée est obligatoire';
  } else if (cas === 'B1') {
    const e = data.entreprise as DonneesB1;
    if (!e.denominationSociale.trim()) errors.denominationSociale = 'La dénomination sociale est obligatoire';
    if (!e.formeJuridique) errors.formeJuridique = 'La forme juridique est obligatoire';
    if (!e.registreCommerce.trim()) errors.registreCommerce = 'Le registre de commerce est obligatoire';
    if (!e.nif.trim()) {
      errors.nif = 'Le NIF est obligatoire';
    } else if (!isValidNif(e.nif)) {
      errors.nif = `Le NIF doit contenir exactement ${RULES.NIF_LENGTH} chiffres`;
    }
    if (!e.nis.trim()) {
      errors.nis = 'Le NIS est obligatoire';
    } else if (!isValidNis(e.nis)) {
      errors.nis = `Le NIS doit contenir exactement ${RULES.NIS_LENGTH} chiffres`;
    }
  } else if (cas === 'B2') {
    const e = data.entreprise as DonneesB2;
    if (!e.numeroAutoEntrepreneur.trim()) errors.numeroAutoEntrepreneur = 'Le numéro auto-entrepreneur est obligatoire';
    if (!e.activiteExercee.trim()) errors.activiteExercee = 'L\'activité exercée est obligatoire';
  }

  return Object.keys(errors).length ? fail(errors) : ok();
}

export function validateStep5(
  uploadedDocuments: UploadedDocument[],
  requiredDocs: Array<{ id: string; name: string; required: boolean }>
): ValidationResult {
  const errors: Record<string, string> = {};
  const uploadedTypes = new Set(uploadedDocuments.map((d) => d.type));

  for (const doc of requiredDocs) {
    if (doc.required && !uploadedTypes.has(doc.id)) {
      errors[doc.id] = `Document requis : ${doc.name}`;
    }
  }

  return Object.keys(errors).length ? fail(errors) : ok();
}

export function validateStep6(data: WizardFormData): ValidationResult {
  if (!data.cguAcceptees) {
    return fail({ cguAcceptees: 'Vous devez accepter les conditions générales pour continuer' });
  }
  return ok();
}

export function validatePostCreation(
  typeStructure: TypeStructure,
  data: Record<string, string>
): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeStructure === 'societe') {
    if (!data.nif?.trim()) {
      errors.nif = 'Le NIF est obligatoire';
    } else if (!isValidNif(data.nif)) {
      errors.nif = `Le NIF doit contenir exactement ${RULES.NIF_LENGTH} chiffres`;
    }
    if (!data.nis?.trim()) {
      errors.nis = 'Le NIS est obligatoire';
    } else if (!isValidNis(data.nis)) {
      errors.nis = `Le NIS doit contenir exactement ${RULES.NIS_LENGTH} chiffres`;
    }
    if (!data.registreCommerce?.trim()) {
      errors.registreCommerce = 'Le registre de commerce est obligatoire';
    }
  } else {
    if (!data.numeroAutoEntrepreneur?.trim()) {
      errors.numeroAutoEntrepreneur = 'Le numéro auto-entrepreneur est obligatoire';
    }
  }

  return Object.keys(errors).length ? fail(errors) : ok();
}

export function firstError(result: ValidationResult): string | null {
  const keys = Object.keys(result.errors);
  return keys.length ? result.errors[keys[0]] : null;
}
