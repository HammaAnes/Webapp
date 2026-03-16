import React from "react";
import { Save, RefreshCw, Mail, Clock } from "lucide-react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";

interface GeneralSettings {
  nom_entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
  horaires_ouverture: string;
  horaires_fermeture: string;
}

interface Props {
  settings: GeneralSettings;
  onChange: (field: keyof GeneralSettings, value: string) => void;
  onSave: () => void;
  saving: boolean;
}

const GeneralTab: React.FC<Props> = ({ settings, onChange, onSave, saving }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Informations Générales</h2>
      <div className="space-y-4">
        <Input
          label="Nom de l'entreprise"
          value={settings.nom_entreprise}
          onChange={(e) => onChange("nom_entreprise", e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email de contact"
            type="email"
            value={settings.email}
            onChange={(e) => onChange("email", e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />
          <Input
            label="Téléphone"
            value={settings.telephone}
            onChange={(e) => onChange("telephone", e.target.value)}
          />
        </div>
        <Input
          label="Adresse"
          value={settings.adresse}
          onChange={(e) => onChange("adresse", e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Heure d'ouverture"
            type="time"
            value={settings.horaires_ouverture}
            onChange={(e) => onChange("horaires_ouverture", e.target.value)}
            icon={<Clock className="w-5 h-5" />}
          />
          <Input
            label="Heure de fermeture"
            type="time"
            value={settings.horaires_fermeture}
            onChange={(e) => onChange("horaires_fermeture", e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
        </div>
      </div>
    </Card>

    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Tarification</h2>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          La tarification est gérée directement dans la section <strong>Espaces</strong>.
          Chaque espace peut avoir ses propres tarifs (heure, demi-journée, jour, semaine).
        </p>
      </div>
    </Card>
  </div>
);

export default GeneralTab;
