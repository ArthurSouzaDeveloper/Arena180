import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Racha, RachaStatus } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const tabs: { key: RachaStatus; label: string }[] = [
  { key: 'ABERTO', label: 'Abertas' },
  { key: 'FECHADO', label: 'Concluídas' },
];

export default function Rachas() {
  const [status, setStatus] = useState<RachaStatus>('ABERTO');
  const [rachas, setRachas] = useState<Racha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<Racha[]>('/rachas', { params: { status } })
      .then((res) => setRachas(res.data))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rachas</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe as rachas em aberto e as já concluídas.</p>
        </div>
        <Link
          to="/rachas/nova"
          className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} />
          Nova racha
        </Link>
      </div>

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              status === tab.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Data</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Jogadores</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Comandas</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Por jogador</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rachas.map((racha) => (
              <tr key={racha.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{formatDate(racha.date)}</td>
                <td className="px-4 py-2 text-gray-700">{racha.numberOfPlayers}</td>
                <td className="px-4 py-2 text-gray-700">{racha.summary.comandas.length}</td>
                <td className="px-4 py-2 font-medium text-gray-900">{formatBRL(racha.summary.total)}</td>
                <td className="px-4 py-2 text-brand-700">{formatBRL(racha.summary.perPlayer)}</td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/rachas/${racha.id}`} className="font-medium text-brand-600 hover:underline">
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && rachas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma racha {status === 'ABERTO' ? 'aberta' : 'concluída'} no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
