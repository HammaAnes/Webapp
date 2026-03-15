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
    description: 'Adresse légale officielle à Coffice',
    price: BASE_MONTHLY_PRICE,
    included: true,
  },
  {
    key: 'receptionCourrier',
    label: 'Réception du courrier',
    description: 'Collecte et notification par email à chaque réception',
    price: 2000,
    included: false,
  },
  {
    key: 'scanNotificationEmail',
    label: 'Scan & notification email',
    description: 'Numérisation et envoi par email de votre courrier',
    price: 3000,
    included: false,
  },
  {
    key: 'reexpeditionCourrier',
    label: 'Réexpédition du courrier',
    description: 'Envoi de votre courrier à l\'adresse de votre choix',
    price: 5000,
    included: false,
  },
  {
    key: 'accesPonctuelEspaces',
    label: 'Accès ponctuel aux espaces',
    description: '2 demi-journées par mois dans nos espaces de coworking',
    price: 4000,
    included: false,
  },
];

export function calculateMonthlyTotal(options: DomiciliationOptions): number {
  return OPTIONS_CONFIG.reduce((total, config) => {
    return total + (options[config.key] ? config.price : 0);
  }, 0);
}

export function getActiveOptions(options: DomiciliationOptions): OptionConfig[] {
  return OPTIONS_CONFIG.filter(c => options[c.key]);
}

export function getAddonOptions(): OptionConfig[] {
  return OPTIONS_CONFIG.filter(c => !c.included);
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('fr-DZ') + ' DA';
}

export function formatPriceWithUnit(amount: number): string {
  return formatPrice(amount) + '/mois';
}
