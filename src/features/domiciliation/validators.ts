export function validateNIF(nif: string): { valid: boolean; error?: string } {
  if (!nif || nif.trim() === "") return { valid: false, error: "Le NIF est obligatoire" };
  const cleaned = nif.replace(/\s/g, "");
  if (!/^\d{20}$/.test(cleaned)) return { valid: false, error: "Le NIF doit contenir exactement 20 chiffres" };
  return { valid: true };
}

export function validateNIS(nis: string): { valid: boolean; error?: string } {
  if (!nis || nis.trim() === "") return { valid: false, error: "Le NIS est obligatoire" };
  const cleaned = nis.replace(/\s/g, "");
  if (!/^\d{15}$/.test(cleaned)) return { valid: false, error: "Le NIS doit contenir exactement 15 chiffres" };
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === "") return { valid: false, error: "Le téléphone est obligatoire" };
  const cleaned = phone.replace(/[\s\-().]/g, "");
  const algerienPattern = /^(\+213|0)(5|6|7)\d{8}$/;
  const frenchPattern = /^(\+33|0)[1-9]\d{8}$/;
  if (!algerienPattern.test(cleaned) && !frenchPattern.test(cleaned)) {
    return { valid: false, error: "Numéro invalide. Format attendu: 05X XXX XX XX ou +213 5X XXX XX XX" };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === "") return { valid: false, error: "L'email est obligatoire" };
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) return { valid: false, error: "Format email invalide" };
  return { valid: true };
}

export function validateDateRange(debut: string, fin: string): { valid: boolean; error?: string } {
  if (!debut) return { valid: false, error: "La date de début est obligatoire" };
  if (!fin) return { valid: false, error: "La date de fin est obligatoire" };
  const d = new Date(debut);
  const f = new Date(fin);
  if (isNaN(d.getTime())) return { valid: false, error: "Date de début invalide" };
  if (isNaN(f.getTime())) return { valid: false, error: "Date de fin invalide" };
  if (f <= d) return { valid: false, error: "La date de fin doit être postérieure à la date de début" };
  return { valid: true };
}

export function validateBureau(num: number, occupied: number[]): { valid: boolean; error?: string } {
  if (!num || isNaN(num)) return { valid: false, error: "Numéro de bureau obligatoire" };
  if (num < 1 || num > 60) return { valid: false, error: "Le bureau doit être entre 1 et 60" };
  if (occupied.includes(num)) return { valid: false, error: `Le bureau N°${num} est déjà occupé` };
  return { valid: true };
}

export function validateRaisonSociale(rs: string): { valid: boolean; error?: string } {
  if (!rs || rs.trim() === "") return { valid: false, error: "La raison sociale est obligatoire" };
  if (rs.trim().length > 200) return { valid: false, error: "La raison sociale ne peut pas dépasser 200 caractères" };
  return { valid: true };
}

export function validateRC(rc: string): { valid: boolean; error?: string } {
  if (!rc || rc.trim() === "") return { valid: false, error: "Le registre de commerce est obligatoire" };
  return { valid: true };
}

export function validateMontant(montant: number | string): { valid: boolean; error?: string } {
  const n = typeof montant === "string" ? parseFloat(montant) : montant;
  if (isNaN(n) || n <= 0) return { valid: false, error: "Le montant doit être supérieur à 0" };
  return { valid: true };
}
