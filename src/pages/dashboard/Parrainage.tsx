import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Copy,
  Check,
  Users,
  TrendingUp,
  Share2,
  Info,
  Calendar,
  User,
  CheckCircle,
  Clock,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { apiClient } from "../../lib/api-client";
import { logger } from "../../utils/logger";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ParrainageDetail {
  id: string;
  filleulId: string;
  filleulNom: string;
  filleulEmail: string;
  recompenseParrain: number;
  recompenseFilleul: number;
  statut: "en_attente" | "valide" | "paye";
  dateInscription: string;
  dateValidation?: string;
}

interface ParrainageStats {
  parraines: number;
  recompensesTotales: number;
  recompensesPayees: number;
  recompensesEnAttente: number;
  codeParrainage: string;
}

const PARRAINAGE_BONUS = 3000;

const Parrainage = () => {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [stats, setStats] = useState<ParrainageStats>({
    parraines: 0,
    recompensesTotales: 0,
    recompensesPayees: 0,
    recompensesEnAttente: 0,
    codeParrainage: user?.codeParrainage || "",
  });
  const [filleuls, setFilleuls] = useState<ParrainageDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParrainageData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.getParrainages(userId);

      if (response.success && response.data) {
        const rd = response.data as Record<string, unknown>;
        const parrainages: ParrainageDetail[] = Array.isArray(rd.data)
          ? (rd.data as ParrainageDetail[])
          : Array.isArray(response.data)
          ? (response.data as ParrainageDetail[])
          : [];

        setFilleuls(parrainages);

        // Calculer les statistiques
        const recompensesTotales = parrainages.reduce(
          (sum: number, p: ParrainageDetail) => sum + (p.recompenseParrain || 0),
          0
        );
        const recompensesPayees = parrainages
          .filter((p: ParrainageDetail) => p.statut === "paye")
          .reduce(
            (sum: number, p: ParrainageDetail) => sum + (p.recompenseParrain || 0),
            0
          );
        const recompensesEnAttente = parrainages
          .filter(
            (p: ParrainageDetail) =>
              p.statut === "en_attente" || p.statut === "valide"
          )
          .reduce(
            (sum: number, p: ParrainageDetail) => sum + (p.recompenseParrain || 0),
            0
          );

        setStats({
          parraines: parrainages.length,
          recompensesTotales,
          recompensesPayees,
          recompensesEnAttente,
          codeParrainage: user?.codeParrainage || "",
        });
      }
    } catch (error) {
      logger.error("Erreur chargement parrainage:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [userId, user?.codeParrainage]);

  useEffect(() => {
    loadParrainageData();
  }, [loadParrainageData]);

  const getCode = () => stats.codeParrainage || user?.codeParrainage || "";

  const handleCopyCode = () => {
    const code = getCode();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("Code copié dans le presse-papiers !");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Impossible de copier le code. Copiez-le manuellement.");
    });
  };

  const handleCopyUrl = () => {
    const code = getCode();
    if (!code) return;
    const url = `${window.location.origin}/inscription?parrain=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      toast.success("Lien de parrainage copié !");
      setTimeout(() => setCopiedUrl(false), 2000);
    }).catch(() => {
      toast.error("Impossible de copier le lien. Copiez-le manuellement.");
    });
  };

  const handleShare = () => {
    const code = getCode();
    if (!code) return;
    const url = `${window.location.origin}/inscription?parrain=${code}`;
    const text = `Rejoins Coffice avec mon code ${code} et gagne ${PARRAINAGE_BONUS} DA de bonus !`;

    if (navigator.share) {
      navigator
        .share({
          title: "Rejoins Coffice",
          text,
          url,
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            handleCopyUrl();
          }
        });
    } else {
      handleCopyUrl();
    }
  };

  const handleShareWhatsApp = () => {
    const code = getCode();
    if (!code) return;
    const text = encodeURIComponent(
      `Rejoins Coffice avec mon code ${code} et gagne ${PARRAINAGE_BONUS} DA de bonus ! ${window.location.origin}/inscription?parrain=${code}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Programme de Parrainage</h1>
        <p className="text-gray-600 mt-1">
          Partagez votre code et gagnez des récompenses
        </p>
      </div>

      {!stats.codeParrainage && !user?.codeParrainage ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-gray-700 to-gray-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Code de parrainage non disponible
              </h2>
              <p className="text-white/80 max-w-md mx-auto">
                Votre code de parrainage n'est pas encore disponible. Contactez notre équipe pour plus d'informations.
              </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-teal-600 to-emerald-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      Votre code de parrainage
                    </h2>
                    <p className="text-white/80 text-sm">
                      Partagez-le avec vos amis et collègues
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white/70 text-sm mb-2">Votre code unique</p>
                    <p className="text-5xl font-bold tracking-widest font-mono">
                      {stats.codeParrainage || user?.codeParrainage || "---"}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="h-14 w-14 bg-white/20 border-white/30 text-white hover:bg-white/30 flex items-center justify-center p-0"
                  >
                    {copied ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Copy className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <p className="text-white/70 text-xs mb-2">Lien de parrainage</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-white/90 truncate">
                    {window.location.origin}/inscription?parrain={stats.codeParrainage || user?.codeParrainage}
                  </code>
                  <Button
                    onClick={handleCopyUrl}
                    size="sm"
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copier
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-white text-teal-700 hover:bg-white/90"
                  size="lg"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Partager
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-500 text-white hover:bg-green-600"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Personnes parrainées</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.parraines}
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
              <p className="text-sm text-gray-600 mb-1">Récompenses totales</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.recompensesTotales.toLocaleString("fr-DZ")} DA
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
              <p className="text-sm text-gray-600 mb-1">Récompenses payées</p>
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
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.recompensesEnAttente.toLocaleString("fr-DZ")} DA
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Liste des filleuls */}
      {filleuls.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">Aucun filleul pour l'instant</p>
                <p className="text-sm text-gray-500 mt-1">Partagez votre code de parrainage pour inviter vos proches.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
      {filleuls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Vos filleuls ({filleuls.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filleul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Récompense
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filleuls.map((filleul) => (
                    <tr key={filleul.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {filleul.filleulNom || "Utilisateur"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {filleul.filleulEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {filleul.dateInscription
                            ? format(
                                new Date(filleul.dateInscription),
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
                            {filleul.recompenseParrain.toLocaleString("fr-DZ")}{" "}
                            DA
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatutBadge(filleul.statut)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Comment ça marche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Comment fonctionne le parrainage ?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Partagez votre code
                </h4>
                <p className="text-sm text-gray-600">
                  Envoyez votre code par WhatsApp, SMS ou en personne
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-green-600">2</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Votre ami s'inscrit
                </h4>
                <p className="text-sm text-gray-600">
                  Il entre votre code lors de l'inscription et reçoit {PARRAINAGE_BONUS} DA de bonus
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-orange-600">3</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Vous gagnez aussi
                </h4>
                <p className="text-sm text-gray-600">
                  Recevez {PARRAINAGE_BONUS} DA de crédit pour chaque ami parrainé
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Avantages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-3 text-lg">
                Les avantages du programme
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-green-800">
                    Gagnez des crédits à chaque parrainage validé
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-green-800">
                    Vos filleuls reçoivent aussi des réductions exclusives
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-green-800">
                    Parrainez un nombre illimité de personnes
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-green-800">
                    Utilisez vos crédits pour toutes vos réservations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Parrainage;
