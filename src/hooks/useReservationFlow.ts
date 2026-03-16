import { useState, useCallback } from "react";
import { addDays, getDay, isSameDay, differenceInMinutes, differenceInCalendarDays } from "date-fns";
import type { Espace } from "../types";
import { useAppStore } from "../store/store";
import { useAvailabilityStore } from "../store/availabilityStore";
import { apiClient } from "../lib/api-client";
import toast from "react-hot-toast";

export type ReservationStep = 1 | 2 | 3;
export type DateSelectionMode = "single_day" | "multi_day";

export interface PricingSummary {
  baseAmount: number;
  reduction: number;
  total: number;
  breakdown: string;
  typeReservation: string;
}

export interface ReservationFlowState {
  step: ReservationStep;
  selectedEspace: Espace | null;
  dateMode: DateSelectionMode;
  dateDebut: Date | null;
  dateFin: Date | null;
  heureDebut: string;
  heureFin: string;
  participants: number;
  notes: string;
  promoCode: string;
  promoApplied: boolean;
  promoReduction: number;
  promoId: string;
  promoError: string;
  isSubmitting: boolean;
  isValidatingPromo: boolean;
  pricing: PricingSummary | null;
}

export interface ReservationFlowActions {
  goToStep: (step: ReservationStep) => void;
  selectEspace: (espace: Espace) => void;
  setDateMode: (mode: DateSelectionMode) => void;
  setDateDebut: (date: Date | null) => void;
  setDateFin: (date: Date | null) => void;
  setHeureDebut: (h: string) => void;
  setHeureFin: (h: string) => void;
  setParticipants: (n: number) => void;
  setNotes: (n: string) => void;
  setPromoCode: (c: string) => void;
  validatePromo: () => Promise<void>;
  removePromo: () => void;
  submit: () => Promise<{ success: boolean; id?: string; error?: string }>;
  reset: () => void;
  canGoNext: boolean;
}

const WORKING_HOURS = { open: "08:30", close: "18:30" };

export function isClosedDay(date: Date): boolean {
  const d = getDay(date);
  return d === 5 || d === 6;
}

function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    if (!isClosedDay(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

function buildDateDebut(date: Date, heure: string, isMultiDay: boolean): Date {
  const [h, m] = (isMultiDay ? WORKING_HOURS.open : heure).split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function buildDateFin(date: Date, heure: string, isMultiDay: boolean): Date {
  const [h, m] = (isMultiDay ? WORKING_HOURS.close : heure).split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function computePricing(
  espace: Espace,
  dateDebut: Date,
  dateFin: Date,
  dateMode: DateSelectionMode,
  participants: number,
  promoReduction: number,
): PricingSummary {
  const isOpenSpace = espace.type === "open_space";
  const multiplier = isOpenSpace ? Math.max(1, participants) : 1;
  const diffMinutes = differenceInMinutes(dateFin, dateDebut);

  let baseAmount = 0;
  let breakdown = "";
  let typeReservation = "heure";

  if (dateMode === "single_day") {
    const hours = diffMinutes / 60;
    if (hours <= 4) {
      baseAmount = espace.prixDemiJournee * multiplier;
      breakdown = `Demi-journée × ${multiplier}`;
      typeReservation = "demi_journee";
    } else {
      baseAmount = espace.prixJour * multiplier;
      breakdown = `Journée × ${multiplier}`;
      typeReservation = "jour";
    }
  } else {
    const calDays = differenceInCalendarDays(dateFin, dateDebut) + 1;
    const workingDays = countWorkingDays(dateDebut, dateFin);
    const weeks = Math.floor(workingDays / 5);
    const remainingDays = workingDays % 5;

    let withWeeks = 0;
    if (weeks > 0 && espace.prixSemaine > 0) {
      withWeeks = weeks * espace.prixSemaine + remainingDays * espace.prixJour;
    }
    const withDays = workingDays * espace.prixJour;

    if (calDays >= 28 && espace.prixMois && espace.prixMois > 0) {
      const months = Math.round(calDays / 30);
      baseAmount = months * espace.prixMois * multiplier;
      breakdown = `${months} mois × ${multiplier}`;
      typeReservation = "mois";
    } else if (withWeeks > 0 && withWeeks < withDays) {
      baseAmount = withWeeks * multiplier;
      breakdown = `${weeks} sem. + ${remainingDays} j × ${multiplier}`;
      typeReservation = "semaine";
    } else {
      baseAmount = withDays * multiplier;
      breakdown = `${workingDays} jour${workingDays > 1 ? "s" : ""} × ${multiplier}`;
      typeReservation = "jour";
    }
  }

  const total = Math.max(0, baseAmount - promoReduction);
  return { baseAmount, reduction: promoReduction, total, breakdown, typeReservation };
}

const initialState: ReservationFlowState = {
  step: 1,
  selectedEspace: null,
  dateMode: "single_day",
  dateDebut: null,
  dateFin: null,
  heureDebut: WORKING_HOURS.open,
  heureFin: WORKING_HOURS.close,
  participants: 1,
  notes: "",
  promoCode: "",
  promoApplied: false,
  promoReduction: 0,
  promoId: "",
  promoError: "",
  isSubmitting: false,
  isValidatingPromo: false,
  pricing: null,
};

export function useReservationFlow(opts?: {
  editMode?: boolean;
  reservationId?: string;
  initialEspace?: Espace;
  initialData?: {
    dateDebut: Date;
    dateFin: Date;
    participants: number;
    notes: string;
  };
  onSuccess?: () => void;
}) {
  const { editMode, reservationId, initialEspace, initialData, onSuccess } = opts ?? {};

  const [state, setState] = useState<ReservationFlowState>(() => {
    if (editMode && initialEspace && initialData) {
      const isMultiDay = differenceInCalendarDays(initialData.dateFin, initialData.dateDebut) > 0;
      const heureDebut = `${String(initialData.dateDebut.getHours()).padStart(2, "0")}:${String(initialData.dateDebut.getMinutes()).padStart(2, "0")}`;
      const heureFin = `${String(initialData.dateFin.getHours()).padStart(2, "0")}:${String(initialData.dateFin.getMinutes()).padStart(2, "0")}`;
      return {
        ...initialState,
        step: 2,
        selectedEspace: initialEspace,
        dateMode: isMultiDay ? "multi_day" : "single_day",
        dateDebut: initialData.dateDebut,
        dateFin: initialData.dateFin,
        heureDebut,
        heureFin,
        participants: initialData.participants,
        notes: initialData.notes,
      };
    }
    return initialState;
  });

  const createReservation = useAppStore((s) => s.createReservation);
  const updateReservation = useAppStore((s) => s.updateReservation);
  const refreshAfterMutation = useAvailabilityStore((s) => s.refreshAfterMutation);

  const updateState = useCallback((partial: Partial<ReservationFlowState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const recomputePricing = useCallback(
    (
      espace: Espace | null,
      dateDebut: Date | null,
      dateFin: Date | null,
      dateMode: DateSelectionMode,
      participants: number,
      promoReduction: number,
    ) => {
      if (!espace || !dateDebut || !dateFin) return null;
      try {
        return computePricing(espace, dateDebut, dateFin, dateMode, participants, promoReduction);
      } catch {
        return null;
      }
    },
    [],
  );

  const goToStep = useCallback((step: ReservationStep) => {
    updateState({ step });
  }, [updateState]);

  const selectEspace = useCallback((espace: Espace) => {
    setState((prev) => {
      const pricing = recomputePricing(espace, prev.dateDebut, prev.dateFin, prev.dateMode, prev.participants, prev.promoReduction);
      return { ...prev, selectedEspace: espace, step: 2, pricing };
    });
  }, [recomputePricing]);

  const setDateMode = useCallback((mode: DateSelectionMode) => {
    setState((prev) => {
      const newDateFin = mode === "single_day" ? prev.dateDebut : prev.dateFin;
      let built: { dateDebut: Date | null; dateFin: Date | null } = { dateDebut: prev.dateDebut, dateFin: newDateFin };

      if (prev.dateDebut) {
        const db = buildDateDebut(prev.dateDebut, prev.heureDebut, mode === "multi_day");
        const df = newDateFin
          ? buildDateFin(newDateFin, prev.heureFin, mode === "multi_day")
          : null;
        built = { dateDebut: db, dateFin: df };
      }

      const pricing = recomputePricing(prev.selectedEspace, built.dateDebut, built.dateFin, mode, prev.participants, prev.promoReduction);
      return { ...prev, dateMode: mode, ...built, pricing };
    });
  }, [recomputePricing]);

  const setDateDebut = useCallback((date: Date | null) => {
    setState((prev) => {
      const isMultiDay = prev.dateMode === "multi_day";
      const dateDebut = date ? buildDateDebut(date, prev.heureDebut, isMultiDay) : null;
      let dateFin = prev.dateFin;

      if (!isMultiDay) {
        dateFin = date ? buildDateFin(date, prev.heureFin, false) : null;
      } else if (dateFin && date && dateFin < date) {
        dateFin = buildDateFin(date, prev.heureFin, true);
      }

      const pricing = recomputePricing(prev.selectedEspace, dateDebut, dateFin, prev.dateMode, prev.participants, prev.promoReduction);
      return { ...prev, dateDebut, dateFin, pricing };
    });
  }, [recomputePricing]);

  const setDateFin = useCallback((date: Date | null) => {
    setState((prev) => {
      const dateFin = date ? buildDateFin(date, prev.heureFin, true) : null;
      const pricing = recomputePricing(prev.selectedEspace, prev.dateDebut, dateFin, prev.dateMode, prev.participants, prev.promoReduction);
      return { ...prev, dateFin, pricing };
    });
  }, [recomputePricing]);

  const setHeureDebut = useCallback((h: string) => {
    setState((prev) => {
      if (prev.dateMode === "multi_day") return { ...prev, heureDebut: h };
      const dateDebut = prev.dateDebut ? buildDateDebut(prev.dateDebut, h, false) : null;
      const pricing = recomputePricing(prev.selectedEspace, dateDebut, prev.dateFin, prev.dateMode, prev.participants, prev.promoReduction);
      return { ...prev, heureDebut: h, dateDebut, pricing };
    });
  }, [recomputePricing]);

  const setHeureFin = useCallback((h: string) => {
    setState((prev) => {
      if (prev.dateMode === "multi_day") return { ...prev, heureFin: h };
      const dateFin = prev.dateFin ? buildDateFin(prev.dateFin, h, false) : null;
      const pricing = recomputePricing(prev.selectedEspace, prev.dateDebut, dateFin, prev.dateMode, prev.participants, prev.promoReduction);
      return { ...prev, heureFin: h, dateFin, pricing };
    });
  }, [recomputePricing]);

  const setParticipants = useCallback((n: number) => {
    setState((prev) => {
      const pricing = recomputePricing(prev.selectedEspace, prev.dateDebut, prev.dateFin, prev.dateMode, n, prev.promoReduction);
      return { ...prev, participants: n, pricing };
    });
  }, [recomputePricing]);

  const setNotes = useCallback((n: string) => {
    updateState({ notes: n });
  }, [updateState]);

  const setPromoCode = useCallback((c: string) => {
    updateState({ promoCode: c, promoError: "" });
  }, [updateState]);

  const validatePromo = useCallback(async () => {
    const { promoCode, pricing, selectedEspace } = state;
    if (!promoCode.trim() || !pricing || !selectedEspace) return;

    updateState({ isValidatingPromo: true, promoError: "" });

    try {
      const result = await apiClient.validateCodePromo(promoCode.trim(), pricing.baseAmount, "reservation");
      if (result.valid) {
        const reduction = result.reduction ?? 0;
        setState((prev) => {
          const newPricing = prev.pricing
            ? { ...prev.pricing, reduction, total: Math.max(0, prev.pricing.baseAmount - reduction) }
            : null;
          return {
            ...prev,
            promoApplied: true,
            promoReduction: reduction,
            promoId: result.codePromoId ?? "",
            promoError: "",
            isValidatingPromo: false,
            pricing: newPricing,
          };
        });
        toast.success(`Code promo appliqué : -${reduction.toLocaleString("fr-FR")} DA`);
      } else {
        updateState({ promoError: result.error ?? "Code invalide", isValidatingPromo: false });
      }
    } catch {
      updateState({ promoError: "Erreur lors de la validation", isValidatingPromo: false });
    }
  }, [state, updateState]);

  const removePromo = useCallback(() => {
    setState((prev) => {
      const pricing = prev.pricing
        ? { ...prev.pricing, reduction: 0, total: prev.pricing.baseAmount }
        : null;
      return { ...prev, promoApplied: false, promoReduction: 0, promoId: "", promoCode: "", pricing };
    });
  }, []);

  const submit = useCallback(async () => {
    const { selectedEspace, dateDebut, dateFin, participants, notes, promoId, pricing } = state;

    if (!selectedEspace || !dateDebut || !dateFin || !pricing) {
      return { success: false, error: "Données manquantes" };
    }

    updateState({ isSubmitting: true });

    try {
      let result: { success: boolean; id?: string; error?: string };

      if (editMode && reservationId) {
        result = await updateReservation(reservationId, {
          dateDebut,
          dateFin,
          participants,
          notes,
        });
      } else {
        result = await createReservation({
          espaceId: selectedEspace.id,
          dateDebut,
          dateFin,
          participants,
          notes,
          codePromo: promoId || undefined,
        });
      }

      if (result.success) {
        await refreshAfterMutation(selectedEspace.id, dateDebut);
        if (isSameDay(dateDebut, dateFin) === false) {
          await refreshAfterMutation(selectedEspace.id, dateFin);
        }
        onSuccess?.();
        toast.success(editMode ? "Réservation modifiée" : "Réservation créée avec succès !");
      } else {
        toast.error(result.error ?? "Erreur lors de la réservation");
      }

      updateState({ isSubmitting: false });
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : "Erreur inconnue";
      updateState({ isSubmitting: false });
      toast.error(error);
      return { success: false, error };
    }
  }, [state, editMode, reservationId, createReservation, updateReservation, refreshAfterMutation, onSuccess, updateState]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const canGoNext = (() => {
    const { step, selectedEspace, dateDebut, dateFin, dateMode, participants } = state;
    if (step === 1) return !!selectedEspace;
    if (step === 2) {
      if (!dateDebut) return false;
      if (dateMode === "multi_day" && !dateFin) return false;
      if (dateMode === "single_day" && !dateFin) return false;
      if (selectedEspace?.type === "open_space" && participants < 1) return false;
      return !!state.pricing;
    }
    return true;
  })();

  return {
    state,
    actions: {
      goToStep,
      selectEspace,
      setDateMode,
      setDateDebut,
      setDateFin,
      setHeureDebut,
      setHeureFin,
      setParticipants,
      setNotes,
      setPromoCode,
      validatePromo,
      removePromo,
      submit,
      reset,
      canGoNext,
    } satisfies ReservationFlowActions,
  };
}
