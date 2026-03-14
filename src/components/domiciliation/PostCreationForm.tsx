import React, { useState } from "react";
import { Hash, FileCheck, Send, Loader2 } from "lucide-react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import toast from "react-hot-toast";

interface PostCreationFormProps {
  demande: {
    typeStructure: string;
    nif?: string;
    nis?: string;
    registreCommerce?: string;
    articleImposition?: string;
    numeroAutoEntrepreneur?: string;
    id: string;
  };
  onSubmit: (data: Record<string, string>) => void;
  loading: boolean;
}

const PostCreationForm: React.FC<PostCreationFormProps> = ({ demande, onSubmit, loading }) => {
  const [formState, setFormState] = useState({
    nif: demande.nif || "",
    nis: demande.nis || "",
    registreCommerce: demande.registreCommerce || "",
    articleImposition: demande.articleImposition || "",
    numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur || "",
  });

  const handleSubmit = () => {
    if (demande.typeStructure === "societe") {
      if (!formState.registreCommerce.trim() || !formState.nif.trim() || !formState.nis.trim() || !formState.articleImposition.trim()) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }
      if (!/^[0-9]{20}$/.test(formState.nif.trim())) {
        toast.error("Le NIF doit contenir exactement 20 chiffres");
        return;
      }
      if (!/^[0-9]{15}$/.test(formState.nis.trim())) {
        toast.error("Le NIS doit contenir exactement 15 chiffres");
        return;
      }
    } else {
      if (!formState.numeroAutoEntrepreneur.trim()) {
        toast.error("Le numéro d'auto-entrepreneur est requis");
        return;
      }
    }
    onSubmit(formState);
  };

  return (
    <Card className="p-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
          <FileCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Complétion administrative</h2>
          <p className="text-sm text-gray-500">Complétez les informations obtenues après la création de votre structure</p>
        </div>
      </div>

      <div className="space-y-4">
        {demande.typeStructure === "societe" ? (
          <>
            <Input
              label="Registre de Commerce (RC)"
              icon={<Hash className="w-5 h-5" />}
              value={formState.registreCommerce}
              onChange={(e) => setFormState({ ...formState, registreCommerce: e.target.value })}
              placeholder="Ex: 16/00-0123456B00"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="NIF (exactement 20 chiffres)"
                icon={<Hash className="w-5 h-5" />}
                value={formState.nif}
                onChange={(e) => setFormState({ ...formState, nif: e.target.value })}
                maxLength={20}
              />
              <Input
                label="NIS (exactement 15 chiffres)"
                icon={<Hash className="w-5 h-5" />}
                value={formState.nis}
                onChange={(e) => setFormState({ ...formState, nis: e.target.value })}
                maxLength={15}
              />
            </div>
            <Input
              label="Article d'Imposition (AI)"
              icon={<Hash className="w-5 h-5" />}
              value={formState.articleImposition}
              onChange={(e) => setFormState({ ...formState, articleImposition: e.target.value })}
            />
          </>
        ) : (
          <Input
            label="Numéro d'auto-entrepreneur"
            icon={<Hash className="w-5 h-5" />}
            value={formState.numeroAutoEntrepreneur}
            onChange={(e) => setFormState({ ...formState, numeroAutoEntrepreneur: e.target.value })}
            placeholder="Ex: AE-2024-123456"
          />
        )}

        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
          <p className="text-sm text-sky-700">
            Une fois ces informations soumises, votre dossier sera verrouillé et la domiciliation deviendra pleinement conforme.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Soumettre les informations
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default PostCreationForm;
