import React from "react";

interface Props {
  occupied: number[];
  selected?: number;
  onSelect?: (n: number) => void;
  pending?: number[];
  readOnly?: boolean;
}

interface BureauInfo {
  num: number;
  societyName?: string;
}

export default function BureauVisualGrid({
  occupied,
  selected,
  onSelect,
  pending = [],
  readOnly = false,
}: Props) {
  const bureaux: BureauInfo[] = Array.from({ length: 60 }, (_, i) => ({ num: i + 1 }));

  const getStatus = (num: number) => {
    if (selected === num) return "selected";
    if (occupied.includes(num)) return "occupied";
    if (pending.includes(num)) return "pending";
    return "free";
  };

  const getCellClass = (status: string, canInteract: boolean) => {
    const base = "w-full aspect-square flex items-center justify-center text-xs font-semibold rounded-lg border-2 transition-all";
    if (status === "selected") return `${base} bg-sky-500 border-sky-600 text-white shadow-md`;
    if (status === "occupied") return `${base} bg-red-100 border-red-300 text-red-700 cursor-not-allowed`;
    if (status === "pending") return `${base} bg-amber-100 border-amber-300 text-amber-700`;
    if (canInteract) return `${base} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer`;
    return `${base} bg-emerald-50 border-emerald-200 text-emerald-700`;
  };

  const free = 60 - occupied.length - pending.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
          <span className="text-gray-600">Libre ({free})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
          <span className="text-gray-600">Occupé ({occupied.length})</span>
        </span>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
            <span className="text-gray-600">En cours ({pending.length})</span>
          </span>
        )}
        {selected && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
            <span className="text-gray-600">Sélectionné (N°{selected})</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {bureaux.map(({ num }) => {
          const status = getStatus(num);
          const canInteract = !readOnly && status !== "occupied" && status !== "pending";

          return (
            <div
              key={num}
              title={
                status === "occupied"
                  ? `Bureau N°${num} — Occupé`
                  : status === "selected"
                  ? `Bureau N°${num} — Sélectionné`
                  : `Bureau N°${num} — Libre`
              }
              className={getCellClass(status, canInteract)}
              onClick={() => {
                if (canInteract && onSelect) onSelect(num);
              }}
            >
              {num}
            </div>
          );
        })}
      </div>

      {selected && (
        <p className="text-sm text-sky-700 font-medium">
          Bureau N°{selected} sélectionné
        </p>
      )}
    </div>
  );
}
