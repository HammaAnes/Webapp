import React, { useState } from "react";
import { Mail, Package, Bookmark, Plus, X, CheckCircle, Send, Archive, Loader2, Inbox as InboxIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import { apiClient } from "../../../lib/api-client";
import { useCourrier } from "../hooks";
import { COURRIER_TYPE_CONFIG, COURRIER_STATUT_CONFIG, COURRIER_INACTIVE_STATUTS } from "../constants";
import type { DemandeDomiciliation, CourrierItem } from "../types";

interface Props {
  demande: DemandeDomiciliation;
}

export default function CourrierTab({ demande }: Props) {
  const { courriers, loading, reload } = useCourrier(demande.id);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nc, setNc] = useState({ type: "lettre", expediteur: "", description: "" });
  const [retireModal, setRetireModal] = useState<string | null>(null);
  const [retireNotes, setRetireNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pending = courriers.filter((c) => !COURRIER_INACTIVE_STATUTS.includes(c.statut)).length;

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
        toast.success("Courrier enregistré");
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
    item: CourrierItem,
    action: "marquer_retire" | "marquer_envoye" | "archiver"
  ) => {
    setActionLoading(item.id + action);
    try {
      const payload: Record<string, string> = { action };
      if (action === "marquer_retire") {
        if (!retireNotes.trim()) {
          toast.error("Précisez le nom de la personne");
          return;
        }
        payload.retire_par = retireNotes;
      }
      const response = await apiClient.updateCourrier(item.id, payload);
      if (response.success) {
        const msgs: Record<string, string> = {
          marquer_retire: "Marqué comme retiré",
          marquer_envoye: "Marqué comme envoyé",
          archiver: "Archivé",
        };
        toast.success(msgs[action]);
        if (action === "marquer_retire") {
          setRetireModal(null);
          setRetireNotes("");
        }
        await reload();
      } else {
        toast.error(response.error || "Erreur");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Courrier</h3>
              {pending > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                  {pending}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{courriers.length} pièce{courriers.length !== 1 ? "s" : ""} au total</p>
          </div>
        </div>
        <Button size="sm" variant={showForm ? "ghost" : "primary"} onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4" /> Fermer</> : <><Plus className="w-4 h-4" /> Enregistrer</>}
        </Button>
      </div>

      {showForm && (
        <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-sky-900 text-sm">Nouveau courrier reçu</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
              <select
                value={nc.type}
                onChange={(e) => setNc({ ...nc, type: e.target.value })}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-sm"
              >
                {Object.entries(COURRIER_TYPE_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expéditeur <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={nc.expediteur}
                onChange={(e) => setNc({ ...nc, expediteur: e.target.value })}
                placeholder="Nom ou organisme"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
              <input
                type="text"
                value={nc.description}
                onChange={(e) => setNc({ ...nc, description: e.target.value })}
                placeholder="Optionnel"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button size="sm" onClick={handleCreate} loading={submitting}>
              <Plus className="w-4 h-4" /> Enregistrer
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : courriers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <InboxIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Aucun courrier enregistré</p>
          <p className="text-sm text-gray-400">Le courrier de cette entreprise apparaîtra ici</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courriers.map((c) => {
            const typeCfg = COURRIER_TYPE_CONFIG[c.type] ?? COURRIER_TYPE_CONFIG.autre;
            const statutCfg = COURRIER_STATUT_CONFIG[c.statut] ?? COURRIER_STATUT_CONFIG.recu;
            const TypeIcon = typeCfg.icon;
            const isActive = !COURRIER_INACTIVE_STATUTS.includes(c.statut);
            const isInactive = COURRIER_INACTIVE_STATUTS.includes(c.statut);

            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                  isInactive ? "bg-gray-50/50 border-gray-100 opacity-70" : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeCfg.iconBg}`}>
                  <TypeIcon className={`w-5 h-5 ${typeCfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{typeCfg.label}</p>
                    <Badge variant={statutCfg.variant} size="sm">{statutCfg.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {c.expediteur}
                    {c.dateReception && ` — ${format(new Date(c.dateReception), "d MMM yyyy", { locale: fr })}`}
                  </p>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  {c.dateTraitement && (
                    <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                      Traité le {format(new Date(c.dateTraitement), "d MMM yyyy", { locale: fr })}
                      {c.notesAdmin && ` — ${c.notesAdmin}`}
                    </p>
                  )}
                </div>
                {isActive && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setRetireModal(c.id); setRetireNotes(""); }}
                      className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                      title="Marquer retiré"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction(c, "marquer_envoye")}
                      disabled={actionLoading === c.id + "marquer_envoye"}
                      className="p-2 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors"
                      title="Marquer envoyé"
                    >
                      {actionLoading === c.id + "marquer_envoye" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(c, "archiver")}
                      disabled={actionLoading === c.id + "archiver"}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      title="Archiver"
                    >
                      {actionLoading === c.id + "archiver" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!retireModal}
        onClose={() => setRetireModal(null)}
        title="Confirmer le retrait"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Précisez le nom de la personne qui retire ce courrier.</p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la personne</label>
            <input
              type="text"
              value={retireNotes}
              onChange={(e) => setRetireNotes(e.target.value)}
              placeholder="Prénom Nom"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const c = courriers.find((x) => x.id === retireModal);
                  if (c) handleAction(c, "marquer_retire");
                }
              }}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRetireModal(null)}>Annuler</Button>
            <Button
              onClick={() => {
                const c = courriers.find((x) => x.id === retireModal);
                if (c) handleAction(c, "marquer_retire");
              }}
              loading={!!actionLoading}
            >
              <CheckCircle className="w-4 h-4" /> Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
