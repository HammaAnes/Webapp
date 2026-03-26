import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Target,
  Heart,
  ArrowRight,
  Building2,
  Wifi,
  Coffee,
  Shield,
  Sparkles,
  CheckCircle,
  Star,
  Zap,
  Server,
  Globe,
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { IMAGES } from "../config/images";

const About = () => {
  useSEO();

  const stats = [
    { value: "200m\u00B2", label: "Surface totale" },
    { value: "24", label: "Postes de travail" },
    { value: "3", label: "Bureaux privés" },
    { value: "60", label: "Domiciliations max" },
  ];

  const values = [
    {
      icon: Users,
      title: "Communauté",
      description:
        "Un réseau d'entrepreneurs, freelances et startups qui échangent, collaborent et grandissent ensemble dans un esprit de partage.",
      color: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      icon: Target,
      title: "Excellence",
      description:
        "Des espaces et services de la plus haute qualité. Chaque détail est pensé pour optimiser votre productivité et votre confort.",
      color: "bg-teal/10",
      iconColor: "text-teal",
    },
    {
      icon: Heart,
      title: "Passion",
      description:
        "Nous croyons au potentiel de chaque entrepreneur algérien. Notre passion nous pousse à créer des expériences qui inspirent.",
      color: "bg-warm/10",
      iconColor: "text-warm",
    },
    {
      icon: Zap,
      title: "Innovation",
      description:
        "Nous innovons constamment : outils digitaux, services évolutifs, partenariats stratégiques pour rester à la pointe.",
      color: "bg-emerald/10",
      iconColor: "text-emerald-600",
    },
  ];

  const amenities = [
    { icon: Wifi, label: "WiFi haut débit" },
    { icon: Coffee, label: "Kitchenette équipée" },
    { icon: Shield, label: "Sécurité 24/7" },
    { icon: Sparkles, label: "Espaces climatisés" },
    { icon: Building2, label: "Parking couvert" },
    { icon: Clock, label: "Horaires flexibles" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.spaces.coworking.url}
            alt={IMAGES.spaces.coworking.alt}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/85"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <MapPin className="w-4 h-4 text-white mr-2" />
              <span className="text-white text-sm font-medium">
                Mohammadia Mall, Alger
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              L'espace de coworking
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-200">
                nouvelle génération
              </span>
            </h1>
            <p className="text-xl text-white/85 mb-8 leading-relaxed max-w-2xl">
              Coffice est un accélérateur-incubateur de startups dédié à
              l'écosystème entrepreneurial algérien. Plus qu'un espace de travail,
              c'est un lieu où les idées prennent vie.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/espaces"
                className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
              >
                Découvrir nos espaces
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a
                href="tel:+21323804924"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-all"
              >
                <Phone className="w-5 h-5 mr-2" />
                Planifier une visite
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                Notre histoire
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 leading-tight">
                Fondé en 2024, conçu pour
                <span className="text-accent"> l'avenir</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Coffice est né d'une conviction simple : les entrepreneurs
                algériens méritent un environnement de travail à la hauteur de
                leurs ambitions. Situé au c&#339;ur du{" "}
                <strong>Centre Commercial Mohammadia Mall</strong>, notre espace
                de <strong>200m²</strong> est conçu pour stimuler l'innovation.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Avec 2 box de 4 places, 1 box de 3 places, un open space de 12
                postes (dont 2 stations informatiques), une salle de réunion
                avec terrasse et une kitchenette équipée, Coffice offre tout ce
                dont vous avez besoin pour réussir.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {amenities.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <item.icon className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src={IMAGES.spaces.coworking.url}
                alt={IMAGES.spaces.coworking.alt}
                className="rounded-2xl shadow-2xl w-full"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-5 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">4.9/5</div>
                    <div className="text-sm text-gray-500">
                      Satisfaction membres
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Ce qui nous anime
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Nos valeurs fondamentales
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident chacune de nos décisions et façonnent
              l'expérience Coffice
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100"
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-14 h-14 ${value.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <value.icon className={`w-7 h-7 ${value.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partenariat Novihost */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
              Partenariat stratégique
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Coffice x Novihost
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un écosystème complet pour les entrepreneurs : espace physique +
              présence digitale
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-12 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-6 mb-8">
                  <img
                    src="/logo_coffice.png"
                    alt="Coffice"
                    className="h-12 object-contain"
                  />
                  <div className="text-3xl font-light text-gray-300">x</div>
                  <img
                    src="/logo_novihost.png"
                    alt="Novihost"
                    className="h-14 object-contain"
                  />
                </div>

                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Notre partenariat avec <strong>Novihost</strong>, leader de
                  l'hébergement web en Algérie depuis 1999, crée
                  l'écosystème idéal pour les entrepreneurs : un espace
                  physique professionnel couplé à une présence digitale
                  performante.
                </p>

                <div className="space-y-4">
                  {[
                    "Pack Croisé : Domiciliation + Coworking + Web Hosting",
                    "Codes Promo Mutuels : Avantages exclusifs pour nos membres",
                    "Support 24/7 : Assistance technique et administrative",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {[
                  {
                    icon: Server,
                    title: "Hébergement Premium",
                    desc: "Infrastructure haute performance pour votre site web",
                  },
                  {
                    icon: Globe,
                    title: "Domaine .DZ inclus",
                    desc: "Un nom de domaine algérien pour votre entreprise",
                  },
                  {
                    icon: Mail,
                    title: "10 Emails Pro",
                    desc: "Adresses email @votreentreprise.dz",
                  },
                  {
                    icon: Shield,
                    title: "Sécurité Renforcée",
                    desc: "SSL, sauvegardes auto et protection anti-DDoS",
                  },
                ].map((benefit) => (
                  <div
                    key={benefit.title}
                    className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Localisation */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                Nous trouver
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">
                Un emplacement stratégique
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Adresse</h3>
                    <p className="text-gray-600">
                      Centre Commercial Mohammadia Mall
                      <br />
                      4ème étage, Bureau 1178
                      <br />
                      Mohammadia, Alger
                    </p>
                    <p className="text-sm text-accent mt-2 font-medium">
                      CNRC et CASNOS dans le même bâtiment
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">
                      Téléphone
                    </h3>
                    <p className="text-gray-600">+213 23 804 924</p>
                    <p className="text-gray-600">+213 795 38 01 24</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-warm/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-warm" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Email</h3>
                    <p className="text-gray-600">desk@coffice.dz</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-rose/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-rose" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">
                      Horaires
                    </h3>
                    <p className="text-gray-600">
                      Dimanche - Jeudi : 8h30 - 18h30
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <img
                  src={IMAGES.spaces.meeting.url}
                  alt={IMAGES.spaces.meeting.alt}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
                <div className="bg-white p-8 text-center">
                  <h3 className="text-xl font-bold text-primary mb-3">
                    Centre Commercial Mohammadia Mall
                  </h3>
                  <p className="text-gray-600 mb-6">
                    4ème étage, Bureau 1178 - Mohammadia, Alger
                  </p>
                  <a
                    href="https://maps.app.goo.gl/LxFBWABN189E8v6b6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-md"
                  >
                    <MapPin className="w-5 h-5" />
                    Voir sur Google Maps
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partenaires Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Globe className="w-4 h-4" />
              Partenaires Coffice
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              L'écosystème qui vous accompagne
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Nos partenaires partagent la même vision : accompagner les entrepreneurs algériens vers le succès.
            </p>
          </motion.div>

          {/* Come to Bladi */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
          >
            {/* Header partenaire */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <a href="https://cometobladi.com/" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <img
                    src="https://cometobladi.com/wp-content/uploads/2025/12/Logo-brute-Cropped.jpeg"
                    alt="Come to Bladi"
                    className="h-16 w-auto rounded-xl shadow-sm object-contain bg-white p-1"
                    loading="lazy"
                  />
                </a>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">Come to Bladi</h3>
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Partenaire officiel
                    </span>
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
                    Le guide de référence pour s'installer, travailler et entreprendre en Algérie. Des ressources pratiques et un accompagnement personnalisé pour les entrepreneurs et les membres de la diaspora qui veulent réussir en Algérie.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-8">
              {/* Code promo */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-gradient-to-r from-accent/10 to-emerald-50 border border-accent/20 rounded-2xl mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Code promo exclusif membres Coffice</p>
                    <p className="text-xs text-gray-500">Valable sur tous les services et ebooks Come to Bladi</p>
                  </div>
                </div>
                <div className="sm:ml-auto flex items-center gap-3">
                  <code className="text-xl font-bold tracking-widest text-accent bg-white border-2 border-accent/30 px-5 py-2 rounded-xl select-all">
                    COFFICE10
                  </code>
                  <span className="text-sm text-gray-500 font-medium">-10%</span>
                </div>
              </div>

              {/* Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* eBooks */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    eBooks
                  </h4>
                  <div className="space-y-3">
                    {[
                      { title: "S'installer à Alger – Le guide complet", desc: "Quartiers, logement, démarches administratives : tout ce qu'il faut savoir avant d'arriver." },
                      { title: "Entreprendre en Algérie", desc: "Statuts juridiques, démarches, financement et pièges à éviter pour lancer votre business." },
                      { title: "30 idées de business qui marchent", desc: "30 opportunités concrètes adaptées au marché algérien avec analyse de viabilité." },
                      { title: "7 jours à Alger – Itinéraire optimisé", desc: "Le meilleur programme pour découvrir Alger et ses opportunités en une semaine." },
                    ].map((book) => (
                      <a
                        key={book.title}
                        href="https://cometobladi.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                      >
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                          <span className="text-emerald-700 text-xs font-bold">PDF</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{book.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{book.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Accompagnements */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Accompagnements
                  </h4>
                  <div className="space-y-3">
                    {[
                      { title: "Bladi Project", price: "39€", desc: "Plan d'action business personnalisé : analyse de viabilité, budget, démarches et étapes hebdomadaires." },
                      { title: "Appel Découverte & Orientation", price: "45€", desc: "Consultation stratégique pour clarifier vos objectifs et obtenir des insights marché." },
                      { title: "Accompagnement Installation", price: null, desc: "Aide au choix de quartier, recherche de logement et guidance administrative." },
                      { title: "Accompagnement Entrepreneuriat", price: null, desc: "De l'idée à la création : étude de marché, statut juridique et networking." },
                      { title: "Offre 360°", price: null, desc: "Support A–Z pour les investisseurs à distance : de la prospection à l'opérationnel." },
                    ].map((service) => (
                      <a
                        key={service.title}
                        href="https://cometobladi.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                      >
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal-200 transition-colors">
                          <Zap className="w-4 h-4 text-teal-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{service.title}</p>
                            {service.price && (
                              <span className="text-xs font-bold text-accent flex-shrink-0">{service.price}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{service.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Utilisez le code <span className="font-bold text-accent">COFFICE10</span> lors du paiement sur cometobladi.com
                </p>
                <a
                  href="https://cometobladi.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all shadow-sm"
                >
                  Visiter Come to Bladi
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
              Prêt à nous rencontrer ?
            </h2>
            <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto">
              Planifiez une visite de nos espaces et découvrez pourquoi Coffice
              est le choix idéal pour votre activité professionnelle
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+21323804924"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl"
              >
                <Phone className="w-5 h-5 mr-2" />
                Planifier une visite
              </a>
              <a
                href="https://wa.me/213795380124"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-all"
              >
                <Mail className="w-5 h-5 mr-2" />
                Nous contacter
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
