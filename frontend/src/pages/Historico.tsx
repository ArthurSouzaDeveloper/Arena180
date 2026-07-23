import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Racha } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Historico() {
  const [rachas, setRachas] = useState<Racha[]>([]);

  useEffect(() => {
    api.get<Racha[]>('/rachas').then((res) => setRachas(res.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Histórico de rachas</h1>
      <p className="mt-1 text-sm text-gray-500">Todas as locações calculadas, mais recentes primeiro.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Data</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Jogadores</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Quadra</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Consumo</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Por jogador</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rachas.map((racha) => (
              <tr key={racha.id}>
                <td className="px-4 py-2 text-gray-700">{formatDate(racha.date)}</td>
                <td className="px-4 py-2 text-gray-700">{racha.numberOfPlayers}</td>
                <td className="px-4 py-2 text-gray-700">{formatBRL(racha.summary.courtPrice)}</td>
                <td className="px-4 py-2 text-gray-700">{formatBRL(racha.summary.consumptionTotal)}</td>
                <td className="px-4 py-2 font-medium text-gray-900">{formatBRL(racha.summary.total)}</td>
                <td className="px-4 py-2 text-brand-700">{formatBRL(racha.summary.perPlayer)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      racha.status === 'FECHADO' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {racha.status === 'FECHADO' ? 'Fechada' : 'Aberta'}
                  </span>
                </td>
              </tr>
            ))}
            {rachas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma racha registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
