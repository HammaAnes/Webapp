import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Calendar, CreditCard, Users, Settings, LogOut, Menu, X, User, Building, FileText, BarChart3, RefreshCw, Tag, Gift, Bell, Clock, ChevronDown, Wallet, CircleUser as UserCircle, Search, Plus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import NotificationCenter from "../ui/NotificationCenter";
import CommandPalette from "../admin/CommandPalette";
import toast from "react-hot-toast";
import Logo from "../Logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loadUser } = useAuthStore();
  const {
    loadEspaces,
    loadReservations,
    loadAbonnements,
    loadDemandesDomiciliation,
    reservations,
  } = useAppStore();

  useEffect(() => {
    if (user?.role === "admin") {
      const groups: Record<string, boolean> = {};
      adminGroups.forEach((group) => {
        const isGroupActive = group.items.some((item) => isActive(item.href));
        if (isGroupActive) {
          groups[group.label] = true;
        }
      });
      setExpandedGroups((prev) => ({ ...prev, ...groups }));
    }
  }, [location.pathname, user?.role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (user?.role === "admin") {
          setCommandPaletteOpen(prev => !prev);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [user?.role]);

  const pendingReservationsCount = reservations.filter(r => r.statut === "en_attente").length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadUser(),
        loadEspaces(),
        loadReservations(),
        loadAbonnements(),
        loadDemandesDomiciliation(),
      ]);
      toast.success("Données actualisées");
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/connexion", { replace: true });
    } catch {
      navigate("/connexion", { replace: true });
    }
  };

  const userNavigation = useMemo<NavItem[]>(() => [
    { name: "Tableau de bord", href: "/app", icon: Home },
    { name: "Réservations", href: "/app/reservations", icon: Calendar },
    { name: "Notifications", href: "/app/notifications", icon: Bell },
    { name: "Mon Espace Pro", href: "/app/mon-espace", icon: Building },
    { name: "Abonnements", href: "/app/abonnements", icon: CreditCard },
    { name: "Parrainage", href: "/app/parrainage", icon: Gift },
    { name: "Profil", href: "/app/profil", icon: User },
  ], []);

  const adminGroups = useMemo<NavGroup[]>(() => [
    {
      label: "Opérations",
      items: [
        { name: "Aujourd'hui", href: "/app/admin/aujourdhui", icon: Clock },
        { name: "Caisse", href: "/app/admin/caisse", icon: Wallet },
      ],
    },
    {
      label: "Réservations & Espaces",
      items: [
        { name: "Réservations", href: "/app/admin/reservations", icon: Calendar },
        { name: "Espaces", href: "/app/admin/spaces", icon: Building },
      ],
    },
    {
      label: "Membres & Domiciliation",
      items: [
        { name: "Utilisateurs", href: "/app/admin/users", icon: Users },
        { name: "Contacts CRM", href: "/app/admin/contacts", icon: UserCircle },
        { name: "Domiciliations", href: "/app/admin/domiciliations", icon: FileText },
      ],
    },
    {
      label: "Marketing & Promotions",
      items: [
        { name: "Codes Promo", href: "/app/admin/codes-promo", icon: Tag },
        { name: "Parrainages", href: "/app/admin/parrainages", icon: Gift },
      ],
    },
    {
      label: "Finances & Analyse",
      items: [
        { name: "Abonnements", href: "/app/admin/abonnements", icon: CreditCard },
        { name: "Rapports", href: "/app/admin/reports", icon: BarChart3 },
        { name: "Paramètres", href: "/app/admin/settings", icon: Settings },
      ],
    },
  ], []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Link to="/connexion" className="btn-primary">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom?.charAt(0) || ""}${nom?.charAt(0) || ""}`.toUpperCase();
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`
          flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
          ${
            active
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
      >
        <Icon className="w-4.5 h-4.5 mr-3 flex-shrink-0" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <Link to="/" className="flex items-center">
              <Logo className="h-9 w-auto" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {user.role === "admin" ? (
              <>
                <Link
                  to="/app"
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-2
                    ${
                      location.pathname === "/app"
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <Home className="w-4.5 h-4.5 mr-3 flex-shrink-0" />
                  Tableau de bord
                </Link>

                <Link
                  to="/app/notifications"
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-3
                    ${
                      isActive("/app/notifications")
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <Bell className="w-4.5 h-4.5 mr-3 flex-shrink-0" />
                  Notifications
                </Link>

                {adminGroups.map((group) => {
                  const isExpanded = expandedGroups[group.label] ?? false;
                  const hasActiveItem = group.items.some((item) => isActive(item.href));

                  return (
                    <div key={group.label} className="mb-1">
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors
                          ${hasActiveItem ? "text-primary bg-primary/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}
                        `}
                      >
                        <span>{group.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-1 pt-1 space-y-0.5">
                              {group.items.map(renderNavItem)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </>
            ) : (
              userNavigation.map(renderNavItem)
            )}
          </nav>

          <div className="px-3 py-4 border-t border-gray-100">
            {user.role === "admin" && (
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 mb-3 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>Recherche rapide</span>
                </div>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">⌘K</kbd>
              </button>
            )}
            <div className="flex items-center space-x-3 mb-3 px-2">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {getInitials(user.prenom, user.nom)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.prenom || ""} {user.nom || ""}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              {user.role === "admin" && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden md:flex items-center text-sm text-gray-500">
                <span>Coffice</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">
                  {user.role === "admin" ? "Administration" : "Espace Client"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <>
                  <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    title="Recherche rapide (⌘K)"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden lg:inline text-xs">Recherche rapide</span>
                    <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded font-mono text-gray-400">⌘K</kbd>
                  </button>
                  <Link
                    to="/app/admin/reservations"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors font-medium"
                    title="Nouvelle réservation"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden lg:inline">Réservation</span>
                  </Link>
                  {pendingReservationsCount > 0 && (
                    <Link
                      to="/app/admin/reservations"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-medium"
                      title={`${pendingReservationsCount} réservation(s) en attente`}
                    >
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <span className="hidden lg:inline">{pendingReservationsCount} en attente</span>
                      <span className="lg:hidden">{pendingReservationsCount}</span>
                    </Link>
                  )}
                </>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Actualiser les données"
              >
                <RefreshCw
                  className={`w-4.5 h-4.5 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <NotificationCenter />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>

      {user.role === "admin" && (
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNewReservation={() => navigate("/app/admin/reservations")}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
