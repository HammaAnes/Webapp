import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Hash } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import type { TypeStructure } from '../../domain/types';
import { validatePostCreation } from '../../domain/validators';

interface PostCreationFormProps {
  typeStructure: TypeStructure;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  loading?: boolean;
}

const PostCreationForm: React.FC<PostCreationFormProps> = ({ typeStructure, onSubmit, loading = false }) => {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string>>({
    nif: '',
    nis: '',
    registreCommerce: '',
    articleImposition: '',
    numeroAutoEntrepreneur: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePostCreation(typeStructure, formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      setErrors({ _global: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' });
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-700 font-medium">Informations mises à jour avec succès.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
        <p className="text-sm text-sky-700 font-medium">Complétez votre dossier</p>
        <p className="text-xs text-sky-600 mt-1">
          {typeStructure === 'societe'
            ? 'Renseignez vos identifiants fiscaux maintenant que votre société est immatriculée.'
            : 'Renseignez votre numéro auto-entrepreneur.'}
        </p>
      </div>

      {errors._global && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{errors._global}</p>
        </div>
      )}

      {typeStructure === 'societe' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIF <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1">(20 chiffres)</span>
            </label>
            <Input
              value={formData.nif}
              onChange={(e) => handleChange('nif', e.target.value)}
              placeholder="20 chiffres"
              maxLength={20}
              icon={<Hash className="w-4 h-4 text-gray-400" />}
              className={errors.nif ? 'border-red-300' : ''}
            />
            {errors.nif && <p className="mt-1 text-xs text-red-500">{errors.nif}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIS <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1">(15 chiffres)</span>
            </label>
            <Input
              value={formData.nis}
              onChange={(e) => handleChange('nis', e.target.value)}
              placeholder="15 chiffres"
              maxLength={15}
              icon={<Hash className="w-4 h-4 text-gray-400" />}
              className={errors.nis ? 'border-red-300' : ''}
            />
            {errors.nis && <p className="mt-1 text-xs text-red-500">{errors.nis}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registre de Commerce <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.registreCommerce}
              onChange={(e) => handleChange('registreCommerce', e.target.value)}
              placeholder="N° RC"
              className={errors.registreCommerce ? 'border-red-300' : ''}
            />
            {errors.registreCommerce && <p className="mt-1 text-xs text-red-500">{errors.registreCommerce}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Article d'imposition</label>
            <Input
              value={formData.articleImposition}
              onChange={(e) => handleChange('articleImposition', e.target.value)}
              placeholder="N° article d'imposition"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro Auto-Entrepreneur <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.numeroAutoEntrepreneur}
            onChange={(e) => handleChange('numeroAutoEntrepreneur', e.target.value)}
            placeholder="N° AE"
            icon={<Hash className="w-4 h-4 text-gray-400" />}
            className={errors.numeroAutoEntrepreneur ? 'border-red-300' : ''}
          />
          {errors.numeroAutoEntrepreneur && <p className="mt-1 text-xs text-red-500">{errors.numeroAutoEntrepreneur}</p>}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={loading} className="w-full flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Mettre à jour
      </Button>
    </form>
  );
};

export default PostCreationForm;
