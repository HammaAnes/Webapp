import React, { useEffect } from "react";
import { Users, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/store";
import { useAvailabilityStore } from "../../store/availabilityStore";
import type { Espace } from "../../types";
import { formatPrice } from "../../utils/formatters";
import type { ReservationFlowActions, ReservationFlowState } from "../../hooks/useReservationFlow";

const SPACE_IMAGES: Record<string, string> = {
  salle_reunion: "/salle-reunion.jpeg",
  reunion: "/salle-reunion.jpeg",
  open_space: "/espace-coworking.jpeg",
  coworking: "/espace-coworking.jpeg",
  box_4: "/booth-atlas.jpeg",
  box_3: "/booth-hoggar.jpeg",
  atlas: "/booth-atlas.jpeg",
  aures: "/booth-aures.jpeg",
  hoggar: "/booth-hoggar.jpeg",
};

function getSpaceImage(nom: string, type: string): string {
  const lower = (nom + " " + type).toLowerCase();
  for (const [key, url] of Object.entries(SPACE_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return "/espace-coworking.jpeg";
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    open_space: "Open Space",
    salle_reunion: "Salle de réunion",
    bureau_prive: "Bureau privé",
    box: "Box",
  };
  return map[type] ?? type;
}

interface AvailabilityIndicatorProps {
  espace: Espace;
  today: Date;
}

function AvailabilityIndicator({ espace, today }: AvailabilityIndicatorProps) {
  const getMonthData = useAvailabilityStore((s) => s.getMonthData);
  const monthData = getMonthData(espace.id, today);

  if (!espace.disponible) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Indisponible
      </span>
    );
  }

  if (!monthData || monthData.loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        Chargement...
      </span>
    );
  }

  const isOpenSpace = monthData.isOpenSpace || espace.type === "open_space";
  const capacity = monthData.capacity > 1 ? monthData.capacity : espace.capacite;

  if (isOpenSpace && capacity > 0) {
    const todayStr = today.toISOString().split("T")[0];
    const todayData = monthData.days.find(
      (d) => d.date.toISOString().split("T")[0] === todayStr,
    );
    const available = todayData ? todayData.seatsAvailable : capacity;
    const pct = available / capacity;
    const color = pct === 0 ? "red" : pct < 0.4 ? "amber" : "emerald";

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium text-${color}-700`}>
            {available}/{capacity} places libres
          </span>
          {available === 0 && (
            <span className="text-xs text-red-600 font-semibold">Complet</span>
          )}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 rounded-full transition-all`}
            style={{ width: `${(available / capacity) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const todayStr = today.toISOString().split("T")[0];
  const todayData = monthData.days.find(
    (d) => d.date.toISOString().split("T")[0] === todayStr,
  );
  const isAvailable = !todayData || todayData.status === "available" || todayData.seatsAvailable > 0;

  return isAvailable ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Disponible aujourd'hui
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" />
      Réservé aujourd'hui
    </span>
  );
}

interface EspaceCardProps {
  espace: Espace;
  selected: boolean;
  onSelect: () => void;
  today: Date;
}

function EspaceCard({ espace, selected, onSelect, today }: EspaceCardProps) {
  const image = getSpaceImage(espace.nom, espace.type);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!espace.disponible}
      className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        selected
          ? "border-primary shadow-md scale-[1.01]"
          : espace.disponible
          ? "border-gray-200 hover:border-primary/40 hover:shadow-md hover:scale-[1.005]"
          : "border-gray-100 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={image}
          alt={espace.nom}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-semibold text-sm leading-tight">{espace.nom}</p>
          <p className="text-white/70 text-xs">{getTypeLabel(espace.type)}</p>
        </div>
        {selected && (
          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2.5">
        <AvailabilityIndicator espace={espace} today={today} />

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {espace.capacite} pers.
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatPrice(espace.prixJour)}/j
          </span>
        </div>

        {espace.equipements.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {espace.equipements.slice(0, 3).map((eq) => (
              <span key={eq} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {eq}
              </span>
            ))}
            {espace.equipements.length > 3 && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                +{espace.equipements.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

interface Step1EspaceSelectorProps {
  state: ReservationFlowState;
  actions: ReservationFlowActions;
}

const Step1EspaceSelector: React.FC<Step1EspaceSelectorProps> = ({ state, actions }) => {
  const espaces = useAppStore((s) => s.espaces);
  const fetchMonth = useAvailabilityStore((s) => s.fetchMonth);
  const today = new Date();

  useEffect(() => {
    espaces.forEach((espace) => {
      if (espace.disponible) {
        fetchMonth(espace.id, today);
      }
    });
  }, [espaces, fetchMonth]);

  const disponibles = espaces.filter((e) => e.disponible);
  const indisponibles = espaces.filter((e) => !e.disponible);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Choisissez un espace</h3>
        <p className="text-sm text-gray-500">La disponibilité est mise à jour en temps réel</p>
      </div>

      {disponibles.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Aucun espace disponible pour le moment.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {disponibles.map((espace) => (
          <EspaceCard
            key={espace.id}
            espace={espace}
            selected={state.selectedEspace?.id === espace.id}
            onSelect={() => actions.selectEspace(espace)}
            today={today}
          />
        ))}
      </div>

      {indisponibles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-50">
          {indisponibles.map((espace) => (
            <EspaceCard
              key={espace.id}
              espace={espace}
              selected={false}
              onSelect={() => {}}
              today={today}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Step1EspaceSelector;
