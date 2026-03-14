import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Logo from "./Logo";
import { BLOG_ENABLED } from "../data/blogArticles";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = useMemo(() => {
    const links = [
      { name: t("nav.home"), path: "/" },
      { name: t("nav.spaces"), path: "/espaces" },
      { name: t("nav.domiciliation"), path: "/domiciliation" },
      { name: t("nav.about"), path: "/a-propos" },
    ];
    if (BLOG_ENABLED) {
      links.push({ name: "Blog", path: "/blog" });
    }
    return links;
  }, [t]);

  const isActive = (path: string) => {
    if (path === "/espaces") {
      return (
        location.pathname === "/espaces" || location.pathname === "/tarifs"
      );
    }
    if (path === "/blog") {
      return location.pathname.startsWith("/blog");
    }
    return location.pathname === path;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100"
          : "bg-white/90 backdrop-blur-sm shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <Link to="/" className="flex items-center group" aria-label="Retour à l'accueil">
            <Logo className="h-14 w-auto transition-transform duration-200 group-hover:scale-105" />
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg ${
                  isActive(link.path)
                    ? "text-primary bg-primary/5"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            <a
              href="https://wa.me/213795380124"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95"
              title="Nous contacter sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>
            <Link
              to="/app"
              className="ml-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
            >
              Espace Client
            </Link>
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors active:bg-gray-200"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 active:scale-95 ${
                    isActive(link.path)
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href="https://wa.me/213795380124"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 bg-green-600 text-white rounded-lg text-center font-semibold text-sm hover:bg-green-700 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                WhatsApp
              </a>
              <Link
                to="/app"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 bg-primary text-white rounded-lg text-center font-semibold text-sm hover:bg-primary/90 transition-all duration-200 active:scale-95"
              >
                Espace Client
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
