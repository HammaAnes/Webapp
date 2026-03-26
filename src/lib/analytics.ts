/**
 * Analytics — Google Tag Manager (GTM-WF4LGQ63)
 *
 * Tous les événements sont poussés dans window.dataLayer.
 * GTM les transmet à GA4 (et tout autre tag configuré dans GTM).
 *
 * Usage :
 *   import { analytics } from '../lib/analytics';
 *   analytics.ctaClick('hero_reserver', 'hero');
 *   analytics.signUp('email');
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(event: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export const analytics = {

  /** À appeler sur chaque changement de route (React Router) */
  pageView(path: string, title?: string) {
    push({
      event: 'page_view',
      page_path: path,
      page_title: title ?? document.title,
    });
  },

  /** Clic sur un bouton CTA (hero, services, tarifs…)
   * @param label    identifiant du bouton, ex: 'hero_reserver', 'cta_voir_tarifs'
   * @param location section de la page, ex: 'hero', 'services', 'footer'
   */
  ctaClick(label: string, location = 'unknown') {
    push({
      event: 'cta_click',
      cta_label: label,
      cta_location: location,
    });
  },

  /** Inscription réussie
   * @param method     'email' | 'google'
   * @param hasReferral true si parrainage utilisé
   */
  signUp(method: 'email' | 'google', hasReferral = false) {
    push({
      event: 'sign_up',
      method,
      has_referral: hasReferral,
    });
  },

  /** Connexion réussie */
  login(method: 'email' | 'google') {
    push({ event: 'login', method });
  },

  /** Début du tunnel de réservation (étape 1 — choix espace) */
  reservationStart(espaceName: string, espaceType: string) {
    push({
      event: 'begin_checkout',
      espace_name: espaceName,
      espace_type: espaceType,
    });
  },

  /** Réservation confirmée avec succès */
  reservationComplete(params: {
    espaceName: string;
    espaceType: string;
    montant: number;
    hasPromo: boolean;
  }) {
    push({
      event: 'purchase',
      currency: 'DZD',
      value: params.montant,
      coupon: params.hasPromo ? 'promo_applied' : undefined,
      items: [{
        item_name: params.espaceName,
        item_category: params.espaceType,
        price: params.montant,
        quantity: 1,
      }],
    });
  },

  /** Demande de domiciliation soumise (lead fort) */
  domiciliationLead() {
    push({
      event: 'generate_lead',
      lead_type: 'domiciliation_request',
    });
  },

  /** Clic sur un lien de contact (téléphone, email, WhatsApp, maps) */
  contactClick(type: 'phone' | 'email' | 'whatsapp' | 'maps') {
    push({
      event: 'contact_click',
      contact_type: type,
    });
  },

  /** Partage d'un code parrainage */
  parrainageShare() {
    push({
      event: 'share',
      method: 'referral_code',
      content_type: 'parrainage',
    });
  },

  /** Vue d'un espace (fiche détail) */
  espaceView(espaceName: string, espaceType: string) {
    push({
      event: 'view_item',
      items: [{
        item_name: espaceName,
        item_category: espaceType,
      }],
    });
  },

};
