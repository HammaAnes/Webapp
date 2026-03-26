import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, ArrowRight, CheckCircle, MapPin, Mail, ScanLine,
  Send, Clock, Shield, Building2, Star, ChevronRight,
  BadgePercent, Server, Zap, Award,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { BASE_MONTHLY_PRICE, formatPrice } from '../../domain/pricing';

const PROCESS_STEPS = [
  { step: '01', title: 'Soumission du dossier', description: 'Remplissez le formulaire en ligne avec les informations de votre entreprise', time: '10 min' },
  { step: '02', title: 'Validation par Coffice', description: 'Notre équipe examine votre dossier et vous contacte si nécessaire', time: '24–48h' },
  { step: '03', title: 'Signature chez le notaire', description: 'Rendez-vous au Mohammadia Mall pour signer le contrat officiel', time: '1 jour' },
  { step: '04', title: 'Domiciliation active', description: 'Votre adresse est immédiatement utilisable pour tous vos documents officiels', time: 'Immédiat' },
];

const SERVICE_CARDS = [
  {
    icon: MapPin,
    title: 'Adresse légale officielle',
    description: 'Mohammadia Mall, 4ème étage, 16000 Alger. Une adresse de prestige pour votre siège social, valable pour tous vos documents administratifs et légaux.',
    highlight: "Inclus dans l'offre de base",
    color: 'amber',
  },
  {
    icon: BadgePercent,
    title: '20% de réduction sur toutes vos locations',
    description: "En tant que client domicilié, bénéficiez de 20% de réduction sur l'ensemble de vos réservations d'espaces Coffice — coworking, bureaux privatifs et salles de réunion.",
    highlight: 'Avantage exclusif domiciliés',
    color: 'emerald',
  },
  {
    icon: Mail,
    title: 'Réception et gestion du courrier',
    description: 'Nous réceptionnons votre courrier professionnel et administratif, avec notification immédiate par e-mail à chaque arrivée.',
    highlight: 'Option disponible',
    color: 'sky',
  },
  {
    icon: ScanLine,
    title: 'Scan & notification digitale',
    description: 'Vos courriers sont scannés et envoyés par e-mail, même si vous êtes absent. Ne manquez aucun document important.',
    highlight: 'Option disponible',
    color: 'teal',
  },
  {
    icon: Send,
    title: 'Réexpédition postale',
    description: "Nous réexpédions votre courrier à l'adresse de votre choix, en Algérie ou à l'étranger.",
    highlight: 'Option disponible',
    color: 'orange',
  },
  {
    icon: Shield,
    title: 'Conformité juridique garantie',
    description: 'Contrat notarié conforme à la réglementation algérienne. Votre domiciliation est légalement reconnue par toutes les administrations.',
    highlight: "Inclus dans l'offre de base",
    color: 'rose',
  },
];

const COLOR_MAP: Record<string, { icon: string; badge: string; bg: string; border: string }> = {
  amber:   { icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
  emerald: { icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  sky:     { icon: 'text-sky-600',     badge: 'bg-sky-100 text-sky-700',       bg: 'bg-sky-50',     border: 'border-sky-200'    },
  teal:    { icon: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700',     bg: 'bg-teal-50',    border: 'border-teal-200'   },
  orange:  { icon: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200' },
  rose:    { icon: 'text-rose-600',    badge: 'bg-rose-100 text-rose-700',     bg: 'bg-rose-50',    border: 'border-rose-200'   },
};

const NOVIHOST_ITEMS = [
  { icon: Server, title: 'Hébergement Premium',  desc: 'Infrastructure haute performance' },
  { icon: Zap,    title: 'Domaine .DZ inclus',   desc: 'votreentreprise.dz' },
  { icon: Mail,   title: '10 adresses e-mail pro', desc: '@votreentreprise.dz' },
  { icon: Shield, title: 'SSL & Sécurité',        desc: 'Protection complète incluse' },
];

const INCLUDED_ITEMS = [
  'Adresse légale et commerciale officielle',
  'Représentation au Registre de Commerce',
  'Adresse valable pour NIF, NIS, RC',
  'Conformité juridique totale',
  "20% de réduction sur toutes vos réservations d'espaces",
  'Réception et notification du courrier',
  'Scan & envoi du courrier par e-mail',
  'Réexpédition du courrier à votre adresse',
];

interface NoDemandeLandingProps {
  onStartDemande: () => void;
}

export default function NoDemandeLanding({ onStartDemande }: NoDemandeLandingProps) {

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-10">

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-[#0c1628] via-[#111827] to-[#0c1628] relative">
          {/* Lumières d'ambiance */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/8 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/8 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-400/4 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_360px]">

            {/* Colonne gauche — texte */}
            <div className="p-8 md:p-12 flex flex-col justify-between gap-8">

              {/* Titre + description */}
              <div>
                {/* Adresse en haut, épurée */}
                <div className="flex items-center gap-2 mb-7">
                  <div className="w-1 h-4 rounded-full bg-amber-400" />
                  <span className="text-amber-300/80 text-xs font-semibold tracking-widest uppercase">
                    Mohammadia Mall — Alger, 4ème étage
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-5 tracking-tight">
                  Donnez une adresse<br />
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    officielle à votre entreprise
                  </span>
                </h2>

                <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                  Adresse de prestige au cœur d'Alger, valable pour votre RC, NIF, NIS
                  et l'ensemble de vos documents officiels. Dossier traité en 48h, contrat notarié.
                </p>
              </div>

              {/* Garanties visuelles */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Clock,  label: 'Traitement', value: '48h' },
                  { icon: Shield, label: 'Contrat',    value: 'Notarié' },
                  { icon: Globe,  label: 'CNRC',       value: 'Au-dessus' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl p-3.5 text-center backdrop-blur-sm">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-bold text-sm">{value}</span>
                    <span className="text-slate-500 text-[11px]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne droite — carte CTA */}
            <div className="border-t lg:border-t-0 lg:border-l border-white/8 bg-white/3 backdrop-blur-sm p-7 flex flex-col justify-between gap-6">

              {/* Prix */}
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Offre de base</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-black text-white">{BASE_MONTHLY_PRICE.toLocaleString('fr-DZ')}</span>
                  <span className="text-slate-400 font-medium">DA<span className="text-sm">/mois</span></span>
                </div>
                <p className="text-slate-500 text-xs">Engagement 6 mois — contrat notarié</p>
              </div>

              {/* Ce qui est inclus */}
              <ul className="space-y-2.5">
                {[
                  'Adresse légale officielle',
                  'Gestion du courrier incluse',
                  '20% de réduction sur vos locations',
                  'Pack Novihost offert',
                  'Conformité juridique totale',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="space-y-3">
                <button
                  onClick={onStartDemande}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/40 transition-all duration-200 active:scale-[0.98] group"
                >
                  <Plus className="w-4 h-4" />
                  Déposer ma demande
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-center text-slate-500 text-xs">
                  Formulaire en ligne · <span className="text-slate-400">10 minutes</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Processus */}
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

        {/* Bloc partenaire Novihost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-0 overflow-hidden border-2 border-blue-200">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-7 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start gap-8">

                {/* En-tête Novihost */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-4 mb-4">
                    <img src="/logo_novihost.png" alt="Novihost" className="h-12 object-contain" />
                    <div>
                      <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-1">
                        INCLUS GRATUITEMENT
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">Pack Novihost Premium</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed max-w-xs">
                    En partenariat avec <strong>Novihost</strong>, leader algérien de l'hébergement
                    web depuis 1999 — chaque domiciliation inclut un pack digital complet pour
                    votre présence en ligne.
                  </p>
                </div>

                {/* Avantages Novihost */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {NOVIHOST_ITEMS.map(item => (
                    <div key={item.title} className="flex items-start gap-3 bg-white/70 rounded-xl p-4 border border-blue-200">
                      <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4.5 h-4.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lien Novihost */}
                <div className="flex-shrink-0 self-center">
                  <a
                    href="https://novihost.dz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" />
                    Découvrir Novihost
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Services */}
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

        {/* Tarification */}
        <Card className="p-0 overflow-hidden border-2 border-amber-200">
          <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

              {/* Prix de base */}
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
                  {INCLUDED_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement */}
              <div className="flex flex-col justify-between h-full">
                <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm">
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-4">Engagement</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Durée minimale de 6 mois</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Contrat signé chez le notaire</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Renouvellement simple en ligne</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Pack Novihost offert dès l'activation</span>
                    </li>
                  </ul>
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
                rightIcon={<ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />}
              >
                Commencer maintenant
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </motion.div>
  );
}
