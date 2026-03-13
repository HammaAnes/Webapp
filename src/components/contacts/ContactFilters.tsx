import { Search } from 'lucide-react';
import Input from '../ui/Input';
import SelectNative from '../ui/SelectNative';
import { SOURCE_OPTIONS, STATUT_OPTIONS } from '../../constants/contacts';
import type { ContactSource, ContactStatut } from '../../types';

interface ContactFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statutValue: ContactStatut | '';
  onStatutChange: (value: ContactStatut | '') => void;
  sourceValue: ContactSource | '';
  onSourceChange: (value: ContactSource | '') => void;
}

export function ContactFilters({
  searchValue,
  onSearchChange,
  statutValue,
  onStatutChange,
  sourceValue,
  onSourceChange,
}: ContactFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <Input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <SelectNative
        value={statutValue}
        onChange={(e) => onStatutChange(e.target.value as ContactStatut | '')}
      >
        <option value="">Tous les statuts</option>
        {STATUT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectNative>

      <SelectNative
        value={sourceValue}
        onChange={(e) => onSourceChange(e.target.value as ContactSource | '')}
      >
        <option value="">Toutes les sources</option>
        {SOURCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectNative>
    </div>
  );
}
