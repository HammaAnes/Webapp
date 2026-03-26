import React from "react";
import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const ReservationDeleteModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Supprimer la location" size="sm">
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Cette action est irréversible. La location sera définitivement supprimée.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          loading={loading}
        >
          Supprimer
        </Button>
      </div>
    </div>
  </Modal>
);

export default ReservationDeleteModal;
