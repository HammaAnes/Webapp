import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Headphones,
  Gift,
  ArrowRight,
  Check,
  Coffee,
  Presentation,
  Mic,
  Wifi,
  Clock,
  Shield,
  Target,
  Zap,
  Star,
  MapPin,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { IMAGES } from "../config/images";

const Home = () => {
  useSEO();

  const features = [
    {
      icon: Wifi,
      title: "WiFi Haut Débit",
      description:
        "Connexion internet performante pour une productivité maximale",
    },
    {
      icon: Coffee,
      title: "Café & Collations",
      description: "Café, thé et collations disponibles pour votre confort",
    },
    {
      icon: Clock,
      title: "Accès Flexible",
      description: "Horaires étendus et formules adaptées à votre rythme",
    },
    {
      icon: Shield,
      title: "Sécurisé 24/7",
      description: "Sécurité assurée et casiers personnels disponibles",
    },
    {
      icon: Users,
      title: "Communauté Active",
      description: "Réseau d'entrepreneurs et opportunités de collaboration",
    },
    {
      icon: Target,
      title: "Support Dédié",
      description: "Équipe disponible pour vous accompagner au quotidien",
    },
  ];

  const testimonials = [
    {
      name: "Karim B.",
      role: "CEO, StartupTech",
      content:
        "Coffice a transformé ma manière de travailler. L'ambiance, les équipements et la communauté sont exceptionnels!",
      rating: 5,
    },
    {
      name: "Yasmine M.",
      role: "Designer Freelance",
      content:
        "Enfin un espace de coworking moderne à Alger! L'ambiance et les équipements sont parfaits pour mes projets.",
      rating: 5,
    },
    {
      name: "Sofiane K.",
      role: "Consultant",
      content:
        "La flexibilité des formules et la qualité du service font de Coffice mon bureau préféré.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img
            src={IMAGES.backgrounds.hero}
            alt={IMAGES.spaces.coworking.alt}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
          >
            <span className="text-white font-medium flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Centre Commercial Mohammadia Mall - Alger
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6"
          >
            Bienvenue chez
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-200 to-white">
              COFFICE
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            L'espace de coworking nouvelle génération qui redéfinit votre
            manière de travailler. Bureaux flexibles, équipements premium,
            communauté dynamique.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/espaces"
              className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              Réserver maintenant
            </Link>
            <Link
              to="/espaces"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-primary transition-all"
            >
              Découvrir nos espaces
            </Link>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">24</div>
              <div className="text-white/70 text-sm">Postes open space</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">3</div>
              <div className="text-white/70 text-sm">Private booths</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">24/7</div>
              <div className="text-white/70 text-sm">Accès Premium</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">200m²</div>
              <div className="text-white/70 text-sm">Surface totale</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center bg-accent/10 text-accent rounded-full px-4 py-2 mb-4"
            >
              <Zap className="w-4 h-4 mr-2" />
              <span className="font-semibold">Pourquoi choisir Coffice?</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
              Tout pour votre réussite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des équipements de pointe et des services premium pour booster
              votre productivité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-teal rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
              Nos Espaces & Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des solutions adaptées à chaque besoin professionnel
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Coworking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card overflow-hidden hover:shadow-2xl transition-all flex flex-col"
            >
              <div className="h-64 relative overflow-hidden">
                <img
                  src={IMAGES.spaces.coworking.url}
                  alt={IMAGES.spaces.coworking.alt}
                  className="object-cover h-full w-full hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <Coffee className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-2xl font-display font-bold text-primary mb-3">
                  Espaces de Coworking
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  Travaillez dans un environnement stimulant avec tous les
                  équipements nécessaires
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Zone principale avec 12 postes
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Box équipe & Box individuel
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    WiFi haut débit & Café disponible
                  </li>
                </ul>
                <div className="pt-4 border-t">
                  <p className="text-2xl font-bold text-accent mb-3">
                    À partir de 1 200 DA TTC/jour
                  </p>
                  <Link
                    to="/espaces"
                    className="btn-primary w-full text-center"
                  >
                    Découvrir
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Private Booths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card overflow-hidden hover:shadow-2xl transition-all flex flex-col"
            >
              <div className="h-64 relative overflow-hidden">
                <img
                  src={IMAGES.booths.atlas.url}
                  alt={IMAGES.booths.atlas.alt}
                  className="object-cover h-full w-full hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-accent/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <Building2 className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-2xl font-display font-bold text-primary mb-3">
                  Private Booths
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  Bureaux privés équipés pour une concentration maximale
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Box de 3 ou 4 places
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Espace fermé & climatisé
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Bureau, chaises & rangement
                  </li>
                </ul>
                <div className="pt-4 border-t">
                  <p className="text-2xl font-bold text-accent mb-3">
                    À partir de 1 500 DA TTC/jour
                  </p>
                  <Link
                    to="/espaces"
                    className="btn-primary w-full text-center"
                  >
                    Réserver
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Salles de réunion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card overflow-hidden hover:shadow-2xl transition-all flex flex-col"
            >
              <div className="h-64 relative overflow-hidden">
                <img
                  src={IMAGES.spaces.meeting.url}
                  alt={IMAGES.spaces.meeting.alt}
                  className="object-cover h-full w-full hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <Presentation className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-2xl font-display font-bold text-primary mb-3">
                  Salles de Réunion
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  Organisez vos réunions dans des espaces professionnels équipés
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Capacité jusqu'à 12 personnes
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    TV 75" & Tableau blanc
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
                    Terrasse privée
                  </li>
                </ul>
                <div className="pt-4 border-t">
                  <p className="text-2xl font-bold text-teal mb-3">
                    2 500 DA TTC/h
                  </p>
                  <Link
                    to="/espaces"
                    className="btn-primary w-full text-center"
                  >
                    Réserver
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
              Ce que disent nos membres
            </h2>
            <p className="text-xl text-gray-600">
              Rejoignez une communauté satisfaite et dynamique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={`star-${testimonial.name}-${i}`}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-teal rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-accent to-teal text-white relative overflow-hidden">
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
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Prêt à rejoindre Coffice ?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Réservez votre espace dès maintenant et profitez d'une offre de
              lancement exceptionnelle
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/espaces"
                className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
              >
                Voir les tarifs
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <a
                href="tel:+213795380124"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-primary transition-all"
              >
                <Phone className="w-5 h-5 mr-2 inline" />
                Nous appeler
              </a>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16 border-t border-white/20">
              <div className="flex flex-col items-center">
                <MapPin className="w-8 h-8 mb-3" />
                <p className="text-white/90 text-sm">
                  Centre Commercial Mohammadia Mall
                  <br />
                  4ème étage, Bureau 1178
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Phone className="w-8 h-8 mb-3" />
                <p className="text-white/90 text-sm">
                  +213 23 804 924
                  <br />
                  Dim - Jeu: 09h - 17h
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Mail className="w-8 h-8 mb-3" />
                <p className="text-white/90 text-sm">desk@coffice.dz</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
