import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { DashboardSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary-700">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Faturamento</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje" value={currencyFormatter.format(summary?.revenueToday ?? 0)} />
        <StatCard label="Esta semana" value={currencyFormatter.format(summary?.revenueWeek ?? 0)} />
        <StatCard label="Este mês" value={currencyFormatter.format(summary?.revenueMonth ?? 0)} />
        <StatCard label="Rachas fechadas" value={String(summary?.totalRachas ?? 0)} />
      </div>
    </div>
  );
}
