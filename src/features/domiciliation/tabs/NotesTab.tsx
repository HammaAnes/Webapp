import React, { useState, useEffect } from "react";
import { StickyNote, Save, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Button from "../../../components/ui/Button";
import type { DemandeDomiciliation } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

const MAX_CHARS = 2000;

export default function NotesTab({ demande, onUpdate, loading }: Props) {
  const [notes, setNotes] = useState(demande.commentaireAdmin || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const hasChanges = notes !== (demande.commentaireAdmin || "");

  useEffect(() => {
    setNotes(demande.commentaireAdmin || "");
  }, [demande.commentaireAdmin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ commentaireAdmin: notes });
      setLastSaved(new Date());
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Notes administratives</h3>
            <p className="text-xs text-gray-500">Visibles uniquement par les administrateurs</p>
          </div>
        </div>
        {lastSaved && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Sauvegardé à {format(lastSaved, "HH:mm", { locale: fr })}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, MAX_CHARS))}
          rows={12}
          placeholder="Ajoutez vos notes internes ici... Seuls les administrateurs peuvent les voir."
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none text-sm text-gray-800 placeholder:text-gray-400 leading-relaxed transition-all"
        />
        <div className={`absolute bottom-3 right-3 text-xs font-medium ${notes.length > MAX_CHARS * 0.9 ? "text-amber-600" : "text-gray-400"}`}>
          {notes.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {hasChanges ? (
          <span className="text-xs text-amber-600 font-medium">Modifications non sauvegardées</span>
        ) : (
          <span className="text-xs text-gray-400">Aucune modification en attente</span>
        )}
        <Button onClick={handleSave} loading={saving || loading} disabled={!hasChanges}>
          <Save className="w-4 h-4" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
