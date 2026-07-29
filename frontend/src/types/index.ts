export type Role = 'SUPERADMIN' | 'ADMIN';
export type ProductCategory = 'BEBIDA' | 'COMIDA';
export type RachaStatus = 'ABERTO' | 'FECHADO';

export interface Arena {
  id: string;
  slug: string;
  name: string;
  hourlyRate: string;
  extraBlockMinutes: number;
  extraBlockPrice: string;
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
  courtPrice: string;
  numberOfPlayers: number;
  status: RachaStatus;
  notes: string | null;
  summary: RachaSummary;
}

export interface DashboardSummary {
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  rachasHoje: number;
  rachasNoMes: number;
  ticketMedio: number;
}
