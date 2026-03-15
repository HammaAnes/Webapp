import React, { useState } from "react";
import { Mail, Package, FileText, Plus, X, CheckCircle, Ban, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Card from "../../../components/ui/Card";
import { apiClient } from "../../../lib/api-client";
import { useCourrier } from "../hooks";
import type { DemandeDomiciliation, CourrierItem } from "../types";

interface Props {
  demande: DemandeDomiciliation;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lettre: { label: "Lettre", icon: Mail, color: "bg-blue-50 text-blue-600" },
  colis: { label: "Colis", icon: Package, color: "bg-teal-50 text-teal-600" },
  recommande: { label: "Recommandé", icon: FileText, color: "bg-red-50 text-red-600" },
  autre: { label: "Autre", icon: Mail, color: "bg-gray-50 text-gray-600" },
};

const STATUT_CONFIG: Record<
  string,
  { label: string; variant: "warning" | "success" | "info" | "danger" | "default" }
> = {
  recu: { label: "Reçu", variant: "warning" },
  notifie: { label: "Notifié", variant: "info" },
  en_attente_instruction: { label: "Att. instruction", variant: "warning" },
  retire: { label: "Retiré", variant: "success" },
  envoye: { label: "Envoyé", variant: "info" },
  archive: { label: "Archivé", variant: "default" },
};

const INACTIVE_STATUTS = ["retire", "envoye", "archive"];

export default function CourrierTab({ demande }: Props) {
  const { courriers, loading, reload } = useCourrier(demande.id);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nc, setNc] = useState({ type: "lettre", expediteur: "", description: "" });
  const [retireModal, setRetireModal] = useState<string | null>(null);
  const [retirePar, setRetirePar] = useState("");

  const nonTraites = courriers.filter((c) => !INACTIVE_STATUTS.includes(c.statut)).length;

  const handleCreate = async () => {
    if (!nc.expediteur.trim()) {
      toast.error("L'expéditeur est requis");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiClient.createCourrier({
        domiciliationId: demande.id,
        ...nc,
      });
      if (response.success) {
        toast.success("Courrier ajouté");
        setNc({ type: "lettre", expediteur: "", description: "" });
        setShowForm(false);
        await reload();
      } else {
        toast.error(response.error || "Erreur lors de la création");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    courrierItem: CourrierItem,
    action: "marquer_retire" | "marquer_envoye" | "archiver"
  ) => {
    try {
      const payload: Record<string, string> = { action };
      if (action === "marquer_retire") {
        if (!retirePar.trim()) {
          toast.error("Précisez le nom de la personne");
          return;
        }
        payload.retire_par = retirePar;
      }
      const response = await apiClient.updateCourrier(courrierItem.id, payload);
      if (response.success) {
        const msgs: Record<string, string> = {
          marquer_retire: "Courrier marqué comme retiré",
          marquer_envoye: "Courrier marqué comme envoyé",
          archiver: "Courrier archivé",
        };
        toast.success(msgs[action]);
        if (action === "marquer_retire") {
          setRetireModal(null);
          setRetirePar("");
        }
        await reload();
      } else {
        toast.error(response.error || "Erreur");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">Courrier</h4>
          </div>
          {nonTraites > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {nonTraites}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Fermer
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Ajouter
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-2 border-amber-200 bg-amber-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={nc.type}
                onChange={(e) => setNc({ ...nc, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Expéditeur"
              value={nc.expediteur}
              onChange={(e) => setNc({ ...nc, expediteur: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={nc.description}
              onChange={(e) => setNc({ ...nc, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={handleCreate} loading={submitting}>
              <Plus className="w-4 h-4" /> Créer
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : courriers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucun courrier enregistré</div>
      ) : (
        <div className="space-y-2">
          {courriers.map((c) => {
            const t = TYPE_CONFIG[c.type] || TYPE_CONFIG.autre;
            const s = STATUT_CONFIG[c.statut] || STATUT_CONFIG.recu;
            const TI = t.icon;
            const dateStr = c.date_reception || c.dateReception;
            const isActive = !INACTIVE_STATUTS.includes(c.statut);

            return (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}
                >
                  <TI className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{t.label}</p>
                    <Badge variant={s.variant} size="sm">
                      {s.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.expediteur}
                    {dateStr &&
                      ` — ${format(new Date(dateStr), "d MMM yyyy", { locale: fr })}`}
                  </p>
                  {c.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                  )}
                  {c.retire_par && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Retiré par : {c.retire_par}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isActive && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRetireModal(c.id);
                          setRetirePar("");
                        }}
                        title="Marquer retiré"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(c, "marquer_envoye")}
                        title="Marquer envoyé"
                      >
                        <Mail className="w-4 h-4 text-sky-600" />
                      </Button>
                    </>
                  )}
                  {c.statut !== "archive" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(c, "archiver")}
                      title="Archiver"
                    >
                      <Ban className="w-4 h-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!retireModal}
        onClose={() => setRetireModal(null)}
        title="Marquer le courrier comme retiré"
      >
        <div className="space-y-4">
          <Input
            label="Retiré par (nom de la personne)"
            value={retirePar}
            onChange={(e) => setRetirePar(e.target.value)}
            placeholder="Nom de la personne"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRetireModal(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                const c = courriers.find((x) => x.id === retireModal);
                if (c) handleAction(c, "marquer_retire");
              }}
            >
              Confirmer le retrait
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
