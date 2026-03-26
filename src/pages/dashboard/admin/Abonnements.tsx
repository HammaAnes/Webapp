import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, FileEdit as Edit2, Trash2, Search, Download, CheckCircle, XCircle, TrendingUp, Users, Banknote, Package, ToggleLeft, ToggleRight, Calendar, AlertCircle, Clock, MessageSquare } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import { formatCurrency } from "../../../utils/formatters";
import toast from "react-hot-toast";
import { apiClient } from "../../../lib/api-client";
import { logger } from "../../../utils/logger";
import EncaisserModal from "../../../components/admin/EncaisserModal";

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
  const [activeTab, setActiveTab] = useState<"plans" | "souscriptions">("plans");

  interface Souscription {
    id: string;
    person_id: string;
    /** @deprecated use person_id */
    user_id: string;
    abonnement_id: string;
    abonnement_nom: string;
    abonnement_prix: number;
    montant_encaisse?: number;
    user_nom: string;
    user_prenom: string;
    user_email: string;
    statut: string;
    date_debut: string;
    date_fin: string;
    commentaire?: string;
    entreprise?: string;
    date_debut_souhaitee?: string;
    created_at: string;
  }

  const [souscriptions, setSouscriptions] = useState<Souscription[]>([]);
  const [loadingSouscriptions, setLoadingSouscriptions] = useState(false);
  const [filterSouscriptionStatut, setFilterSouscriptionStatut] = useState<string>("tous");
  const [selectedSouscription, setSelectedSouscription] = useState<Souscription | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<"actif" | "refuse">("actif");
  const [validationCommentaire, setValidationCommentaire] = useState("");
  const [validationCodeAcces, setValidationCodeAcces] = useState("");

  // CRUD souscriptions
  const [showSouscriptionModal, setShowSouscriptionModal] = useState(false);
  const [editingSouscription, setEditingSouscription] = useState<Souscription | null>(null);
  const [showDeleteSouscriptionModal, setShowDeleteSouscriptionModal] = useState(false);
  const [souscriptionToDelete, setSouscriptionToDelete] = useState<Souscription | null>(null);
  const [souscriptionForm, setSouscriptionForm] = useState({
    person_id: "",
    abonnement_id: "",
    statut: "en_attente" as string,
    date_debut: new Date().toISOString().split("T")[0],
    date_fin: "",
    commentaire: "",
    entreprise: "",
    code_acces: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<Array<{id: string; nom: string; prenom: string; email: string; type: "user" | "contact"}>>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Encaissement
  const [encaisserTarget, setEncaisserTarget] = useState<Souscription | null>(null);

  useEffect(() => {
    loadAbonnements();
    loadSouscriptions();
  }, []);

  const loadAbonnements = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAbonnements();
      if (response.success) {
        const raw = (response.data || []) as Abonnement[];
        setAbonnements(raw.map(a => ({
          ...a,
          prix: Number(a.prix) || 0,
          prix_avec_domiciliation: a.prix_avec_domiciliation != null
            ? Number(a.prix_avec_domiciliation) || 0
            : undefined,
          duree_mois: Number(a.duree_mois) || 1,
          ordre: Number(a.ordre) || 0,
          actif: a.actif === true || (a.actif as unknown) === 1 || (a.actif as unknown) === "1",
        })));
      }
    } catch (error) {
      logger.error("Erreur chargement abonnements:", error as Error);
      toast.error("Erreur lors du chargement des abonnements");
    } finally {
      setLoading(false);
    }
  };

  const loadSouscriptions = async () => {
    setLoadingSouscriptions(true);
    try {
      const response = await apiClient.getAbonnementsUtilisateurs();
      if (response.success) {
        const data = (Array.isArray(response.data) ? response.data : []) as Souscription[];
        setSouscriptions(data.map(s => ({
          ...s,
          abonnement_prix: Number(s.abonnement_prix) || 0,
          montant_encaisse: Number(s.montant_encaisse) || 0,
        })));
      }
    } catch (error) {
      logger.error("Erreur chargement souscriptions:", error as Error);
    } finally {
      setLoadingSouscriptions(false);
    }
  };

  const searchUsersAndContacts = async (q: string) => {
    if (q.length < 2) { setUserSearchResults([]); return; }
    setSearchingUsers(true);
    try {
      const res = await apiClient.searchPersons(q, 15);
      const raw = (res.data as Record<string, unknown>);
      const persons = (Array.isArray(raw?.persons) ? raw.persons : []) as Array<Record<string, unknown>>;
      setUserSearchResults(persons.map((p) => ({
        id: String(p.id),
        nom: String(p.nom || ""),
        prenom: String(p.prenom || ""),
        email: String(p.email || ""),
        type: (p.type === "user" ? "user" : "contact") as "user" | "contact",
      })));
    } catch {
      // ignore
    } finally {
      setSearchingUsers(false);
    }
  };

  const openCreateSouscription = () => {
    setEditingSouscription(null);
    setSouscriptionForm({
      person_id: "", abonnement_id: "",
      statut: "en_attente",
      date_debut: new Date().toISOString().split("T")[0],
      date_fin: "", commentaire: "", entreprise: "", code_acces: "",
    });
    setUserSearch("");
    setUserSearchResults([]);
    setShowSouscriptionModal(true);
  };

  const openEditSouscription = (s: Souscription) => {
    setEditingSouscription(s);
    setSouscriptionForm({
      person_id: s.person_id || s.user_id || "",
      abonnement_id: s.abonnement_id,
      statut: s.statut,
      date_debut: s.date_debut || new Date().toISOString().split("T")[0],
      date_fin: s.date_fin || "",
      commentaire: s.commentaire || "",
      entreprise: s.entreprise || "",
      code_acces: (s as Souscription & { code_acces?: string }).code_acces || "",
    });
    setUserSearch(`${s.user_prenom} ${s.user_nom}`.trim());
    setUserSearchResults([]);
    setShowSouscriptionModal(true);
  };

  const handleSaveSouscription = async () => {
    if (!souscriptionForm.abonnement_id) { toast.error("Sélectionnez un abonnement"); return; }
    if (!editingSouscription && !souscriptionForm.person_id) {
      toast.error("Sélectionnez un utilisateur ou contact"); return;
    }
    try {
      let res;
      if (editingSouscription) {
        res = await apiClient.adminUpdateSouscription(editingSouscription.id, {
          abonnement_id: souscriptionForm.abonnement_id,
          statut: souscriptionForm.statut,
          date_debut: souscriptionForm.date_debut || null,
          date_fin: souscriptionForm.date_fin || null,
          commentaire: souscriptionForm.commentaire || null,
          entreprise: souscriptionForm.entreprise || null,
          code_acces: souscriptionForm.code_acces || null,
        });
        if (res.success) { toast.success("Souscription modifiée"); }
        else { toast.error(res.error || "Erreur"); return; }
      } else {
        res = await apiClient.adminCreateSouscription({
          person_id: souscriptionForm.person_id || null,
          abonnement_id: souscriptionForm.abonnement_id,
          statut: souscriptionForm.statut,
          date_debut: souscriptionForm.date_debut || null,
          date_fin: souscriptionForm.date_fin || null,
          commentaire: souscriptionForm.commentaire || null,
          entreprise: souscriptionForm.entreprise || null,
          code_acces: souscriptionForm.code_acces || null,
        });
        if (res.success) { toast.success("Souscription créée"); }
        else { toast.error(res.error || "Erreur"); return; }
      }
      setShowSouscriptionModal(false);
      await loadSouscriptions();
    } catch {
      toast.error("Une erreur est survenue");
    }
  };

  const handleDeleteSouscription = async () => {
    if (!souscriptionToDelete) return;
    try {
      const res = await apiClient.adminDeleteSouscription(souscriptionToDelete.id);
      if (res.success) {
        toast.success("Souscription supprimée");
        setShowDeleteSouscriptionModal(false);
        setSouscriptionToDelete(null);
        await loadSouscriptions();
      } else {
        toast.error(res.error || "Erreur");
      }
    } catch {
      toast.error("Une erreur est survenue");
    }
  };

  const handleValiderSouscription = async () => {
    if (!selectedSouscription) return;
    try {
      const response = await apiClient.validerSouscription(
        selectedSouscription.id,
        validationAction,
        validationCommentaire || undefined,
        validationAction === "actif" ? validationCodeAcces || undefined : undefined
      );
      if (response.success) {
        toast.success(validationAction === "actif" ? "Abonnement activé" : "Abonnement refusé");
        setShowValidationModal(false);
        setSelectedSouscription(null);
        setValidationCommentaire("");
        setValidationCodeAcces("");
        await loadSouscriptions();
      } else {
        toast.error(response.error || "Erreur");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const pendingSouscriptions = souscriptions.filter((s) => s.statut === "en_attente");
  const filteredSouscriptions = filterSouscriptionStatut === "tous"
    ? souscriptions
    : souscriptions.filter((s) => s.statut === filterSouscriptionStatut);

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

    if (!formData.nom || !formData.type || formData.prix === undefined || formData.prix === null) {
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
        const response = await apiClient.updateAbonnement(selectedAbonnement.id, payload);
        if (response.success) {
          toast.success("Abonnement modifie avec succes");
          handleCloseModal();
          await loadAbonnements();
        } else {
          toast.error(response.error || "Erreur lors de la modification");
        }
      } else {
        const response = await apiClient.createAbonnement(payload);
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
      const response = await apiClient.updateAbonnement(abonnement.id, {
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
      { variant: "success" | "warning" | "danger" | "neutral"; label: string }
    > = {
      actif: { variant: "success", label: "Actif" },
      inactif: { variant: "warning", label: "Inactif" },
      archive: { variant: "neutral", label: "Archivé" },
    };
    const badge = badges[statut] || badges.actif;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Abonnements"
        subtitle="Administration des types d'abonnements et forfaits"
        actions={
          <>
            <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button onClick={() => handleOpenModal()} size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4" /> Nouvel abonnement
            </Button>
          </>
        }
      />

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "plans" ? "bg-white border border-b-white text-accent -mb-px" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Plans d'abonnement
          </button>
          <button
            onClick={() => setActiveTab("souscriptions")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === "souscriptions" ? "bg-white border border-b-white text-accent -mb-px" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Users className="w-4 h-4" />
            Souscriptions
            {pendingSouscriptions.length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingSouscriptions.length}</span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === "souscriptions" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">Demandes de souscription</h3>
            <div className="flex items-center gap-3">
              <select
                value={filterSouscriptionStatut}
                onChange={(e) => setFilterSouscriptionStatut(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="actif">Actif</option>
                <option value="refuse">Refusé</option>
                <option value="annule">Annulé</option>
                <option value="expire">Expiré</option>
                <option value="suspendu">Suspendu</option>
              </select>
              <button onClick={loadSouscriptions} className="text-sm text-accent hover:underline">Actualiser</button>
              <Button size="sm" onClick={openCreateSouscription}>
                <Plus className="w-4 h-4 mr-1" />
                Nouvelle
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abonnement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Encaisser</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valider / Refuser</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingSouscriptions ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
                ) : filteredSouscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune souscription</p>
                    </td>
                  </tr>
                ) : (
                  filteredSouscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{s.user_prenom} {s.user_nom}</p>
                          <p className="text-xs text-gray-500">{s.user_email}</p>
                          {s.entreprise && <p className="text-xs text-gray-400">{s.entreprise}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{s.abonnement_nom}</p>
                        <p className="text-xs text-gray-500">{s.abonnement_prix?.toLocaleString("fr-FR")} DA</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.statut === "en_attente" && <Badge variant="warning"><Clock className="w-3 h-3 inline mr-1" />En attente</Badge>}
                        {s.statut === "actif" && <Badge variant="success">Actif</Badge>}
                        {s.statut === "refuse" && <Badge variant="danger">Refusé</Badge>}
                        {s.statut === "annule" && <Badge variant="neutral">Annulé</Badge>}
                        {s.statut === "expire" && <Badge variant="neutral">Expiré</Badge>}
                        {s.statut === "suspendu" && <Badge variant="warning">Suspendu</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {s.date_debut ? (
                          <div>
                            <p className="font-medium text-gray-800">{new Date(s.date_debut).toLocaleDateString("fr-FR")}</p>
                            {s.date_fin && (
                              <p className="text-xs text-gray-400">→ {new Date(s.date_fin).toLocaleDateString("fr-FR")}</p>
                            )}
                          </div>
                        ) : s.date_debut_souhaitee ? (
                          <div>
                            <p className="text-xs text-gray-400">Souhaité</p>
                            <p className="font-medium text-gray-800">{new Date(s.date_debut_souhaitee).toLocaleDateString("fr-FR")}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(s.montant_encaisse ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {(s.montant_encaisse ?? 0).toLocaleString("fr-FR")} DA
                          </span>
                        ) : ["actif", "en_attente"].includes(s.statut) ? (
                          <button
                            onClick={() => setEncaisserTarget(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            {s.abonnement_prix ? `${s.abonnement_prix.toLocaleString("fr-FR")} DA` : "Encaisser"}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {s.statut === "en_attente" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => { setSelectedSouscription(s); setValidationAction("actif"); setShowValidationModal(true); }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedSouscription(s); setValidationAction("refuse"); setShowValidationModal(true); }}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditSouscription(s)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSouscriptionToDelete(s); setShowDeleteSouscriptionModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "plans" && <><div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <Badge variant="neutral">{abonnement.type}</Badge>
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
      </>}

      <Modal
        isOpen={showValidationModal}
        onClose={() => { setShowValidationModal(false); setSelectedSouscription(null); setValidationCommentaire(""); setValidationCodeAcces(""); }}
        title={validationAction === "actif" ? "Valider la souscription" : "Refuser la souscription"}
      >
        <div className="space-y-4">
          {selectedSouscription && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedSouscription.user_prenom} {selectedSouscription.user_nom}</p>
              <p className="text-sm text-gray-600">{selectedSouscription.abonnement_nom} — {selectedSouscription.abonnement_prix?.toLocaleString("fr-FR")} DA</p>
            </div>
          )}
          {validationAction === "actif" ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">L'abonnement sera activé et l'utilisateur recevra une notification et un email.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code d'accès serrure <span className="text-gray-400 font-normal">(7 chiffres)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={validationCodeAcces}
                    onChange={(e) => setValidationCodeAcces(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    placeholder="ex : 1234567"
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm font-mono tracking-widest text-center"
                  />
                  <span className="text-lg font-bold text-gray-400">#</span>
                  {validationCodeAcces.length === 7 && (
                    <span className="text-xs text-green-600 font-medium">✓ Code complet</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Le code sera inclus dans l'email d'activation et affiché dans le dashboard.</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">La demande sera refusée et l'utilisateur recevra une notification.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Motif du refus (optionnel)
                </label>
                <textarea
                  value={validationCommentaire}
                  onChange={(e) => setValidationCommentaire(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                  placeholder="Expliquer la raison du refus..."
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => { setShowValidationModal(false); setSelectedSouscription(null); setValidationCommentaire(""); setValidationCodeAcces(""); }} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleValiderSouscription}
              className={`flex-1 ${validationAction === "actif" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {validationAction === "actif" ? "Confirmer l'activation" : "Confirmer le refus"}
            </Button>
          </div>
        </div>
      </Modal>

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

      {/* Modal créer / modifier souscription */}
      <Modal
        isOpen={showSouscriptionModal}
        onClose={() => setShowSouscriptionModal(false)}
        title={editingSouscription ? "Modifier la souscription" : "Nouvelle souscription"}
      >
        <div className="space-y-4">
          {!editingSouscription && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur / Contact</label>
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); searchUsersAndContacts(e.target.value); }}
                  placeholder="Rechercher par nom ou email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                {userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {userSearchResults.map((u) => (
                      <button
                        key={`${u.type}-${u.id}`}
                        type="button"
                        onClick={() => {
                          setSouscriptionForm(f => ({
                            ...f,
                            person_id: u.id,
                          }));
                          setUserSearch(`${u.prenom} ${u.nom}`.trim());
                          setUserSearchResults([]);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{u.prenom} {u.nom}</span>
                        <span className="text-xs text-gray-400">{u.email} · {u.type === "user" ? "Compte" : "Contact"}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchingUsers && <p className="text-xs text-gray-400 mt-1">Recherche...</p>}
              </div>
            </div>
          )}
          {editingSouscription && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              {editingSouscription.user_prenom} {editingSouscription.user_nom} — {editingSouscription.user_email}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abonnement</label>
            <select
              value={souscriptionForm.abonnement_id}
              onChange={(e) => setSouscriptionForm(f => ({ ...f, abonnement_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              {abonnements.map((a) => (
                <option key={a.id} value={a.id}>{a.nom} — {a.prix.toLocaleString("fr-FR")} DA / {a.duree_mois} mois</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={souscriptionForm.statut}
                onChange={(e) => setSouscriptionForm(f => ({ ...f, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="en_attente">En attente</option>
                <option value="actif">Actif</option>
                <option value="refuse">Refusé</option>
                <option value="annule">Annulé</option>
                <option value="expire">Expiré</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
              <input
                type="text"
                value={souscriptionForm.entreprise}
                onChange={(e) => setSouscriptionForm(f => ({ ...f, entreprise: e.target.value }))}
                placeholder="Optionnel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={souscriptionForm.date_debut}
                onChange={(e) => setSouscriptionForm(f => ({ ...f, date_debut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={souscriptionForm.date_fin}
                onChange={(e) => setSouscriptionForm(f => ({ ...f, date_fin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
          {/* Code accès serrure — visible uniquement si statut = actif */}
          {souscriptionForm.statut === "actif" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code d'accès serrure <span className="text-gray-400 font-normal">(7 chiffres)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  value={souscriptionForm.code_acces}
                  onChange={(e) => setSouscriptionForm(f => ({ ...f, code_acces: e.target.value.replace(/\D/g, "").slice(0, 7) }))}
                  placeholder="ex : 1234567"
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <span className="text-lg font-bold text-gray-400">#</span>
                {souscriptionForm.code_acces.length === 7 && (
                  <span className="text-xs text-green-600 font-medium">✓ Complet</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Inclus dans l'email et affiché dans le dashboard de l'abonné.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea
              value={souscriptionForm.commentaire}
              onChange={(e) => setSouscriptionForm(f => ({ ...f, commentaire: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Optionnel"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowSouscriptionModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleSaveSouscription} className="flex-1">
              {editingSouscription ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal supprimer souscription */}
      <Modal
        isOpen={showDeleteSouscriptionModal}
        onClose={() => { setShowDeleteSouscriptionModal(false); setSouscriptionToDelete(null); }}
        title="Supprimer la souscription"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Confirmer la suppression de la souscription de{" "}
                <strong>{souscriptionToDelete?.user_prenom} {souscriptionToDelete?.user_nom}</strong>{" "}
                ({souscriptionToDelete?.abonnement_nom}) ? Cette action est irréversible.
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowDeleteSouscriptionModal(false); setSouscriptionToDelete(null); }} className="flex-1">Annuler</Button>
            <Button onClick={handleDeleteSouscription} className="flex-1 bg-red-600 hover:bg-red-700">Supprimer</Button>
          </div>
        </div>
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

      {/* Modal encaissement souscription */}
      {encaisserTarget && (
        <EncaisserModal
          data={{
            abonnementUtilisateurId: encaisserTarget.id,
            typeTransaction: "abonnement",
            montantSuggere: encaisserTarget.abonnement_prix ?? 0,
            label: `${encaisserTarget.abonnement_nom} – ${encaisserTarget.user_prenom} ${encaisserTarget.user_nom}`,
          }}
          onClose={() => setEncaisserTarget(null)}
          onSuccess={(numeroRecu) => {
            toast.success(`Encaissement enregistré · Reçu ${numeroRecu}`);
            setEncaisserTarget(null);
            loadSouscriptions();
          }}
        />
      )}
    </div>
  );
};

export default AdminAbonnements;
