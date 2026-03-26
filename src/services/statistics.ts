// Types partagés avec les composants charts

export interface RevenueTrendPoint {
  label: string;
  revenue: number;
  reservations: number;
}

export interface SpacePerformance {
  name: string;
  type: string;
  reservations: number;
  revenue: number;
  percentage: number;
}

export interface ReservationStatusBreakdown {
  confirmees: number;
  enAttente: number;
  annulees: number;
  terminees: number;
  total: number;
}
