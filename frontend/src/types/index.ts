export interface Quadra {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  photoUrl: string | null;
}

export interface RachaItem {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
}

export interface Racha {
  id: string;
  courtValue: string;
  playersCount: number;
  totalValue: string;
  valuePerHead: string;
  status: "ABERTA" | "FECHADA";
  playedAt: string;
  items: RachaItem[];
}

export interface DashboardSummary {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  totalRachas: number;
}

export interface CourtHours {
  id: string;
  weekday: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

export interface CourtBlock {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface Court {
  id: string;
  name: string;
  hourlyRate: string;
  extraBlockMinutes: number;
  extraBlockPrice: string | null;
  active: boolean;
  hours: CourtHours[];
  blocks: CourtBlock[];
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Availability {
  open: boolean;
  reason?: string;
  hourlyRate?: string;
  extraBlockMinutes?: number;
  extraBlockPrice?: string | null;
  slots: AvailabilitySlot[];
}

export interface PublicCourt {
  id: string;
  name: string;
  hourlyRate: string;
  extraBlockMinutes: number;
  extraBlockPrice: string | null;
}

export interface Booking {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  totalPrice: string;
  status: "CONFIRMADA" | "CANCELADA";
  cancelToken: string;
}

export interface BookingWithCourt extends Booking {
  court: { name: string };
}
