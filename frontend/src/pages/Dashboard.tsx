import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const cards: { key: keyof DashboardSummary; label: string; money: boolean }[] = [
  { key: 'faturamentoHoje', label: 'Faturamento hoje', money: true },
  { key: 'faturamentoSemana', label: 'Faturamento na semana', money: true },
  { key: 'faturamentoMes', label: 'Faturamento no mês', money: true },
  { key: 'rachasHoje', label: 'Rachas fechadas hoje', money: false },
  { key: 'rachasNoMes', label: 'Rachas fechadas no mês', money: false },
  { key: 'ticketMedio', label: 'Ticket médio por racha', money: true },
];

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.get<DashboardSummary>('/dashboard/summary').then((res) => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Painel</h1>
      <p className="mt-1 text-sm text-gray-500">Resumo do faturamento com base nas rachas fechadas.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ key, label, money }) => (
          <div key={key} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary ? (money ? formatBRL(summary[key]) : summary[key]) : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
