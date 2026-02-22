import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Banknote,
  Package,
  ToggleLeft,
  ToggleRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import { formatCurrency } from "../../../utils/formatters";
import toast from "react-hot-toast";
import { apiClient } from "../../../lib/api-client";
import { logger } from "../../../utils/logger";

interface Abonnement {
  id: string;
  nom: string;
  type: string;
  prix: number;
  prix_avec_domiciliation?: number;
  duree_mois: number;
  description?: string;
  avantages?: string[];
  actif: boolean;
  statut: "actif" | "inactif" | "archive";
  ordre: number;
  created_at?: string;
  updated_at?: string;
}

const AdminAbonnements = () => {
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAbonnement, setSelectedAbonnement] =
    useState<Abonnement | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Partial<Abonnement>>({
    nom: "",
    type: "",
    prix: 0,
    prix_avec_domiciliation: 0,
    duree_mois: 1,
    description: "",
    avantages: [],
    actif: true,
    statut: "actif",
    ordre: 0,
  });

  const [newAvantage, setNewAvantage] = useState("");

  useEffect(() => {
    loadAbonnements();
  }, []);

  const loadAbonnements = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/abonnements/index.php");
      if (response.success) {
        setAbonnements((response.data || []) as Abonnement[]);
      }
    } catch (error) {
      logger.error("Erreur chargement abonnements:", error as Error);
      toast.error("Erreur lors du chargement des abonnements");
    } finally {
      setLoading(false);
    }
  };

  const filteredAbonnements = abonnements.filter((ab) => {
    const matchSearch =
      ab.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ab.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatut === "tous" || ab.statut === filterStatut;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: abonnements.length,
    actifs: abonnements.filter((a) => a.statut === "actif").length,
    inactifs: abonnements.filter((a) => a.statut === "inactif").length,
    revenuMensuel: abonnements
      .filter((a) => a.statut === "actif")
      .reduce((sum, a) => sum + a.prix, 0),
  };

  const handleOpenModal = (abonnement?: Abonnement) => {
    if (abonnement) {
      setIsEditing(true);
      setSelectedAbonnement(abonnement);
      setFormData({
        ...abonnement,
        avantages: abonnement.avantages || [],
      });
    } else {
      setIsEditing(false);
      setSelectedAbonnement(null);
      setFormData({
        nom: "",
        type: "",
        prix: 0,
        prix_avec_domiciliation: 0,
        duree_mois: 1,
        description: "",
        avantages: [],
        actif: true,
        statut: "actif",
        ordre: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAbonnement(null);
    setIsEditing(false);
    setFormData({
      nom: "",
      type: "",
      prix: 0,
      prix_avec_domiciliation: 0,
      duree_mois: 1,
      description: "",
      avantages: [],
      actif: true,
      statut: "actif",
      ordre: 0,
    });
    setNewAvantage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.type || !formData.prix) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        prix: Number(formData.prix),
        prix_avec_domiciliation: formData.prix_avec_domiciliation
          ? Number(formData.prix_avec_domiciliation)
          : null,
        duree_mois: Number(formData.duree_mois),
        ordre: Number(formData.ordre),
        actif: formData.actif ? 1 : 0,
      };

      if (isEditing && selectedAbonnement) {
        const response = await apiClient.put("/abonnements/update.php", {
          id: selectedAbonnement.id,
          ...payload,
        });
        if (response.success) {
          toast.success("Abonnement modifie avec succes");
          handleCloseModal();
          await loadAbonnements();
        } else {
          toast.error(response.error || "Erreur lors de la modification");
        }
      } else {
        const response = await apiClient.post(
          "/abonnements/create.php",
          payload,
        );
        if (response.success) {
          toast.success("Abonnement cree avec succes");
          handleCloseModal();
          await loadAbonnements();
        } else {
          toast.error(response.error || "Erreur lors de la creation");
        }
      }
    } catch (error) {
      logger.error("Erreur:", error instanceof Error ? error.message : "Unknown error");
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActif = async (abonnement: Abonnement) => {
    try {
      const response = await apiClient.put("/abonnements/update.php", {
        id: abonnement.id,
        actif: !abonnement.actif,
      });
      if (response.success) {
        toast.success(
          `Abonnement ${!abonnement.actif ? "activé" : "désactivé"}`,
        );
        await loadAbonnements();
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!selectedAbonnement) return;

    setLoading(true);
    try {
      const response = await apiClient.deleteAbonnement(selectedAbonnement.id);
      if (response.success) {
        toast.success("Abonnement archivé avec succès");
        setShowDeleteModal(false);
        setSelectedAbonnement(null);
        await loadAbonnements();
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvantage = () => {
    if (newAvantage.trim()) {
      setFormData({
        ...formData,
        avantages: [...(formData.avantages || []), newAvantage.trim()],
      });
      setNewAvantage("");
    }
  };

  const handleRemoveAvantage = (index: number) => {
    setFormData({
      ...formData,
      avantages: formData.avantages?.filter((_, i) => i !== index),
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        "Nom",
        "Type",
        "Prix",
        "Prix avec Domiciliation",
        "Durée (mois)",
        "Statut",
        "Actif",
        "Ordre",
      ],
      ...filteredAbonnements.map((a) => [
        a.nom,
        a.type,
        a.prix,
        a.prix_avec_domiciliation || "N/A",
        a.duree_mois,
        a.statut,
        a.actif ? "Oui" : "Non",
        a.ordre,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abonnements_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Export réussi");
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<
      string,
      { variant: "success" | "warning" | "danger" | "default"; label: string }
    > = {
      actif: { variant: "success", label: "Actif" },
      inactif: { variant: "warning", label: "Inactif" },
      archive: { variant: "default", label: "Archivé" },
    };
    const badge = badges[statut] || badges.actif;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Abonnements
          </h1>
          <p className="text-gray-600 mt-1">
            Administration des types d'abonnements et forfaits
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Abonnement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Actifs</p>
              <p className="text-3xl font-bold text-green-900">
                {stats.actifs}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Inactifs</p>
              <p className="text-3xl font-bold text-amber-900">
                {stats.inactifs}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-amber-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-l-4 border-teal-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600 font-medium">
                Revenu Potentiel
              </p>
              <p className="text-2xl font-bold text-teal-900">
                {formatCurrency(stats.revenuMensuel)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-teal-600 opacity-50" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Rechercher par nom ou type..."
            icon={<Search className="w-5 h-5" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="archive">Archivé</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actif
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAbonnements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun abonnement trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredAbonnements.map((abonnement) => (
                  <motion.tr
                    key={abonnement.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {abonnement.nom}
                        </p>
                        {abonnement.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {abonnement.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{abonnement.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(abonnement.prix)}
                        </p>
                        {abonnement.prix_avec_domiciliation && (
                          <p className="text-xs text-gray-500">
                            Avec dom:{" "}
                            {formatCurrency(abonnement.prix_avec_domiciliation)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {abonnement.duree_mois} mois
                    </td>
                    <td className="px-6 py-4">
                      {getStatutBadge(abonnement.statut)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActif(abonnement)}
                        className="focus:outline-none"
                        title={abonnement.actif ? "Désactiver" : "Activer"}
                      >
                        {abonnement.actif ? (
                          <ToggleRight className="w-8 h-8 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(abonnement)}
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAbonnement(abonnement);
                            setShowDeleteModal(true);
                          }}
                          title="Supprimer"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={isEditing ? "Modifier l'abonnement" : "Nouvel abonnement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom de l'abonnement"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              required
              placeholder="Ex: Solo, Pro, Executive"
            />
            <Input
              label="Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              required
              placeholder="Ex: solo, pro, entreprise"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Prix (DA)"
              type="number"
              value={formData.prix}
              onChange={(e) =>
                setFormData({ ...formData, prix: Number(e.target.value) })
              }
              required
              min="0"
              step="100"
            />
            <Input
              label="Prix avec Domiciliation (DA)"
              type="number"
              value={formData.prix_avec_domiciliation || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prix_avec_domiciliation: Number(e.target.value) || 0,
                })
              }
              min="0"
              step="100"
              placeholder="Optionnel"
            />
            <Input
              label="Durée (mois)"
              type="number"
              value={formData.duree_mois}
              onChange={(e) =>
                setFormData({ ...formData, duree_mois: Number(e.target.value) })
              }
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Description de l'abonnement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avantages
            </label>
            <div className="space-y-2">
              {formData.avantages?.map((avantage, index) => (
                <div
                  key={`avantage-form-${index}`}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    {avantage}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAvantage(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newAvantage}
                  onChange={(e) => setNewAvantage(e.target.value)}
                  placeholder="Ajouter un avantage"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAvantage();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddAvantage}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) =>
                  setFormData({ ...formData, statut: e.target.value as "actif" | "inactif" | "archive" })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            <Input
              label="Ordre d'affichage"
              type="number"
              value={formData.ordre}
              onChange={(e) =>
                setFormData({ ...formData, ordre: Number(e.target.value) })
              }
              min="0"
            />

            <div className="flex items-center pt-8">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) =>
                    setFormData({ ...formData, actif: e.target.checked })
                  }
                  className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                />
                <span className="ml-2 text-sm text-gray-700">Actif</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAbonnement(null);
        }}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Êtes-vous sûr de vouloir archiver l'abonnement{" "}
                <strong>{selectedAbonnement?.nom}</strong> ? Cette action ne
                supprimera pas l'abonnement mais le rendra indisponible.
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedAbonnement(null);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? "Suppression..." : "Archiver"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAbonnements;
