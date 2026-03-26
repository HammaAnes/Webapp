import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Shield,
  CreditCard,
  TrendingUp,
  Package,
  Home,
  Receipt,
  Gift,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Hash,
  Upload,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Skeleton from "../../../components/ui/Skeleton";
import toast from "react-hot-toast";
import { formatDate, formatTime, formatCurrency } from "../../../utils/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile360User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profession?: string;
  entreprise?: string;
  role: string;
  statut?: string;
  created_at: string;
  derniere_connexion?: string;
  carte_identite_url?: string;
  code_parrainage?: string;
  credit?: number;
  raison_sociale?: string;
  wilaya?: string;
}

interface Reservation {
  id: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  montant_total: number;
  type_reservation: string;
  participants: number;
  espace_nom?: string;
  espace_type?: string;
  abonnement_couvert: number;
  created_at: string;
}

interface Abonnement {
  id: string;
  statut: string;
  date_debut?: string;
  date_fin?: string;
  abonnement_nom?: string;
  prix?: number;
  duree_mois?: number;
  created_at: string;
}

interface AbonnementActif {
  id: string;
  abonnement_nom?: string;
  date_fin?: string;
  prix?: number;
}

interface Domiciliation {
  id: string;
  raison_sociale?: string;
  statut: string;
  date_debut?: string;
  date_fin?: string;
  montant_mensuel?: number;
  numero_bureau?: number;
  created_at: string;
}

interface DomiciliationActive {
  id: string;
  raison_sociale?: string;
  date_fin?: string;
  montant_mensuel?: number;
  numero_bureau?: number;
}

interface TransactionCaisse {
  id: string;
  type_transaction: string;
  montant: number;
  statut: string;
  mode_paiement: string;
  numero_recu: string;
  notes?: string;
  reference_paiement?: string;
  created_at: string;
  encaisse_par_prenom?: string;
  encaisse_par_nom?: string;
}

interface CodePromo {
  id: string;
  code?: string;
  montant_reduction: number;
  created_at: string;
}

interface Parrainage {
  id: string;
  statut: string;
  bonus_parrain?: number;
  filleul_prenom?: string;
  filleul_nom?: string;
  created_at: string;
}

interface Stats {
  total_depense: number;
  total_encaisse_caisse: number;
  nb_reservations: number;
  nb_presences_abonnement: number;
  nb_annulations: number;
  total_reductions: number;
  nb_parrainages: number;
  has_abonnement_actif: boolean;
  has_domiciliation_active: boolean;
  anciennete_jours: number;
}

interface Profile360 {
  user: Profile360User;
  reservations: Reservation[];
  abonnements: Abonnement[];
  abonnement_actif: AbonnementActif | null;
  domiciliations: Domiciliation[];
  domiciliation_active: DomiciliationActive | null;
  transactions_caisse: TransactionCaisse[];
  codes_promo: CodePromo[];
  parrainages: Parrainage[];
  stats: Stats;
}

type TabId = "apercu" | "reservations" | "abonnement" | "domiciliation" | "finances";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(prenom: string, nom: string): string {
  return ((prenom[0] ?? "") + (nom[0] ?? "")).toUpperCase();
}

function getReservationStatutBadge(statut: string): { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
  switch (statut.toLowerCase()) {
    case "confirmee":
    case "confirmé":
    case "validee":
    case "validé":
      return { variant: "success", label: "Confirmée" };
    case "en_attente":
    case "pending":
      return { variant: "warning", label: "En attente" };
    case "annulee":
    case "annulé":
    case "annulée":
      return { variant: "danger", label: "Annulée" };
    case "terminee":
    case "terminé":
    case "terminée":
      return { variant: "neutral", label: "Terminée" };
    default:
      return { variant: "info", label: statut };
  }
}

function getAbonnementStatutBadge(statut: string): { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
  switch (statut.toLowerCase()) {
    case "actif":
      return { variant: "success", label: "Actif" };
    case "en_attente":
      return { variant: "warning", label: "En attente" };
    case "expire":
    case "expiré":
      return { variant: "neutral", label: "Expiré" };
    case "refuse":
    case "refusé":
      return { variant: "danger", label: "Refusé" };
    case "annule":
    case "annulé":
      return { variant: "danger", label: "Annulé" };
    default:
      return { variant: "info", label: statut };
  }
}

function getDomiciliationStatutBadge(statut: string): { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
  switch (statut.toLowerCase()) {
    case "active":
    case "actif":
      return { variant: "success", label: "Active" };
    case "en_attente":
      return { variant: "warning", label: "En attente" };
    case "expiree":
    case "expirée":
    case "expire":
      return { variant: "neutral", label: "Expirée" };
    case "resiliee":
    case "résiliée":
      return { variant: "danger", label: "Résiliée" };
    default:
      return { variant: "info", label: statut };
  }
}

function getTransactionStatutBadge(statut: string): { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
  switch (statut.toLowerCase()) {
    case "encaisse":
    case "complete":
    case "completee":
      return { variant: "success", label: "Encaissé" };
    case "en_attente":
      return { variant: "warning", label: "En attente" };
    case "rembourse":
    case "remboursee":
      return { variant: "info", label: "Remboursé" };
    case "annule":
      return { variant: "danger", label: "Annulé" };
    default:
      return { variant: "neutral", label: statut };
  }
}

// ─── Skeleton de chargement ───────────────────────────────────────────────────

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
    <Card className="p-8">
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </Card>
      ))}
    </div>
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </Card>
  </div>
);

// ─── Modal Edit ───────────────────────────────────────────────────────────────

interface EditForm {
  nom: string;
  prenom: string;
  telephone: string;
  profession: string;
  entreprise: string;
  role: string;
}

interface EditModalProps {
  isOpen: boolean;
  form: EditForm;
  saving: boolean;
  onChange: (form: EditForm) => void;
  onSave: () => void;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, form, saving, onChange, onSave, onClose }) => {
  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Modifier le client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                className={inputClass}
                value={form.prenom}
                onChange={(e) => onChange({ ...form, prenom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                className={inputClass}
                value={form.nom}
                onChange={(e) => onChange({ ...form, nom: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              className={inputClass}
              value={form.telephone}
              onChange={(e) => onChange({ ...form, telephone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Profession</label>
            <input
              type="text"
              className={inputClass}
              value={form.profession}
              onChange={(e) => onChange({ ...form, profession: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Entreprise</label>
            <input
              type="text"
              className={inputClass}
              value={form.entreprise}
              onChange={(e) => onChange({ ...form, entreprise: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rôle</label>
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => onChange({ ...form, role: e.target.value })}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} loading={saving}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal Delete ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  isOpen: boolean;
  deleting: boolean;
  nomComplet: string;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, deleting, nomComplet, onConfirm, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Supprimer le compte</h2>
          <p className="text-sm text-gray-600 mb-1">
            Vous êtes sur le point de supprimer le compte de{" "}
            <span className="font-semibold text-gray-900">{nomComplet}</span>.
          </p>
          <p className="text-sm text-red-600 font-medium">
            Cette action est irréversible. Toutes les données associées seront supprimées.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" fullWidth onClick={onClose} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm} loading={deleting}>
            Supprimer définitivement
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "apercu", label: "Aperçu", icon: <User className="w-4 h-4" /> },
  { id: "reservations", label: "Réservations", icon: <Calendar className="w-4 h-4" /> },
  { id: "abonnement", label: "Abonnement", icon: <Package className="w-4 h-4" /> },
  { id: "domiciliation", label: "Domiciliation", icon: <Home className="w-4 h-4" /> },
  { id: "finances", label: "Finances", icon: <Receipt className="w-4 h-4" /> },
];

const RESERVATIONS_PER_PAGE = 10;

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("apercu");
  const [reservationPage, setReservationPage] = useState(1);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cniUploading, setCniUploading] = useState(false);
  const cniInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    nom: "",
    prenom: "",
    telephone: "",
    profession: "",
    entreprise: "",
    role: "user",
  });

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiClient.get<Profile360>(`/users/profile360.php?id=${id}`);
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        toast.error("Profil introuvable");
        navigate("/app/admin/users");
      }
    } catch {
      toast.error("Erreur lors du chargement du profil");
      navigate("/app/admin/users");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openEditModal = () => {
    if (!profile) return;
    const u = profile.user;
    setEditForm({
      nom: u.nom ?? "",
      prenom: u.prenom ?? "",
      telephone: u.telephone ?? "",
      profession: u.profession ?? "",
      entreprise: u.entreprise ?? "",
      role: u.role ?? "user",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const res = await apiClient.updateUser(id, editForm as unknown as Record<string, unknown>);
      if (res.success) {
        toast.success("Informations mises à jour");
        setShowEditModal(false);
        await loadProfile();
      } else {
        toast.error(res.error ?? "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const res = await apiClient.deleteUser(id);
      if (res.success) {
        toast.success("Compte supprimé avec succès");
        navigate("/app/admin/users");
      } else {
        toast.error(res.error ?? "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleCniUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setCniUploading(true);
    try {
      const uploadRes = await apiClient.uploadDocument(file, "user", id, "cni");
      if (uploadRes.success && uploadRes.data) {
        const d = uploadRes.data as { chemin_fichier: string };
        const updateRes = await apiClient.updateUser(id, { carte_identite_url: d.chemin_fichier });
        if (updateRes.success) {
          toast.success("CNI enregistrée avec succès");
          await loadProfile();
        } else {
          toast.error(updateRes.error ?? "Erreur lors de la mise à jour");
        }
      } else {
        toast.error(uploadRes.error ?? "Erreur lors de l'upload");
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setCniUploading(false);
      if (cniInputRef.current) cniInputRef.current.value = "";
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-gray-500 text-lg">Profil introuvable</p>
        <Button variant="outline" onClick={() => navigate("/app/admin/users")}>
          Retour aux utilisateurs
        </Button>
      </div>
    );
  }

  const { user, reservations, abonnements, abonnement_actif, domiciliations, domiciliation_active, transactions_caisse, codes_promo, parrainages, stats } = profile;

  const isAdmin = user.role === "admin";
  const nomComplet = `${user.prenom} ${user.nom}`;
  const initiales = getInitials(user.prenom, user.nom);
  const avatarBg = isAdmin ? "bg-indigo-600" : "bg-sky-500";

  // Réservations paginées
  const sortedReservations = [...reservations].sort(
    (a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedReservations.length / RESERVATIONS_PER_PAGE));
  const paginatedReservations = sortedReservations.slice(
    (reservationPage - 1) * RESERVATIONS_PER_PAGE,
    reservationPage * RESERVATIONS_PER_PAGE
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Bouton retour ── */}
        <button
          onClick={() => navigate("/app/admin/users")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour aux utilisateurs
        </button>

        {/* ── En-tête ── */}
        <Card className="overflow-hidden" padding="none">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className={`${avatarBg} w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0`}>
                {initiales}
              </div>

              {/* Infos principales */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white">{nomComplet}</h1>
                  <Badge variant={isAdmin ? "info" : "neutral"} size="sm">
                    {isAdmin ? "Administrateur" : "Utilisateur"}
                  </Badge>
                  {stats.has_abonnement_actif && (
                    <Badge variant="success" size="sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Abonnement actif
                    </Badge>
                  )}
                  {stats.has_domiciliation_active && (
                    <Badge variant="info" size="sm">
                      <Home className="w-3 h-3 mr-1" />
                      Domicilié
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-slate-300 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                  {user.telephone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {user.telephone}
                    </span>
                  )}
                  {user.wilaya && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.wilaya}
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-xs mt-2">
                  Membre depuis{" "}
                  <span className="text-slate-200 font-medium">{stats.anciennete_jours} jours</span>
                  {user.derniere_connexion && (
                    <>
                      {" · "}Dernière connexion :{" "}
                      <span className="text-slate-200 font-medium">
                        {formatDate(user.derniere_connexion)} à {formatTime(user.derniere_connexion)}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditModal}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Modifier
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>

          {/* ── Bande stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 bg-white">
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total dépensé</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_depense)}</p>
              {stats.total_encaisse_caisse > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">dont {formatCurrency(stats.total_encaisse_caisse)} en caisse</p>
              )}
            </div>
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Réservations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.nb_reservations}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.nb_presences_abonnement} via abonnement · {stats.nb_annulations} annulée{stats.nb_annulations > 1 ? "s" : ""}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Réductions</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_reductions)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{codes_promo.length} code{codes_promo.length > 1 ? "s" : ""} utilisé{codes_promo.length > 1 ? "s" : ""}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Parrainages</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.nb_parrainages}</p>
              {user.code_parrainage && (
                <p className="text-xs text-gray-400 mt-0.5 font-mono">Code : {user.code_parrainage}</p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Navigation Tabs ── */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════
            TAB : APERÇU
        ════════════════════════════════════════════ */}
        {activeTab === "apercu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche */}
            <div className="lg:col-span-2 space-y-5">

              {/* Infos profil */}
              <Card padding="md">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Prénom", value: user.prenom, icon: <User className="w-4 h-4" /> },
                    { label: "Nom", value: user.nom, icon: <User className="w-4 h-4" /> },
                    { label: "Email", value: user.email, icon: <Mail className="w-4 h-4" /> },
                    { label: "Téléphone", value: user.telephone, icon: <Phone className="w-4 h-4" /> },
                    { label: "Profession", value: user.profession, icon: <Briefcase className="w-4 h-4" /> },
                    { label: "Entreprise", value: user.entreprise, icon: <Building2 className="w-4 h-4" /> },
                    { label: "Wilaya", value: user.wilaya, icon: <MapPin className="w-4 h-4" /> },
                    { label: "Raison sociale", value: user.raison_sociale, icon: <Building2 className="w-4 h-4" /> },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="mt-0.5 text-gray-400">{item.icon}</span>
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className="text-sm font-medium text-gray-900">{item.value}</p>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Membre depuis</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                  {user.credit !== undefined && user.credit > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Crédit disponible</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(user.credit)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* 5 dernières réservations */}
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Dernières réservations
                  </h3>
                  {reservations.length > 5 && (
                    <button
                      onClick={() => setActiveTab("reservations")}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                    >
                      Voir tout ({reservations.length})
                    </button>
                  )}
                </div>
                {reservations.length === 0 ? (
                  <EmptyState icon={<Calendar className="w-8 h-8" />} message="Aucune réservation" />
                ) : (
                  <div className="space-y-2">
                    {sortedReservations.slice(0, 5).map((r) => {
                      const s = getReservationStatutBadge(r.statut);
                      return (
                        <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {r.espace_nom ?? "Espace"}
                              {r.espace_type && <span className="text-gray-400 font-normal"> · {r.espace_type}</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(r.date_debut)} · {formatTime(r.date_debut)} – {formatTime(r.date_fin)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge variant={s.variant} size="xs">{s.label}</Badge>
                            {r.abonnement_couvert ? (
                              <span className="text-xs font-medium text-emerald-600">Abonnement</span>
                            ) : (
                              <span className="text-xs font-medium text-gray-700">{formatCurrency(r.montant_total)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Colonne droite */}
            <div className="space-y-5">

              {/* Abonnement actif */}
              <Card padding="md">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-500" />
                  Abonnement
                </h3>
                {abonnement_actif ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-800 text-sm">{abonnement_actif.abonnement_nom ?? "Abonnement actif"}</span>
                      <Badge variant="success" size="xs">Actif</Badge>
                    </div>
                    {abonnement_actif.prix !== undefined && (
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(abonnement_actif.prix)}<span className="text-sm font-normal text-emerald-600">/mois</span></p>
                    )}
                    {abonnement_actif.date_fin && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Expire le {formatDate(abonnement_actif.date_fin)}
                      </p>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={<Package className="w-7 h-7" />} message="Aucun abonnement actif" small />
                )}
              </Card>

              {/* Domiciliation active */}
              <Card padding="md">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4 text-indigo-500" />
                  Domiciliation
                </h3>
                {domiciliation_active ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-800 text-sm">{domiciliation_active.raison_sociale ?? "Domiciliation active"}</span>
                      <Badge variant="info" size="xs">Active</Badge>
                    </div>
                    {domiciliation_active.montant_mensuel !== undefined && (
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(domiciliation_active.montant_mensuel)}<span className="text-sm font-normal text-blue-600">/mois</span></p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-600">
                      {domiciliation_active.numero_bureau && (
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Bureau {domiciliation_active.numero_bureau}</span>
                      )}
                      {domiciliation_active.date_fin && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Jusqu'au {formatDate(domiciliation_active.date_fin)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={<Home className="w-7 h-7" />} message="Aucune domiciliation active" small />
                )}
              </Card>

              {/* Compte */}
              <Card padding="md">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Compte
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Rôle</span>
                    <Badge variant={isAdmin ? "info" : "neutral"} size="xs">
                      {isAdmin ? "Administrateur" : "Utilisateur"}
                    </Badge>
                  </div>
                  {user.statut && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Statut</span>
                      <Badge variant={user.statut === "actif" ? "success" : "warning"} size="xs">{user.statut}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Inscription</span>
                    <span className="text-xs font-medium text-gray-700">{formatDate(user.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">ID</span>
                    <p className="text-xs font-mono text-gray-500 break-all mt-0.5">{user.id}</p>
                  </div>
                </div>
              </Card>

              {/* Carte d'identité (CNI) */}
              <Card padding="md">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  Carte d'identité (CNI)
                </h3>
                {user.carte_identite_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium flex-1">CNI enregistrée</span>
                      <a
                        href={`/api/${user.carte_identite_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Voir
                      </a>
                    </div>
                    <button
                      onClick={() => cniInputRef.current?.click()}
                      disabled={cniUploading}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {cniUploading ? "Upload en cours…" : "Remplacer la CNI"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Aucune CNI enregistrée
                    </p>
                    <button
                      onClick={() => cniInputRef.current?.click()}
                      disabled={cniUploading}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-indigo-600 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {cniUploading ? "Upload en cours…" : "Uploader la CNI"}
                    </button>
                  </div>
                )}
                <input
                  ref={cniInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleCniUpload}
                />
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            TAB : RÉSERVATIONS
        ════════════════════════════════════════════ */}
        {activeTab === "reservations" && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Historique des réservations
                <span className="ml-1 text-xs font-normal text-gray-400">({reservations.length} au total)</span>
              </h3>
            </div>
            {reservations.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={<Calendar className="w-10 h-10" />} message="Aucune réservation enregistrée" />
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {paginatedReservations.map((r) => {
                    const s = getReservationStatutBadge(r.statut);
                    return (
                      <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900">
                              {r.espace_nom ?? "Espace non renseigné"}
                            </span>
                            {r.espace_type && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{r.espace_type}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(r.date_debut)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(r.date_debut)} – {formatTime(r.date_fin)}
                            </span>
                            {r.participants > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {r.participants} pers.
                              </span>
                            )}
                            <span className="capitalize text-gray-400">{r.type_reservation}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant={s.variant} size="xs">{s.label}</Badge>
                          {r.abonnement_couvert ? (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Abonnement
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                              {formatCurrency(r.montant_total)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Page {reservationPage} sur {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reservationPage === 1}
                        onClick={() => setReservationPage((p) => Math.max(1, p - 1))}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reservationPage === totalPages}
                        onClick={() => setReservationPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* ════════════════════════════════════════════
            TAB : ABONNEMENT
        ════════════════════════════════════════════ */}
        {activeTab === "abonnement" && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" />
                Historique des abonnements
              </h3>
            </div>
            {abonnements.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={<Package className="w-10 h-10" />} message="Aucun abonnement enregistré" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {abonnements.map((a) => {
                  const s = getAbonnementStatutBadge(a.statut);
                  return (
                    <div key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        a.statut === "actif" ? "bg-emerald-500" :
                        a.statut === "en_attente" ? "bg-amber-400" :
                        a.statut === "refuse" ? "bg-red-500" :
                        "bg-gray-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{a.abonnement_nom ?? "Abonnement"}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          {a.date_debut && <span>Début : {formatDate(a.date_debut)}</span>}
                          {a.date_fin && <span>Fin : {formatDate(a.date_fin)}</span>}
                          {a.duree_mois && <span>{a.duree_mois} mois</span>}
                          <span>Souscrit le {formatDate(a.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={s.variant} size="xs">{s.label}</Badge>
                        {a.prix !== undefined && (
                          <span className="text-sm font-semibold text-gray-700">{formatCurrency(a.prix)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ════════════════════════════════════════════
            TAB : DOMICILIATION
        ════════════════════════════════════════════ */}
        {activeTab === "domiciliation" && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-indigo-500" />
                Domiciliations
              </h3>
            </div>
            {domiciliations.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={<Home className="w-10 h-10" />} message="Aucune domiciliation enregistrée" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {domiciliations.map((d) => {
                  const s = getDomiciliationStatutBadge(d.statut);
                  return (
                    <div key={d.id} className="px-6 py-4 hover:bg-gray-50/50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {d.raison_sociale ?? "Domiciliation"}
                            </p>
                            <Badge variant={s.variant} size="xs">{s.label}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            {d.date_debut && <span>Début : {formatDate(d.date_debut)}</span>}
                            {d.date_fin && <span>Fin : {formatDate(d.date_fin)}</span>}
                            {d.numero_bureau && (
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                Bureau {d.numero_bureau}
                              </span>
                            )}
                            <span>Créée le {formatDate(d.created_at)}</span>
                          </div>
                        </div>
                        {d.montant_mensuel !== undefined && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-700">{formatCurrency(d.montant_mensuel)}</p>
                            <p className="text-xs text-gray-400">/ mois</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ════════════════════════════════════════════
            TAB : FINANCES
        ════════════════════════════════════════════ */}
        {activeTab === "finances" && (
          <div className="space-y-6">

            {/* Historique financier unifié */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Historique financier
                  {transactions_caisse.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-gray-400">{transactions_caisse.length} entrée{transactions_caisse.length > 1 ? "s" : ""}</span>
                  )}
                </h3>
              </div>
              {transactions_caisse.length === 0 ? (
                <div className="p-10">
                  <EmptyState icon={<TrendingUp className="w-8 h-8" />} message="Aucune transaction" />
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions_caisse.map((tc) => {
                    const s = getTransactionStatutBadge(tc.statut);
                    const TYPE_LABELS: Record<string, string> = {
                      reservation: "Réservation", abonnement: "Abonnement",
                      domiciliation: "Domiciliation", impression: "Impression",
                      boisson: "Boisson", autre: "Autre", remboursement: "Remboursement",
                    };
                    const MODE_LABELS: Record<string, string> = {
                      cash: "Espèces", tpe: "TPE", virement: "Virement", cheque: "Chèque", credit: "Crédit",
                    };
                    return (
                      <div key={tc.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[tc.type_transaction] ?? tc.type_transaction}</p>
                            <span className="text-xs text-gray-400 font-mono">{tc.numero_recu}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>{formatDate(tc.created_at)}</span>
                            <span>{MODE_LABELS[tc.mode_paiement] ?? tc.mode_paiement}</span>
                            {(tc.encaisse_par_prenom || tc.encaisse_par_nom) && (
                              <span>· {tc.encaisse_par_prenom} {tc.encaisse_par_nom}</span>
                            )}
                            {tc.notes && <span className="text-gray-400 truncate max-w-48">· {tc.notes}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant={s.variant} size="xs">{s.label}</Badge>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(tc.montant)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Codes promo */}
            {codes_promo.length > 0 && (
              <Card padding="none">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-indigo-500" />
                    Codes promo utilisés
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {codes_promo.map((cp) => (
                    <div key={cp.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                          {cp.code ?? "—"}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(cp.created_at)}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        -{formatCurrency(cp.montant_reduction)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Parrainages */}
            {parrainages.length > 0 && (
              <Card padding="none">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-indigo-500" />
                    Parrainages
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {parrainages.map((p) => (
                    <div key={p.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.filleul_prenom} {p.filleul_nom}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(p.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={p.statut === "valide" ? "success" : p.statut === "en_attente" ? "warning" : "neutral"}
                          size="xs"
                        >
                          {p.statut}
                        </Badge>
                        {p.bonus_parrain !== undefined && p.bonus_parrain > 0 && (
                          <span className="text-sm font-bold text-emerald-600">+{formatCurrency(p.bonus_parrain)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <EditModal
        isOpen={showEditModal}
        form={editForm}
        saving={saving}
        onChange={setEditForm}
        onSave={handleSaveEdit}
        onClose={() => setShowEditModal(false)}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        deleting={deleting}
        nomComplet={nomComplet}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

// ─── Composant utilitaire EmptyState ──────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  small?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, small }) => (
  <div className={`flex flex-col items-center justify-center text-gray-400 ${small ? "py-6 gap-2" : "py-12 gap-3"}`}>
    <span className="opacity-40">{icon}</span>
    <p className={small ? "text-xs" : "text-sm"}>{message}</p>
  </div>
);

export default UserDetail;
