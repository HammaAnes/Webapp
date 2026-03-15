import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, ArrowRight, CheckCircle, MapPin, Mail, ScanLine,
  Send, Briefcase, Clock, Shield, Building2, Star, ChevronRight,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { OPTIONS_CONFIG, BASE_MONTHLY_PRICE, formatPrice } from '../../domain/pricing';

const PROCESS_STEPS = [
  { step: '01', title: 'Soumission du dossier', description: 'Remplissez le formulaire en ligne avec les informations de votre entreprise', time: '10 min' },
  { step: '02', title: 'Validation par Coffice', description: 'Notre équipe examine votre dossier et vous contacte si nécessaire', time: '24–48h' },
  { step: '03', title: 'Signature chez le notaire', description: 'Rendez-vous au Mohammadia Mall pour signer le contrat officiel', time: '1 jour' },
  { step: '04', title: 'Domiciliation active', description: "Votre adresse est immédiatement utilisable pour tous vos documents officiels", time: 'Immédiat' },
];

const SERVICE_CARDS = [
  { icon: MapPin, title: 'Adresse légale officielle', description: 'Mohammadia Mall, 4ème étage, 16000 Alger. Une adresse de prestige pour votre siège social, valable pour tous vos documents administratifs et légaux.', highlight: "Inclus dans l'offre de base", color: 'amber' },
  { icon: Mail, title: 'Réception et gestion du courrier', description: 'Nous réceptionnons votre courrier professionnel et administratif, avec notification immédiate par email à chaque arrivée.', highlight: 'Option disponible', color: 'sky' },
  { icon: ScanLine, title: 'Scan & notification digitale', description: "Vos courriers sont scannés et envoyés par email, même si vous êtes absent. Ne manquez aucun document important.", highlight: 'Option disponible', color: 'teal' },
  { icon: Send, title: 'Réexpédition postale', description: "Nous réexpédions votre courrier à l'adresse de votre choix, en Algérie ou à l'étranger.", highlight: 'Option disponible', color: 'orange' },
  { icon: Briefcase, title: 'Accès aux espaces Coffice', description: 'Profitez de 2 demi-journées par mois dans nos espaces de coworking modernes pour travailler ou recevoir vos clients.', highlight: 'Option disponible', color: 'emerald' },
  { icon: Shield, title: 'Conformité juridique garantie', description: "Contrat notarié conforme à la réglementation algérienne. Votre domiciliation est légalement reconnue par toutes les administrations.", highlight: "Inclus dans l'offre de base", color: 'rose' },
];

const COLOR_MAP: Record<string, { icon: string; badge: string; bg: string; border: string }> = {
  amber: { icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  sky: { icon: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  teal: { icon: 'text-teal-600', badge: 'bg-teal-100 text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  orange: { icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  emerald: { icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rose: { icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

interface NoDemandeLandingProps {
  onStartDemande: () => void;
}

export default function NoDemandeLanding({ onStartDemande }: NoDemandeLandingProps) {
  const addonOptions = OPTIONS_CONFIG.filter(o => !o.included);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-10">
        <Card className="p-0 overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
            <div className="relative max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/30">
                  <Globe className="w-3.5 h-3.5" />
                  Mohammadia Mall, Alger
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  Validation en 48h
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-sky-500/20 text-sky-300 px-3 py-1.5 rounded-full border border-sky-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  Contrat notarié
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
                Domiciliez votre entreprise<br />
                <span className="text-amber-400">au cœur d'Alger</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
                Obtenez une adresse légale et commerciale dans un espace d'affaires moderne.
                Valable pour votre RC, NIF, NIS et tous documents officiels.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onStartDemande}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-900/30 border-0 group"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Démarrer ma demande
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Dès <strong className="text-white">{formatPrice(BASE_MONTHLY_PRICE)}/mois</strong></span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Comment ça fonctionne ?</h3>
            <p className="text-gray-500">Un processus simple et rapide en 4 étapes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="p-5 h-full border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl font-black text-amber-300 group-hover:text-amber-500 transition-colors leading-none">{step.step}</span>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1">{step.time}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">{step.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nos services de domiciliation</h3>
            <p className="text-gray-500">Tout ce qu'il vous faut pour domicilier et gérer votre entreprise</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_CARDS.map((service, i) => {
              const c = COLOR_MAP[service.color];
              const Icon = service.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className={`p-6 h-full border ${c.border} ${c.bg} hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${c.border}`}>
                        <Icon className={`w-5 h-5 ${c.icon}`} />
                      </div>
                      <span className={`text-xs font-semibold ${c.badge} px-2 py-0.5 rounded-full self-center`}>
                        {service.highlight}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{service.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-2 border-amber-200">
          <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Tarification transparente</h3>
                    <p className="text-gray-500 text-sm">Sans frais cachés</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm mb-4">
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-2">Offre de base — inclus</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-black text-gray-900">{BASE_MONTHLY_PRICE.toLocaleString('fr-DZ')}</span>
                    <span className="text-xl font-semibold text-gray-500 mb-1">DA/mois</span>
                  </div>
                  <p className="text-xs text-gray-500">Engagement 6 mois minimum — contrat notarié</p>
                </div>

                <div className="space-y-2">
                  {['Adresse légale et commerciale officielle', 'Représentation au Registre de Commerce', 'Adresse valable pour NIF, NIS, RC', 'Conformité juridique totale'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Options additionnelles</h4>
                <div className="space-y-3">
                  {addonOptions.map(opt => (
                    <div key={opt.key} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg whitespace-nowrap ml-3">
                        +{opt.price.toLocaleString('fr-DZ')} DA/mois
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Prêt à domicilier votre entreprise ?</p>
                <p className="text-sm text-gray-500">Déposez votre dossier en moins de 10 minutes</p>
              </div>
              <Button
                onClick={onStartDemande}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white group whitespace-nowrap"
                size="lg"
              >
                Commencer maintenant
                <ChevronRight className="w-5 h-5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
