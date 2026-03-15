import React from "react";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { calculateContractDurationMonths, calculateContractTotal } from "../utils";

interface Props {
  dateDebut: string;
  dateFin: string;
  montantMensuel: number;
}

export default function ContratSummary({ dateDebut, dateFin, montantMensuel }: Props) {
  const months = calculateContractDurationMonths(dateDebut, dateFin);
  const total = calculateContractTotal(montantMensuel, months);

  if (!dateDebut || !dateFin || !montantMensuel || months <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
            Total du contrat
          </p>
          <p className="text-sm text-emerald-600 mt-0.5">
            {months} mois × {formatCurrency(montantMensuel)}
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-900 flex-shrink-0">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}
