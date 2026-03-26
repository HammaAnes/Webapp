import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Key,
  Users,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Badge from "../../../../components/ui/Badge";
import Modal from "../../../../components/ui/Modal";
import { apiClient } from "../../../../lib/api-client";
import toast from "react-hot-toast";
import { logger } from "../../../../utils/logger";

interface UserResult {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  statut: string;
}

const ComptesTab: React.FC = () => {
  const [userSearch, setUserSearch] = useState("");
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.getUsers()
      .then((res) => {
        const raw = res.data as Record<string, unknown>;
        const list = Array.isArray(raw?.persons) ? raw.persons
          : Array.isArray(raw?.users) ? raw.users
          : Array.isArray(raw?.data) ? raw.data
          : Array.isArray(res.data) ? res.data as UserResult[]
          : [];
        setAllUsers(list as UserResult[]);
      })
      .catch((err) => {
        logger.error("Erreur chargement utilisateurs:", err as Error);
        toast.error("Erreur chargement utilisateurs");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const q = userSearch.toLowerCase();
    setUserResults(
      allUsers
        .filter(
          (u) =>
            u.nom?.toLowerCase().includes(q) ||
            u.prenom?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.telephone?.includes(q)
        )
        .slice(0, 15)
    );
  }, [userSearch, allUsers]);

  const openPasswordReset = useCallback((user: UserResult) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowPasswordModal(true);
  }, []);

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPassword(true);
    try {
      const response = await apiClient.adminResetPassword(selectedUser.id, newPassword);
      if (response.success) {
        toast.success(`Mot de passe mis à jour pour ${selectedUser.prenom} ${selectedUser.nom}`);
        setShowPasswordModal(false);
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      logger.error("Erreur reset password:", error as Error);
      toast.error("Erreur lors de la mise à jour du mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-500" />
          Gestion des mots de passe
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Recherchez un utilisateur pour réinitialiser son mot de passe depuis le desk.
        </p>

        <div className="mb-6">
          <Input
            type="search"
            placeholder="Rechercher par nom, prénom, email ou téléphone..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-3" />
            <span className="text-gray-500">Chargement des utilisateurs...</span>
          </div>
        )}

        {!loading && userSearch.trim() && userResults.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Aucun utilisateur trouvé pour "{userSearch}"</p>
          </div>
        )}

        {userResults.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userResults.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {u.prenom} {u.nom}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.telephone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "warning" : "neutral"} className="text-xs">
                        {u.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openPasswordReset(u)}>
                        <Key className="w-3.5 h-3.5 mr-1" />
                        Reset MDP
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!userSearch.trim() && !loading && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Tapez un nom, email ou téléphone</p>
            <p className="text-gray-400 text-sm mt-1">pour trouver un utilisateur</p>
          </div>
        )}
      </Card>

      <Card className="p-6 border-l-4 border-amber-400 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Information sécurité</p>
            <p className="text-sm text-amber-700 mt-1">
              Le reset de mot de passe depuis le desk ne déclenche pas d'email automatique.
              Communiquez le nouveau mot de passe directement au client et conseillez-lui de
              le changer à sa prochaine connexion.
            </p>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Réinitialiser le mot de passe"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {selectedUser.prenom} {selectedUser.nom}
              </p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="relative">
              <Input
                label="Nouveau mot de passe (min. 8 caractères)"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Key className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirmer le mot de passe"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Key className="w-4 h-4" />}
            />

            {newPassword && newPassword.length < 8 && (
              <p className="text-xs text-red-500">Le mot de passe doit contenir au moins 8 caractères</p>
            )}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} disabled={savingPassword}>
                Annuler
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={savingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              >
                {savingPassword ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                Réinitialiser
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComptesTab;
