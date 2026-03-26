import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Users,
  Building,
  FileText,
  BarChart3,
  Tag,
  Gift,
  CreditCard,
  Settings,
  Clock,
  Wallet,
  CircleUser,
  Plus,
  ArrowRight,
  Keyboard,
} from "lucide-react";
import { useAppStore } from "../../store/store";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewReservation?: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNewReservation }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { reservations, users } = useAppStore();

  const navigate_and_close = (path: string) => {
    navigate(path);
    onClose();
  };

  const commands: Command[] = useMemo(() => [
    {
      id: "nav-dashboard",
      label: "Tableau de bord",
      description: "Opérations du jour — check-in / check-out",
      icon: Clock,
      action: () => navigate_and_close("/app"),
      category: "Navigation",
      keywords: ["today", "aujourdhui", "operations", "checkin", "checkout", "accueil"],
    },
    {
      id: "nav-caisse",
      label: "Caisse",
      description: "Journal des paiements",
      icon: Wallet,
      action: () => navigate_and_close("/app/admin/caisse"),
      category: "Navigation",
      keywords: ["cash", "paiement", "transaction", "recette"],
    },
    {
      id: "nav-reservations",
      label: "Réservations",
      description: "Gérer toutes les réservations",
      icon: Calendar,
      action: () => navigate_and_close("/app/admin/reservations"),
      category: "Navigation",
      keywords: ["booking", "reservation", "calendrier"],
    },
    {
      id: "nav-espaces",
      label: "Espaces",
      description: "Gérer les espaces et salles",
      icon: Building,
      action: () => navigate_and_close("/app/admin/spaces"),
      category: "Navigation",
      keywords: ["room", "salle", "bureau", "coworking"],
    },
    {
      id: "nav-users",
      label: "Utilisateurs",
      description: "Gérer les comptes utilisateurs",
      icon: Users,
      action: () => navigate_and_close("/app/admin/users"),
      category: "Navigation",
      keywords: ["membre", "client", "compte"],
    },
    {
      id: "nav-contacts",
      label: "Contacts CRM",
      description: "Gérer les contacts et prospects",
      icon: CircleUser,
      action: () => navigate_and_close("/app/admin/contacts"),
      category: "Navigation",
      keywords: ["crm", "prospect", "lead"],
    },
    {
      id: "nav-domiciliations",
      label: "Domiciliations",
      description: "Gérer les demandes de domiciliation",
      icon: FileText,
      action: () => navigate_and_close("/app/admin/domiciliations"),
      category: "Navigation",
      keywords: ["dossier", "entreprise", "adresse"],
    },
    {
      id: "nav-abonnements",
      label: "Abonnements",
      description: "Plans et souscriptions",
      icon: CreditCard,
      action: () => navigate_and_close("/app/admin/abonnements"),
      category: "Navigation",
      keywords: ["plan", "subscription", "mensuel"],
    },
    {
      id: "nav-codes-promo",
      label: "Codes Promo",
      description: "Gérer les codes de réduction",
      icon: Tag,
      action: () => navigate_and_close("/app/admin/codes-promo"),
      category: "Navigation",
      keywords: ["discount", "reduction", "code"],
    },
    {
      id: "nav-parrainages",
      label: "Parrainages",
      description: "Suivre les parrainages",
      icon: Gift,
      action: () => navigate_and_close("/app/admin/parrainages"),
      category: "Navigation",
      keywords: ["referral", "parrain"],
    },
    {
      id: "nav-rapports",
      label: "Rapports",
      description: "Statistiques et analyses",
      icon: BarChart3,
      action: () => navigate_and_close("/app/admin/reports"),
      category: "Navigation",
      keywords: ["stats", "analytics", "revenus", "chiffres"],
    },
    {
      id: "nav-settings",
      label: "Paramètres",
      description: "Configuration du système",
      icon: Settings,
      action: () => navigate_and_close("/app/admin/settings"),
      category: "Navigation",
      keywords: ["config", "systeme", "email"],
    },
    {
      id: "action-new-reservation",
      label: "Nouvelle réservation",
      description: "Créer une réservation rapidement",
      icon: Plus,
      action: () => {
        onClose();
        if (onNewReservation) onNewReservation();
        else navigate_and_close("/app/admin/reservations");
      },
      category: "Actions rapides",
      keywords: ["create", "booking", "reserver", "nouveau"],
    },
    {
      id: "action-new-reservation-today",
      label: "Réservation pour aujourd'hui",
      description: "Créer une réservation pour ce jour",
      icon: Calendar,
      action: () => {
        onClose();
        if (onNewReservation) onNewReservation();
        else navigate_and_close("/app/admin/reservations");
      },
      category: "Actions rapides",
      keywords: ["today", "maintenant", "walk-in"],
    },
  ], [navigate, onClose, onNewReservation]);

  const pendingCount = useMemo(() => {
    return reservations.filter(r => r.statut === "en_attente").length;
  }, [reservations]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const flatCommands = useMemo(() => filteredCommands, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatCommands[selectedIndex]?.action();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, flatCommands, selectedIndex]);

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200"
          >
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Chercher une page, une action..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-base text-gray-900 bg-transparent outline-none placeholder-gray-400"
              />
              {pendingCount > 0 && !query && (
                <span className="flex-shrink-0 ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  {pendingCount} en attente
                </span>
              )}
              <kbd className="ml-3 flex-shrink-0 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded-md font-mono">Esc</kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto py-2">
              {flatCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Aucune commande trouvée
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {category}
                    </div>
                    {cmds.map(cmd => {
                      const idx = globalIndex++;
                      const Icon = cmd.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected ? "bg-sky-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-accent/10" : "bg-gray-100"
                          }`}>
                            <Icon className={`w-4 h-4 ${isSelected ? "text-accent" : "text-gray-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-gray-400 truncate">{cmd.description}</div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Naviguer</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑↓</kbd>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>Sélectionner</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↵</kbd>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">⌘K</kbd>
                <span>pour ouvrir</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
