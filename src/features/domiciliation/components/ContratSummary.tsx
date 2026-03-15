import React from "react";
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
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-900">Montant total du contrat</p>
          <p className="text-xs text-emerald-700">
            {months} mois × {formatCurrency(montantMensuel)}
          </p>
          <p className="text-xs text-emerald-600">Paiement unique lors de la signature notariale</p>
        </div>
        <p className="text-3xl font-bold text-emerald-900">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}
