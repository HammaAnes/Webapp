import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Users,
  Banknote,
  Clock,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { apiClient } from "../../lib/api-client";
import { useAppStore } from "../../store/store";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { logger } from "../../utils/logger";
import Modal from "../../components/ui/Modal";
import { formatPrice } from "../../utils/formatters";
import { getEspaceTypeLabel } from "../../constants";
import toast from "react-hot-toast";

interface EspaceDetail {
  id: string;
  nom: string;
  type: string;
  capacite: number;
  description?: string;
  equipements?: string[];
  tarifHoraire?: number;
  tarifJournalier?: number;
  tarifMensuel?: number;
  disponible: boolean;
  image?: string;
  createdAt: string;
}

const EspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { loadEspaces } = useAppStore();
  const [espace, setEspace] = useState<EspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadEspace();
    }
  }, [id]);

  const loadEspace = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getEspace(id!);
      if (response.success && response.data) {
        setEspace(response.data as EspaceDetail);
      } else {
        toast.error("Espace introuvable");
        navigate("/app/admin/spaces");
      }
    } catch (error) {
      logger.error("Erreur chargement espace:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors du chargement");
      navigate("/app/admin/spaces");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      const response = await apiClient.deleteEspace(id);
      if (response.success) {
        toast.success("Espace supprimé avec succès");
        await loadEspaces();
        navigate("/app/admin/spaces");
      } else {
        toast.error(response.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!espace) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Espace introuvable</p>
        <Button onClick={() => navigate("/app/admin/spaces")} className="mt-4">
          Retour aux espaces
        </Button>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/app/admin/spaces")}
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{espace.nom}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={espace.disponible ? "success" : "error"}>
            {espace.disponible ? "Disponible" : "Indisponible"}
          </Badge>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/app/admin/spaces?edit=${id}`)}
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
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {espace.image && (
            <Card className="overflow-hidden">
              <img
                src={espace.image}
                alt={espace.nom}
                className="w-full h-64 object-cover"
              />
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              Informations générales
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Type d'espace</p>
                <p className="font-semibold text-lg">
                  {getEspaceTypeLabel(espace.type)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Capacité</p>
                <p className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  {espace.capacite} personnes
                </p>
              </div>
              {espace.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700 leading-relaxed">
                    {espace.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {(() => {
            let items: string[] = [];
            if (Array.isArray(espace.equipements)) {
              items = espace.equipements;
            } else if (typeof espace.equipements === 'string') {
              try {
                items = JSON.parse(espace.equipements);
              } catch (e) {
                items = [];
              }
            }

            return items.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Équipements disponibles</h2>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((equipement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm font-medium">{equipement}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null;
          })()}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-accent" />
              Tarifs
            </h2>
            <div className="space-y-4">
              {espace.tarifHoraire && (
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Tarif horaire</p>
                    <p className="font-bold text-lg text-accent">
                      {formatPrice(espace.tarifHoraire)}
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-accent" />
                </div>
              )}
              {espace.tarifJournalier && (
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Tarif journalier</p>
                    <p className="font-bold text-lg text-blue-600">
                      {formatPrice(espace.tarifJournalier)}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              )}
              {espace.tarifMensuel && (
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Tarif mensuel</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatPrice(espace.tarifMensuel)}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Statistiques</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={espace.disponible ? "success" : "error"}>
                  {espace.disponible ? "Disponible" : "Indisponible"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-medium">
                  {new Date(espace.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Informations système</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">ID Espace</p>
                <p className="font-mono text-xs break-all">{espace.id}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'espace"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer cet espace ? Cette action est
            irréversible et supprimera également toutes les réservations
            associées.
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
    </div>
  );
};

export default EspaceDetail;
