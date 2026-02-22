import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Copy,
  CheckCircle,
  Gift,
  Search,
  Percent,
  Banknote,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "../../utils/logger";

interface CodePromo {
  id: string;
  code: string;
  type: "pourcentage" | "montant_fixe";
  valeur: number;
  actif: boolean;
  date_debut: string;
  date_fin: string;
  utilisations_actuelles: number;
  utilisations_max: number;
  montant_min?: number;
  types_application?: string;
  description?: string;
}

interface VerifyResult {
  valid: boolean;
  reduction?: number;
  error?: string;
}

function getApplicationLabel(type?: string): string {
  if (!type || type === "tous") return "Tous les services";
  if (type === "reservation") return "R\u00e9servations";
  if (type === "abonnement") return "Abonnements";
  if (type === "domiciliation") return "Domiciliation";
  return type;
}

const CodesPromo = () => {
  const [codes, setCodes] = useState<CodePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCodesPromo();
      const data = (response.data || []) as CodePromo[];
      const activeCodes = data.filter(
        (code) =>
          code.actif &&
          new Date(code.date_fin) > new Date() &&
          (code.utilisations_max <= 0 ||
            code.utilisations_actuelles < code.utilisations_max),
      );
      setCodes(activeCodes);
    } catch (error) {
      logger.error(
        "Erreur chargement codes:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyCode.trim()) {
      toast.error("Veuillez entrer un code");
      return;
    }

    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await apiClient.validateCodePromo(
        verifyCode.toUpperCase(),
        0,
        "reservation",
      );
      if (result.valid) {
        setVerifyResult({
          valid: true,
          reduction: result.reduction || 0,
        });
      } else {
        setVerifyResult({
          valid: false,
          error: result.error || "Code invalide",
        });
      }
    } catch {
      setVerifyResult({
        valid: false,
        error: "Erreur lors de la v\u00e9rification",
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyCode = (code: CodePromo) => {
    navigator.clipboard.writeText(code.code);
    setCopiedId(code.id);
    toast.success("Code copi\u00e9 !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Codes Promo</h1>
        <p className="text-gray-500 mt-1">
          Profitez de nos offres sp\u00e9ciales et r\u00e9ductions
        </p>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                V\u00e9rifier un code
              </h2>
              <p className="text-sm text-gray-400">
                Entrez un code promo pour v\u00e9rifier sa validit\u00e9
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={verifyCode}
                onChange={(e) => {
                  setVerifyCode(e.target.value.toUpperCase());
                  if (verifyResult) setVerifyResult(null);
                }}
                placeholder="Entrez votre code promo"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              />
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={verifying || !verifyCode.trim()}
              className="px-6 py-3 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {verifying ? "..." : "V\u00e9rifier"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {verifyResult && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                {verifyResult.valid ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">
                        Code valide !
                      </p>
                      <p className="text-xs text-emerald-400/80">
                        R\u00e9duction de{" "}
                        {verifyResult.reduction?.toLocaleString()} DA applicable
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-300">
                        Code invalide
                      </p>
                      <p className="text-xs text-red-400/80">
                        {verifyResult.error}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {codes.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Offres disponibles
            </h2>
            <Badge variant="success" size="sm">
              {codes.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codes.map((code, index) => {
              const daysLeft = differenceInDays(
                parseISO(code.date_fin),
                new Date(),
              );
              const remaining =
                code.utilisations_max > 0
                  ? code.utilisations_max - code.utilisations_actuelles
                  : null;
              const isCopied = copiedId === code.id;

              return (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 !p-0 overflow-hidden">
                    <div
                      className={`p-4 ${
                        code.type === "pourcentage"
                          ? "bg-gradient-to-br from-blue-50 to-blue-50/30"
                          : "bg-gradient-to-br from-emerald-50 to-emerald-50/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            code.type === "pourcentage"
                              ? "bg-blue-100"
                              : "bg-emerald-100"
                          }`}
                        >
                          {code.type === "pourcentage" ? (
                            <Percent className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Banknote className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        {daysLeft <= 7 && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" />
                            {daysLeft <= 1
                              ? "Dernier jour"
                              : `${daysLeft} jours restants`}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-3xl font-bold ${
                          code.type === "pourcentage"
                            ? "text-blue-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {code.type === "pourcentage"
                          ? `-${code.valeur}%`
                          : `-${code.valeur.toLocaleString()} DA`}
                      </p>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-gray-900 tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-dashed border-gray-300">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyCode(code)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isCopied
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" /> Copi\u00e9
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copier
                            </>
                          )}
                        </button>
                      </div>

                      {code.description && (
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {code.description}
                        </p>
                      )}

                      <div className="space-y-1.5 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Valide jusqu'au</span>
                          <span className="font-medium text-gray-700">
                            {format(parseISO(code.date_fin), "d MMMM yyyy", {
                              locale: fr,
                            })}
                          </span>
                        </div>
                        {code.montant_min && code.montant_min > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Commande minimum</span>
                            <span className="font-medium text-gray-700">
                              {code.montant_min.toLocaleString()} DA
                            </span>
                          </div>
                        )}
                        {remaining !== null && (
                          <div className="flex items-center justify-between">
                            <span>Utilisations restantes</span>
                            <span
                              className={`font-medium ${remaining <= 5 ? "text-amber-600" : "text-gray-700"}`}
                            >
                              {remaining}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Applicable \u00e0</span>
                          <Badge variant="default" size="sm">
                            {getApplicationLabel(code.types_application)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun code promo disponible
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Il n'y a pas d'offres en cours pour le moment. Revenez bient\u00f4t
              pour d\u00e9couvrir nos nouvelles promotions !
            </p>
          </div>
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-gray-900">
              Comment utiliser un code promo ?
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              {
                step: "1",
                title: "Copiez le code",
                desc: "Cliquez sur le bouton Copier du code de votre choix",
              },
              {
                step: "2",
                title: "Faites votre r\u00e9servation",
                desc: "Choisissez un espace et remplissez le formulaire de r\u00e9servation",
              },
              {
                step: "3",
                title: "Appliquez la r\u00e9duction",
                desc: "Collez le code dans le champ pr\u00e9vu et la r\u00e9duction s'applique",
              },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                {i < 2 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CodesPromo;
