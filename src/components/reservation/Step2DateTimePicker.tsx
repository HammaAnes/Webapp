import React, { useMemo } from "react";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Users, ToggleLeft, ToggleRight } from "lucide-react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { isClosedDay } from "../../hooks/useReservationFlow";
import { formatPrice } from "../../utils/formatters";
import type { ReservationFlowActions, ReservationFlowState } from "../../hooks/useReservationFlow";
import { useAvailabilityStore } from "../../store/availabilityStore";

const OPENING_TIME = "08:30";
const CLOSING_TIME = "18:30";

function buildTimeOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  for (let h = 8; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 8 && m < 30) continue;
      if (h === 18 && m > 30) continue;
      const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      opts.push({ value: val, label: val });
    }
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  let cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endCopy = new Date(end);
  endCopy.setHours(0, 0, 0, 0);
  while (cur <= endCopy) {
    if (!isClosedDay(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

interface ParticipantsFieldProps {
  value: number;
  max: number;
  onChange: (n: number) => void;
}

function ParticipantsField({ value, max, onChange }: ParticipantsFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg leading-none"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center font-semibold text-gray-900 text-lg">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg leading-none"
      >
        +
      </button>
      <span className="text-sm text-gray-500">/ {max} places</span>
    </div>
  );
}

interface Step2DateTimePickerProps {
  state: ReservationFlowState;
  actions: ReservationFlowActions;
}

const Step2DateTimePicker: React.FC<Step2DateTimePickerProps> = ({ state, actions }) => {
  const { selectedEspace, dateMode, dateDebut, dateFin, heureDebut, heureFin, participants, pricing } = state;

  const getMonthData = useAvailabilityStore((s) => s.getMonthData);
  const today = new Date();

  const capacityFromStore = useMemo(() => {
    if (!selectedEspace) return 12;
    const monthData = getMonthData(selectedEspace.id, today);
    if (monthData && monthData.capacity > 1) return monthData.capacity;
    return selectedEspace.capacite > 0 ? selectedEspace.capacite : 12;
  }, [selectedEspace, getMonthData]);

  const isOpenSpace = selectedEspace?.type === "open_space";

  const heureDebutOpts = useMemo(() => {
    if (dateMode === "multi_day") return [];
    return TIME_OPTIONS.filter((o) => o.value < (heureFin ?? CLOSING_TIME));
  }, [dateMode, heureFin]);

  const heureFinOpts = useMemo(() => {
    if (dateMode === "multi_day") return [];
    return TIME_OPTIONS.filter((o) => o.value > (heureDebut ?? OPENING_TIME));
  }, [dateMode, heureDebut]);

  const durationLabel = useMemo(() => {
    if (!dateDebut || !dateFin) return null;
    if (dateMode === "single_day") {
      const h = (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60);
      if (h < 1) return null;
      return h <= 4 ? "Demi-journée" : "Journée complète";
    }
    const calDays = differenceInCalendarDays(dateFin, dateDebut) + 1;
    const workDays = countWorkingDays(dateDebut, dateFin);
    return `${calDays} jour${calDays > 1 ? "s" : ""} (${workDays} jour${workDays > 1 ? "s" : ""} ouvrable${workDays > 1 ? "s" : ""})`;
  }, [dateDebut, dateFin, dateMode]);

  if (!selectedEspace) return null;

  const handleSingleDaySelect = (date: Date) => {
    actions.setDateDebut(date);
  };

  const handleRangeSelect = (start: Date, end: Date) => {
    actions.setDateDebut(start);
    actions.setDateFin(end);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">
          {selectedEspace.nom} — Choisissez la période
        </h3>
        <p className="text-sm text-gray-500">Le vendredi est fermé. Les réservations du samedi sont soumises à confirmation.</p>
      </div>

      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => actions.setDateMode("single_day")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            dateMode === "single_day"
              ? "bg-white shadow-sm text-gray-900 border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          Journée / Demi-journée
        </button>
        <button
          type="button"
          onClick={() => actions.setDateMode("multi_day")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            dateMode === "multi_day"
              ? "bg-white shadow-sm text-gray-900 border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {dateMode === "multi_day" ? (
            <ToggleRight className="w-4 h-4 inline mr-1.5" />
          ) : (
            <ToggleLeft className="w-4 h-4 inline mr-1.5" />
          )}
          Multi-jours
        </button>
      </div>

      <AvailabilityCalendar
        espaceId={selectedEspace.id}
        selectedDate={dateDebut ?? new Date()}
        onDateSelect={handleSingleDaySelect}
        selectionMode={dateMode === "multi_day" ? "range" : "single"}
        rangeEnd={dateMode === "multi_day" ? dateFin : null}
        onRangeSelect={handleRangeSelect}
        isOpenSpace={isOpenSpace}
        spaceCapacity={capacityFromStore}
      />

      {dateMode === "single_day" && dateDebut && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Heure de début
            </label>
            <select
              value={heureDebut}
              onChange={(e) => actions.setHeureDebut(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {heureDebutOpts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Heure de fin
            </label>
            <select
              value={heureFin}
              onChange={(e) => actions.setHeureFin(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {heureFinOpts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {dateMode === "multi_day" && dateDebut && dateFin && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
          <Calendar className="w-4 h-4 shrink-0 text-blue-500" />
          <span>
            Du <strong>{format(dateDebut, "d MMM yyyy", { locale: fr })}</strong> au{" "}
            <strong>{format(dateFin, "d MMM yyyy", { locale: fr })}</strong>
            {" — "}8:30 → 18:30 chaque jour
          </span>
        </div>
      )}

      {isOpenSpace && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Nombre de participants
          </label>
          <ParticipantsField
            value={participants}
            max={capacityFromStore}
            onChange={actions.setParticipants}
          />
          <p className="text-xs text-gray-400">
            Le tarif est multiplié par le nombre de participants.
          </p>
        </div>
      )}

      {pricing && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{pricing.breakdown}</span>
            <span>{formatPrice(pricing.baseAmount)}</span>
          </div>
          {durationLabel && (
            <p className="text-xs text-gray-400">{durationLabel}</p>
          )}
          <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
            <span>Estimation</span>
            <span className="text-lg">{formatPrice(pricing.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2DateTimePicker;
