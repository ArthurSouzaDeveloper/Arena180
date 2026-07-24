import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Quadra } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Configuracoes() {
  const { refreshUser } = useAuth();
  const [hourlyRate, setHourlyRate] = useState('');
  const [extraBlockMinutes, setExtraBlockMinutes] = useState('');
  const [extraBlockPrice, setExtraBlockPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Quadra>('/quadra/settings').then((res) => {
      setHourlyRate(res.data.hourlyRate);
      setExtraBlockMinutes(String(res.data.extraBlockMinutes));
      setExtraBlockPrice(res.data.extraBlockPrice);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/quadra/settings', {
        hourlyRate: Number(hourlyRate),
        extraBlockMinutes: Number(extraBlockMinutes),
        extraBlockPrice: Number(extraBlockPrice),
      });
      await refreshUser();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const rate = Number(hourlyRate) || 0;
  const blockMinutes = Number(extraBlockMinutes) || 0;
  const blockPrice = Number(extraBlockPrice) || 0;
  const exampleTotalMinutes = 100; // 1h40
  const exampleExtraBlocks = blockMinutes > 0 ? Math.ceil(Math.max(0, exampleTotalMinutes - 60) / blockMinutes) : 0;
  const exampleValue = rate + exampleExtraBlocks * blockPrice;

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
      <p className="mt-1 text-sm text-gray-500">
        Defina a precificação padrão da quadra usada pela calculadora por tempo na Nova racha.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor da primeira hora (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bloco adicional (minutos)</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={extraBlockMinutes}
              onChange={(e) => setExtraBlockMinutes(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor do bloco adicional (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={extraBlockPrice}
              onChange={(e) => setExtraBlockPrice(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
          Exemplo: uma locação de 1h40min ficaria em{' '}
          <span className="font-semibold text-gray-900">{formatBRL(exampleValue)}</span> (primeira hora +{' '}
          {exampleExtraBlocks} {exampleExtraBlocks === 1 ? 'bloco extra' : 'blocos extras'}).
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {saved && <span className="text-sm text-green-600">Configurações salvas.</span>}
        </div>
      </form>
    </div>
  );
}
