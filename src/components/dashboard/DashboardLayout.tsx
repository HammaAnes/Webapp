import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Calendar, CreditCard, Users, Settings, LogOut, Menu, X,
  User, Building, FileText, BarChart3, RefreshCw, Tag, Gift, Bell,
  Wallet, CircleUser as UserCircle, Search, Plus, Mail,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import NotificationCenter from "../ui/NotificationCenter";
import CommandPalette from "../admin/CommandPalette";
import toast from "react-hot-toast";
import Logo from "../Logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

interface NavSection {
  label?: string; // undefined = no separator
  items: NavItem[];
}

// ─── Admin navigation ────────────────────────────────────────────────────────
const ADMIN_SECTIONS: NavSection[] = [
  {
    items: [
      { name: "Tableau de bord", href: "/app", icon: Home },
    ],
  },
  {
    label: "Quotidien",
    items: [
      { name: "Caisse", href: "/app/admin/caisse", icon: Wallet },
    ],
  },
  {
    label: "Réservations",
    items: [
      { name: "Réservations", href: "/app/admin/reservations", icon: Calendar },
      { name: "Espaces",      href: "/app/admin/spaces",       icon: Building },
    ],
  },
  {
    label: "Membres",
    items: [
      { name: "Utilisateurs",  href: "/app/admin/users",       icon: Users     },
      { name: "Contacts CRM",  href: "/app/admin/contacts",    icon: UserCircle},
      { name: "Abonnements",   href: "/app/admin/abonnements", icon: CreditCard},
    ],
  },
  {
    label: "Services",
    items: [
      { name: "Domiciliations", href: "/app/admin/domiciliations", icon: FileText },
      { name: "Courrier",       href: "/app/admin/courrier",        icon: Mail     },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Codes Promo", href: "/app/admin/codes-promo", icon: Tag  },
      { name: "Parrainages", href: "/app/admin/parrainages", icon: Gift },
    ],
  },
  {
    label: "Analyse",
    items: [
      { name: "Rapports", href: "/app/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Système",
    items: [
      { name: "Emails",      href: "/app/admin/email",    icon: Mail     },
      { name: "Paramètres",  href: "/app/admin/settings", icon: Settings },
    ],
  },
];

// ─── Client navigation ───────────────────────────────────────────────────────
const USER_NAV: NavItem[] = [
  { name: "Tableau de bord", href: "/app",                icon: Home       },
  { name: "Réservations",    href: "/app/reservations",   icon: Calendar   },
  { name: "Notifications",   href: "/app/notifications",  icon: Bell       },
  { name: "Mon Espace Pro",  href: "/app/mon-espace",     icon: Building   },
  { name: "Abonnements",     href: "/app/abonnements",    icon: CreditCard },
  { name: "Parrainage",      href: "/app/parrainage",     icon: Gift       },
  { name: "Profil",          href: "/app/profil",         icon: User       },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loadUser } = useAuthStore();
  const { initializeData, loadEspaces, loadReservations, loadAbonnements, loadDemandesDomiciliation, reservations } = useAppStore();

  const pendingCount = reservations.filter(r => r.statut === "en_attente").length;

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (user?.role === "admin") setCommandPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [user?.role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadUser(), loadEspaces(), loadReservations(), loadAbonnements(), loadDemandesDomiciliation()]);
      toast.success("Données actualisées");
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch { /* noop */ }
    navigate("/connexion", { replace: true });
  };

  const isActive = (href: string) =>
    href === "/app" ? location.pathname === "/app" : location.pathname.startsWith(href);

  const getInitials = (prenom: string, nom: string) =>
    `${prenom?.charAt(0) ?? ""}${nom?.charAt(0) ?? ""}`.toUpperCase();

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-amber-500 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-400"}`} />
        {item.name}
      </Link>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Link to="/connexion" className="btn-primary">Se connecter</Link>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <Link to="/" className="flex items-center">
          <Logo className="h-9 w-auto" />
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-md hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {user.role === "admin" ? (
          ADMIN_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-0.5">
            {USER_NAV.map(item => <NavLink key={item.href} item={item} />)}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-2">
        {user.role === "admin" && (
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Recherche rapide</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">⌘K</kbd>
          </button>
        )}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{getInitials(user.prenom, user.nom)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.prenom} {user.nom}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
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
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-gray-100">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden md:flex items-center text-sm text-gray-500 gap-2">
                <span>Coffice</span>
                <span>/</span>
                <span className="font-medium text-gray-900">
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
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden lg:inline text-xs">Recherche rapide</span>
                    <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded font-mono text-gray-400">⌘K</kbd>
                  </button>

                  <Link
                    to="/app/admin/reservations"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden lg:inline">Réservation</span>
                  </Link>

                  {pendingCount > 0 && (
                    <Link
                      to="/app/admin/reservations"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-medium"
                    >
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <span className="hidden lg:inline">{pendingCount} en attente</span>
                      <span className="lg:hidden">{pendingCount}</span>
                    </Link>
                  )}
                </>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
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
