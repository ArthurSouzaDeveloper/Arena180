export interface Quadra {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "SUPERADMIN";
}

export interface Arena {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  users: { id: string; name: string; email: string }[];
  _count: { courts: number; rachas: number };
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
  slotMinutes: number;
  extraBlockMinutes: number;
  extraBlockPrice: string | null;
  mensalistaHourlyRate: string | null;
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
  slotMinutes?: number;
  extraBlockMinutes?: number;
  extraBlockPrice?: string | null;
  slots: AvailabilitySlot[];
}

export interface PublicCourt {
  id: string;
  name: string;
  hourlyRate: string;
  slotMinutes: number;
  extraBlockMinutes: number;
  extraBlockPrice: string | null;
  mensalistaHourlyRate: string | null;
}

export interface PublicCourtsResponse {
  arenaName: string;
  courts: PublicCourt[];
  pixEnabled: boolean;
  allowDepositPayment: boolean;
  allowFullPayment: boolean;
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
  status: "CONFIRMADA" | "CANCELADA" | "PENDENTE_PAGAMENTO";
  cancelToken: string;
  depositAmount: string | null;
  paymentMode: "DEPOSITO" | "INTEGRAL" | null;
  pix: { qrCode: string; qrCodeBase64: string } | null;
}

export interface BookingWithCourt extends Booking {
  court: { name: string };
  cancellable: boolean;
  cancelMinHoursBefore: number;
}

export interface PaymentStatus {
  status: "CONFIRMADA" | "CANCELADA" | "PENDENTE_PAGAMENTO";
  expired: boolean;
}

export interface MensalistaHours {
  open: boolean;
  openTime?: string;
  closeTime?: string;
  slotMinutes?: number;
  pricePerOccurrence?: number;
}

export interface MensalistaQuote {
  dates: string[];
  endTime: string;
  pricePerOccurrence: number;
  totalPrice: number;
  depositAmount: number;
}

export interface Subscription {
  id: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  weekday: number;
  startTime: string;
  endTime: string;
  pricePerOccurrence: string;
  depositAmount: string | null;
  status: "AGUARDANDO_PAGAMENTO" | "ATIVA" | "CANCELADA";
  cancelToken: string;
  pix: { qrCode: string; qrCodeBase64: string } | null;
  dates?: string[];
  totalPrice?: number;
}

export interface SubscriptionPaymentStatus {
  status: "AGUARDANDO_PAGAMENTO" | "ATIVA" | "CANCELADA";
  expired: boolean;
}
