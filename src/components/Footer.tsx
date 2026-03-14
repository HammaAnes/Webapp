import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <Logo variant="light" className="h-12 w-auto" />
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Coffice est le premier espace de coworking nouvelle génération à
              Alger, conçu pour répondre aux besoins des entrepreneurs et
              freelances modernes.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://www.instagram.com/coffice_dz/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white hover:text-primary transition-all duration-200 active:scale-95"
                aria-label="Suivez-nous sur Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/showcase/cofficedz/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white hover:text-primary transition-all duration-200 active:scale-95"
                aria-label="Suivez-nous sur LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">
              Liens rapides
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block duration-200"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/espaces"
                  className="text-gray-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block duration-200"
                >
                  Espaces & Tarifs
                </Link>
              </li>
              <li>
                <Link
                  to="/domiciliation"
                  className="text-gray-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block duration-200"
                >
                  Domiciliation
                </Link>
              </li>
              <li>
                <Link
                  to="/a-propos"
                  className="text-gray-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block duration-200"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-gray-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block duration-200"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/mentions-legales"
                  className="text-gray-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block duration-200"
                >
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Centre Commercial Mohammadia Mall
                  <br />
                  4ème étage, Bureau 1178
                  <br />
                  Mohammadia, Alger
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:+21323804924" className="text-gray-300 text-sm hover:text-white transition-colors">+213 23 804 924</a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:+213795380124" className="text-gray-300 text-sm hover:text-white transition-colors">+213 795 38 01 24</a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a
                  href="https://wa.me/213795380124"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  +213 795 38 01 24 (WhatsApp)
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href="mailto:desk@coffice.dz" className="text-gray-300 text-sm hover:text-white transition-colors">desk@coffice.dz</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Coffice. Tous droits r\u00e9serv\u00e9s.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
