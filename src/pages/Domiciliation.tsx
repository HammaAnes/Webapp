import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building,
  FileText,
  CheckCircle,
  Check,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Building2,
  Target,
  Receipt,
  Scale,
  BookOpen,
  Server,
  Zap,
  Award,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useSEO } from "../hooks/useSEO";
import { apiClient } from "../lib/api-client";
import { IMAGES } from "../config/images";
import { useAppStore } from "../store/store";
import { formatCurrency } from "../utils/formatters";

interface PublicDomiciliationStats {
  activeCount: number;
  visibleCompanies: Array<{ companyName: string; legalForm: string }>;
}

const DomiciliationPublic = () => {
  const { abonnements } = useAppStore();
  const [stats, setStats] = React.useState<PublicDomiciliationStats>({
    activeCount: 0,
    visibleCompanies: [],
  });
  const [loadError, setLoadError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const prixDomiciliation = React.useMemo(() => {
    const ab = abonnements.find(
      (a) => a.actif && (a.type === "domiciliation" || a.nom.toLowerCase().includes("domicil"))
    );
    return ab?.prix || null;
  }, [abonnements]);

  useSEO({
    title: "Domiciliation d'Entreprise à Alger | Coffice Coworking",
    description:
      "Domiciliez votre entreprise au Centre Commercial Mohammadia Mall. Adresse prestigieuse, conformité légale, contrat notarié. 12.000 DA HT/mois avec accès coworking et partenariat Novihost inclus.",
    keywords: [
      "domiciliation entreprise Alger",
      "adresse commerciale Alger",
      "siege social Mohammadia Mall",
      "domiciliation SARL Algerie",
      "coworking Alger",
    ],
  });

  const loadPublicStats = React.useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await apiClient.getPublicDomiciliationStats();
      if (response.success && response.data) {
        const data = response.data as Record<string, unknown>;
        const companies = Array.isArray(data.companies) ? data.companies : [];
        setStats({
          activeCount: (data.active_count as number) || 0,
          visibleCompanies: companies.map((c: Record<string, unknown>) => ({
            companyName: (c.raison_sociale as string) || "",
            legalForm: (c.forme_juridique as string) || "",
          })),
        });
      }
    } catch (error) {
      console.warn("[Domiciliation] Failed to load public stats:", error instanceof Error ? error.message : String(error));
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPublicStats();
  }, [loadPublicStats]);

  const visibleCompanies = stats.visibleCompanies;
  const MAX_DOMICILIATIONS = 60;
  const activeCount = stats.activeCount > 0 ? stats.activeCount : 10;
  const placesRestantes = MAX_DOMICILIATIONS - activeCount;

  const pricingFeatures = [
    "Adresse commerciale prestigieuse",
    "Gestion et réception du courrier",
    "Attestation de domiciliation",
    "Contrat notarié 100% conforme",
    "Accès coworking 8H/semaine",
    "Salles de réunion prioritaire",
    "Réductions de 20% sur tous les services",
    "Visibilite sur notre site",
    "Support prioritaire 24/7",
  ];

  const businessServices = [
    {
      icon: Building2,
      name: "Création d'Entreprise",
      tagline: "Accompagnement complet de A à Z",
      description:
        "Nous vous accompagnons dans toutes les démarches de création de votre entreprise",
      color: "text-accent",
      bgColor: "bg-accent/10",
      features: [
        "Choix de la forme juridique (SARL, EURL, SPA...)",
        "Rédaction des statuts et documents légaux",
        "Constitution du dossier CNRC",
        "Obtention du registre de commerce",
        "Immatriculation fiscale (NIF, NIS, AI)",
        "Accompagnement jusqu'à l'ouverture",
      ],
    },
    {
      icon: Target,
      name: "Conseil & Stratégie",
      tagline: "Expertise business pour votre réussite",
      description:
        "Conseils personnalisés pour développer et optimiser votre activité",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      features: [
        "Analyse économique et étude de marché",
        "Business plan et prévisionnel financier",
        "Stratégie de développement commercial",
        "Optimisation fiscale et sociale",
        "Audit et diagnostic d'entreprise",
        "Conseil en gestion et organisation",
      ],
    },
    {
      icon: Receipt,
      name: "Comptabilité & Fiscalité",
      tagline: "Gestion administrative complète",
      description:
        "Prenez soin de votre business, on s'occupe de votre compta",
      color: "text-teal",
      bgColor: "bg-teal/10",
      features: [
        "Tenue de comptabilité complète",
        "Déclarations fiscales et sociales",
        "Bulletins de paie et gestion RH",
        "Liasse fiscale et bilan annuel",
        "Suivi de trésorerie",
        "Conseils comptables personnalisés",
      ],
    },
    {
      icon: Scale,
      name: "Assistance Juridique",
      tagline: "Support légal pour votre activité",
      description:
        "Accompagnement juridique pour toutes vos problématiques",
      color: "text-rose",
      bgColor: "bg-rose/10",
      features: [
        "Rédaction de contrats commerciaux",
        "Cession de parts et augmentation capital",
        "Propriété intellectuelle et marques",
        "Conseil en droit des affaires",
      ],
    },
    {
      icon: BookOpen,
      name: "Formation Professionnelle",
      tagline: "Développez vos compétences",
      description:
        "Formations adaptées aux entrepreneurs et professionnels",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      features: [
        "Gestion d'entreprise et management",
        "Marketing digital et réseaux sociaux",
        "Comptabilité pour non-comptables",
        "Pitch et levée de fonds",
        "Techniques de vente et négociation",
        "Certification et attestation",
      ],
    },
  ];

  const advantages = [
    {
      icon: Building,
      title: "Adresse Prestigieuse",
      description:
        "Centre Commercial Mohammadia Mall, 4ème étage, Bureau 1178. Une adresse qui inspire confiance.",
      color: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      icon: Shield,
      title: "100% Conforme",
      description:
        "Contrat de location notarié conforme à la réglementation algérienne. Respect total des obligations.",
      color: "bg-teal/10",
      iconColor: "text-teal",
    },
    {
      icon: FileText,
      title: "Service Complet",
      description:
        "Attestations et certificats de domiciliation pour toutes vos démarches administratives.",
      color: "bg-warm/10",
      iconColor: "text-warm",
    },
    {
      icon: Clock,
      title: "Rapidité",
      description:
        "Mise en place rapide. Obtenez votre attestation sous 48h après validation et signature.",
      color: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      icon: MapPin,
      title: "Proximité CNRC & CASNOS",
      description:
        "Le CNRC est un étage au-dessus, la CASNOS dans le même bâtiment. Toutes vos démarches facilitées !",
      color: "bg-teal/10",
      iconColor: "text-teal",
    },
    {
      icon: Users,
      title: "Accompagnement",
      description:
        "Notre équipe vous accompagne dans toutes vos démarches administratives et juridiques.",
      color: "bg-warm/10",
      iconColor: "text-warm",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Demande en ligne",
      description:
        "Remplissez le formulaire de demande avec les informations de votre entreprise",
    },
    {
      number: "02",
      title: "Validation",
      description:
        "Notre équipe valide votre demande sous 24-48h et vous contacte",
    },
    {
      number: "03",
      title: "Signature notaire",
      description:
        "Rendez-vous chez le notaire pour signature du contrat de location",
    },
    {
      number: "04",
      title: "Activation",
      description:
        "Recevez votre attestation de domiciliation et démarrez vos activités",
    },
  ];

  const documentsNewCreation = [
    {
      text: "Dénomination de la société",
      note: "Peut être faite au niveau du CNRC juste au-dessus de nous",
    },
    { text: "Pièce d'identité" },
    { text: "Extrait de naissance" },
    { text: "Justificatif de domicile (Résidence)" },
  ];

  const documentsTransfer = [
    { text: "Extrait de registre du commerce" },
    { text: "Statuts de la société" },
    { text: "PV de nomination du gérant" },
    { text: "Copie NIF et NIS", optional: true },
    { text: "Article d'imposition" },
    { text: "Pièce d'identité du gérant" },
    { text: "Justificatif de domicile du gérant" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.spaces.meeting.url}
            alt={IMAGES.spaces.meeting.alt}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Building className="w-4 h-4 text-white mr-2" />
              <span className="text-white text-sm font-medium">
                Service de Domiciliation
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Domiciliez votre entreprise
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-200">
                au cœur d'Alger
              </span>
            </h1>
            <p className="text-xl text-white/85 mb-8 leading-relaxed max-w-2xl">
              Une adresse prestigieuse au Mohammadia Mall, un contrat notarié
              100% conforme, et un écosystème complet pour lancer et développer
              votre entreprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/inscription"
                className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a
                href="#tarifs"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-all"
              >
                Voir les tarifs
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 mt-16"
          >
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              {loadError ? (
                <button
                  onClick={loadPublicStats}
                  className="text-white/60 text-xs underline hover:text-white transition-colors"
                >
                  Réessayer
                </button>
              ) : (
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {loading ? "…" : activeCount}
                </div>
              )}
              <div className="text-white/70 text-sm">
                Entreprises domiciliées
              </div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {loading ? "…" : placesRestantes}
              </div>
              <div className="text-white/70 text-sm">Places disponibles</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                48h
              </div>
              <div className="text-white/70 text-sm">Délai d'activation</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Pourquoi nous choisir
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Les avantages Coffice
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une domiciliation professionnelle avec tous les avantages d'un
              espace de coworking moderne
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <motion.div
                key={advantage.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100"
              >
                <div
                  className={`w-14 h-14 ${advantage.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <advantage.icon
                    className={`w-7 h-7 ${advantage.iconColor}`}
                  />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {advantage.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {advantage.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs Section */}
      <section id="tarifs" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Tarifs
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Une offre complete et transparente
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour votre domiciliation
              professionnelle, dans une seule formule
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-accent relative h-full">
                <div className="absolute -top-4 left-6">
                  <span className="bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                    Offre Unique
                  </span>
                </div>

                <div className="pt-4 mb-8">
                  {prixDomiciliation ? (
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-primary">
                        {prixDomiciliation.toLocaleString("fr-DZ")}
                      </span>
                      <span className="text-xl text-gray-500">DA HT/mois</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-primary">
                        Contactez-nous pour les tarifs
                      </span>
                    </div>
                  )}
                  <p className="text-gray-600">
                    Formule complète pour votre domiciliation professionnelle
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {pricingFeatures.map((feature, idx) => (
                    <li
                      key={`feature-${idx}`}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/inscription" className="block">
                  <Button variant="primary" className="w-full" size="lg">
                    Commencer maintenant
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 border border-blue-200 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src="/logo_novihost.png"
                    alt="Novihost"
                    className="h-14 object-contain"
                  />
                  <div>
                    <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-1">
                      INCLUS GRATUITEMENT
                    </span>
                    <h3 className="text-xl font-bold text-primary">
                      Pack Novihost Premium
                    </h3>
                  </div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  En partenariat avec <strong>Novihost</strong>, leader algerien
                  de l'hebergement web depuis 1999, chaque domiciliation inclut
                  un pack digital complet pour votre presence en ligne.
                </p>

                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    {
                      icon: Server,
                      title: "Hébergement Premium",
                      desc: "Infrastructure haute performance",
                    },
                    {
                      icon: Zap,
                      title: "Domaine .DZ inclus",
                      desc: "votreentreprise.dz",
                    },
                    {
                      icon: Mail,
                      title: "10 Emails Pro",
                      desc: "@votreentreprise.dz",
                    },
                    {
                      icon: Shield,
                      title: "SSL & Securite",
                      desc: "Protection complete",
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <a
                  href="https://novihost.dz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Découvrir Novihost
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              Questions sur notre offre ?{" "}
              <a
                href="tel:+21323804924"
                className="text-accent font-semibold hover:underline"
              >
                +213 23 804 924
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Processus
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600">
              Un processus simple et rapide en 4 étapes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-teal text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)]">
                    <div className="border-t-2 border-dashed border-gray-200"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services d'accompagnement */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Au-delà de la domiciliation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Services d'accompagnement
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nous vous accompagnons dans toutes les étapes de vie de votre
              entreprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businessServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 h-full flex flex-col">
                  <div
                    className={`w-14 h-14 ${service.bgColor} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <service.icon className={`w-7 h-7 ${service.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-1">
                    {service.name}
                  </h3>
                  <p className={`text-sm font-medium ${service.color} mb-3`}>
                    {service.tagline}
                  </p>
                  <p className="text-gray-600 text-sm mb-5 flex-grow">
                    {service.description}
                  </p>

                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li
                        key={`${service.name}-${idx}`}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Besoin d'accompagnement personnalisé ? Notre équipe est à votre
              écoute
            </p>
            <a
              href="tel:+21323804924"
              className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
            >
              <Phone className="w-5 h-5" />
              +213 23 804 924
            </a>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Preparation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Documents nécessaires
            </h2>
            <p className="text-lg text-gray-600">
              Préparez ces documents pour accélérer votre demande
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    Nouvelle création
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pour les nouvelles sociétés
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {documentsNewCreation.map((doc, index) => (
                  <div
                    key={`new-${index}`}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-700 text-sm">{doc.text}</span>
                      {doc.note && (
                        <p className="text-xs text-accent mt-1">{doc.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    Transfert de siege social
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pour les sociétés existantes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {documentsTransfer.map((doc, index) => (
                  <div
                    key={`transfer-${index}`}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-700 text-sm">{doc.text}</span>
                      {doc.optional && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          Optionnel
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Entreprises domiciliees */}
      {visibleCompanies.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                Confiance
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Ils nous font confiance
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Rejoignez les {visibleCompanies.length} entreprises qui ont
                choisi Coffice pour leur domiciliation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCompanies.map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all border-l-4 border-l-accent">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal to-accent rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary mb-1 truncate">
                          {company.companyName}
                        </h3>
                        <Badge variant="info" className="text-xs">
                          {(company.legalForm || "").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-accent text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Prêt à domicilier votre entreprise ?
            </h2>
            <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto">
              Rejoignez les entreprises qui nous font confiance et donnez une
              adresse prestigieuse à votre société
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/inscription"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl"
              >
                Créer un compte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a
                href="tel:+21323804924"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-all"
              >
                <Phone className="w-5 h-5 mr-2" />
                Nous contacter
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-primary mb-2">Adresse</h3>
              <p className="text-gray-600 text-sm">
                Centre Commercial Mohammadia Mall
                <br />
                4ème étage, Bureau 1178
                <br />
                Mohammadia, Alger
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center mb-3">
                <Phone className="w-6 h-6 text-teal" />
              </div>
              <h3 className="font-semibold text-primary mb-2">Téléphone</h3>
              <p className="text-gray-600 text-sm">
                +213 23 804 924
                <br />
                Dim - Jeu: 8h30 - 18h30
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-warm/10 rounded-xl flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-warm" />
              </div>
              <h3 className="font-semibold text-primary mb-2">Email</h3>
              <p className="text-gray-600 text-sm">desk@coffice.dz</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DomiciliationPublic;
