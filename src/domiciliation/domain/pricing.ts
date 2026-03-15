import type { DomiciliationOptions } from './types';

export const BASE_MONTHLY_PRICE = 12000;

export interface OptionConfig {
  key: keyof DomiciliationOptions;
  label: string;
  description: string;
  price: number;
  included: boolean;
}

export const OPTIONS_CONFIG: OptionConfig[] = [
  {
    key: 'domiciliationSimple',
    label: 'Domiciliation simple',
    description: 'Adresse légale et commerciale',
    price: 0,
    included: true,
  },
  {
    key: 'receptionCourrier',
    label: 'Réception courrier',
    description: 'Collecte, conservation et notification sous 24h',
    price: 2000,
    included: false,
  },
  {
    key: 'scanNotificationEmail',
    label: 'Scan + notification email',
    description: 'Numérisation et envoi par email',
    price: 3000,
    included: false,
  },
  {
    key: 'reexpeditionCourrier',
    label: 'Réexpédition courrier',
    description: 'Envoi physique à votre adresse',
    price: 5000,
    included: false,
  },
  {
    key: 'accesPonctuelEspaces',
    label: 'Accès ponctuel espaces',
    description: '2 demi-journées par mois incluses',
    price: 4000,
    included: false,
  },
];

export function calculateMonthlyTotal(options: DomiciliationOptions): number {
  let total = BASE_MONTHLY_PRICE;
  for (const config of OPTIONS_CONFIG) {
    if (!config.included && options[config.key]) {
      total += config.price;
    }
  }
  return total;
}

export function getActiveOptions(options: DomiciliationOptions): OptionConfig[] {
  return OPTIONS_CONFIG.filter((c) => options[c.key]);
}

export function getAddonOptions(): OptionConfig[] {
  return OPTIONS_CONFIG.filter((c) => !c.included);
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('fr-DZ') + ' DA';
}

export function formatPriceWithUnit(amount: number, unit = 'HT/mois'): string {
  return formatPrice(amount) + ' ' + unit;
}
