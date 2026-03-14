import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Users,
  TrendingUp,
  Award,
  Banknote,
  Calendar,
  Search,
  Download,
  CheckCircle,
  Clock,
  User,
  Mail,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import { useAppStore } from "../../../store/store";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "../../../utils/logger";
import { buildCsvContent } from "../../../utils/formatters";

interface ParrainageDetail {
  id: string;
  parrainageId: string;
  parrainId: string;
  parrainNom: string;
  parrainEmail: string;
  filleulId: string;
  filleulNom: string;
  filleulEmail: string;
  recompenseParrain: number;
  recompenseFilleul: number;
  statut: "en_attente" | "valide" | "paye";
  dateInscription: string;
  dateValidation?: string;
}

interface Stats {
  totalParrainages: number;
  totalRecompenses: number;
  recompensesPayees: number;
  recompensesEnAttente: number;
}

interface TopParrain {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  count: number;
  credits: number;
}

const Parrainages = () => {
  const { users } = useAppStore();
  const [parrainages, setParrainages] = useState<ParrainageDetail[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalParrainages: 0,
    totalRecompenses: 0,
    recompensesPayees: 0,
    recompensesEnAttente: 0,
  });
  const [topParrains, setTopParrains] = useState<TopParrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getParrainages();
      const responseData = response.data as Record<string, any>;
      const data = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(response.data)
        ? response.data
        : [];

      setParrainages(data);
      calculateStats(data);
    } catch (error) {
      logger.error("Erreur chargement parrainages:", error as Error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: ParrainageDetail[]) => {
    const totalRecompenses = data.reduce(
      (sum, p) => sum + (p.recompenseParrain || 0),
      0
    );
    const recompensesPayees = data
      .filter((p) => p.statut === "paye")
      .reduce((sum, p) => sum + (p.recompenseParrain || 0), 0);
    const recompensesEnAttente = data
      .filter((p) => p.statut === "en_attente" || p.statut === "valide")
      .reduce((sum, p) => sum + (p.recompenseParrain || 0), 0);

    setStats({
      totalParrainages: data.length,
      totalRecompenses,
      recompensesPayees,
      recompensesEnAttente,
    });

    calculateTopParrains(data);
  };

  const calculateTopParrains = (data: ParrainageDetail[]) => {
    const parrainMap = new Map<string, TopParrain>();

    data.forEach((p) => {
      const parrainId = p.parrainId;
      if (!parrainId) return;

      if (!parrainMap.has(parrainId)) {
        const nameParts = (p.parrainNom || "").split(" ");
        parrainMap.set(parrainId, {
          id: parrainId,
          prenom: nameParts[0] || "Parrain",
          nom: nameParts.slice(1).join(" ") || `#${parrainId.slice(0, 6)}`,
          email: p.parrainEmail || "",
          count: 0,
          credits: 0,
        });
      }

      const parrain = parrainMap.get(parrainId);
      if (parrain) {
        parrain.count++;
        parrain.credits += p.recompenseParrain || 0;
      }
    });

    const top = Array.from(parrainMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setTopParrains(top);
  };

  const handleUpdateStatut = async (id: string, newStatut: string) => {
    setUpdatingId(id);
    const previousParrainages = parrainages;
    setParrainages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, statut: newStatut as ParrainageDetail["statut"] } : p))
    );
    try {
      const response = await apiClient.updateParrainageStatut(id, newStatut);
      if (response.success) {
        toast.success("Statut mis à jour");
        await loadData();
      } else {
        setParrainages(previousParrainages);
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      setParrainages(previousParrainages);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatut = (statut: string): { label: string; value: string } | null => {
    if (statut === "en_attente") return { label: "Valider", value: "valide" };
    if (statut === "valide") return { label: "Marquer payé", value: "paye" };
    return null;
  };

  const filteredParrainages = parrainages.filter(
    (p) =>
      p.filleulNom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.filleulEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = [
      "Filleul",
      "Email",
      "Date d'inscription",
      "Récompense Parrain (DA)",
      "Récompense Filleul (DA)",
      "Statut",
    ];

    const rows = filteredParrainages.map((p) => [
      p.filleulNom || "N/A",
      p.filleulEmail || "N/A",
      p.dateInscription
        ? format(new Date(p.dateInscription), "dd/MM/yyyy HH:mm", { locale: fr })
        : "N/A",
      p.recompenseParrain.toString(),
      p.recompenseFilleul.toString(),
      p.statut,
    ]);

    const csvContent = buildCsvContent(headers, rows);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parrainages_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV réussi");
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "paye":
        return <Badge variant="success">Payé</Badge>;
      case "valide":
        return <Badge variant="primary">Validé</Badge>;
      case "en_attente":
        return <Badge variant="warning">En attente</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Parrainages
          </h1>
          <p className="text-gray-600 mt-1">
            Suivi et validation des parrainages
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Parrainages</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalParrainages}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Récompenses</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalRecompenses.toLocaleString("fr-DZ")} DA
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Récompenses Payées</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.recompensesPayees.toLocaleString("fr-DZ")} DA
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">En Attente</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.recompensesEnAttente.toLocaleString("fr-DZ")} DA
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Top Parrains */}
      {topParrains.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Top 5 Parrains
              </h2>
            </div>
            <div className="space-y-4">
              {topParrains.map((parrain, index) => (
                <div
                  key={parrain.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-gray-200">
                      <span className="font-bold text-gray-700">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {parrain.prenom} {parrain.nom}
                      </p>
                      <p className="text-sm text-gray-500">{parrain.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {parrain.count} parrainages
                    </p>
                    <p className="text-sm text-gray-600">
                      {parrain.credits.toLocaleString("fr-DZ")} DA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Liste des parrainages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-6 h-6 text-blue-600" />
                Tous les Parrainages ({filteredParrainages.length})
              </h2>
              <div className="w-full max-w-sm">
                <Input
                  type="search"
                  placeholder="Rechercher un filleul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {filteredParrainages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parrain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filleul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Récompense Parrain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Récompense Filleul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParrainages.map((parrainage) => (
                    <tr key={parrainage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {parrainage.parrainNom || "—"}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {parrainage.parrainEmail || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {parrainage.filleulNom || "Utilisateur"}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {parrainage.filleulEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {parrainage.dateInscription
                            ? format(
                                new Date(parrainage.dateInscription),
                                "dd MMM yyyy",
                                { locale: fr }
                              )
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {parrainage.recompenseParrain.toLocaleString(
                              "fr-DZ"
                            )}{" "}
                            DA
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {parrainage.recompenseFilleul.toLocaleString(
                              "fr-DZ"
                            )}{" "}
                            DA
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatutBadge(parrainage.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const next = getNextStatut(parrainage.statut);
                          if (!next) return <span className="text-xs text-gray-400">—</span>;
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === parrainage.id}
                              onClick={() => handleUpdateStatut(parrainage.id, next.value)}
                              className="flex items-center gap-1"
                            >
                              {updatingId === parrainage.id ? (
                                <Clock className="w-3 h-3 animate-spin" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              {next.label}
                            </Button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery
                  ? "Aucun parrainage trouvé pour cette recherche"
                  : "Aucun parrainage enregistré"}
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Parrainages;
