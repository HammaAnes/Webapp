import React, { useState } from "react";
import { Save, RefreshCw, Mail, Send, FileText, CheckCircle, XCircle } from "lucide-react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Badge from "../../../../components/ui/Badge";
import { emailService } from "../../../../services/email-service";
import toast from "react-hot-toast";
import { logger } from "../../../../utils/logger";

interface MailingSettings {
  smtp_from_name: string;
  smtp_from_email: string;
  email_admin: string;
  signature_text: string;
}

interface NotificationSettings {
  email_nouvelles_reservations: boolean;
  email_nouveaux_utilisateurs: boolean;
  email_expirations_abonnements: boolean;
  email_annulations: boolean;
  email_domiciliations: boolean;
  notifications_push: boolean;
}

interface Props {
  settings: MailingSettings;
  notifications: NotificationSettings;
  onChange: (field: keyof MailingSettings, value: string) => void;
  onSave: () => void;
  saving: boolean;
}

const EMAIL_TEMPLATES = [
  { name: "Bienvenue", trigger: "Inscription d'un utilisateur", to: "Utilisateur + Admin", category: "bienvenue" },
  { name: "Réservation enregistrée", trigger: "Nouvelle réservation", to: "Utilisateur + Admin", category: "reservation" },
  { name: "Réservation confirmée", trigger: "Confirmation par admin", to: "Utilisateur", category: "reservation" },
  { name: "Réservation annulée", trigger: "Annulation", to: "Utilisateur + Admin", category: "annulation" },
  { name: "Rappel réservation", trigger: "J-1 avant réservation", to: "Utilisateur", category: "rappel" },
  { name: "Domiciliation soumise", trigger: "Nouvelle demande", to: "Utilisateur + Admin", category: "domiciliation" },
  { name: "Domiciliation - statut", trigger: "Changement de statut", to: "Utilisateur", category: "domiciliation" },
  { name: "Domiciliation activée", trigger: "Activation", to: "Utilisateur", category: "domiciliation" },
  { name: "Domiciliation refusée", trigger: "Refus", to: "Utilisateur", category: "domiciliation" },
  { name: "Domiciliation expirée", trigger: "Expiration à J-7", to: "Utilisateur", category: "domiciliation" },
  { name: "Abonnement souscrit", trigger: "Nouvelle souscription", to: "Utilisateur + Admin", category: "abonnement" },
  { name: "Abonnement validé", trigger: "Validation par admin", to: "Utilisateur", category: "abonnement" },
  { name: "Abonnement refusé", trigger: "Refus par admin", to: "Utilisateur", category: "abonnement" },
  { name: "Abonnement expire bientôt", trigger: "Expiration à J-7", to: "Utilisateur", category: "rappel" },
  { name: "Courrier reçu", trigger: "Réception d'un courrier", to: "Utilisateur", category: "domiciliation" },
  { name: "Bonus parrainage débloqué", trigger: "Première réservation du filleul", to: "Parrain + Filleul", category: "parrainage" },
  { name: "Code promo attribué", trigger: "Attribution manuelle admin", to: "Utilisateur", category: "marketing" },
  { name: "Reset mot de passe", trigger: "Demande de reset", to: "Utilisateur", category: "reset" },
  { name: "Notification admin", trigger: "Événements système", to: "Admin", category: "admin" },
];

const MailingTab: React.FC<Props> = ({ settings, notifications, onChange, onSave, saving }) => {
  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSendTest = async () => {
    if (!testEmailTo.trim()) {
      toast.error("Entrez une adresse email");
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      await emailService.sendCustom(
        testEmailTo,
        "Test Email — Coffice SMTP",
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;background:#f9fafb">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
            <h2 style="color:#111827;margin-bottom:8px">Test Email Coffice</h2>
            <p style="color:#6b7280">Cet email confirme que le SMTP Coffice est correctement configuré.</p>
            <p style="color:#059669;font-weight:700;font-size:18px;margin:24px 0">SMTP Coffice fonctionne !</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px">mail.coffice.dz:465 — ${new Date().toLocaleString("fr-FR")}</p>
          </div>
        </body></html>`
      );
      setTestResult("success");
      toast.success(`Email de test envoyé à ${testEmailTo}`);
    } catch (error) {
      setTestResult("error");
      logger.error("Erreur envoi email test:", error as Error);
      toast.error("Erreur lors de l'envoi du test");
    } finally {
      setSendingTest(false);
    }
  };

  const isTemplateEnabled = (category: string) => {
    if (category === "reset" || category === "admin") return true;
    if (category === "rappel") return notifications.email_nouvelles_reservations || notifications.email_expirations_abonnements;
    if (category === "reservation") return notifications.email_nouvelles_reservations;
    if (category === "annulation") return notifications.email_annulations;
    if (category === "bienvenue") return notifications.email_nouveaux_utilisateurs;
    if (category === "domiciliation") return notifications.email_domiciliations;
    if (category === "abonnement") return notifications.email_expirations_abonnements;
    if (category === "parrainage") return true;
    if (category === "marketing") return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-500" />
            Configuration Email
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">SMTP Coffice actif</span>
            <span className="text-xs text-emerald-600">mail.coffice.dz:465</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom d'expéditeur"
              value={settings.smtp_from_name}
              onChange={(e) => onChange("smtp_from_name", e.target.value)}
            />
            <Input
              label="Email d'expéditeur"
              type="email"
              value={settings.smtp_from_email}
              onChange={(e) => onChange("smtp_from_email", e.target.value)}
            />
          </div>
          <Input
            label="Email administrateur (reçoit les notifications)"
            type="email"
            value={settings.email_admin}
            onChange={(e) => onChange("email_admin", e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />
          <Input
            label="Signature des emails"
            value={settings.signature_text}
            onChange={(e) => onChange("signature_text", e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Sauvegarder
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-500" />
          Test d'envoi SMTP
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Vérifiez que le SMTP Coffice envoie correctement les emails depuis <code className="bg-gray-100 px-1 rounded text-xs">desk@coffice.dz</code>.
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              placeholder="adresse@email.com"
              type="email"
              value={testEmailTo}
              onChange={(e) => {
                setTestEmailTo(e.target.value);
                setTestResult(null);
              }}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>
          <Button onClick={handleSendTest} disabled={sendingTest || !testEmailTo.trim()}>
            {sendingTest ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Envoyer test
          </Button>
        </div>
        {testResult === "success" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Email envoyé avec succès via SMTP Coffice.
          </div>
        )}
        {testResult === "error" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            Erreur d'envoi. Vérifiez les logs email pour plus de détails.
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Templates Email Actifs
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Tous les emails automatiques du système. Activez/désactivez les catégories dans l'onglet Notifications.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
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
              {EMAIL_TEMPLATES.map((tpl, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{tpl.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tpl.trigger}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tpl.to}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={isTemplateEnabled(tpl.category) ? "success" : "neutral"} className="text-xs">
                      {isTemplateEnabled(tpl.category) ? "Actif" : "Désactivé"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MailingTab;
