import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Plus,
  ArrowRight,
  CheckCircle,
  MapPin,
  Mail,
  ScanLine,
  Send,
  Briefcase,
  Clock,
  Shield,
  Building2,
  Star,
  ChevronRight,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { OPTIONS_CONFIG, formatPriceWithUnit, BASE_MONTHLY_PRICE } from '../../domain/pricing';

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
    highlight: 'Inclus dans l\'offre de base',
    color: 'amber',
  },
  {
    icon: Mail,
    title: 'Réception et gestion du courrier',
    description: 'Nous réceptionnons votre courrier professionnel et administratif, avec notification immédiate par email à chaque arrivée.',
    highlight: 'Option disponible',
    color: 'sky',
  },
  {
    icon: ScanLine,
    title: 'Scan & notification digitale',
    description: 'Vos courriers sont scannés et envoyés par email, même si vous êtes absent. Ne manquez aucun document important.',
    highlight: 'Option disponible',
    color: 'teal',
  },
  {
    icon: Send,
    title: 'Réexpédition postale',
    description: 'Nous réexpédions votre courrier à l\'adresse de votre choix, en Algérie ou à l\'étranger.',
    highlight: 'Option disponible',
    color: 'orange',
  },
  {
    icon: Briefcase,
    title: 'Accès aux espaces coworking',
    description: '2 demi-journées par mois incluses. Profitez des espaces de travail, salles de réunion et équipements professionnels.',
    highlight: 'Option disponible',
    color: 'emerald',
  },
  {
    icon: Globe,
    title: 'Visibilité en ligne',
    description: 'Votre entreprise apparaît sur notre site. Un avantage de notoriété et de référencement local.',
    highlight: 'Inclus automatiquement',
    color: 'blue',
  },
];

const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
};

interface NoDemandeLandingProps {
  onNewDemande: () => void;
}

const NoDemandeLanding: React.FC<NoDemandeLandingProps> = ({ onNewDemande }) => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-3xl translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-500/10 to-sky-500/10 rounded-full blur-3xl -translate-x-10 translate-y-10" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-amber-500/30">
            <Building2 className="w-4 h-4" />
            Service de Domiciliation
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Domiciliez votre entreprise
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
              au cœur d'Alger
            </span>
          </h2>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Une adresse prestigieuse au Mohammadia Mall, un contrat notarié 100% conforme, et un écosystème complet pour lancer et développer votre entreprise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={onNewDemande}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Soumettre ma demande
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-8 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Contrat notarié 100% légal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Activation sous 48h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Conforme droit algérien</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div>
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Comment ça marche ?</h3>
          <p className="text-gray-500 text-sm">Un processus simple en 4 étapes</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS_STEPS.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{step.time}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">{step.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                {index < PROCESS_STEPS.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 hidden lg:block z-10" />
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Nos services</h3>
          <p className="text-gray-500 text-sm">Tout ce dont votre entreprise a besoin</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICE_CARDS.map((service, index) => {
            const colors = colorMap[service.color] ?? colorMap.amber;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="p-5 h-full flex flex-col hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 ${colors.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <service.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">{service.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{service.description}</p>
                  <span className={`mt-3 text-xs font-medium ${colors.badge} px-2 py-1 rounded-full self-start`}>
                    {service.highlight}
                  </span>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-2 border-amber-200">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-amber-800">Offre de domiciliation</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">{formatPriceWithUnit(BASE_MONTHLY_PRICE)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Domiciliation simple — adresse légale incluse</p>
              <div className="space-y-1.5">
                {OPTIONS_CONFIG.filter((c) => c.included).map((c) => (
                  <div key={c.key} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="primary" size="lg" onClick={onNewDemande} className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Déposer ma demande
              </Button>
              <p className="text-xs text-center text-gray-500">Options additionnelles personnalisables</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NoDemandeLanding;
