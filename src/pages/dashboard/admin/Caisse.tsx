import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Lock,
  Calendar,
  Plus,
  X,
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

interface TransactionsResponse {
  transactions: Transaction[];
  totaux: Totaux[];
  total_general: number;
}

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  cash: "Especes",
  virement: "Virement",
  cheque: "Cheque",
  tpe: "TPE",
  credit: "Credit",
};

const MODE_PAIEMENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cash: Banknote,
  virement: CreditCard,
  cheque: Receipt,
  tpe: CreditCard,
  credit: CreditCard,
};

const TYPE_TRANSACTION_OPTIONS = [
  { value: "reservation", label: "Reservation" },
  { value: "abonnement", label: "Abonnement" },
  { value: "domiciliation", label: "Domiciliation" },
  { value: "impression", label: "Impression" },
  { value: "boisson", label: "Boisson" },
  { value: "autre", label: "Autre" },
];

const MODE_PAIEMENT_OPTIONS = [
  { value: "cash", label: "Especes" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Cheque" },
  { value: "tpe", label: "TPE" },
];

export default function Caisse() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totaux, setTotaux] = useState<Totaux[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clotureNotes, setClotureNotes] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    type_transaction: "reservation",
    montant: "",
    mode_paiement: "cash",
    reference_paiement: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [selectedDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTransactionsCaisse(selectedDate);
      if (response.success && response.data) {
        const data = response.data as TransactionsResponse;
        setTransactions(data.transactions || []);
        setTotaux(data.totaux || []);
        setTotalGeneral(data.total_general || 0);
      } else {
        toast.error(response.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Erreur chargement transactions:", error);
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCloture = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir clôturer la caisse pour le ${new Date(selectedDate).toLocaleDateString("fr-FR")} ?`)) {
      return;
    }

    try {
      const response = await apiClient.cloturerCaisse(selectedDate, clotureNotes);
      if (response.success) {
        toast.success("Cloture enregistree avec succes");
        setShowClotureModal(false);
        setClotureNotes("");
        loadTransactions();
      } else {
        toast.error(response.error || "Erreur lors de la cloture");
      }
    } catch (error) {
      console.error("Erreur clôture caisse:", error);
      toast.error("Erreur lors de la cloture");
    }
  };

  const handleCreateTransaction = async () => {
    const montant = parseFloat(paymentForm.montant);
    if (!montant || montant <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.createTransactionCaisse({
        type_transaction: paymentForm.type_transaction,
        montant,
        mode_paiement: paymentForm.mode_paiement,
        reference_paiement: paymentForm.reference_paiement || undefined,
        description: paymentForm.description || undefined,
      });

      if (response.success) {
        toast.success("Transaction enregistree");
        setShowPaymentModal(false);
        setPaymentForm({
          type_transaction: "reservation",
          montant: "",
          mode_paiement: "cash",
          reference_paiement: "",
          description: "",
        });
        loadTransactions();
      } else {
        toast.error(response.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur création transaction:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caisse</h1>
          <p className="text-gray-600 mt-1">Gestion des encaissements</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <Button onClick={() => setShowPaymentModal(true)} variant="success">
            <Plus className="w-4 h-4" />
            Encaisser
          </Button>
          <Button onClick={() => setShowClotureModal(true)} variant="primary">
            <Lock className="w-4 h-4" />
            Cloturer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["cash", "virement", "cheque", "tpe"].map((mode) => {
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

      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Total General</p>
            <p className="text-4xl font-bold text-green-900 mt-1">
              {formatMontant(totalGeneral)}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {transactions.length} transaction(s) enregistree(s)
            </p>
          </div>
          <DollarSign className="w-16 h-16 text-green-600 opacity-50" />
        </div>
      </Card>

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
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recu
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
                    <Badge variant="teal">
                      {MODE_PAIEMENT_LABELS[transaction.mode_paiement] || transaction.mode_paiement}
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
              Aucune transaction enregistree pour cette date
            </div>
          )}
        </div>
      </Card>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Nouvel encaissement
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de transaction
                </label>
                <select
                  value={paymentForm.type_transaction}
                  onChange={(e) => setPaymentForm({ ...paymentForm, type_transaction: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {TYPE_TRANSACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={paymentForm.montant}
                  onChange={(e) => setPaymentForm({ ...paymentForm, montant: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODE_PAIEMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, mode_paiement: opt.value })}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        paymentForm.mode_paiement === opt.value
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference (optionnel)
                </label>
                <input
                  type="text"
                  value={paymentForm.reference_paiement}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference_paiement: e.target.value })}
                  placeholder="N de cheque, virement..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  placeholder="Details de la transaction..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateTransaction}
                variant="success"
                className="flex-1"
                loading={submitting}
              >
                Encaisser {paymentForm.montant ? formatMontant(parseFloat(paymentForm.montant) || 0) : ""}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showClotureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cloturer la journee
            </h3>
            <p className="text-gray-600 mb-4">
              Confirmez la cloture de caisse pour le{" "}
              {new Date(selectedDate).toLocaleDateString("fr-FR")}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Recapitulatif :</p>
              {totaux.map((total) => (
                <div key={total.mode_paiement} className="flex justify-between text-sm mb-1">
                  <span>{MODE_PAIEMENT_LABELS[total.mode_paiement] || total.mode_paiement}</span>
                  <span className="font-semibold">{formatMontant(total.total)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total General</span>
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
                placeholder="Remarques eventuelles..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowClotureModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button onClick={handleCloture} variant="primary" className="flex-1">
                Confirmer la cloture
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
