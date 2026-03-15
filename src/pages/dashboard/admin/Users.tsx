import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  Search,
  Download,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Building,
  Calendar,
  Activity,
  TrendingUp,
  RefreshCw,
  Eye,
  UserPlus,
} from "lucide-react";
import { useAppStore } from "../../../store/store";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { CreateUserModal } from "../../../components/admin/CreateUserModal";
import { formatDate, buildCsvContent } from "../../../utils/formatters";
import toast from "react-hot-toast";
import { logger } from "../../../utils/logger";
import type { User } from "../../../types";

const Users = () => {
  const {
    users,
    updateUser,
    deleteUser,
    reservations,
    loadUsers,
    loadReservations,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadUsers(), loadReservations()]);
      } catch (error) {
        logger.error("Erreur chargement utilisateurs:", error as Error);
        toast.error("Erreur lors du chargement des utilisateurs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [loadUsers, loadReservations]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUsers(), loadReservations()]);
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("tous");
  const [statutFilter, setStatutFilter] = useState<string>("tous");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const result = await updateUser(userId, { statut: newStatus as User['statut'] });
      if (result.success) {
        toast.success(`Statut mis à jour avec succès`);
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      logger.error("Erreur mise à jour statut:", error as Error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur ?`)) {
      return;
    }

    try {
      const result = await updateUser(userId, { role: newRole as User['role'] });
      if (result.success) {
        toast.success(`Rôle mis à jour avec succès`);
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du rôle");
      }
    } catch (error) {
      logger.error("Erreur mise à jour rôle:", error as Error);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleDelete = async (userId: string) => {
    if (
      window.confirm("Etes-vous sur de vouloir supprimer cet utilisateur ?")
    ) {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success("Utilisateur supprime");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchSearch =
          debouncedSearch === "" ||
          user.nom.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          user.prenom.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (user.entreprise &&
            user.entreprise.toLowerCase().includes(debouncedSearch.toLowerCase()));

        const matchRole = roleFilter === "tous" || user.role === roleFilter;
        const matchStatut =
          statutFilter === "tous" || user.statut === statutFilter;

        return matchSearch && matchRole && matchStatut;
      })
      .sort(
        (a, b) =>
          new Date(b.dateCreation ?? 0).getTime() -
          new Date(a.dateCreation ?? 0).getTime(),
      );
  }, [users, debouncedSearch, roleFilter, statutFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const actifs = users.filter((u) => u.statut === "actif").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const nouveaux = users.filter(
      (u) => {
        const d = new Date(u.dateCreation ?? 0);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      },
    ).length;

    return { total, actifs, admins, nouveaux };
  }, [users]);

  const getUserReservations = (userId: string) => {
    return reservations.filter((r) => r.userId === userId);
  };

  const exportToCSV = () => {
    const headers = [
      "Nom",
      "Prénom",
      "Email",
      "Téléphone",
      "Entreprise",
      "Rôle",
      "Statut",
      "Date inscription",
    ];
    const rows = filteredUsers.map((u) => [
      u.nom,
      u.prenom,
      u.email,
      u.telephone || "",
      u.entreprise || "",
      u.role,
      u.statut || "actif",
      formatDate(u.dateCreation ?? new Date()),
    ]);

    const csv = buildCsvContent(headers, rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utilisateurs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export réussi");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestion des Utilisateurs
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="ghost"
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button onClick={exportToCSV} variant="ghost" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Nouvel Utilisateur
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.actifs}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-teal-600">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouveaux ce mois</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.nouveaux}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={<Search className="w-5 h-5" />}
              placeholder="Rechercher par nom, email ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="tous">Tous les rôles</option>
            <option value="user">Utilisateurs</option>
            <option value="admin">Administrateurs</option>
          </select>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chargement...
              </h3>
              <p className="text-gray-500">Récupération des utilisateurs</p>
            </div>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun utilisateur
              </h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter !== "tous" || statutFilter !== "tous"
                  ? "Aucun utilisateur ne correspond à vos filtres"
                  : "Aucun utilisateur enregistré"}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              {filteredUsers.length} résultat(s)
            </div>

            {filteredUsers.map((user, index) => {
              const userReservations = getUserReservations(user.id);
              const activeReservations = userReservations.filter(
                (r) => r.statut === "confirmee",
              ).length;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center text-white font-bold">
                        {user.prenom.charAt(0)}
                        {user.nom.charAt(0)}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Identité</p>
                          <p className="font-bold text-gray-900">
                            {user.prenom} {user.nom}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-600">
                              {user.email}
                            </p>
                          </div>
                          {user.telephone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                {user.telephone}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Entreprise
                          </p>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <p className="font-medium text-gray-900">
                              {user.entreprise || "Non renseignée"}
                            </p>
                          </div>
                          {user.profession && (
                            <p className="text-xs text-gray-500 mt-1">
                              {user.profession}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">Activité</p>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <p className="font-medium text-gray-900">
                              {userReservations.length} réservation(s)
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {activeReservations} active(s)
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">
                              Inscrit le {formatDate(user.dateCreation ?? new Date())}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">Statuts</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={
                                user.role === "admin" ? "info" : "default"
                              }
                            >
                              {user.role === "admin" ? "Admin" : "User"}
                            </Badge>
                            <Badge
                              variant={
                                user.statut === "actif" ? "success" : "danger"
                              }
                            >
                              {user.statut}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link to={`/app/admin/users/${user.id}`}>
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </Button>
                        </Link>

                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>

                        <Button
                          size="sm"
                          variant={
                            user.statut === "actif" ? "outline" : "success"
                          }
                          onClick={() =>
                            handleStatusChange(
                              user.id,
                              user.statut === "actif" ? "inactif" : "actif",
                            )
                          }
                        >
                          {user.statut === "actif" ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activer
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(user.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    {user.bio && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{user.bio}</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={async () => {
          await loadUsers();
        }}
      />
    </div>
  );
};

export default Users;
