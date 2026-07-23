export type Role = 'SUPERADMIN' | 'ADMIN';
export type ProductCategory = 'BEBIDA' | 'COMIDA';
export type RachaStatus = 'ABERTO' | 'FECHADO';

export interface Quadra {
  id: string;
  slug: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  quadra: Quadra | null;
}

export interface Product {
  id: string;
  quadraId: string;
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

export interface RachaSummary {
  courtPrice: number;
  consumptionTotal: number;
  total: number;
  perPlayer: number;
  items: RachaItemView[];
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
