import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Building2, Mail, Bell, Users, Wrench } from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import toast from "react-hot-toast";
import { logger } from "../../../utils/logger";
import GeneralTab from "./settings/GeneralTab";
import MailingTab from "./settings/MailingTab";
import NotificationsTab from "./settings/NotificationsTab";
import ComptesTab from "./settings/ComptesTab";
import MaintenanceTab from "./settings/MaintenanceTab";

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

type SettingsTab = "general" | "mailing" | "notifications" | "comptes" | "maintenance";

const TABS: { id: SettingsTab; name: string; icon: typeof Building2 }[] = [
  { id: "general", name: "Général", icon: Building2 },
  { id: "mailing", name: "Mailing", icon: Mail },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "comptes", name: "Comptes", icon: Users },
  { id: "maintenance", name: "Maintenance", icon: Wrench },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get("/admin/settings.php").then((res) => {
      if (res.success && res.data) {
        const d = res.data as Record<string, unknown>;
        setSettings({
          general: { ...defaultSettings.general, ...(d.general as object || {}) } as GeneralSettings,
          notifications: { ...defaultSettings.notifications, ...(d.notifications as object || {}) } as NotificationSettings,
          mailing: { ...defaultSettings.mailing, ...(d.mailing as object || {}) } as MailingSettings,
        });
      }
    }).catch((err) => {
      logger.error("Erreur chargement paramètres:", err as Error);
    });
  }, []);

  const saveSection = useCallback(async (section: string, data: Record<string, unknown>, label: string) => {
    setSaving(true);
    try {
      const res = await apiClient.post("/admin/settings.php", { section, ...data } as Record<string, unknown>);
      if (res.success) {
        toast.success(label);
      } else {
        toast.error(res.error || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      logger.error("Erreur sauvegarde:", err as Error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }, []);

  const updateGeneral = useCallback((field: keyof GeneralSettings, value: string) => {
    setSettings((p) => ({ ...p, general: { ...p.general, [field]: value } }));
  }, []);

  const updateNotifications = useCallback((field: keyof NotificationSettings, value: boolean) => {
    setSettings((p) => ({ ...p, notifications: { ...p.notifications, [field]: value } }));
  }, []);

  const updateMailing = useCallback((field: keyof MailingSettings, value: string) => {
    setSettings((p) => ({ ...p, mailing: { ...p.mailing, [field]: value } }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 text-sm">Configuration complète de l'ERP Coffice</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap text-sm border-b-2 -mb-px ${
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

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {activeTab === "general" && (
          <GeneralTab
            settings={settings.general}
            onChange={updateGeneral}
            onSave={() => saveSection("general", settings.general as unknown as Record<string, unknown>, "Paramètres généraux enregistrés")}
            saving={saving}
          />
        )}
        {activeTab === "mailing" && (
          <MailingTab
            settings={settings.mailing}
            notifications={settings.notifications}
            onChange={updateMailing}
            onSave={() => saveSection("mailing", settings.mailing as unknown as Record<string, unknown>, "Paramètres mailing enregistrés")}
            saving={saving}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab
            settings={settings.notifications}
            onChange={updateNotifications}
            onSave={() => saveSection("notifications", settings.notifications as unknown as Record<string, unknown>, "Préférences de notification enregistrées")}
            saving={saving}
          />
        )}
        {activeTab === "comptes" && <ComptesTab />}
        {activeTab === "maintenance" && <MaintenanceTab />}
      </motion.div>
    </div>
  );
};

export default Settings;
