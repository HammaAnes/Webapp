import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Building2,
  Clock,
  Mail,
  Bell,
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Search,
  Key,
  Send,
  Eye,
  EyeOff,
  AlertTriangle,
  Wrench,
  FileText,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import toast from "react-hot-toast";
import { logger } from "../../../utils/logger";
import { apiClient } from "../../../lib/api-client";
import { emailService } from "../../../services/email-service";

interface GeneralSettings {
  nom_entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
  horaires_ouverture: string;
  horaires_fermeture: string;
}

interface NotificationSettings {
  email_nouvelles_reservations: boolean;
  email_nouveaux_utilisateurs: boolean;
  email_expirations_abonnements: boolean;
  email_annulations: boolean;
  email_domiciliations: boolean;
  notifications_push: boolean;
}

interface MailingSettings {
  smtp_from_name: string;
  smtp_from_email: string;
  email_admin: string;
  signature_text: string;
}

interface AllSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  mailing: MailingSettings;
}

interface UserResult {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  statut: string;
}

const defaultSettings: AllSettings = {
  general: {
    nom_entreprise: "COFFICE",
    email: "desk@coffice.dz",
    telephone: "+213 795 38 01 24",
    adresse: "4ème étage, Mohammadia Mall, Alger",
    horaires_ouverture: "08:30",
    horaires_fermeture: "18:30",
  },
  notifications: {
    email_nouvelles_reservations: true,
    email_nouveaux_utilisateurs: true,
    email_expirations_abonnements: true,
    email_annulations: true,
    email_domiciliations: true,
    notifications_push: false,
  },
  mailing: {
    smtp_from_name: "Coffice",
    smtp_from_email: "desk@coffice.dz",
    email_admin: "desk@coffice.dz",
    signature_text: "L'équipe Coffice - Coworking & Domiciliation",
  },
};


type SettingsTab = "general" | "notifications" | "mailing" | "comptes" | "maintenance";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking");

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    setSettings(defaultSettings);
    apiClient.get('/admin/settings.php').then((res) => {
      if (res.success && res.data) {
        const serverData = res.data as Record<string, unknown>;
        setSettings({
          general: { ...defaultSettings.general, ...(serverData.general as Record<string, unknown> || {}) } as AllSettings["general"],
          notifications: { ...defaultSettings.notifications, ...(serverData.notifications as Record<string, unknown> || {}) } as AllSettings["notifications"],
          mailing: { ...defaultSettings.mailing, ...(serverData.mailing as Record<string, unknown> || {}) } as AllSettings["mailing"],
        });
      }
    }).catch((error) => {
      logger.error("Erreur chargement paramètres:", error as Error);
      toast.error("Erreur lors du chargement des paramètres");
    });
  }, []);

  useEffect(() => {
    setApiStatus("checking");
    apiClient.get('/health.php')
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("disconnected"));
  }, []);

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/admin/settings.php', { section: 'general', data: settings.general } as unknown as Record<string, unknown>);
      if (response.success) {
        toast.success("Parametres generaux enregistres");
      } else {
        toast.error(response.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      logger.error("Erreur sauvegarde paramètres:", error as Error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/admin/settings.php', { section: 'notifications', data: settings.notifications } as unknown as Record<string, unknown>);
      if (response.success) {
        toast.success("Preferences de notification enregistrees");
      } else {
        toast.error(response.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      logger.error("Erreur sauvegarde notifications:", error as Error);
      toast.error("Erreur lors de la sauvegarde des notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMailing = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/admin/settings.php', { section: 'mailing', data: settings.mailing } as unknown as Record<string, unknown>);
      if (response.success) {
        toast.success("Parametres mailing enregistres");
      } else {
        toast.error(response.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      logger.error("Erreur sauvegarde mailing:", error as Error);
      toast.error("Erreur lors de la sauvegarde des paramètres mailing");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir effacer le cache ? Vous allez être déconnecté.")) {
      return;
    }

    try {
      localStorage.removeItem("coffice-app-storage");
      toast.success("Cache effacé avec succès");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      logger.error("Erreur suppression cache:", error as Error);
      toast.error("Erreur lors de la suppression du cache");
    }
  };

  const updateGeneral = (field: keyof GeneralSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }));
  };

  const updateNotifications = (field: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const updateMailing = (field: keyof MailingSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      mailing: { ...prev.mailing, [field]: value },
    }));
  };

  const loadAllUsers = async () => {
    if (usersLoaded) return;
    setSearchingUsers(true);
    try {
      const response = await apiClient.getUsers();
      const responseData = response.data as Record<string, any>;
      const users = Array.isArray(responseData?.users)
        ? responseData.users
        : Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setAllUsers(users);
      setUsersLoaded(true);
    } catch (error) {
      logger.error("Erreur chargement utilisateurs:", error as Error);
      toast.error("Erreur chargement utilisateurs");
    } finally {
      setSearchingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "comptes" && !usersLoaded) {
      loadAllUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const q = userSearch.toLowerCase();
    const filtered = allUsers.filter(
      (u) =>
        u.nom?.toLowerCase().includes(q) ||
        u.prenom?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.telephone?.includes(q)
    );
    setUserResults(filtered.slice(0, 15));
  }, [userSearch, allUsers]);

  const openPasswordReset = (user: UserResult) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await apiClient.updateUser(selectedUser.id, {
        password: newPassword,
      });
      if (response.success) {
        toast.success(`Mot de passe mis à jour pour ${selectedUser.prenom} ${selectedUser.nom}`);
        setShowPasswordModal(false);
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      logger.error("Erreur reset password:", error as Error);
      toast.error("Erreur lors de la mise à jour du mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) {
      toast.error("Entrez une adresse email");
      return;
    }
    setSendingTest(true);
    try {
      await emailService.sendCustom(
        testEmailTo,
        "Test Email - Coffice",
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2 style="color:#111827">Test Email Coffice</h2>
          <p style="color:#6b7280">Cet email a été envoyé depuis les paramètres d'administration de Coffice.</p>
          <p style="color:#059669;font-weight:bold;font-size:18px">Le service email fonctionne correctement !</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="color:#9ca3af;font-size:12px">Coffice - ${new Date().toLocaleString("fr-FR")}</p>
        </body></html>`
      );
      toast.success(`Email de test envoyé à ${testEmailTo}`);
    } catch (error) {
      logger.error("Erreur envoi email test:", error as Error);
      toast.error("Erreur lors de l'envoi du test");
    } finally {
      setSendingTest(false);
    }
  };

  const tabs: { id: SettingsTab; name: string; icon: typeof Building2 }[] = [
    { id: "general", name: "Général", icon: Building2 },
    { id: "mailing", name: "Mailing", icon: Mail },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "comptes", name: "Comptes", icon: Users },
    { id: "maintenance", name: "Maintenance", icon: Wrench },
  ];

  const EMAIL_TEMPLATES = [
    { name: "Bienvenue", trigger: "Inscription d'un utilisateur", to: "Utilisateur + Admin" },
    { name: "Réservation enregistrée", trigger: "Nouvelle réservation", to: "Utilisateur + Admin" },
    { name: "Réservation confirmée", trigger: "Confirmation par admin", to: "Utilisateur" },
    { name: "Réservation annulée", trigger: "Annulation", to: "Utilisateur + Admin" },
    { name: "Rappel réservation", trigger: "J-1 avant réservation", to: "Utilisateur" },
    { name: "Domiciliation soumise", trigger: "Nouvelle demande", to: "Utilisateur + Admin" },
    { name: "Domiciliation - statut", trigger: "Changement de statut", to: "Utilisateur" },
    { name: "Domiciliation activée", trigger: "Activation", to: "Utilisateur" },
    { name: "Domiciliation refusée", trigger: "Refus", to: "Utilisateur" },
    { name: "Reset mot de passe", trigger: "Demande de reset", to: "Utilisateur" },
    { name: "Notification admin", trigger: "Événements système", to: "Admin" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-7 h-7" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-1">Configuration complète de l'ERP Coffice</p>
        </div>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap text-sm border-b-2 ${
                activeTab === tab.id
                  ? "text-amber-600 border-amber-500"
                  : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {activeTab === "general" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Informations Générales
            </h2>
            <div className="space-y-4">
              <Input
                label="Nom de l'entreprise"
                value={settings.general.nom_entreprise}
                onChange={(e) => updateGeneral("nom_entreprise", e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email de contact"
                  type="email"
                  value={settings.general.email}
                  onChange={(e) => updateGeneral("email", e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                />
                <Input
                  label="Téléphone"
                  value={settings.general.telephone}
                  onChange={(e) => updateGeneral("telephone", e.target.value)}
                />
              </div>
              <Input
                label="Adresse"
                value={settings.general.adresse}
                onChange={(e) => updateGeneral("adresse", e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Heure d'ouverture"
                  type="time"
                  value={settings.general.horaires_ouverture}
                  onChange={(e) => updateGeneral("horaires_ouverture", e.target.value)}
                  icon={<Clock className="w-5 h-5" />}
                />
                <Input
                  label="Heure de fermeture"
                  type="time"
                  value={settings.general.horaires_fermeture}
                  onChange={(e) => updateGeneral("horaires_fermeture", e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveGeneral} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tarification</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                La tarification est gérée directement dans la section{" "}
                <strong>Espaces</strong>. Chaque espace peut avoir ses propres
                tarifs (heure, demi-journée, jour, semaine).
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === "mailing" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-500" />
              Configuration Email
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom d'expéditeur"
                  value={settings.mailing.smtp_from_name}
                  onChange={(e) => updateMailing("smtp_from_name", e.target.value)}
                />
                <Input
                  label="Email d'expéditeur"
                  type="email"
                  value={settings.mailing.smtp_from_email}
                  onChange={(e) => updateMailing("smtp_from_email", e.target.value)}
                />
              </div>
              <Input
                label="Email administrateur (reçoit les notifications)"
                type="email"
                value={settings.mailing.email_admin}
                onChange={(e) => updateMailing("email_admin", e.target.value)}
                icon={<Mail className="w-5 h-5" />}
              />
              <Input
                label="Signature des emails"
                value={settings.mailing.signature_text}
                onChange={(e) => updateMailing("signature_text", e.target.value)}
              />
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveMailing} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              Test d'envoi
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Envoyez un email de test pour vérifier que la configuration fonctionne.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="adresse@email.com"
                  type="email"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
              <Button onClick={handleSendTestEmail} disabled={sendingTest}>
                {sendingTest ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Templates Email Actifs
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Liste de tous les emails automatiques envoyés par le système.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Déclencheur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinataire</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {EMAIL_TEMPLATES.map((tpl, i) => {
                    const nameLower = tpl.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const isEnabled =
                      (nameLower.includes("reservation") && (settings.notifications.email_nouvelles_reservations || settings.notifications.email_annulations)) ||
                      (nameLower.includes("bienvenue") && settings.notifications.email_nouveaux_utilisateurs) ||
                      (nameLower.includes("domiciliation") && settings.notifications.email_domiciliations) ||
                      nameLower.includes("reset") ||
                      nameLower.includes("notification admin") ||
                      nameLower.includes("rappel");
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{tpl.trigger}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{tpl.to}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={isEnabled ? "success" : "default"} className="text-xs">
                            {isEnabled ? "Actif" : "Désactivé"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Les templates sont codés dans l'application. Activez/désactivez les catégories dans l'onglet Notifications.
            </p>
          </Card>
        </motion.div>
      )}

      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Préférences de Notification
            </h2>
            <div className="space-y-3">
              {[
                {
                  field: "email_nouvelles_reservations" as const,
                  label: "Nouvelles réservations",
                  desc: "Email pour chaque nouvelle réservation + confirmation",
                },
                {
                  field: "email_annulations" as const,
                  label: "Annulations de réservations",
                  desc: "Email lorsqu'une réservation est annulée",
                },
                {
                  field: "email_nouveaux_utilisateurs" as const,
                  label: "Nouveaux utilisateurs",
                  desc: "Email pour chaque nouvelle inscription (bienvenue + notification admin)",
                },
                {
                  field: "email_expirations_abonnements" as const,
                  label: "Expirations d'abonnements",
                  desc: "Rappel 7 jours avant l'expiration d'un abonnement",
                },
                {
                  field: "email_domiciliations" as const,
                  label: "Domiciliations",
                  desc: "Emails de suivi de demandes de domiciliation (soumission, statut, activation, refus)",
                },
                {
                  field: "notifications_push" as const,
                  label: "Notifications push",
                  desc: "Activer les notifications push dans le navigateur",
                },
              ].map((item) => (
                <label
                  key={item.field}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="pr-4">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.notifications[item.field]}
                      onChange={(e) => updateNotifications(item.field, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </div>
                </label>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === "comptes" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Gestion des mots de passe
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Recherchez un utilisateur pour réinitialiser son mot de passe depuis le desk.
            </p>

            <div className="mb-6">
              <Input
                type="search"
                placeholder="Rechercher par nom, prénom, email ou téléphone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {searchingUsers && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-3" />
                <span className="text-gray-500">Chargement des utilisateurs...</span>
              </div>
            )}

            {!searchingUsers && userSearch.trim() && userResults.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucun utilisateur trouvé pour "{userSearch}"</p>
              </div>
            )}

            {userResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userResults.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {u.prenom} {u.nom}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.telephone || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === "admin" ? "warning" : "default"} className="text-xs">
                            {u.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordReset(u)}
                          >
                            <Key className="w-3.5 h-3.5 mr-1" />
                            Reset MDP
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!userSearch.trim() && !searchingUsers && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Tapez un nom, email ou téléphone</p>
                <p className="text-gray-400 text-sm mt-1">pour trouver un utilisateur</p>
              </div>
            )}
          </Card>

          <Card className="p-6 border-l-4 border-amber-400 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Information sécurité</p>
                <p className="text-sm text-amber-700 mt-1">
                  Le reset de mot de passe depuis le desk ne déclenche pas d'email automatique.
                  Communiquez le nouveau mot de passe directement au client et conseillez-lui de
                  le changer à sa prochaine connexion.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === "maintenance" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-gray-600" />
              Maintenance & Système
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">État du système</p>
                  <p className="text-sm text-gray-500">Connexion à l'API backend</p>
                </div>
                {apiStatus === "checking" ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Vérification...</span>
                  </div>
                ) : apiStatus === "connected" ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Connecté</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Déconnecté</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Effacer le cache local</p>
                  <p className="text-sm text-gray-500">Vider les données en cache du navigateur</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearCache}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Effacer
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Recharger les données</p>
                  <p className="text-sm text-gray-500">Forcer le rechargement depuis le serveur</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Version</p>
                  <p className="text-sm text-gray-500">Version actuelle de l'application</p>
                </div>
                <span className="text-sm font-mono bg-gray-200 px-3 py-1 rounded">
                  v4.2.0
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={`Réinitialiser le mot de passe`}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {selectedUser.prenom} {selectedUser.nom}
              </p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="relative">
              <Input
                label="Nouveau mot de passe (min. 8 caractères)"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Key className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirmer le mot de passe"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Key className="w-4 h-4" />}
            />

            {newPassword && newPassword.length < 8 && (
              <p className="text-xs text-red-500">Le mot de passe doit contenir au moins 8 caractères</p>
            )}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} disabled={savingPassword}>
                Annuler
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={savingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              >
                {savingPassword ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Réinitialiser
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Settings;
