import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Calendar, Clock, Users, Check, AlertCircle, MapPin, ChevronRight, Loader2, CreditCard, Timer, ArrowLeft, Wifi, Coffee, Monitor, Zap, Sun, Star, Shield, Info, Tag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import AvailabilityCalendar from "../reservation/AvailabilityCalendar";
import { apiClient } from "../../lib/api-client";
import { emailService } from "../../services/email-service";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import { WORKING_HOURS } from "../../constants/algeria";
import {
  differenceInMinutes,
  addDays,
  setHours,
  setMinutes,
  format,
  isBefore,
  startOfDay,
  getDay,
  eachDayOfInterval,
} from "date-fns";
import { fr } from "date-fns/locale";

interface EspaceAPI {
  id: string;
  nom: string;
  type: string;
  capacite: number;
  prix_heure?: number;
  prix_jour?: number;
  prix_demi_journee?: number;
  prix_semaine?: number;
  prix_mois?: number;
  prixHeure?: number;
  prixJour?: number;
  prixDemiJournee?: number;
  prixSemaine?: number;
  prixMois?: number;
  disponible: boolean | number;
  description?: string;
  image?: string;
  equipements?: string[];
  places_disponibles?: number;
  placesDisponibles?: number;
  places_occupees?: number;
  placesOccupees?: number;
}

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEspace?: EspaceAPI;
  editMode?: boolean;
  reservationId?: string;
  initialData?: {
    dateDebut: Date;
    dateFin: Date;
    participants: number;
    notes: string;
  };
}

interface FormData {
  espace_id: string;
  date_debut: Date;
  date_fin: Date;
  participants: number;
  notes: string;
}

type ReservationType = "single_day" | "multi_day";

const getPrixHeure = (espace: EspaceAPI | null): number => {
  if (!espace) return 0;
  const prix = espace.prix_heure ?? espace.prixHeure ?? 0;
  return typeof prix === "string" ? parseFloat(prix) : prix;
};

const getPrixJour = (espace: EspaceAPI | null): number => {
  if (!espace) return 0;
  const prix = espace.prix_jour ?? espace.prixJour ?? 0;
  return typeof prix === "string" ? parseFloat(prix) : prix;
};

const getPrixDemiJournee = (espace: EspaceAPI | null): number => {
  if (!espace) return 0;
  const prix = espace.prix_demi_journee ?? espace.prixDemiJournee ?? 0;
  if (typeof prix === "string") return parseFloat(prix);
  if (prix > 0) return prix;
  const prixJ = getPrixJour(espace);
  return prixJ > 0 ? Math.round(prixJ / 2) : 0;
};

const getPrixSemaine = (espace: EspaceAPI | null): number => {
  if (!espace) return 0;
  const prix = espace.prix_semaine ?? espace.prixSemaine ?? 0;
  return typeof prix === "string" ? parseFloat(prix) : prix;
};

const getPrixMois = (espace: EspaceAPI | null): number => {
  if (!espace) return 0;
  const prix = espace.prix_mois ?? espace.prixMois ?? 0;
  return typeof prix === "string" ? parseFloat(prix) : prix;
};

const OPENING_HOUR = WORKING_HOURS.OPENING_HOUR;
const OPENING_MINUTE = WORKING_HOURS.OPENING_MINUTE;
const CLOSING_HOUR = WORKING_HOURS.CLOSING_HOUR;
const CLOSING_MINUTE = WORKING_HOURS.CLOSING_MINUTE;

const OPEN_SPACE_CAPACITY = 12;

const isOpenSpace = (espace: EspaceAPI): boolean => {
  const lower = (espace.nom + " " + espace.type).toLowerCase();
  return lower.includes("open") || lower.includes("coworking") || espace.type === "open_space";
};

const getAvailableSeats = (espace: EspaceAPI, seatsFromAvailability?: number): number => {
  if (seatsFromAvailability != null) return seatsFromAvailability;
  if (espace.places_disponibles != null) return Number(espace.places_disponibles);
  if (espace.placesDisponibles != null) return Number(espace.placesDisponibles);
  const occupied = espace.places_occupees ?? espace.placesOccupees ?? 0;
  return espace.capacite - Number(occupied);
};

const getAvailabilityStatus = (espace: EspaceAPI, realtimeSeats?: number | null): { label: string; color: string; bgColor: string; borderColor: string; cardBorder: string; cardBg: string; available: boolean; seats?: number } => {
  const dispo = espace.disponible;
  const isBoolFalse = typeof dispo === "boolean" && !dispo;
  const isNumFalse = typeof dispo === "number" && dispo === 0;

  if (isOpenSpace(espace)) {
    const seats = getAvailableSeats(espace, realtimeSeats ?? undefined);
    const total = espace.capacite || OPEN_SPACE_CAPACITY;
    const occupied = total - seats;
    if (seats <= 0 || isBoolFalse || isNumFalse) {
      return { label: "Complet", color: "text-red-700", bgColor: "bg-red-500", borderColor: "border-red-200", cardBorder: "border-red-400", cardBg: "bg-red-50/50", available: false, seats: 0 };
    }
    if (occupied > total / 2) {
      return { label: `${seats}/${total} places`, color: "text-amber-700", bgColor: "bg-amber-500", borderColor: "border-amber-200", cardBorder: "border-amber-400", cardBg: "bg-amber-50/50", available: true, seats };
    }
    return { label: `${seats}/${total} places`, color: "text-emerald-700", bgColor: "bg-emerald-500", borderColor: "border-emerald-200", cardBorder: "border-emerald-400", cardBg: "bg-emerald-50/50", available: true, seats };
  }

  if (isBoolFalse || isNumFalse) {
    return { label: "Réservé", color: "text-red-700", bgColor: "bg-red-500", borderColor: "border-red-200", cardBorder: "border-red-400", cardBg: "bg-red-50/50", available: false };
  }
  return { label: "Disponible", color: "text-emerald-700", bgColor: "bg-emerald-500", borderColor: "border-emerald-200", cardBorder: "border-emerald-400", cardBg: "bg-emerald-50/30", available: true };
};

const isOpenDay = (date: Date): boolean => {
  const day = getDay(date);
  if (day === 5 || day === 6) return false;
  return true;
};

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

const getSpaceImage = (espace: EspaceAPI): string => {
  if (espace.image) return espace.image;
  const lower = (espace.nom + " " + espace.type).toLowerCase();
  for (const [key, url] of Object.entries(SPACE_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return "/espace-coworking.jpeg";
};

const getNextOpenDay = (from: Date): Date => {
  let date = new Date(from);
  while (!isOpenDay(date)) {
    date = addDays(date, 1);
  }
  return date;
};

const getDefaultStartDate = (): Date => {
  let now = new Date();
  now = getNextOpenDay(now);
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  if (currentH > CLOSING_HOUR || (currentH === CLOSING_HOUR && currentM >= CLOSING_MINUTE)) {
    const tomorrow = getNextOpenDay(addDays(now, 1));
    return setMinutes(setHours(tomorrow, OPENING_HOUR), OPENING_MINUTE);
  }
  if (currentH < OPENING_HOUR || (currentH === OPENING_HOUR && currentM < OPENING_MINUTE)) {
    return setMinutes(setHours(now, OPENING_HOUR), OPENING_MINUTE);
  }
  const nextM = currentM <= 30 ? 30 : 0;
  const nextH = currentM <= 30 ? currentH : currentH + 1;
  return setMinutes(setHours(now, nextH), nextM);
};

const getEquipmentIcon = (equip: string) => {
  const lower = equip.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return Wifi;
  if (lower.includes("cafe") || lower.includes("boisson")) return Coffee;
  if (lower.includes("ecran") || lower.includes("projecteur")) return Monitor;
  return Zap;
};

const getSpaceTypeLabel = (type: string): string => {
  const lower = type?.toLowerCase() || "";
  if (lower.includes("reunion")) return "Salle de réunion";
  if (lower.includes("box")) return "Bureau privé";
  if (lower.includes("open") || lower.includes("coworking")) return "Open Space";
  if (lower.includes("poste")) return "Poste informatique";
  return type;
};

const countWorkingDays = (start: Date, end: Date): number => {
  const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });
  return days.filter((d) => isOpenDay(d)).length;
};

const STEPS = [
  { id: 1, label: "Espace", icon: MapPin },
  { id: 2, label: "Date & Heure", icon: Calendar },
  { id: 3, label: "Confirmation", icon: Shield },
];

const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = [];
  let h = OPENING_HOUR;
  let m = OPENING_MINUTE;
  while (h < CLOSING_HOUR || (h === CLOSING_HOUR && m <= CLOSING_MINUTE)) {
    const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const label = `${h}h${m === 0 ? "00" : m}`;
    options.push({ value: val, label });
    m += 30;
    if (m >= 60) {
      h++;
      m = 0;
    }
  }
  return options;
})();

const ReservationForm: React.FC<ReservationFormProps> = ({
  isOpen,
  onClose,
  selectedEspace,
  editMode = false,
  reservationId,
  initialData,
}) => {
  const { reservations: storeReservations, loadReservations } = useAppStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [espaces, setEspaces] = useState<EspaceAPI[]>([]);
  const [currentEspace, setCurrentEspace] = useState<EspaceAPI | null>(null);
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEspaces, setLoadingEspaces] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reservationType, setReservationType] = useState<ReservationType>("single_day");
  const [selectedDate, setSelectedDate] = useState<Date>(getNextOpenDay(new Date()));
  const [selectedStartTime, setSelectedStartTime] = useState<string>("08:30");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("12:30");
  const [multiDayEnd, setMultiDayEnd] = useState<Date | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{ valid: boolean; reduction: number; codePromoId?: string; error?: string } | null>(null);
  const [slotSeatsAvailable, setSlotSeatsAvailable] = useState<number | null>(null);
  const [slotSeatsTaken, setSlotSeatsTaken] = useState<number | null>(null);
  const [slotCapacity, setSlotCapacity] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      espace_id: selectedEspace?.id || "",
      date_debut: getDefaultStartDate(),
      date_fin: setMinutes(setHours(getNextOpenDay(new Date()), 12), 30),
      participants: 1,
      notes: "",
    },
  });

  const watchEspaceId = watch("espace_id");
  const watchDateDebut = watch("date_debut");
  const watchDateFin = watch("date_fin");
  const watchParticipants = watch("participants");

  useEffect(() => {
    if (isOpen) {
      loadEspaces();
      loadReservations();
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEspace && isOpen) {
      setValue("espace_id", selectedEspace.id);
      setCurrentEspace(selectedEspace);
      if (editMode && initialData) {
        setValue("date_debut", initialData.dateDebut);
        setValue("date_fin", initialData.dateFin);
        setValue("participants", initialData.participants);
        setValue("notes", initialData.notes);
      }
      setStep(2);
    }
  }, [selectedEspace, isOpen, setValue, editMode, initialData]);

  useEffect(() => {
    if (watchEspaceId && espaces.length > 0) {
      const found = espaces.find((e) => e.id === watchEspaceId);
      setCurrentEspace(found || null);
    } else {
      setCurrentEspace(null);
    }
  }, [watchEspaceId, espaces]);

  useEffect(() => {
    if (reservationType === "single_day") {
      const [startH, startM] = selectedStartTime.split(":").map(Number);
      const [endH, endM] = selectedEndTime.split(":").map(Number);
      const startDate = setMinutes(setHours(new Date(selectedDate), startH), startM);
      const endDate = setMinutes(setHours(new Date(selectedDate), endH), endM);
      setValue("date_debut", startDate);
      setValue("date_fin", endDate);
    } else if (reservationType === "multi_day" && multiDayEnd) {
      const startDate = setMinutes(setHours(new Date(selectedDate), OPENING_HOUR), OPENING_MINUTE);
      const endDate = setMinutes(setHours(new Date(multiDayEnd), CLOSING_HOUR), CLOSING_MINUTE);
      setValue("date_debut", startDate);
      setValue("date_fin", endDate);
    }
  }, [reservationType, selectedDate, selectedStartTime, selectedEndTime, multiDayEnd, setValue]);

  useEffect(() => {
    if (!currentEspace || !watchDateDebut || !watchDateFin) {
      setEstimatedAmount(0);
      return;
    }

    const prixJ = getPrixJour(currentEspace);
    const prixDJ = getPrixDemiJournee(currentEspace);
    const prixS = getPrixSemaine(currentEspace);
    const prixM = getPrixMois(currentEspace);
    const isOS = isOpenSpace(currentEspace);
    const parsedParticipants = parseInt(String(watchParticipants), 10);
    const multiplier = isOS ? (isNaN(parsedParticipants) || parsedParticipants < 1 ? 1 : parsedParticipants) : 1;

    if (reservationType === "multi_day") {
      const days = countWorkingDays(watchDateDebut, watchDateFin);
      if (days <= 0) {
        setEstimatedAmount(0);
        return;
      }
      const baseCost = days * prixJ * multiplier;
      const weeks = Math.floor(days / 5);
      const remainingDays = days % 5;
      const weeklyCost = prixS > 0 ? (weeks * prixS + remainingDays * prixJ) * multiplier : baseCost;
      const bestCost = prixS > 0 ? Math.min(baseCost, weeklyCost) : baseCost;
      setEstimatedAmount(Math.round(bestCost));
      return;
    }

    const minutes = differenceInMinutes(watchDateFin, watchDateDebut);
    if (minutes <= 0) {
      setEstimatedAmount(0);
      return;
    }

    const hours = minutes / 60;
    if (hours <= 4) {
      setEstimatedAmount(Math.round(prixDJ * multiplier));
    } else {
      setEstimatedAmount(Math.round(prixJ * multiplier));
    }
  }, [currentEspace, watchDateDebut, watchDateFin, reservationType, watchParticipants]);

  useEffect(() => {
    if (!currentEspace || !watchDateDebut || !watchDateFin || !isOpenSpace(currentEspace)) {
      setSlotSeatsAvailable(null);
      setSlotSeatsTaken(null);
      setSlotCapacity(null);
      return;
    }
    const reqStart = new Date(watchDateDebut);
    const reqEnd = new Date(watchDateFin);
    if (reqStart >= reqEnd) return;

    const dateStr = format(reqStart, "yyyy-MM-dd");
    const controller = new AbortController();

    const fetchSeats = async () => {
      setCheckingAvailability(true);
      try {
        const response = await apiClient.request(
          `/reservations/availability.php?espace_id=${currentEspace.id}&date_debut=${dateStr}&date_fin=${dateStr}`
        );
        if (response.success && response.data?.days?.length > 0) {
          const dayData = response.data.days[0];
          setSlotSeatsAvailable(dayData.seats_available ?? null);
          setSlotSeatsTaken(dayData.seats_taken ?? null);
          setSlotCapacity(response.data.capacity ?? null);
        } else {
          setSlotSeatsAvailable(null);
          setSlotSeatsTaken(null);
          setSlotCapacity(null);
        }
      } catch {
        setSlotSeatsAvailable(null);
        setSlotSeatsTaken(null);
        setSlotCapacity(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchSeats();
    return () => controller.abort();
  }, [currentEspace, watchDateDebut, watchDateFin]);

  const loadEspaces = async () => {
    try {
      setLoadingEspaces(true);
      setLoadError(null);
      const response = await apiClient.getEspaces();
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        setEspaces(data);
        if (data.length === 0) setLoadError("Aucun espace disponible");
      } else {
        setLoadError(response.error || "Erreur lors du chargement");
        setEspaces([]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Erreur de connexion");
      setEspaces([]);
    } finally {
      setLoadingEspaces(false);
    }
  };

  const validateDates = (): boolean => {
    if (!watchDateDebut || !watchDateFin) {
      toast.error("Veuillez sélectionner les dates");
      return false;
    }
    const now = new Date();
    if (isBefore(watchDateDebut, now)) {
      toast.error("La date et l'heure de début ne peuvent pas être dans le passé");
      return false;
    }
    if (!isOpenDay(watchDateDebut)) {
      toast.error("Ce jour est fermé (ouvert du dimanche au jeudi)");
      return false;
    }

    if (reservationType === "single_day") {
      const startHour = watchDateDebut.getHours();
      const startMinute = watchDateDebut.getMinutes();
      if (startHour < OPENING_HOUR || (startHour === OPENING_HOUR && startMinute < OPENING_MINUTE)) {
        toast.error(`L'heure de début ne peut pas être avant ${OPENING_HOUR}h${OPENING_MINUTE.toString().padStart(2, "0")}`);
        return false;
      }
      const endHour = watchDateFin.getHours();
      const endMinute = watchDateFin.getMinutes();
      if (endHour > CLOSING_HOUR || (endHour === CLOSING_HOUR && endMinute > CLOSING_MINUTE)) {
        toast.error(`L'heure de fin ne peut pas être après ${CLOSING_HOUR}h${CLOSING_MINUTE.toString().padStart(2, "0")}`);
        return false;
      }
      const minutes = differenceInMinutes(watchDateFin, watchDateDebut);
      if (minutes <= 0) {
        toast.error("L'heure de fin doit être après l'heure de début");
        return false;
      }
      if (minutes < 60) {
        toast.error("La réservation doit être d'au moins 1 heure");
        return false;
      }
    } else {
      if (!multiDayEnd) {
        toast.error("Veuillez sélectionner une date de fin");
        return false;
      }
      const days = countWorkingDays(watchDateDebut, watchDateFin);
      if (days < 2) {
        toast.error("Une réservation multi-jours doit couvrir au moins 2 jours ouvrables");
        return false;
      }
    }

    if (currentEspace && isOpenSpace(currentEspace)) {
      const seats = getAvailableSeats(currentEspace, slotSeatsAvailable ?? undefined);
      if ((watchParticipants || 1) > seats) {
        toast.error(`Seulement ${seats} place${seats > 1 ? "s" : ""} disponible${seats > 1 ? "s" : ""} sur ce créneau`);
        return false;
      }
    }

    if (spaceConflict && currentEspace && !isOpenSpace(currentEspace)) {
      const conflictDate = format(new Date(spaceConflict.dateDebut), "d MMM", { locale: fr });
      const conflictStart = format(new Date(spaceConflict.dateDebut), "HH:mm");
      const conflictEnd = format(new Date(spaceConflict.dateFin), "HH:mm");
      toast.error(
        `${currentEspace.nom} est déjà réservé le ${conflictDate} de ${conflictStart} à ${conflictEnd}. Choisissez un autre créneau ou un autre espace.`
      );
      return false;
    }

    return true;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    try {
      const result = await apiClient.validateCodePromo(promoCode.toUpperCase(), estimatedAmount, "reservation");
      if (result.valid) {
        setPromoResult({ valid: true, reduction: result.reduction || 0, codePromoId: result.codePromoId });
        toast.success(`Code promo appliqué : -${result.reduction} DA`);
      } else {
        setPromoResult({ valid: false, reduction: 0, error: result.error || "Code invalide" });
        toast.error(result.error || "Code promo invalide");
      }
    } catch {
      setPromoResult({ valid: false, reduction: 0, error: "Erreur de vérification" });
      toast.error("Erreur lors de la vérification du code");
    } finally {
      setPromoValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoResult(null);
  };

  const finalAmount = useMemo(() => {
    if (promoResult?.valid && promoResult.reduction > 0) {
      return Math.max(0, estimatedAmount - promoResult.reduction);
    }
    return estimatedAmount;
  }, [estimatedAmount, promoResult]);

  const durationInfo = useMemo(() => {
    if (!watchDateDebut || !watchDateFin) return null;
    if (reservationType === "multi_day") {
      const days = countWorkingDays(watchDateDebut, watchDateFin);
      if (days <= 0) return null;
      return { text: `${days} jour${days > 1 ? "s" : ""} ouvrable${days > 1 ? "s" : ""}`, hours: days * 10, days };
    }
    const minutes = differenceInMinutes(watchDateFin, watchDateDebut);
    if (minutes <= 0) return null;
    const hours = Math.round(minutes / 60 * 10) / 10;
    return { text: `${hours}h`, hours, days: 0 };
  }, [watchDateDebut, watchDateFin, reservationType]);

  const pricingBreakdown = useMemo(() => {
    if (!currentEspace || !durationInfo) return null;
    const prixJ = getPrixJour(currentEspace);
    const prixDJ = getPrixDemiJournee(currentEspace);
    const prixS = getPrixSemaine(currentEspace);
    const isOS = isOpenSpace(currentEspace);
    const participants = isOS ? (watchParticipants || 1) : 1;

    if (reservationType === "multi_day" && durationInfo.days) {
      const days = durationInfo.days;
      const weeks = Math.floor(days / 5);
      const remainingDays = days % 5;
      if (prixS > 0 && weeks > 0) {
        const weeklyCost = (weeks * prixS + remainingDays * prixJ) * participants;
        const dailyCost = days * prixJ * participants;
        if (weeklyCost < dailyCost) {
          return { type: "weekly", rate: prixS, quantity: weeks, unit: "semaine", remainingDays, remainingRate: prixJ, participants, isOpenSpace: isOS };
        }
      }
      return { type: "multiday", rate: prixJ, quantity: days, unit: "jour", participants, isOpenSpace: isOS };
    }

    if (durationInfo.hours <= 4) {
      return { type: "halfday", rate: prixDJ, quantity: 1, unit: "demi-journée", participants, isOpenSpace: isOS };
    }
    return { type: "fullday", rate: prixJ, quantity: 1, unit: "journée", participants, isOpenSpace: isOS };
  }, [currentEspace, durationInfo, reservationType, watchParticipants]);

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    if (!data.espace_id) {
      toast.error("Veuillez sélectionner un espace");
      return;
    }
    if (!validateDates()) return;
    try {
      setIsSubmitting(true);

      if (editMode && reservationId) {
        const response = await apiClient.updateReservation(reservationId, {
          dateDebut: data.date_debut.toISOString(),
          dateFin: data.date_fin.toISOString(),
          participants: data.participants || 1,
          notes: data.notes || "",
        });
        if (response.success) {
          toast.success("Réservation modifiée avec succès !");
          handleClose();
        } else {
          toast.error(response.error || response.message || "Erreur lors de la modification");
        }
      } else {
        const response = await apiClient.createReservation({
          espaceId: data.espace_id,
          dateDebut: data.date_debut.toISOString(),
          dateFin: data.date_fin.toISOString(),
          participants: data.participants || 1,
          notes: data.notes || "",
          ...(promoResult?.valid && promoCode ? { codePromo: promoCode.toUpperCase() } : {}),
        });
        if (response.success) {
          toast.success("Réservation confirmée avec succès !");
          const user = useAuthStore.getState().user;
          if (user?.email && currentEspace) {
            const durationText = durationInfo?.text || "";
            emailService.onReservationCreated(user.email, {
              prenom: user.prenom || user.nom || "",
              espaceName: currentEspace.nom,
              espaceType: getSpaceTypeLabel(currentEspace.type),
              dateDebut: format(data.date_debut, "EEEE d MMMM yyyy", { locale: fr }),
              dateFin: format(data.date_fin, "EEEE d MMMM yyyy", { locale: fr }),
              heureDebut: format(data.date_debut, "HH:mm"),
              heureFin: format(data.date_fin, "HH:mm"),
              duree: durationText,
              participants: data.participants || 1,
              montant: estimatedAmount,
              notes: data.notes,
            });
          }
          handleClose();
        } else {
          toast.error(response.error || response.message || "Erreur lors de la création");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset({
      espace_id: "",
      date_debut: getDefaultStartDate(),
      date_fin: setMinutes(setHours(getNextOpenDay(new Date()), 12), 30),
      participants: 1,
      notes: "",
    });
    setEstimatedAmount(0);
    setCurrentEspace(null);
    setStep(1);
    setReservationType("single_day");
    setSelectedDate(getNextOpenDay(new Date()));
    setSelectedStartTime("08:30");
    setSelectedEndTime("12:30");
    setMultiDayEnd(null);
    setIsSubmitting(false);
    setLoadError(null);
    setSlotSeatsAvailable(null);
    setSlotSeatsTaken(null);
    setSlotCapacity(null);
    setPromoCode("");
    setPromoResult(null);
    onClose();
  };

  const selectEspace = (espace: EspaceAPI) => {
    const status = getAvailabilityStatus(espace);
    if (!status.available) {
      toast.error("Cet espace n'est pas disponible actuellement");
      return;
    }
    setValue("espace_id", espace.id);
    setCurrentEspace(espace);
    if (isOpenSpace(espace) && status.seats != null) {
      const maxP = Math.max(1, status.seats);
      if ((watchParticipants || 1) > maxP) {
        setValue("participants", maxP);
      }
    } else {
      if ((watchParticipants || 1) > espace.capacite) {
        setValue("participants", espace.capacite);
      }
    }
    setStep(2);
  };

  const goToConfirmation = () => {
    if (!validateDates()) return;
    setStep(3);
  };

  const handleDateChange = useCallback((date: Date | null) => {
    if (!date) return;
    if (!isOpenDay(date)) {
      toast.error("Coffice est fermé le vendredi et le samedi");
      return;
    }
    setSelectedDate(date);
    setMultiDayEnd(null);
  }, []);

  const handleRangeSelect = useCallback((start: Date, end: Date) => {
    setSelectedDate(start);
    setMultiDayEnd(end);
  }, []);

  const sortedEspaces = useMemo(() => {
    return [...espaces].sort((a, b) => {
      const statusA = getAvailabilityStatus(a);
      const statusB = getAvailabilityStatus(b);
      if (statusA.available && !statusB.available) return -1;
      if (!statusA.available && statusB.available) return 1;
      return 0;
    });
  }, [espaces]);

  const endTimeOptions = useMemo(() => {
    const startMin = (() => {
      const [h, m] = selectedStartTime.split(":").map(Number);
      return h * 60 + m;
    })();
    return TIME_OPTIONS.filter((opt) => {
      const [h, m] = opt.value.split(":").map(Number);
      const optMin = h * 60 + m;
      return optMin > startMin;
    });
  }, [selectedStartTime]);

  useEffect(() => {
    if (reservationType === "single_day") {
      const startMin = (() => {
        const [h, m] = selectedStartTime.split(":").map(Number);
        return h * 60 + m;
      })();
      const endMin = (() => {
        const [h, m] = selectedEndTime.split(":").map(Number);
        return h * 60 + m;
      })();
      if (endMin <= startMin) {
        const newEndMin = Math.min(startMin + 60, CLOSING_HOUR * 60 + CLOSING_MINUTE);
        const newH = Math.floor(newEndMin / 60);
        const newM = newEndMin % 60;
        setSelectedEndTime(`${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
      }
    }
  }, [selectedStartTime, selectedEndTime, reservationType]);

  const maxParticipants = useMemo(() => {
    if (!currentEspace) return 1;
    if (isOpenSpace(currentEspace)) {
      const seats = getAvailableSeats(currentEspace, slotSeatsAvailable ?? undefined);
      return Math.max(1, Math.min(seats, currentEspace.capacite));
    }
    return currentEspace.capacite || 4;
  }, [currentEspace, slotSeatsAvailable]);

  const singleDayHours = useMemo(() => {
    const [startH, startM] = selectedStartTime.split(":").map(Number);
    const [endH, endM] = selectedEndTime.split(":").map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  }, [selectedStartTime, selectedEndTime]);

  const spaceConflict = useMemo(() => {
    if (!currentEspace || !watchDateDebut || !watchDateFin) return null;
    if (isOpenSpace(currentEspace)) return null;

    const reqStart = new Date(watchDateDebut).getTime();
    const reqEnd = new Date(watchDateFin).getTime();
    if (reqStart >= reqEnd) return null;

    const conflict = storeReservations.find((r) => {
      if (r.espaceId !== currentEspace.id) return false;
      if (r.statut === "annulee" || r.statut === "terminee") return false;
      if (editMode && r.id === reservationId) return false;
      const rStart = new Date(r.dateDebut).getTime();
      const rEnd = new Date(r.dateFin).getTime();
      return reqStart < rEnd && reqEnd > rStart;
    });
    return conflict || null;
  }, [currentEspace, watchDateDebut, watchDateFin, storeReservations, editMode, reservationId]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" noPadding>
      <div className="flex flex-col max-h-[85vh]">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editMode
                ? (step === 2 ? "Modifier la date" : "Confirmer la modification")
                : (step === 1 ? "Réserver un espace" : step === 2 ? "Choisir la date" : "Confirmer la réservation")
              }
            </h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <span className="sr-only">Fermer</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => { if (isCompleted) setStep(s.id); }}
                    disabled={!isCompleted}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gray-900 text-white shadow-lg"
                        : isCompleted
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${isCompleted ? "bg-emerald-300" : "bg-gray-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {loadingEspaces ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-500 mt-5 font-medium">Chargement des espaces...</p>
                  </div>
                ) : loadError ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-2">Erreur de chargement</p>
                    <p className="text-gray-500 text-sm mb-4 text-center">{loadError}</p>
                    <Button onClick={loadEspaces} variant="secondary">Réessayer</Button>
                  </div>
                ) : sortedEspaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold">Aucun espace disponible</p>
                    <p className="text-gray-500 text-sm mt-1">Revenez plus tard</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>Ouvert du dimanche au jeudi | 8h30 - 18h30</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedEspaces.map((espace) => {
                        const status = getAvailabilityStatus(espace);
                        const isOS = isOpenSpace(espace);
                        const seats = isOS ? getAvailableSeats(espace) : null;
                        const total = isOS ? (espace.capacite || OPEN_SPACE_CAPACITY) : null;
                        const fillPercentage = isOS && total ? ((total - (seats || 0)) / total) * 100 : 0;

                        return (
                          <button
                            key={espace.id}
                            type="button"
                            onClick={() => selectEspace(espace)}
                            disabled={!status.available}
                            className={`group text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                              status.available
                                ? `${status.cardBg} ${status.cardBorder} hover:shadow-xl cursor-pointer`
                                : "bg-gray-50 border-red-300 opacity-70 cursor-not-allowed"
                            }`}
                          >
                            <div className="relative h-36 overflow-hidden">
                              <img
                                src={getSpaceImage(espace)}
                                alt={espace.nom}
                                className={`w-full h-full object-cover transition-transform duration-500 ${
                                  status.available ? "group-hover:scale-105" : "grayscale"
                                }`}
                              />
                              <div className={`absolute inset-0 ${status.available ? "bg-gradient-to-t from-black/60 via-black/10 to-transparent" : "bg-gradient-to-t from-red-900/70 via-red-900/20 to-transparent"}`} />
                              <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-800">
                                  {getSpaceTypeLabel(espace.type)}
                                </span>
                              </div>
                              <div className="absolute top-3 right-3">
                                <span className={`px-2.5 py-1 ${status.bgColor} rounded-lg text-xs font-bold text-white flex items-center gap-1`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                                  {status.label}
                                </span>
                              </div>
                              {!status.available && !isOS && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="px-4 py-2 bg-red-600/90 text-white font-bold text-sm rounded-lg backdrop-blur-sm">
                                    Réservé
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="font-bold text-white text-lg leading-tight">
                                  {espace.nom}
                                </h3>
                              </div>
                            </div>
                            <div className="p-4">
                              {isOS && total ? (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                      Occupation
                                    </span>
                                    <span className={`text-xs font-bold ${status.color}`}>
                                      {seats} place{(seats || 0) > 1 ? "s" : ""} libre{(seats || 0) > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        fillPercentage >= 80
                                          ? "bg-red-500"
                                          : fillPercentage >= 50
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${fillPercentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-400">0</span>
                                    <span className="text-[10px] text-gray-400">{total} places</span>
                                  </div>
                                </div>
                              ) : !isOS && (
                                <div className="mb-3 flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${status.available ? "bg-emerald-500" : "bg-red-500"}`} />
                                  <span className={`text-sm font-semibold ${status.available ? "text-emerald-700" : "text-red-700"}`}>
                                    {status.available ? "Disponible" : "Réservé"}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-auto">Réservation exclusive</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    {isOS ? `${seats || 0}/${total} places` : `Jusqu'à ${espace.capacite} pers.`}
                                  </span>
                                  {espace.equipements && espace.equipements.length > 0 && (
                                    <span className="flex items-center gap-1 text-sm text-gray-600">
                                      <Star className="w-3.5 h-3.5 text-amber-500" />
                                      {espace.equipements.length} équip.
                                    </span>
                                  )}
                                </div>
                                {status.available && (
                                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-900 rounded-lg flex items-center justify-center transition-colors">
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-end justify-between">
                                <div>
                                  <span className="text-2xl font-bold text-gray-900">
                                    {getPrixDemiJournee(espace).toLocaleString()}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">DA/demi-j</span>
                                </div>
                                {getPrixJour(espace) > 0 && (
                                  <span className="text-sm text-gray-400">
                                    {getPrixJour(espace).toLocaleString()} DA/jour
                                  </span>
                                )}
                              </div>
                              {espace.equipements && espace.equipements.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                                  {espace.equipements.slice(0, 4).map((equip, i) => {
                                    const Icon = getEquipmentIcon(equip);
                                    return (
                                      <span
                                        key={i}
                                        className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md"
                                      >
                                        <Icon className="w-3 h-3" />
                                        {equip}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {step === 2 && currentEspace && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={getSpaceImage(currentEspace)}
                      alt={currentEspace.nom}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{currentEspace.nom}</h3>
                    <p className="text-sm text-gray-500">
                      {getSpaceTypeLabel(currentEspace.type)}
                    </p>
                    {isOpenSpace(currentEspace) && (
                      <div className="mt-1">
                        {checkingAvailability ? (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Vérification des places...
                          </span>
                        ) : slotSeatsTaken != null && slotCapacity != null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${slotSeatsTaken >= slotCapacity ? "bg-red-500" : slotSeatsTaken > slotCapacity / 2 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(100, (slotSeatsTaken / slotCapacity) * 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${slotSeatsTaken >= slotCapacity ? "text-red-600" : slotSeatsTaken > slotCapacity / 2 ? "text-amber-600" : "text-emerald-600"}`}>
                              {slotSeatsTaken}/{slotCapacity} places prises
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Capacité : {currentEspace.capacite} places</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    Changer
                  </button>
                </div>

                {spaceConflict && !isOpenSpace(currentEspace) && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-800">Créneau non disponible</p>
                      <p className="text-red-600 mt-0.5">
                        {currentEspace.nom} est déjà réservé le{" "}
                        {format(new Date(spaceConflict.dateDebut), "EEEE d MMMM", { locale: fr })} de{" "}
                        {format(new Date(spaceConflict.dateDebut), "HH:mm")} à{" "}
                        {format(new Date(spaceConflict.dateFin), "HH:mm")}.
                        Choisissez un autre créneau ou changez d'espace.
                      </p>
                    </div>
                  </div>
                )}

                {isOpenSpace(currentEspace) && slotSeatsAvailable != null && slotSeatsAvailable <= 0 && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-800">Open Space complet sur ce créneau</p>
                      <p className="text-red-600 mt-0.5">Toutes les places sont occupées. Choisissez une autre date ou un autre espace.</p>
                    </div>
                  </div>
                )}

                {isOpenSpace(currentEspace) && slotSeatsAvailable != null && slotSeatsAvailable > 0 && slotSeatsAvailable <= 3 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800">Plus que {slotSeatsAvailable} place{slotSeatsAvailable > 1 ? "s" : ""} disponible{slotSeatsAvailable > 1 ? "s" : ""}</p>
                      <p className="text-amber-700 mt-0.5">L'Open Space se remplit rapidement sur ce créneau.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Type de réservation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReservationType("single_day");
                        setMultiDayEnd(null);
                      }}
                      className={`relative p-4 rounded-xl transition-all duration-200 text-left ${
                        reservationType === "single_day"
                          ? "bg-gray-900 text-white shadow-lg ring-2 ring-gray-900 ring-offset-2"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sun className={`w-5 h-5 flex-shrink-0 ${reservationType === "single_day" ? "text-white" : "text-gray-400"}`} />
                        <div>
                          <p className={`text-sm font-semibold ${reservationType === "single_day" ? "text-white" : "text-gray-900"}`}>
                            Une journée
                          </p>
                          <p className={`text-xs ${reservationType === "single_day" ? "text-gray-300" : "text-gray-400"}`}>
                            Choisissez vos horaires
                          </p>
                        </div>
                      </div>
                      {reservationType === "single_day" && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReservationType("multi_day")}
                      className={`relative p-4 rounded-xl transition-all duration-200 text-left ${
                        reservationType === "multi_day"
                          ? "bg-gray-900 text-white shadow-lg ring-2 ring-gray-900 ring-offset-2"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 flex-shrink-0 ${reservationType === "multi_day" ? "text-white" : "text-gray-400"}`} />
                        <div>
                          <p className={`text-sm font-semibold ${reservationType === "multi_day" ? "text-white" : "text-gray-900"}`}>
                            Plusieurs jours
                          </p>
                          <p className={`text-xs ${reservationType === "multi_day" ? "text-gray-300" : "text-gray-400"}`}>
                            Journées complètes 8h30-18h30
                          </p>
                        </div>
                      </div>
                      {reservationType === "multi_day" && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      {reservationType === "multi_day" ? "Sélectionnez vos dates" : "Sélectionnez une date"}
                    </label>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Vendredi &amp; samedi = fermés
                    </span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <AvailabilityCalendar
                      espaceId={currentEspace.id}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateChange}
                      selectionMode={reservationType === "multi_day" ? "range" : "single"}
                      rangeEnd={multiDayEnd}
                      onRangeSelect={handleRangeSelect}
                      isOpenSpace={isOpenSpace(currentEspace)}
                      spaceCapacity={currentEspace.capacite || OPEN_SPACE_CAPACITY}
                    />
                  </div>
                </div>

                {reservationType === "single_day" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Choisissez vos horaires
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Heure de début</label>
                        <select
                          value={selectedStartTime}
                          onChange={(e) => setSelectedStartTime(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm font-medium bg-white"
                        >
                          {TIME_OPTIONS.slice(0, -1).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Heure de fin</label>
                        <select
                          value={selectedEndTime}
                          onChange={(e) => setSelectedEndTime(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm font-medium bg-white"
                        >
                          {endTimeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {singleDayHours <= 4
                          ? `${singleDayHours}h = Demi-journée (${getPrixDemiJournee(currentEspace).toLocaleString()} DA${isOpenSpace(currentEspace) ? " / pers." : ""})`
                          : `${singleDayHours}h = Journée complète (${getPrixJour(currentEspace).toLocaleString()} DA${isOpenSpace(currentEspace) ? " / pers." : ""})`
                        }
                      </span>
                    </div>
                  </div>
                )}

                {reservationType === "multi_day" && multiDayEnd && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {countWorkingDays(selectedDate, multiDayEnd)} jours ouvrables sélectionnés
                      </span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      Du {format(selectedDate, "EEEE d MMMM", { locale: fr })} au {format(multiDayEnd, "EEEE d MMMM", { locale: fr })} | 8h30 - 18h30
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nombre de participants (vous inclus)
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {isOpenSpace(currentEspace)
                        ? `(max ${maxParticipants} places disponibles — tarif par personne)`
                        : `(box réservé exclusivement pour vous, max ${maxParticipants})`
                      }
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("participants", Math.max(1, (watchParticipants || 1) - 1))}
                      className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl text-gray-700 font-bold text-xl transition-all"
                    >
                      -
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        {...register("participants", {
                          required: true,
                          min: 1,
                          max: maxParticipants,
                          valueAsNumber: true,
                        })}
                        className="w-20 text-center px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xl font-bold"
                        min={1}
                        max={maxParticipants}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setValue("participants", Math.min(maxParticipants, (watchParticipants || 1) + 1))
                      }
                      className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl text-gray-700 font-bold text-xl transition-all"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-400 ml-1">
                      sur {maxParticipants}
                    </span>
                  </div>
                  {errors.participants && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Le nombre doit être entre 1 et {maxParticipants}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && currentEspace && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Récapitulatif de votre réservation</h3>
                  <p className="text-sm text-gray-500 mt-1">Vérifiez les détails avant de confirmer</p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={getSpaceImage(currentEspace)}
                      alt={currentEspace.nom}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{currentEspace.nom}</h4>
                    <p className="text-sm text-gray-500">{getSpaceTypeLabel(currentEspace.type)}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      {watchParticipants || 1} participant{(watchParticipants || 1) > 1 ? "s" : ""}
                      {isOpenSpace(currentEspace)
                        ? ` / ${getAvailableSeats(currentEspace)} dispo. sur ${currentEspace.capacite}`
                        : ` / ${currentEspace.capacite} max`
                      }
                    </p>
                  </div>
                </div>

                {reservationType === "multi_day" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Période</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        Du {watchDateDebut && format(watchDateDebut, "d MMM", { locale: fr })} au {watchDateFin && format(watchDateFin, "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                        <Timer className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Durée</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {durationInfo?.text || "-"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">8h30 - 18h30 chaque jour</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Date</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {watchDateDebut && format(watchDateDebut, "EEEE d MMMM", { locale: fr })}
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Horaire</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {watchDateDebut && format(watchDateDebut, "HH:mm", { locale: fr })}
                        {" - "}
                        {watchDateFin && format(watchDateFin, "HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                        <Timer className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Durée</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {durationInfo?.text || "-"}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none text-sm bg-white"
                    placeholder="Besoins particuliers, équipements requis..."
                  />
                </div>

                {!editMode && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Code promo (optionnel)
                    </label>
                    {promoResult?.valid ? (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">{promoCode}</span>
                          <span className="text-sm text-emerald-600">-{promoResult.reduction.toLocaleString()} DA</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="p-1 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-emerald-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              if (promoResult) setPromoResult(null);
                            }}
                            placeholder="Entrez votre code promo"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                              promoResult?.valid === false ? "border-red-300 bg-red-50" : "border-gray-200"
                            }`}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyPromo())}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoValidating || !promoCode.trim()}
                          className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {promoValidating ? "..." : "Appliquer"}
                        </button>
                      </div>
                    )}
                    {promoResult?.valid === false && promoResult.error && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {promoResult.error}
                      </p>
                    )}
                  </div>
                )}

                {estimatedAmount > 0 && pricingBreakdown && (
                  <div className="p-5 bg-gray-900 rounded-xl text-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Tarification</span>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">
                        Estimation
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-gray-300">
                        {pricingBreakdown.type === "weekly" && "remainingDays" in pricingBreakdown ? (
                          <>
                            {pricingBreakdown.participants > 1
                              ? `${pricingBreakdown.participants} pers. x ${pricingBreakdown.quantity} semaine${pricingBreakdown.quantity > 1 ? "s" : ""} x ${pricingBreakdown.rate.toLocaleString()} DA${(pricingBreakdown.remainingDays as number) > 0 ? ` + ${pricingBreakdown.remainingDays} j. x ${(pricingBreakdown.remainingRate as number).toLocaleString()} DA` : ""}`
                              : `${pricingBreakdown.quantity} semaine${pricingBreakdown.quantity > 1 ? "s" : ""} x ${pricingBreakdown.rate.toLocaleString()} DA${(pricingBreakdown.remainingDays as number) > 0 ? ` + ${pricingBreakdown.remainingDays} j. x ${(pricingBreakdown.remainingRate as number).toLocaleString()} DA` : ""}`
                            }
                          </>
                        ) : (
                          <>
                            {pricingBreakdown.participants > 1
                              ? `${pricingBreakdown.participants} pers. x ${pricingBreakdown.quantity} ${pricingBreakdown.unit}${pricingBreakdown.quantity > 1 && pricingBreakdown.type === "multiday" ? "s" : ""} x ${pricingBreakdown.rate.toLocaleString()} DA`
                              : `${pricingBreakdown.quantity} ${pricingBreakdown.unit}${pricingBreakdown.quantity > 1 && pricingBreakdown.type === "multiday" ? "s" : ""} x ${pricingBreakdown.rate.toLocaleString()} DA`
                            }
                          </>
                        )}
                      </span>
                      <span className="font-medium">{estimatedAmount.toLocaleString()} DA</span>
                    </div>
                    {promoResult?.valid && promoResult.reduction > 0 && (
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          Code promo ({promoCode})
                        </span>
                        <span className="font-medium text-emerald-400">-{promoResult.reduction.toLocaleString()} DA</span>
                      </div>
                    )}
                    <div className="border-t border-gray-700 pt-3 mt-3 flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold">{finalAmount.toLocaleString()} DA</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-gray-100 bg-white px-6 py-4">
          {step === 2 && estimatedAmount > 0 && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Estimation</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{finalAmount.toLocaleString()} DA</span>
            </div>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                className="px-5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            )}
            {step === 1 && (
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                onClick={goToConfirmation}
                disabled={estimatedAmount === 0 || !!spaceConflict}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {step === 3 && (
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
                <Button
                  type="submit"
                  disabled={isSubmitting || estimatedAmount === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base py-3 shadow-lg shadow-emerald-600/25"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {editMode ? "Modification en cours..." : "Confirmation en cours..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      {editMode ? "Confirmer la modification" : "Confirmer la réservation"}
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReservationForm;
