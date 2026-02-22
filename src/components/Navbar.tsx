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
          ? "bg-white/98 backdrop-blur-md shadow-lg"
          : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center group">
            <Logo className="h-16 w-auto transition-transform group-hover:scale-105" />
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 font-medium transition-all ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
              className="ml-2 px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              title="Nous contacter sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>
            <Link
              to="/app"
              className="ml-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              Espace Client
            </Link>
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
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
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/app"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 bg-primary text-white rounded-lg text-center font-medium"
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
