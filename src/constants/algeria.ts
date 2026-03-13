export const NIF_VALIDATION = {
  LENGTH: 20,
  PATTERN: /^[0-9]{20}$/,
  ERROR_MESSAGE: "Le NIF doit contenir exactement 20 chiffres",
} as const;

export const NIS_VALIDATION = {
  LENGTH: 15,
  PATTERN: /^[0-9]{15}$/,
  ERROR_MESSAGE: "Le NIS doit contenir exactement 15 chiffres",
} as const;

export const RC_VALIDATION = {
  PATTERN: /^[0-9A-Z\/-]+$/,
  ERROR_MESSAGE: "Format de registre de commerce invalide",
} as const;

export const WORKING_HOURS: {
  START: string;
  END: string;
  LUNCH_START: string;
  LUNCH_END: string;
  OPENING_HOUR: number;
  OPENING_MINUTE: number;
  CLOSING_HOUR: number;
  CLOSING_MINUTE: number;
} = {
  START: "08:30",
  END: "18:30",
  LUNCH_START: "12:00",
  LUNCH_END: "13:00",
  OPENING_HOUR: 8,
  OPENING_MINUTE: 30,
  CLOSING_HOUR: 18,
  CLOSING_MINUTE: 30,
};

export function validateNIF(nif: string): boolean {
  if (!nif) return false;
  const cleaned = nif.replace(/\s/g, "");
  return NIF_VALIDATION.PATTERN.test(cleaned);
}

export function validateNIS(nis: string): boolean {
  if (!nis) return false;
  const cleaned = nis.replace(/\s/g, "");
  return NIS_VALIDATION.PATTERN.test(cleaned);
}

export function validateAlgerianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^(\+213|0)?[5-7][0-9]{8}$/.test(cleaned);
}
