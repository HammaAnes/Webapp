import React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { calculateContractDurationMonths, calculateContractTotal } from "../utils";

interface Props {
  dateDebut: string;
  dateFin: string;
  montantMensuel: number;
}

const NOTARY_FEES = 8000;

export default function ContratSummary({ dateDebut, dateFin, montantMensuel }: Props) {
  const months = calculateContractDurationMonths(dateDebut, dateFin);
  const total = calculateContractTotal(montantMensuel, months);
  const isUpfrontContract = months >= 6;

  if (!dateDebut || !dateFin || !montantMensuel || months <= 0) return null;

  return (
    <div className="space-y-2">
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

      {isUpfrontContract && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Paiement intégral à la signature :</span> les contrats{" "}
            {months >= 12 ? "annuels" : "semestriels"} sont réglés en totalité chez le notaire (
            {formatCurrency(total)}), auxquels s'ajoutent des frais notariaux d'environ{" "}
            <span className="font-semibold">{formatCurrency(NOTARY_FEES)}</span>.
          </div>
        </div>
      )}
    </div>
  );
}
