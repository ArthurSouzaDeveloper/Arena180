export type Role = 'SUPERADMIN' | 'ADMIN';
export type ProductCategory = 'BEBIDA' | 'COMIDA';
export type RachaStatus = 'ABERTO' | 'FECHADO';
export type RachaSource = 'MANUAL' | 'PUBLIC_BOOKING';

export interface Arena {
  id: string;
  slug: string;
  name: string;
  bookingOpenTime: string;
  bookingCloseTime: string;
}

export interface Court {
  id: string;
  arenaId: string;
  name: string;
  hourlyRate: string;
  extraBlockMinutes: number;
  extraBlockPrice: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  arena: Arena | null;
}

export interface ArenaAdmin {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface ArenaListItem {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  admins: ArenaAdmin[];
  rachasCount: number;
  productsCount: number;
}

export interface Product {
  id: string;
  arenaId: string;
  name: string;
  category: ProductCategory;
  price: string;
  photoUrl: string | null;
  active: boolean;
}

export interface RachaItemView {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ComandaItemView {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ComandaView {
  id: string;
  playerName: string;
  items: ComandaItemView[];
  total: number;
  totalToPay: number;
}

export interface RachaSummary {
  courtPrice: number;
  consumptionTotal: number;
  sharedTotal: number;
  perPlayer: number;
  comandasTotal: number;
  total: number;
  items: RachaItemView[];
  comandas: ComandaView[];
}

export interface Racha {
  id: string;
  date: string;
  durationMinutes: number;
  courtId: string;
  court: Court;
  courtPrice: string;
  numberOfPlayers: number | null;
  status: RachaStatus;
  source: RachaSource;
  bookedByName: string | null;
  bookedByPhone: string | null;
  notes: string | null;
  summary: RachaSummary;
}

export interface PublicCourt {
  id: string;
  name: string;
  hourlyRate: string;
  extraBlockMinutes: number;
  extraBlockPrice: string;
}

export interface PublicArena {
  id: string;
  name: string;
  slug: string;
  bookingOpenTime: string;
  bookingCloseTime: string;
  courts: PublicCourt[];
}

export interface BusyInterval {
  startsAt: string;
  endsAt: string;
}

export interface Availability {
  arena: { id: string; name: string; slug: string };
  court: PublicCourt;
  openTime: string;
  closeTime: string;
  busy: BusyInterval[];
}

export interface DashboardSummary {
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  rachasHoje: number;
  rachasNoMes: number;
  ticketMedio: number;
}
