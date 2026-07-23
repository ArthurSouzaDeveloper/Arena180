import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { api, fileUrl } from '../lib/api';
import { Product } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NovaRacha() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [courtPrice, setCourtPrice] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('10');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Product[]>('/products').then((res) => setProducts(res.data));
  }, []);

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

      navigate('/historico');
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor da quadra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={courtPrice}
                  onChange={(e) => setCourtPrice(e.target.value)}
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
