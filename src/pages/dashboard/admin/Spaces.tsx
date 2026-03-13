import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Building, Plus, FileEdit as Edit, Trash2, Search, Users, Banknote, CheckCircle, XCircle, Wifi, Monitor, Coffee, Printer, Video, Grid2x2 as Grid, List, Eye } from "lucide-react";
import { useAppStore } from "../../../store/store";
import { Input, Select, Textarea, Checkbox, Button, Card, Modal } from "../../../components/ui";
import toast from "react-hot-toast";
import {
  ESPACE_TYPE_OPTIONS,
  DEFAULT_ESPACE_TYPE,
  getEspaceTypeLabel,
  getEspaceTypeColor,
  type EspaceType,
} from "../../../constants";
import { validationRules } from "../../../utils/validation";
import type { Espace } from "../../../types";

const equipementsList = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "ecran", label: "Écran", icon: Monitor },
  { id: "cafe", label: "Café", icon: Coffee },
  { id: "imprimante", label: "Imprimante", icon: Printer },
  { id: "visio", label: "Visioconférence", icon: Video },
];

interface SpaceFormData {
  nom: string;
  type: EspaceType;
  capacite: number;
  prixHeure: number;
  prixDemiJournee: number;
  prixJour: number;
  prixSemaine: number;
  description: string;
  equipements: string[];
  disponible: boolean;
}

const Spaces = () => {
  const { espaces, addEspace, updateEspace, deleteEspace, loadEspaces } =
    useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Espace | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [equipements, setEquipements] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SpaceFormData>({
    defaultValues: {
      nom: "",
      type: DEFAULT_ESPACE_TYPE as EspaceType,
      capacite: 1,
      prixHeure: 0,
      prixDemiJournee: 0,
      prixJour: 0,
      prixSemaine: 0,
      description: "",
      equipements: [],
      disponible: true,
    },
  });

  useEffect(() => {
    loadEspaces();
  }, []);

  const onSubmit = async (data: SpaceFormData) => {
    setLoading(true);

    try {
      const dataToSend = {
        ...data,
        equipements,
      };

      if (editingSpace) {
        const result = await updateEspace(editingSpace.id, dataToSend);
        if (result.success) {
          toast.success("Espace modifié avec succès");
          setShowModal(false);
          resetForm();
        } else {
          toast.error(result.error || "Erreur lors de la modification");
        }
      } else {
        const result = await addEspace(dataToSend);
        if (result.success) {
          toast.success("Espace créé avec succès");
          setShowModal(false);
          resetForm();
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    setEquipements([]);
    setEditingSpace(null);
  };

  const handleEdit = (space: Espace) => {
    setEditingSpace(space);
    reset({
      nom: space.nom,
      type: space.type,
      capacite: space.capacite,
      prixHeure: space.prixHeure || 0,
      prixDemiJournee: space.prixDemiJournee || 0,
      prixJour: space.prixJour || 0,
      prixSemaine: space.prixSemaine || 0,
      description: space.description || "",
      disponible: space.disponible !== false,
    });
    setEquipements(space.equipements || []);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet espace?"))
      return;

    try {
      const result = await deleteEspace(id);
      if (result.success) {
        toast.success("Espace supprimé avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const toggleEquipement = (equipId: string) => {
    setEquipements((prev) =>
      prev.includes(equipId)
        ? prev.filter((e) => e !== equipId)
        : [...prev, equipId]
    );
  };

  const filteredSpaces = espaces.filter((space) => {
    const matchSearch = space.nom
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || space.type === filterType;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "disponible" && space.disponible) ||
      (filterStatus === "indisponible" && !space.disponible);
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: espaces.length,
    disponibles: espaces.filter((e) => e.disponible).length,
    occupes: espaces.filter((e) => !e.disponible).length,
    capaciteTotal: espaces.reduce((sum, e) => sum + (e.capacite || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Espaces
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos espaces de coworking</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Nouvel Espace
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Espaces</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.disponibles}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Occupés</p>
              <p className="text-2xl font-bold text-red-600">{stats.occupes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacité Totale</p>
              <p className="text-2xl font-bold text-teal-600">
                {stats.capaciteTotal}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={<Search className="w-5 h-5" />}
              placeholder="Rechercher un espace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filterType}
              onChange={(value) => setFilterType(value)}
              options={[
                { value: "all", label: "Tous les types" },
                ...ESPACE_TYPE_OPTIONS,
              ]}
            />

            <Select
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              options={[
                { value: "all", label: "Tous les statuts" },
                { value: "disponible", label: "Disponible" },
                { value: "indisponible", label: "Indisponible" },
              ]}
            />

            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === "grid" ? (
                <List className="w-5 h-5" />
              ) : (
                <Grid className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {filteredSpaces.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun espace trouvé
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? "Aucun espace ne correspond à vos critères de recherche."
              : "Commencez par créer votre premier espace de coworking."}
          </p>
          {!searchTerm && filterType === "all" && filterStatus === "all" && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un espace
            </Button>
          )}
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredSpaces.map((space) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {space.nom}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getEspaceTypeLabel(space.type)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        space.disponible
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {space.disponible ? "Disponible" : "Occupé"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{space.capacite} pers.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Banknote className="w-4 h-4" />
                      <span>{space.prixHeure} DA/h</span>
                    </div>
                  </div>

                  {space.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {space.description}
                    </p>
                  )}

                  {space.equipements && space.equipements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {space.equipements.map((equipId) => {
                        const equip = equipementsList.find((e) => e.id === equipId);
                        if (!equip) return null;
                        const Icon = equip.icon;
                        return (
                          <div
                            key={equipId}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                          >
                            <Icon className="w-3 h-3" />
                            <span>{equip.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Link to={`/app/admin/spaces/${space.id}`} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(space)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(space.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingSpace ? "Modifier l'Espace" : "Nouvel Espace"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Nom de l'espace"
            icon={<Building className="w-5 h-5" />}
            placeholder="Ex: Box Premium 1"
            {...register("nom", validationRules.required("Nom"))}
            error={errors.nom?.message}
            required
          />

          <Select
            label="Type d'espace"
            options={ESPACE_TYPE_OPTIONS}
            {...register("type", { required: "Type requis" })}
            error={errors.type?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Capacité"
              type="number"
              min="1"
              icon={<Users className="w-5 h-5" />}
              {...register("capacite", validationRules.capacity())}
              error={errors.capacite?.message}
              required
            />
            <div className="pt-8">
              <Checkbox
                label="Disponible à la réservation"
                {...register("disponible")}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Tarifs
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prix/Heure (DA)"
                type="number"
                min="0"
                step="100"
                icon={<Banknote className="w-5 h-5" />}
                {...register("prixHeure", validationRules.amount)}
                error={errors.prixHeure?.message}
                required
              />
              <Input
                label="Prix/Demi-journée (DA)"
                type="number"
                min="0"
                step="100"
                icon={<Banknote className="w-5 h-5" />}
                {...register("prixDemiJournee", validationRules.amount)}
                error={errors.prixDemiJournee?.message}
                required
              />
              <Input
                label="Prix/Jour (DA)"
                type="number"
                min="0"
                step="100"
                icon={<Banknote className="w-5 h-5" />}
                {...register("prixJour", validationRules.amount)}
                error={errors.prixJour?.message}
                required
              />
              <Input
                label="Prix/Semaine (DA)"
                type="number"
                min="0"
                step="100"
                icon={<Banknote className="w-5 h-5" />}
                {...register("prixSemaine", validationRules.amount)}
                error={errors.prixSemaine?.message}
                required
              />
            </div>
          </div>

          <Textarea
            label="Description"
            rows={3}
            placeholder="Décrivez brièvement cet espace..."
            {...register("description")}
            error={errors.description?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Équipements
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {equipementsList.map((equip) => {
                const Icon = equip.icon;
                const isSelected = equipements.includes(equip.id);
                return (
                  <button
                    key={equip.id}
                    type="button"
                    onClick={() => toggleEquipement(equip.id)}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{equip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" loading={loading}>
              {editingSpace ? "Modifier l'espace" : "Créer l'espace"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Spaces;
