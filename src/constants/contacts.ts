import type { ContactSource, ContactStatut } from '../types';

export const CONTACT_SOURCES = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  fixe: 'Téléphone fixe',
  mobile: 'Mobile',
  physique: 'En personne',
  email: 'Email',
  autre: 'Autre',
} as const;

export const CONTACT_SOURCE_COLORS: Record<ContactSource, string> = {
  whatsapp: 'bg-green-100 text-green-800',
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-slate-100 text-slate-800',
  fixe: 'bg-blue-100 text-blue-800',
  mobile: 'bg-cyan-100 text-cyan-800',
  physique: 'bg-amber-100 text-amber-800',
  email: 'bg-gray-100 text-gray-800',
  autre: 'bg-slate-100 text-slate-800',
};

export const CONTACT_STATUTS = {
  prospect: 'Prospect',
  client: 'Client',
  perdu: 'Perdu',
} as const;

export const CONTACT_STATUT_COLORS: Record<ContactStatut, string> = {
  prospect: 'bg-yellow-100 text-yellow-800',
  client: 'bg-green-100 text-green-800',
  perdu: 'bg-red-100 text-red-800',
};

export const CONTACT_STATUT_DESCRIPTIONS: Record<ContactStatut, string> = {
  prospect: 'Contact potentiel non converti',
  client: 'Client actif ou ayant effectué une réservation',
  perdu: 'Contact ne présentant plus d\'intérêt commercial',
};

export const SOURCE_OPTIONS = [
  { value: 'whatsapp' as const, label: 'WhatsApp' },
  { value: 'instagram' as const, label: 'Instagram' },
  { value: 'tiktok' as const, label: 'TikTok' },
  { value: 'fixe' as const, label: 'Téléphone fixe' },
  { value: 'mobile' as const, label: 'Mobile' },
  { value: 'physique' as const, label: 'En personne' },
  { value: 'email' as const, label: 'Email' },
  { value: 'autre' as const, label: 'Autre' },
];

export const STATUT_OPTIONS = [
  {
    value: 'prospect' as const,
    label: 'Prospect',
    description: 'Contact potentiel non converti',
  },
  {
    value: 'client' as const,
    label: 'Client',
    description: 'Client actif ou ayant réservé',
  },
  {
    value: 'perdu' as const,
    label: 'Perdu',
    description: 'Contact ne présentant plus d\'intérêt',
  },
];
