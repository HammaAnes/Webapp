import React, { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

interface RequiredDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
}

interface ManageRequiredDocumentsProps {
  documents: RequiredDocument[];
  title: string;
  onSave: (documents: RequiredDocument[]) => void;
  onCancel: () => void;
}

export default function ManageRequiredDocuments({
  documents: initialDocuments,
  title,
  onSave,
  onCancel,
}: ManageRequiredDocumentsProps) {
  const [documents, setDocuments] = useState<RequiredDocument[]>(initialDocuments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ id: "", name: "", description: "", required: true });

  const handleAddDocument = () => {
    if (!newDoc.id.trim() || !newDoc.name.trim()) {
      toast.error("ID et nom requis");
      return;
    }

    if (documents.some((d) => d.id === newDoc.id)) {
      toast.error("Un document avec cet ID existe déjà");
      return;
    }

    setDocuments([...documents, newDoc]);
    setNewDoc({ id: "", name: "", description: "", required: true });
    setShowAddModal(false);
    toast.success("Document ajouté");
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
    toast.success("Document supprimé");
  };

  const handleToggleRequired = (id: string) => {
    setDocuments(
      documents.map((d) => (d.id === id ? { ...d, required: !d.required } : d))
    );
  };

  const handleSave = () => {
    onSave(documents);
    toast.success("Documents mis à jour");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucun document configuré</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                  {doc.required && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                      Requis
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">ID: {doc.id}</p>
                {doc.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggleRequired(doc.id)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"
                >
                  {doc.required ? "Optionnel" : "Requis"}
                </button>
                <button
                  onClick={() => handleRemoveDocument(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4" /> Annuler
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" /> Enregistrer
        </Button>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewDoc({ id: "", name: "", description: "", required: true });
        }}
        title="Ajouter un document"
      >
        <div className="space-y-4">
          <Input
            label="ID du document"
            value={newDoc.id}
            onChange={(e) => setNewDoc({ ...newDoc, id: e.target.value })}
            placeholder="ex: cni, registre_commerce"
            required
          />
          <Input
            label="Nom du document"
            value={newDoc.name}
            onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
            placeholder="ex: Carte Nationale d'Identité"
            required
          />
          <Input
            label="Description (optionnelle)"
            value={newDoc.description}
            onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
            placeholder="ex: Du gérant de la société"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={newDoc.required}
              onChange={(e) => setNewDoc({ ...newDoc, required: e.target.checked })}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="required" className="text-sm text-gray-700">
              Document requis
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setNewDoc({ id: "", name: "", description: "", required: true });
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAddDocument}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
