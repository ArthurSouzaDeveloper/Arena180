import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { api, fileUrl } from '../lib/api';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Cobra hourlyRate pela primeira hora e, a partir daí, um extraBlockPrice a
 * cada extraBlockMinutes de uso adicional (bloco parcial conta como cheio).
 */
function calculateCourtPrice(
  totalMinutes: number,
  hourlyRate: number,
  extraBlockMinutes: number,
  extraBlockPrice: number,
): number {
  if (totalMinutes <= 0) return 0;
  const extraMinutes = Math.max(0, totalMinutes - 60);
  const extraBlocks = extraBlockMinutes > 0 ? Math.ceil(extraMinutes / extraBlockMinutes) : 0;
  return hourlyRate + extraBlocks * extraBlockPrice;
}

export default function NovaRacha() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const arena = user?.arena;
  const [products, setProducts] = useState<Product[]>([]);
  const [autoCalc, setAutoCalc] = useState(true);
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [courtPrice, setCourtPrice] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('10');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Product[]>('/products').then((res) => setProducts(res.data));
  }, []);

  const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const hourlyRate = Number(arena?.hourlyRate ?? 0);
  const extraBlockMinutes = arena?.extraBlockMinutes ?? 20;
  const extraBlockPrice = Number(arena?.extraBlockPrice ?? 0);
  const calculatedCourtPrice = calculateCourtPrice(totalMinutes, hourlyRate, extraBlockMinutes, extraBlockPrice);

  useEffect(() => {
    if (autoCalc && arena) {
      setCourtPrice(calculatedCourtPrice ? String(calculatedCourtPrice) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalc, totalMinutes, hourlyRate, extraBlockMinutes, extraBlockPrice, arena]);

  function setQty(productId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, qty) }));
  }

  const consumptionTotal = useMemo(
    () =>
      products.reduce((sum, product) => sum + (quantities[product.id] ?? 0) * Number(product.price), 0),
    [products, quantities],
  );

  const courtValue = Number(courtPrice) || 0;
  const players = Number(numberOfPlayers) || 0;
  const total = courtValue + consumptionTotal;
  const perPlayer = players > 0 ? total / players : 0;

  async function handleSave(status: 'ABERTO' | 'FECHADO') {
    setSaving(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));

      const res = await api.post('/rachas', {
        courtPrice: courtValue,
        numberOfPlayers: players,
        items,
      });

      if (status === 'FECHADO') {
        await api.patch(`/rachas/${res.data.id}/status`, { status: 'FECHADO' });
      }

      navigate(`/rachas/${res.data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Nova racha</h1>
      <p className="mt-1 text-sm text-gray-500">
        Divida o valor da quadra pela quantidade de jogadores e some o consumo do grupo.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Valor da quadra</p>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoCalc}
                  onChange={(e) => setAutoCalc(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Calcular pelo tempo jogado
              </label>
            </div>

            {autoCalc && (
              <div className="mt-3 rounded-md bg-gray-50 p-3">
                {arena ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Horas</label>
                        <input
                          type="number"
                          min="0"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Minutos</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={minutes}
                          onChange={(e) => setMinutes(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Primeira hora {formatBRL(hourlyRate)} + {formatBRL(extraBlockPrice)} a cada {extraBlockMinutes}{' '}
                      min adicionais. Ajuste os valores padrão em Configurações.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Carregando configurações da arena...</p>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor da quadra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={courtPrice}
                  onChange={(e) => {
                    setAutoCalc(false);
                    setCourtPrice(e.target.value);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="200.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de jogadores</label>
                <input
                  type="number"
                  min="1"
                  value={numberOfPlayers}
                  onChange={(e) => setNumberOfPlayers(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-700">Consumo (bebidas e comidas)</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((product) => {
                const qty = quantities[product.id] ?? 0;
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-md border border-gray-200 p-2">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {product.photoUrl && (
                        <img src={fileUrl(product.photoUrl)} alt={product.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatBRL(Number(product.price))}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQty(product.id, qty - 1)}
                        className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, qty + 1)}
                        className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <p className="text-sm text-gray-500">Cadastre produtos na aba Produtos para incluir consumo aqui.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 h-fit">
          <p className="text-sm font-medium text-gray-700">Resumo</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Valor da quadra</dt>
              <dd className="text-gray-900">{formatBRL(courtValue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Consumo</dt>
              <dd className="text-gray-900">{formatBRL(consumptionTotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-medium">
              <dt>Total</dt>
              <dd>{formatBRL(total)}</dd>
            </div>
            <div className="flex justify-between rounded-md bg-brand-50 px-3 py-2 text-brand-700">
              <dt className="font-medium">Valor por jogador</dt>
              <dd className="font-semibold">{formatBRL(perPlayer)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => handleSave('FECHADO')}
              disabled={saving || !courtValue || !players}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Fechar racha (conta no faturamento)
            </button>
            <button
              onClick={() => handleSave('ABERTO')}
              disabled={saving || !courtValue || !players}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Salvar como rascunho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
