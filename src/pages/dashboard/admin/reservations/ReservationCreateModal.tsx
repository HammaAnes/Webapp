import React from "react";
import { MapPin } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { UserSelector, type SelectedUser } from "../../../../components/admin/UserSelector";
import type { Espace } from "../../../../types";
import { WORKING_HOURS } from "../../../../constants/algeria";

export interface CreateReservationForm {
  espace_id: string;
  date_debut: string;
  heure_debut: string;
  date_fin: string;
  heure_fin: string;
  participants: number;
  notes: string;
  reduction: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CreateReservationForm;
  setFormData: (data: CreateReservationForm) => void;
  selectedUser: SelectedUser | null;
  setSelectedUser: (user: SelectedUser | null) => void;
  espaces: Espace[];
  loading: boolean;
}

const ReservationCreateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedUser,
  setSelectedUser,
  espaces,
  loading,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Location" subtitle="Créer une location pour un client" size="lg">
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UserSelector value={selectedUser} onChange={setSelectedUser} label="Client" required />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Espace <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={formData.espace_id}
              onChange={(e) => setFormData({ ...formData, espace_id: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm bg-white appearance-none cursor-pointer"
              required
            >
              <option value="">Sélectionner un espace</option>
              {espaces.map((espace) => (
                <option key={espace.id} value={espace.id}>
                  {espace.nom} ({espace.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Date début *", field: "date_debut", type: "date", min: undefined, max: undefined },
          { label: "Heure début *", field: "heure_debut", type: "time", min: WORKING_HOURS.START, max: WORKING_HOURS.END },
          { label: "Date fin *", field: "date_fin", type: "date", min: undefined, max: undefined },
          { label: "Heure fin *", field: "heure_fin", type: "time", min: WORKING_HOURS.START, max: WORKING_HOURS.END },
        ].map(({ label, field, type, min, max }) => (
          <div key={field}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <input
              type={type}
              value={formData[field as keyof CreateReservationForm] as string}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              min={min}
              max={max}
              step={type === "time" ? "1800" : undefined}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
              required
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Participants</label>
          <input
            type="number"
            value={formData.participants}
            onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 1 })}
            min="1"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Remise (DA)</label>
          <input
            type="number"
            value={formData.reduction}
            onChange={(e) => setFormData({ ...formData, reduction: Math.max(0, parseInt(e.target.value) || 0) })}
            min="0"
            placeholder="0"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes optionnelles..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white" loading={loading}>
          Créer la location
        </Button>
      </div>
    </form>
  </Modal>
);

export default ReservationCreateModal;
