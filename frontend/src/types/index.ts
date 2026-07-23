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
