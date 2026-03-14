import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  AlertCircle,
  User,
  Clock,
  MapPin,
} from "lucide-react";
import {
  addDays,
  startOfDay,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  format,
  getDay,
  differenceInDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useAppStore } from "../../store/store";
import { formatTime, formatCurrency } from "../../utils/formatters";
import {
  getReservationStatutLabel,
  type ReservationStatut,
} from "../../constants";
import type { Reservation, Espace } from "../../types";
import { apiClient } from "../../lib/api-client";

type ViewRange = 7 | 14 | 30;

interface Blocage {
  id: string;
  espace_id: string;
  date_debut: string;
  date_fin: string;
  type: string;
  raison: string;
  statut: string;
}

interface HotelCalendarProps {
  onReservationClick: (reservation: Reservation) => void;
  onCreateClick: (espaceId: string, date: string) => void;
}

const STATUS_BAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmee: { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-white" },
  en_attente: { bg: "bg-amber-400", border: "border-amber-500", text: "text-amber-950" },
  en_cours: { bg: "bg-sky-500", border: "border-sky-600", text: "text-white" },
  terminee: { bg: "bg-gray-300", border: "border-gray-400", text: "text-gray-700" },
  annulee: { bg: "bg-red-300", border: "border-red-400", text: "text-red-900" },
};

const LEGEND_ITEMS = [
  { label: "Confirmee", color: "bg-emerald-500" },
  { label: "En attente", color: "bg-amber-400" },
  { label: "En cours", color: "bg-sky-500" },
  { label: "Terminee", color: "bg-gray-300" },
  { label: "Annulee", color: "bg-red-300" },
  { label: "Blocage", color: "bg-gray-800" },
];

function getBarStyle(statut: string) {
  return STATUS_BAR_COLORS[statut] || STATUS_BAR_COLORS.confirmee;
}

interface BarPosition {
  reservation: Reservation;
  startCol: number;
  span: number;
  row: number;
}

function computeBars(
  reservations: Reservation[],
  espaceId: string,
  days: Date[],
): BarPosition[] {
  const start = startOfDay(days[0]);
  const end = startOfDay(addDays(days[days.length - 1], 1));
  const relevant = reservations
    .filter((r) => {
      if (r.espaceId !== espaceId) return false;
      if (r.statut === "annulee") return false;
      const rStart = startOfDay(new Date(r.dateDebut));
      const rEnd = startOfDay(new Date(r.dateFin));
      return isBefore(rStart, end) && isAfter(rEnd, start);
    })
    .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());

  const bars: BarPosition[] = [];
  const rows: number[][] = [];

  for (const res of relevant) {
    const rStart = startOfDay(new Date(res.dateDebut));
    const rEnd = startOfDay(new Date(res.dateFin));

    let startCol = differenceInDays(rStart, start);
    if (startCol < 0) startCol = 0;

    let endCol = differenceInDays(rEnd, start);
    if (endCol >= days.length) endCol = days.length - 1;

    const span = endCol - startCol + 1;
    if (span <= 0) continue;

    let row = 0;
    while (true) {
      if (!rows[row]) rows[row] = [];
      const conflict = rows[row].some((barIdx) => {
        const b = bars[barIdx];
        return startCol < b.startCol + b.span && startCol + span > b.startCol;
      });
      if (!conflict) break;
      row++;
    }

    if (!rows[row]) rows[row] = [];
    rows[row].push(bars.length);

    bars.push({ reservation: res, startCol, span, row });
  }

  return bars;
}

function computeBlockageBars(
  blocages: Blocage[],
  espaceId: string,
  days: Date[],
): { startCol: number; span: number; blocage: Blocage }[] {
  const start = startOfDay(days[0]);
  const end = startOfDay(addDays(days[days.length - 1], 1));

  return blocages
    .filter((b) => {
      if (b.espace_id !== espaceId) return false;
      if (b.statut === "annule" || b.statut === "termine") return false;
      const bStart = startOfDay(new Date(b.date_debut));
      const bEnd = startOfDay(new Date(b.date_fin));
      return isBefore(bStart, end) && isAfter(bEnd, start);
    })
    .map((b) => {
      const bStart = startOfDay(new Date(b.date_debut));
      const bEnd = startOfDay(new Date(b.date_fin));
      let startCol = differenceInDays(bStart, start);
      if (startCol < 0) startCol = 0;
      let endCol = differenceInDays(bEnd, start);
      if (endCol >= days.length) endCol = days.length - 1;
      const span = endCol - startCol + 1;
      return { startCol, span, blocage: b };
    })
    .filter((b) => b.span > 0);
}

export default function HotelCalendar({ onReservationClick, onCreateClick }: HotelCalendarProps) {
  const { reservations, espaces, loadReservations } = useAppStore();
  const [viewRange, setViewRange] = useState<ViewRange>(14);
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [blocages, setBlocages] = useState<Blocage[]>([]);
  const [tooltip, setTooltip] = useState<{ res: Reservation; x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.getBlocages().then((resp) => {
      if (resp.success && Array.isArray(resp.data)) {
        setBlocages(resp.data as Blocage[]);
      }
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    const resp = await apiClient.getBlocages();
    if (resp.success && Array.isArray(resp.data)) {
      setBlocages(resp.data as Blocage[]);
    }
    setRefreshing(false);
  };

  const days = useMemo(() => {
    return Array.from({ length: viewRange }, (_, i) => addDays(startDate, i));
  }, [startDate, viewRange]);

  const today = startOfDay(new Date());

  const todayStats = useMemo(() => {
    const todayRes = reservations.filter((r) => {
      const rStart = startOfDay(new Date(r.dateDebut));
      const rEnd = startOfDay(new Date(r.dateFin));
      return (
        r.statut !== "annulee" &&
        (isSameDay(rStart, today) ||
          isSameDay(rEnd, today) ||
          isWithinInterval(today, { start: rStart, end: rEnd }))
      );
    });
    const pending = todayRes.filter((r) => r.statut === "en_attente").length;
    return { total: todayRes.length, pending };
  }, [reservations, today]);

  const sortedEspaces = useMemo(() => {
    return [...espaces].sort((a, b) => a.nom.localeCompare(b.nom));
  }, [espaces]);

  const colWidth = viewRange <= 7 ? 120 : viewRange <= 14 ? 90 : 48;
  const rowBaseHeight = 52;
  const barHeight = 26;
  const barGap = 2;
  const sidebarWidth = 180;

  const maxRowsPerEspace = useMemo(() => {
    const map: Record<string, number> = {};
    for (const esp of sortedEspaces) {
      const bars = computeBars(reservations, esp.id, days);
      const maxRow = bars.reduce((max, b) => Math.max(max, b.row), -1);
      map[esp.id] = maxRow + 1;
    }
    return map;
  }, [sortedEspaces, reservations, days]);

  const getRowHeight = (espaceId: string) => {
    const rows = maxRowsPerEspace[espaceId] || 0;
    return Math.max(rowBaseHeight, rows * (barHeight + barGap) + 16);
  };

  const handleBarHover = (res: Reservation, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ res, x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const isClosed = (d: Date) => { const day = getDay(d); return day === 5 || day === 6; };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartDate((d) => addDays(d, -viewRange))}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStartDate(startOfDay(new Date()))}
            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setStartDate((d) => addDays(d, viewRange))}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-gray-900">
            {format(days[0], "d MMM", { locale: fr })} - {format(days[days.length - 1], "d MMM yyyy", { locale: fr })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500 mr-3">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{todayStats.total}</span> aujourd'hui
            {todayStats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                {todayStats.pending} en attente
              </span>
            )}
          </div>

          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {([7, 14, 30] as ViewRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setViewRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewRange === range
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {range}j
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto" ref={gridRef}>
          <div style={{ minWidth: sidebarWidth + colWidth * viewRange }}>
            <div className="flex sticky top-0 z-20 bg-gray-50 border-b border-gray-200">
              <div
                className="flex-shrink-0 border-r border-gray-200 px-4 py-3 flex items-center"
                style={{ width: sidebarWidth }}
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Espaces
                </span>
              </div>
              <div className="flex">
                {days.map((day, i) => {
                  const isToday = isSameDay(day, today);
                  const closed = isClosed(day);
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 border-r border-gray-100 text-center py-2 ${
                        isToday ? "bg-sky-50" : closed ? "bg-gray-100" : ""
                      }`}
                      style={{ width: colWidth }}
                    >
                      <div className={`text-[10px] uppercase tracking-wide ${
                        isToday ? "text-sky-600 font-bold" : closed ? "text-gray-400" : "text-gray-400"
                      }`}>
                        {format(day, "EEE", { locale: fr })}
                      </div>
                      <div className={`text-sm font-bold ${
                        isToday ? "text-sky-600" : closed ? "text-gray-400" : "text-gray-800"
                      }`}>
                        {format(day, "d")}
                      </div>
                      {isToday && (
                        <div className="mx-auto mt-0.5 w-1 h-1 rounded-full bg-sky-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {sortedEspaces.length === 0 ? (
              <div className="px-8 py-16 text-center text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Aucun espace configure</p>
              </div>
            ) : (
              sortedEspaces.map((espace) => {
                const bars = computeBars(reservations, espace.id, days);
                const blockBars = computeBlockageBars(blocages, espace.id, days);
                const rowHeight = getRowHeight(espace.id);

                return (
                  <div key={espace.id} className="flex border-b border-gray-100 last:border-b-0">
                    <div
                      className="flex-shrink-0 border-r border-gray-200 px-4 flex flex-col justify-center"
                      style={{ width: sidebarWidth, minHeight: rowHeight }}
                    >
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {espace.nom}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {espace.capacite} place{espace.capacite > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex relative" style={{ minHeight: rowHeight }}>
                      {days.map((day, i) => {
                        const isToday = isSameDay(day, today);
                        const closed = isClosed(day);
                        return (
                          <div
                            key={i}
                            className={`flex-shrink-0 border-r border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                              isToday ? "bg-sky-50/30" : closed ? "bg-gray-50/60" : ""
                            }`}
                            style={{ width: colWidth, minHeight: rowHeight }}
                            onClick={() => {
                              if (!closed) {
                                onCreateClick(espace.id, format(day, "yyyy-MM-dd"));
                              }
                            }}
                          />
                        );
                      })}

                      {blockBars.map((bb, i) => (
                        <div
                          key={`block-${i}`}
                          className="absolute bg-gray-800/10 border border-dashed border-gray-400 rounded"
                          style={{
                            left: bb.startCol * colWidth + 2,
                            width: bb.span * colWidth - 4,
                            top: 4,
                            bottom: 4,
                            zIndex: 5,
                            pointerEvents: "none",
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-gray-500 bg-white/80 px-1.5 py-0.5 rounded">
                              {bb.blocage.raison || bb.blocage.type}
                            </span>
                          </div>
                        </div>
                      ))}

                      {bars.map((bar, i) => {
                        const style = getBarStyle(bar.reservation.statut);
                        const clientName = bar.reservation.utilisateur
                          ? `${bar.reservation.utilisateur.prenom || ""} ${bar.reservation.utilisateur.nom || ""}`.trim()
                          : "";
                        const showTime = viewRange <= 14;

                        return (
                          <div
                            key={bar.reservation.id}
                            className={`absolute ${style.bg} ${style.border} ${style.text} border rounded-md cursor-pointer hover:brightness-110 hover:shadow-md transition-all group`}
                            style={{
                              left: bar.startCol * colWidth + 3,
                              width: bar.span * colWidth - 6,
                              top: 8 + bar.row * (barHeight + barGap),
                              height: barHeight,
                              zIndex: 10,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReservationClick(bar.reservation);
                            }}
                            onMouseEnter={(e) => handleBarHover(bar.reservation, e)}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <div className="flex items-center gap-1 px-2 h-full overflow-hidden">
                              <User className="w-3 h-3 flex-shrink-0 opacity-80" />
                              <span className="text-[11px] font-semibold truncate">
                                {clientName || "Client"}
                              </span>
                              {showTime && (
                                <span className="text-[10px] opacity-75 ml-auto flex-shrink-0">
                                  {formatTime(bar.reservation.dateDebut)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isSameDay(startDate, today) || (isBefore(startDate, today) && isAfter(addDays(startDate, viewRange), today)) ? (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
                          style={{
                            left: differenceInDays(today, startDate) * colWidth + colWidth / 2,
                          }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs max-w-xs">
            <div className="font-semibold">
              {tooltip.res.utilisateur?.prenom} {tooltip.res.utilisateur?.nom}
            </div>
            <div className="text-gray-300 mt-1">
              {tooltip.res.espace?.nom} -- {getReservationStatutLabel(tooltip.res.statut)}
            </div>
            <div className="text-gray-400">
              {formatTime(tooltip.res.dateDebut)} - {formatTime(tooltip.res.dateFin)}
            </div>
            {tooltip.res.montantTotal > 0 && (
              <div className="text-gray-400">{formatCurrency(tooltip.res.montantTotal)}</div>
            )}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
