import React from "react";
import { AlertCircle, Building2 } from "lucide-react";

interface Props {
  value: number | string;
  onChange: (val: number) => void;
  occupiedBureaux: number[];
  disabled?: boolean;
  required?: boolean;
  showEmpty?: boolean;
  label?: string;
}

export default function BureauSelector({
  value,
  onChange,
  occupiedBureaux,
  disabled = false,
  required = false,
  showEmpty = false,
  label = "Numéro de bureau",
}: Props) {
  const numValue = value ? Number(value) : 0;
  const isCurrentOccupied = numValue > 0 && occupiedBureaux.includes(numValue);
  const freeCount = 60 - occupiedBureaux.filter((n) => n >= 1 && n <= 60).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {freeCount} / 60 libres
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        disabled={disabled}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
      >
        {showEmpty ? (
          <option value="">Non attribué</option>
        ) : (
          <option value={0}>Sélectionner un bureau</option>
        )}
        {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
          const isOccupied = occupiedBureaux.includes(n);
          return (
            <option key={n} value={n} disabled={isOccupied}>
              Bureau {n}
              {isOccupied ? " — occupé" : ""}
            </option>
          );
        })}
      </select>
      {isCurrentOccupied && (
        <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium">
          <AlertCircle className="w-3 h-3" />
          Ce bureau est déjà attribué à une autre domiciliation
        </p>
      )}
    </div>
  );
}
