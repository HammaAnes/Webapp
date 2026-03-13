import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Lock,
  Download,
  Calendar,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Badge from "../../../components/ui/Badge";

interface Transaction {
  id: string;
  type_transaction: string;
  montant: number;
  mode_paiement: string;
  numero_recu: string;
  reference_paiement?: string;
  statut: string;
  created_at: string;
  admin_prenom: string;
  admin_nom: string;
}

interface Totaux {
  mode_paiement: string;
  total: number;
  nombre: number;
}

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  virement: "Virement",
  cheque: "Chèque",
  tpe: "TPE",
  credit: "Crédit",
};

const MODE_PAIEMENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cash: Banknote,
  virement: CreditCard,
  cheque: Receipt,
  tpe: CreditCard,
  credit: CreditCard,
};

export default function Caisse() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totaux, setTotaux] = useState<Totaux[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [clotureNotes, setClotureNotes] = useState("");

  useEffect(() => {
    loadTransactions();
  }, [selectedDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTransactionsCaisse(selectedDate);
      if (response.success) {
        setTransactions(response.data.transactions);
        setTotaux(response.data.totaux);
        setTotalGeneral(response.data.total_general);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCloture = async () => {
    try {
      const response = await apiClient.cloturerCaisse(selectedDate, clotureNotes);
      if (response.success) {
        toast.success("Clôture enregistrée avec succès");
        setShowClotureModal(false);
        setClotureNotes("");
        loadTransactions();
      } else {
        toast.error(response.error || "Erreur lors de la clôture");
      }
    } catch (error) {
      toast.error("Erreur lors de la clôture");
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(montant);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caisse</h1>
          <p className="text-gray-600 mt-1">Gestion des encaissements</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <Button
            onClick={() => setShowClotureModal(true)}
            variant="primary"
            icon={Lock}
          >
            Clôturer la journée
          </Button>
        </div>
      </div>

      {/* Totaux par mode de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {["cash", "virement", "cheque", "tpe", "credit"].map((mode) => {
          const total = totaux.find((t) => t.mode_paiement === mode);
          const Icon = MODE_PAIEMENT_ICONS[mode];
          return (
            <Card key={mode} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {MODE_PAIEMENT_LABELS[mode]}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMontant(total?.total || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {total?.nombre || 0} transaction(s)
                  </p>
                </div>
                <Icon className="w-10 h-10 text-gray-400" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Total général */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Total Général</p>
            <p className="text-4xl font-bold text-green-900 mt-1">
              {formatMontant(totalGeneral)}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {transactions.length} transaction(s) enregistrée(s)
            </p>
          </div>
          <DollarSign className="w-16 h-16 text-green-600 opacity-50" />
        </div>
      </Card>

      {/* Liste des transactions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Journal du {new Date(selectedDate).toLocaleDateString("fr-FR")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Heure
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Référence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reçu
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(transaction.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {transaction.type_transaction}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary">
                      {MODE_PAIEMENT_LABELS[transaction.mode_paiement]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.reference_paiement || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {transaction.numero_recu}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                    {formatMontant(transaction.montant)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      variant={transaction.statut === "encaisse" ? "success" : "warning"}
                    >
                      {transaction.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucune transaction enregistrée pour cette date
            </div>
          )}
        </div>
      </Card>

      {/* Modal clôture */}
      {showClotureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Clôturer la journée
            </h3>
            <p className="text-gray-600 mb-4">
              Confirmez la clôture de caisse pour le{" "}
              {new Date(selectedDate).toLocaleDateString("fr-FR")}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Récapitulatif :</p>
              {totaux.map((total) => (
                <div key={total.mode_paiement} className="flex justify-between text-sm mb-1">
                  <span>{MODE_PAIEMENT_LABELS[total.mode_paiement]}</span>
                  <span className="font-semibold">{formatMontant(total.total)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total Général</span>
                <span>{formatMontant(totalGeneral)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={clotureNotes}
                onChange={(e) => setClotureNotes(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                placeholder="Remarques éventuelles..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowClotureModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button onClick={handleCloture} variant="primary" className="flex-1">
                Confirmer la clôture
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
