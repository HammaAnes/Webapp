import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Briefcase, Building, Calendar, ArrowLeft, FileEdit as Edit, Trash2, Shield, CheckCircle, XCircle, CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import { useAppStore } from "../../../store/store";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Modal from "../../../components/ui/Modal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "../../../utils/logger";

interface UserDetailData {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profession?: string;
  entreprise?: string;
  role: string;
  emailVerified: boolean;
  createdAt?: string;
  created_at?: string;
  carte_identite_url?: string | null;
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadUsers } = useAppStore();
  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    profession: '',
    entreprise: '',
    role: 'user',
  });

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUser(id!);
      if (response.success && response.data) {
        const userData = response.data as UserDetailData;
        setUser({
          ...userData,
          createdAt: userData.createdAt || userData.created_at,
        });
      } else {
        toast.error("Utilisateur introuvable");
        navigate("/app/admin/users");
      }
    } catch (error) {
      logger.error("Erreur chargement utilisateur:", error as Error);
      toast.error("Erreur lors du chargement");
      navigate("/app/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      const response = await apiClient.deleteUser(id);
      if (response.success) {
        toast.success("Utilisateur supprimé avec succès");
        await loadUsers();
        navigate("/app/admin/users");
      } else {
        toast.error(response.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = () => {
    if (!user) return;
    setEditForm({
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone || '',
      profession: user.profession || '',
      entreprise: user.entreprise || '',
      role: user.role || 'user',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const response = await apiClient.updateUser(id, editForm);
      if (response.success) {
        toast.success('Utilisateur mis à jour');
        setShowEditModal(false);
        await loadUser();
        await loadUsers();
      } else {
        toast.error(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRole = async () => {
    if (!user || !id) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const response = await apiClient.updateUser(id, { role: newRole });
      if (response.success) {
        toast.success(`Rôle mis à jour : ${newRole === 'admin' ? 'Administrateur' : 'Utilisateur'}`);
        await loadUser();
        await loadUsers();
      }
    } catch (error) {
      toast.error('Erreur lors du changement de rôle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Utilisateur introuvable</p>
        <Button onClick={() => navigate("/app/admin/users")} className="mt-4">
          Retour aux utilisateurs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/app/admin/users")}
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.prenom} {user.nom}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={user.role === "admin" ? "warning" : "primary"}>
            {user.role === "admin" ? "Administrateur" : "Utilisateur"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={openEditModal}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:bg-red-50 border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Informations personnelles
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Prénom</p>
                  <p className="font-medium text-lg">{user.prenom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="font-medium text-lg">{user.nom}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  {user.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              {user.telephone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </p>
                  <p className="font-medium">{user.telephone}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" />
              Informations professionnelles
            </h2>
            <div className="space-y-4">
              {user.profession && (
                <div>
                  <p className="text-sm text-gray-600">Profession</p>
                  <p className="font-medium">{user.profession}</p>
                </div>
              )}
              {user.entreprise && (
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Entreprise
                  </p>
                  <p className="font-medium">{user.entreprise}</p>
                </div>
              )}
              {!user.profession && !user.entreprise && (
                <p className="text-gray-500 italic">
                  Aucune information professionnelle renseignée
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Compte & Permissions
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Rôle</p>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === "admin" ? "warning" : "primary"}>
                    {user.role === "admin" ? "Administrateur" : "Utilisateur"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={handleToggleRole}>
                    Changer
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut email</p>
                <Badge variant={user.emailVerified ? "success" : "danger"}>
                  {user.emailVerified ? "Vérifié" : "Non vérifié"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Informations système
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Date d'inscription</p>
                {user.createdAt ? (
                  <>
                    <p className="font-medium">
                      {format(new Date(user.createdAt), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(user.createdAt), "HH:mm", { locale: fr })}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Non disponible</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">ID Utilisateur</p>
                <p className="font-mono text-xs break-all">{user.id}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Carte d'identité
            </h2>
            {user.carte_identite_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Document archivé
                </div>
                <a
                  href={user.carte_identite_url?.startsWith('/api/') || user.carte_identite_url?.startsWith('api/') ? `/${user.carte_identite_url?.replace(/^\//, '')}` : `/api/${user.carte_identite_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Consulter le document
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                Carte d'identité non fournie
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'utilisateur"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action
            est irréversible et supprimera également toutes les données
            associées (réservations, domiciliations, etc.).
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'utilisateur"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={editForm.prenom}
                onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={editForm.nom}
                onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={editForm.telephone}
              onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={editForm.profession}
              onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={editForm.entreprise}
              onChange={(e) => setEditForm({ ...editForm, entreprise: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
