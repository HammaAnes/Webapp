import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminKpiCard from "../../../components/admin/AdminKpiCard";
import { CreateUserModal } from "../../../components/admin/CreateUserModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useConfirm } from "../../../hooks/useConfirm";
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
  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();


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

  const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
    const ok = await confirm({
      title: "Changer le rôle",
      message: "Êtes-vous sûr de vouloir changer le rôle de cet utilisateur ?",
      confirmLabel: "Confirmer",
      variant: "warning",
    });
    if (!ok) return;

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
  }, [confirm, updateUser]);

  const handleDelete = useCallback(async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    const userName = userToDelete ? `${userToDelete.prenom} ${userToDelete.nom}` : "cet utilisateur";
    const ok = await confirm({
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous sûr de vouloir supprimer ${userName} ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      variant: "danger",
    });
    if (!ok) return;

    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("Utilisateur supprimé");
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  }, [confirm, deleteUser, users]);

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
    return reservations.filter((r) => r.personId === userId);
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
      <AdminPageHeader
        title="Utilisateurs"
        subtitle={`${stats.total} compte${stats.total > 1 ? "s" : ""} enregistrés`}
        actions={
          <>
            <Button onClick={handleRefresh} variant="ghost" size="sm" className="gap-1.5" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvel utilisateur</span>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard icon={UsersIcon}   label="Total"          value={stats.total}    color="blue"    />
        <AdminKpiCard icon={UserCheck}   label="Actifs"         value={stats.actifs}   color="emerald" />
        <AdminKpiCard icon={Shield}      label="Admins"         value={stats.admins}   color="teal"    />
        <AdminKpiCard icon={TrendingUp}  label="Nouveaux / mois" value={stats.nouveaux} color="orange"  />
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
                                user.role === "admin" ? "info" : "neutral"
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmLabel={confirmOptions.confirmLabel}
        cancelLabel={confirmOptions.cancelLabel}
        variant={confirmOptions.variant}
      />
    </div>
  );
};

export default Users;
