import React from "react";
import { Save, RefreshCw } from "lucide-react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";

interface NotificationSettings {
  email_nouvelles_reservations: boolean;
  email_nouveaux_utilisateurs: boolean;
  email_expirations_abonnements: boolean;
  email_annulations: boolean;
  email_domiciliations: boolean;
  notifications_push: boolean;
}

interface Props {
  settings: NotificationSettings;
  onChange: (field: keyof NotificationSettings, value: boolean) => void;
  onSave: () => void;
  saving: boolean;
}

const ITEMS: { field: keyof NotificationSettings; label: string; desc: string }[] = [
  {
    field: "email_nouvelles_reservations",
    label: "Nouvelles réservations",
    desc: "Email pour chaque nouvelle réservation + confirmation",
  },
  {
    field: "email_annulations",
    label: "Annulations de réservations",
    desc: "Email lorsqu'une réservation est annulée",
  },
  {
    field: "email_nouveaux_utilisateurs",
    label: "Nouveaux utilisateurs",
    desc: "Email pour chaque nouvelle inscription (bienvenue + notification admin)",
  },
  {
    field: "email_expirations_abonnements",
    label: "Expirations d'abonnements",
    desc: "Rappel 7 jours avant l'expiration d'un abonnement",
  },
  {
    field: "email_domiciliations",
    label: "Domiciliations",
    desc: "Emails de suivi de demandes de domiciliation (soumission, statut, activation, refus)",
  },
  {
    field: "notifications_push",
    label: "Notifications push",
    desc: "Activer les notifications push dans le navigateur",
  },
];

const NotificationsTab: React.FC<Props> = ({ settings, onChange, onSave, saving }) => (
  <Card className="p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-6">Préférences de Notification</h2>
    <div className="space-y-3">
      {ITEMS.map((item) => (
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
              checked={settings[item.field]}
              onChange={(e) => onChange(item.field, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
        </label>
      ))}
      <div className="flex justify-end pt-4">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  </Card>
);

export default NotificationsTab;
