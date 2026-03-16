import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, FileEdit as Edit2, Trash2, Search, Percent, Banknote, ToggleLeft, ToggleRight, Copy, RefreshCw, Zap, Clock, AlertTriangle, CheckCircle2, Filter, Shuffle, X } from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { format, isPast, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "../../../utils/logger";

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

type StatusFilter = "all" | "active" | "expired" | "exhausted" | "disabled";

const initialFormData = {
  code: "",
  type: "pourcentage" as "pourcentage" | "montant_fixe",
  valeur: "",
  date_debut: "",
  date_fin: "",
  utilisations_max: "",
  montant_min: "",
  types_application: "tous",
  description: "",
};

function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  return !isNaN(d.getTime());
}

function getCodeStatus(code: CodePromo): {
  label: string;
  variant: "success" | "danger" | "warning" | "neutral";
  key: StatusFilter;
} {
  if (!code.actif)
    return { label: "Désactivé", variant: "neutral", key: "disabled" };
  if (isValidDateString(code.date_fin) && isPast(parseISO(code.date_fin)))
    return { label: "Expiré", variant: "danger", key: "expired" };
  if (
    code.utilisations_max > 0 &&
    code.utilisations_actuelles >= code.utilisations_max
  )
    return { label: "Épuisé", variant: "warning", key: "exhausted" };
  return { label: "Actif", variant: "success", key: "active" };
}

function getDaysRemaining(dateFin: string): number {
  if (!isValidDateString(dateFin)) return 0;
  return differenceInDays(parseISO(dateFin), new Date());
}

function getApplicationLabel(type?: string): string {
  if (!type || type === "tous") return "Tous";
  if (type === "reservation") return "Réservations";
  if (type === "abonnement") return "Abonnements";
  if (type === "domiciliation") return "Domiciliation";
  return type;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

const CodesPromo = () => {
  const [codes, setCodes] = useState<CodePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<CodePromo | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CodePromo | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCodesPromo();
      setCodes((response.data || []) as CodePromo[]);
    } catch (error) {
      logger.error("Erreur chargement codes promo:", error as Error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let exhausted = 0;
    let disabled = 0;
    let totalUsages = 0;
    codes.forEach((c) => {
      const s = getCodeStatus(c);
      if (s.key === "active") active++;
      else if (s.key === "expired") expired++;
      else if (s.key === "exhausted") exhausted++;
      else disabled++;
      totalUsages += c.utilisations_actuelles;
    });
    return { total: codes.length, active, expired, exhausted, disabled, totalUsages };
  }, [codes]);

  const filteredCodes = useMemo(() => {
    return codes.filter((code) => {
      const matchesSearch =
        !searchQuery ||
        code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || getCodeStatus(code).key === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [codes, searchQuery, statusFilter]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCode(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (code: CodePromo) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      type: code.type,
      valeur: String(code.valeur),
      date_debut: code.date_debut ? code.date_debut.split("T")[0] : "",
      date_fin: code.date_fin ? code.date_fin.split("T")[0] : "",
      utilisations_max: String(code.utilisations_max || ""),
      montant_min: code.montant_min ? String(code.montant_min) : "",
      types_application: code.types_application || "tous",
      description: code.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.code.trim()) {
      toast.error("Le code est requis");
      return;
    }
    if (!formData.valeur || parseFloat(formData.valeur) <= 0) {
      toast.error("La valeur doit être supérieure à 0");
      return;
    }
    if (
      formData.type === "pourcentage" &&
      parseFloat(formData.valeur) > 100
    ) {
      toast.error("Le pourcentage ne peut pas dépasser 100%");
      return;
    }
    if (!formData.date_debut || !formData.date_fin) {
      toast.error("Les dates sont requises");
      return;
    }
    if (new Date(formData.date_fin) < new Date(formData.date_debut)) {
      toast.error("La date de fin doit être après ou égale à la date de début");
      return;
    }

    setSubmitting(true);
    try {
      const montantMin = formData.montant_min
        ? parseFloat(formData.montant_min)
        : 0;
      const utilisationsMaxRaw = parseInt(formData.utilisations_max);
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        valeur: parseFloat(formData.valeur),
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        utilisations_max: !isNaN(utilisationsMaxRaw) && utilisationsMaxRaw > 0 ? utilisationsMaxRaw : null,
        montant_min: montantMin,
        types_application: formData.types_application,
        description: formData.description || null,
      };

      if (editingCode) {
        const res = await apiClient.updateCodePromo(editingCode.id, payload);
        if (!res.success) throw new Error(res.error || "Erreur mise à jour");
        toast.success("Code promo mis à jour");
      } else {
        const res = await apiClient.createCodePromo(payload);
        if (!res.success) throw new Error(res.error || "Erreur création");
        toast.success("Code promo créé");
      }
      setShowModal(false);
      resetForm();
      await loadCodes();
    } catch {
      toast.error(
        editingCode
          ? "Erreur lors de la mise à jour"
          : "Erreur lors de la création",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, actif: boolean) => {
    try {
      const res = await apiClient.updateCodePromo(id, { actif: !actif });
      if (!res.success) throw new Error(res.error || "Erreur");
      toast.success(actif ? "Code désactivé" : "Code activé");
      await loadCodes();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiClient.deleteCodePromo(deleteTarget.id);
      if (!res.success) throw new Error(res.error || "Erreur suppression");
      toast.success("Code supprimé");
      setDeleteTarget(null);
      await loadCodes();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };

  const statusFilters: {
    value: StatusFilter;
    label: string;
    count: number;
    color: string;
  }[] = [
    {
      value: "all",
      label: "Tous",
      count: stats.total,
      color: "bg-gray-100 text-gray-700",
    },
    {
      value: "active",
      label: "Actifs",
      count: stats.active,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      value: "expired",
      label: "Expirés",
      count: stats.expired,
      color: "bg-red-50 text-red-700",
    },
    {
      value: "exhausted",
      label: "Épuisés",
      count: stats.exhausted,
      color: "bg-amber-50 text-amber-700",
    },
    {
      value: "disabled",
      label: "Désactivés",
      count: stats.disabled,
      color: "bg-gray-50 text-gray-500",
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Codes Promo</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} code{stats.total > 1 ? "s" : ""} -{" "}
            {stats.totalUsages} utilisation
            {stats.totalUsages > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCodes}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsages}
              </p>
              <p className="text-xs text-gray-500">Utilisations</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.expired}
              </p>
              <p className="text-xs text-gray-500">Expirés</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.exhausted}
              </p>
              <p className="text-xs text-gray-500">Épuisés</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Rechercher par code ou description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === f.value
                  ? f.color + " ring-1 ring-current/20"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {filteredCodes.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Aucun code promo trouvé
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || statusFilter !== "all"
              ? "Essayez de modifier vos filtres"
              : "Créez votre premier code promo"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCodes.map((code) => {
            const status = getCodeStatus(code);
            const isActive = status.key === "active";
            const usagePercent =
              code.utilisations_max > 0
                ? Math.min(
                    100,
                    (code.utilisations_actuelles / code.utilisations_max) * 100,
                  )
                : 0;
            const daysLeft = getDaysRemaining(code.date_fin);

            return (
              <motion.div
                key={code.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card
                  className={`relative overflow-hidden ${!isActive ? "opacity-60" : ""}`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            code.type === "pourcentage"
                              ? "bg-blue-50"
                              : "bg-emerald-50"
                          }`}
                        >
                          {code.type === "pourcentage" ? (
                            <Percent className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Banknote className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-base font-bold text-gray-900 tracking-wide">
                              {code.code}
                            </code>
                            <button
                              onClick={() => copyCode(code.code)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {code.type === "pourcentage"
                              ? `-${code.valeur}%`
                              : `-${code.valeur.toLocaleString()} DA`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    {code.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {code.description}
                      </p>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">
                          Utilisations
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          {code.utilisations_actuelles} /{" "}
                          {code.utilisations_max || "\u221e"}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            usagePercent >= 90
                              ? "bg-red-500"
                              : usagePercent >= 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">
                          Période
                        </span>
                        <span className="text-gray-700 font-medium">
                          {format(parseISO(code.date_debut), "dd MMM", {
                            locale: fr,
                          })}{" "}
                          -{" "}
                          {format(parseISO(code.date_fin), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">
                          Expire dans
                        </span>
                        <span
                          className={`font-medium ${daysLeft <= 0 ? "text-red-600" : daysLeft <= 7 ? "text-amber-600" : "text-gray-700"}`}
                        >
                          {daysLeft <= 0
                            ? "Expiré"
                            : `${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">
                          Min. commande
                        </span>
                        <span className="text-gray-700 font-medium">
                          {code.montant_min && code.montant_min > 0
                            ? `${code.montant_min.toLocaleString()} DA`
                            : "Aucun"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">
                          Applicable à
                        </span>
                        <span className="text-gray-700 font-medium">
                          {getApplicationLabel(code.types_application)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                      <button
                        onClick={() =>
                          handleToggleActive(code.id, code.actif)
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          code.actif
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {code.actif ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />{" "}
                            Désactiver
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" /> Activer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(code)}
                        className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(code)}
                        className="px-3 py-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={
          editingCode ? "Modifier le code promo" : "Créer un code promo"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code promo *
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  placeholder="PROMO2024"
                  disabled={!!editingCode}
                  icon={<Tag className="w-4 h-4" />}
                />
              </div>
              {!editingCode && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, code: generateCode() })
                  }
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Shuffle className="w-4 h-4" />
                  Générer
                </button>
              )}
            </div>
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Promotion de lancement"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de réduction *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "pourcentage" | "montant_fixe",
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              >
                <option value="pourcentage">Pourcentage (%)</option>
                <option value="montant_fixe">Montant fixe (DA)</option>
              </select>
            </div>
            <Input
              label={
                formData.type === "pourcentage" ? "Valeur (%) *" : "Valeur (DA) *"
              }
              type="number"
              value={formData.valeur}
              onChange={(e) =>
                setFormData({ ...formData, valeur: e.target.value })
              }
              required
              placeholder={formData.type === "pourcentage" ? "10" : "5000"}
              min="0"
              max={formData.type === "pourcentage" ? "100" : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date début *"
              type="date"
              value={formData.date_debut}
              onChange={(e) =>
                setFormData({ ...formData, date_debut: e.target.value })
              }
              required
            />
            <Input
              label="Date fin *"
              type="date"
              value={formData.date_fin}
              onChange={(e) =>
                setFormData({ ...formData, date_fin: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Utilisations max (0 = illimité)"
              type="number"
              value={formData.utilisations_max}
              onChange={(e) =>
                setFormData({ ...formData, utilisations_max: e.target.value })
              }
              placeholder="0"
              min="0"
            />
            <Input
              label="Montant min. commande (DA)"
              type="number"
              value={formData.montant_min}
              onChange={(e) =>
                setFormData({ ...formData, montant_min: e.target.value })
              }
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicable à *
            </label>
            <select
              value={formData.types_application}
              onChange={(e) =>
                setFormData({ ...formData, types_application: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            >
              <option value="tous">Tous les services</option>
              <option value="reservation">Réservations uniquement</option>
              <option value="abonnement">Abonnements uniquement</option>
              <option value="domiciliation">Domiciliation uniquement</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting
                ? "Enregistrement..."
                : editingCode
                  ? "Enregistrer les modifications"
                  : "Créer le code"}
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

      <AnimatePresence>
        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-center min-h-screen px-4 py-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={() => !deleting && setDeleteTarget(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Supprimer ce code promo ?
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    Vous êtes sur le point de supprimer le code :
                  </p>
                  <p className="text-lg font-bold text-gray-900 mb-4 bg-gray-50 py-2 px-4 rounded-lg inline-block">
                    {deleteTarget.code}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Cette action est irréversible. Le code ne pourra plus
                    être utilisé.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteTarget(null)}
                      disabled={deleting}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <Button
                      onClick={confirmDelete}
                      variant="danger"
                      disabled={deleting}
                      className="flex-1"
                    >
                      {deleting ? "Suppression..." : "Supprimer"}
                    </Button>
                  </div>
                </div>
                {!deleting && (
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodesPromo;
