import React, { useState, useEffect } from "react";
import { StickyNote, Save } from "lucide-react";
import Button from "../../../components/ui/Button";
import type { DemandeDomiciliation } from "../types";

interface Props {
  demande: DemandeDomiciliation;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

function SectionHeader({ icon: Icon, title, gradient }: { icon: React.ElementType; title: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-bold text-gray-900 text-base">{title}</h4>
    </div>
  );
}

export default function NotesTab({ demande, onUpdate, loading }: Props) {
  const [notes, setNotes] = useState(demande.commentaireAdmin || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(demande.commentaireAdmin || "");
  }, [demande.commentaireAdmin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ commentaireAdmin: notes });
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={StickyNote}
        title="Notes administratives"
        gradient="from-amber-500 to-yellow-500"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="Ajoutez vos notes internes ici..."
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y"
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving || loading}>
          <Save className="w-4 h-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
}
