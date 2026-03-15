import React, { useState } from 'react';
import { Hash, FileCheck, Send, Loader2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import { validatePostCreation } from '../../domain/validators';
import type { TypeStructure } from '../../domain/types';

interface PostCreationFormProps {
  typeStructure: TypeStructure;
  initialData?: {
    nif?: string;
    nis?: string;
    registreCommerce?: string;
    articleImposition?: string;
    numeroAutoEntrepreneur?: string;
  };
  loading: boolean;
  onSubmit: (data: Record<string, string>) => void;
}

export default function PostCreationForm({ typeStructure, initialData = {}, loading, onSubmit }: PostCreationFormProps) {
  const [form, setForm] = useState({
    nif: initialData.nif || '',
    nis: initialData.nis || '',
    registreCommerce: initialData.registreCommerce || '',
    articleImposition: initialData.articleImposition || '',
    numeroAutoEntrepreneur: initialData.numeroAutoEntrepreneur || '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    const result = validatePostCreation(typeStructure, form);
    if (!result.valid) {
      const first = Object.values(result.errors)[0];
      toast.error(first);
      return;
    }
    onSubmit(form);
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
        {typeStructure === 'societe' ? (
          <>
            <Input
              label="Registre de Commerce (RC)"
              icon={<Hash className="w-5 h-5" />}
              value={form.registreCommerce}
              onChange={set('registreCommerce')}
              placeholder="Ex: 16/00-0123456B00"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="NIF (exactement 20 chiffres)"
                icon={<Hash className="w-5 h-5" />}
                value={form.nif}
                onChange={set('nif')}
                maxLength={20}
              />
              <Input
                label="NIS (exactement 15 chiffres)"
                icon={<Hash className="w-5 h-5" />}
                value={form.nis}
                onChange={set('nis')}
                maxLength={15}
              />
            </div>
            <Input
              label="Article d'Imposition (AI)"
              icon={<Hash className="w-5 h-5" />}
              value={form.articleImposition}
              onChange={set('articleImposition')}
            />
          </>
        ) : (
          <Input
            label="Numéro d'auto-entrepreneur"
            icon={<Hash className="w-5 h-5" />}
            value={form.numeroAutoEntrepreneur}
            onChange={set('numeroAutoEntrepreneur')}
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
}
