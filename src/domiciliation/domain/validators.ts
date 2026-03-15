import type { SituationAdministrative, TypeStructure, WizardFormData, DonneesB1, DonneesB2, DonneesA1, DonneesA2 } from './types';
import { getCasMetier } from './types';

export const RULES = {
  NIF_LENGTH: 20,
  NIS_LENGTH: 15,
  RC_MAX: 30,
  FILE_MAX_BYTES: 5 * 1024 * 1024,
  BUREAU_MIN: 1,
  BUREAU_MAX: 60,
  RAISON_SOCIALE_MAX: 255,
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
} as const;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function ok(): ValidationResult { return { valid: true, errors: {} }; }
function fail(errors: Record<string, string>): ValidationResult { return { valid: false, errors }; }

export function isValidNif(nif: string): boolean {
  return /^\d{20}$/.test(nif.replace(/\s/g, ''));
}

export function isValidNis(nis: string): boolean {
  return /^\d{15}$/.test(nis.replace(/\s/g, ''));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+213|0)(5|6|7)\d{8}$/.test(cleaned) || /^(\+33|0)[1-9]\d{8}$/.test(cleaned);
}

export function isValidBureau(num: number, occupied: number[]): boolean {
  return num >= RULES.BUREAU_MIN && num <= RULES.BUREAU_MAX && !occupied.includes(num);
}

export function isValidFile(file: File): boolean {
  return file.size <= RULES.FILE_MAX_BYTES && RULES.ALLOWED_FILE_TYPES.includes(file.type);
}

export function validateStep1(data: Pick<WizardFormData, 'situation'>): ValidationResult {
  if (!data.situation) return fail({ situation: 'Veuillez indiquer la situation administrative' });
  return ok();
}

export function validateStep2(data: Pick<WizardFormData, 'typeStructure'>): ValidationResult {
  if (!data.typeStructure) return fail({ typeStructure: 'Veuillez sélectionner le type de structure' });
  return ok();
}

export function validateStep3(data: Pick<WizardFormData, 'dirigeant'>): ValidationResult {
  const errors: Record<string, string> = {};
  const { dirigeant } = data;
  if (!dirigeant.adresseResidence?.trim()) errors['dirigeant.adresseResidence'] = "L'adresse de résidence est requise";
  if (!dirigeant.ville?.trim()) errors['dirigeant.ville'] = 'La ville est requise';
  if (!dirigeant.telephone?.trim()) {
    errors['dirigeant.telephone'] = 'Le téléphone est requis';
  } else if (!isValidPhone(dirigeant.telephone)) {
    errors['dirigeant.telephone'] = 'Format invalide (ex: 05X XXX XX XX)';
  }
  if (!dirigeant.email?.trim()) {
    errors['dirigeant.email'] = "L'email est requis";
  } else if (!isValidEmail(dirigeant.email)) {
    errors['dirigeant.email'] = 'Format email invalide';
  }
  return Object.keys(errors).length > 0 ? fail(errors) : ok();
}

export function validateStep4(
  situation: SituationAdministrative,
  typeStructure: TypeStructure,
  entreprise: WizardFormData['entreprise']
): ValidationResult {
  if (!entreprise) return fail({ entreprise: 'Données entreprise manquantes' });
  const cas = getCasMetier(situation, typeStructure);
  const errors: Record<string, string> = {};

  if (cas === 'A1') {
    const d = entreprise as DonneesA1;
    if (!d.denominationSociale?.trim()) errors.denominationSociale = 'La dénomination sociale est requise';
    if (!d.formeJuridique) errors.formeJuridique = 'La forme juridique est requise';
  } else if (cas === 'A2') {
    const d = entreprise as DonneesA2;
    if (!d.activiteExercee?.trim()) errors.activiteExercee = "L'activité exercée est requise";
  } else if (cas === 'B1') {
    const d = entreprise as DonneesB1;
    if (!d.denominationSociale?.trim()) errors.denominationSociale = 'La dénomination sociale est requise';
    if (!d.formeJuridique) errors.formeJuridique = 'La forme juridique est requise';
    if (!d.registreCommerce?.trim()) errors.registreCommerce = 'Le registre de commerce est requis';
    if (!d.nif?.trim()) {
      errors.nif = 'Le NIF est requis';
    } else if (!isValidNif(d.nif)) {
      errors.nif = `Le NIF doit contenir exactement ${RULES.NIF_LENGTH} chiffres`;
    }
    if (!d.nis?.trim()) {
      errors.nis = 'Le NIS est requis';
    } else if (!isValidNis(d.nis)) {
      errors.nis = `Le NIS doit contenir exactement ${RULES.NIS_LENGTH} chiffres`;
    }
    if (!d.articleImposition?.trim()) errors.articleImposition = "L'article d'imposition est requis";
  } else if (cas === 'B2') {
    const d = entreprise as DonneesB2;
    if (!d.numeroAutoEntrepreneur?.trim()) errors.numeroAutoEntrepreneur = 'Le numéro auto-entrepreneur est requis';
    if (!d.activiteExercee?.trim()) errors.activiteExercee = "L'activité exercée est requise";
  }

  return Object.keys(errors).length > 0 ? fail(errors) : ok();
}

export function validateStep5(
  uploadedDocs: Array<{ type: string }>,
  requiredDocs: Array<{ id: string; required: boolean }>
): ValidationResult {
  const uploadedTypes = new Set(uploadedDocs.map(d => d.type));
  const missing = requiredDocs.filter(d => d.required && !uploadedTypes.has(d.id));
  if (missing.length > 0) {
    return fail({ documents: `Documents requis manquants: ${missing.map(d => d.id).join(', ')}` });
  }
  return ok();
}

export function validateStep6(cguAcceptees: boolean): ValidationResult {
  if (!cguAcceptees) return fail({ cgu: 'Vous devez accepter les conditions générales' });
  return ok();
}

export function validatePostCreation(
  typeStructure: TypeStructure,
  data: Record<string, string>
): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeStructure === 'societe') {
    if (!data.registreCommerce?.trim()) errors.registreCommerce = 'Le registre de commerce est requis';
    if (!data.nif?.trim()) {
      errors.nif = 'Le NIF est requis';
    } else if (!isValidNif(data.nif)) {
      errors.nif = `Le NIF doit contenir exactement ${RULES.NIF_LENGTH} chiffres`;
    }
    if (!data.nis?.trim()) {
      errors.nis = 'Le NIS est requis';
    } else if (!isValidNis(data.nis)) {
      errors.nis = `Le NIS doit contenir exactement ${RULES.NIS_LENGTH} chiffres`;
    }
    if (!data.articleImposition?.trim()) errors.articleImposition = "L'article d'imposition est requis";
  } else {
    if (!data.numeroAutoEntrepreneur?.trim()) errors.numeroAutoEntrepreneur = 'Le numéro auto-entrepreneur est requis';
  }

  return Object.keys(errors).length > 0 ? fail(errors) : ok();
}

export function firstError(result: ValidationResult): string | null {
  const keys = Object.keys(result.errors);
  return keys.length > 0 ? result.errors[keys[0]] : null;
}
