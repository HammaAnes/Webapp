import React, { useState, useEffect, useCallback } from "react";
import { Wrench, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { useConfirm } from "../../../../hooks/useConfirm";
import { apiClient } from "../../../../lib/api-client";
import toast from "react-hot-toast";
import { logger } from "../../../../utils/logger";

const MaintenanceTab: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    setApiStatus("checking");
    apiClient.get("/health.php")
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("disconnected"));
  }, []);

  const handleClearCache = useCallback(async () => {
    const ok = await confirm({
      title: "Effacer le cache",
      message: "Êtes-vous sûr de vouloir effacer le cache ? Vous allez être déconnecté.",
      confirmLabel: "Effacer",
      variant: "warning",
    });
    if (!ok) return;
    try {
      localStorage.removeItem("coffice-app-storage");
      toast.success("Cache effacé avec succès");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      logger.error("Erreur suppression cache:", error as Error);
      toast.error("Erreur lors de la suppression du cache");
    }
  }, [confirm]);

  const recheckApi = () => {
    setApiStatus("checking");
    apiClient.get("/health.php")
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("disconnected"));
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-gray-600" />
          Maintenance & Système
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">État du système</p>
              <p className="text-sm text-gray-500">Connexion à l'API backend</p>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus === "checking" ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Vérification...</span>
                </div>
              ) : apiStatus === "connected" ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Connecté</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Déconnecté</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={recheckApi}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Effacer le cache local</p>
              <p className="text-sm text-gray-500">Vider les données en cache du navigateur</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Effacer
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Recharger les données</p>
              <p className="text-sm text-gray-500">Forcer le rechargement depuis le serveur</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recharger
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Version</p>
              <p className="text-sm text-gray-500">Version actuelle de l'application</p>
            </div>
            <span className="text-sm font-mono bg-gray-200 px-3 py-1 rounded">v4.2.0</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Transport email</p>
              <p className="text-sm text-gray-500">Fournisseur d'envoi d'emails actif</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Brevo SMTP</span>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
      />
    </>
  );
};

export default MaintenanceTab;
