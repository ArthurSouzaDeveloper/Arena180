import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Trash2, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { Racha, Product, ComandaView } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

interface ComandaFormProps {
  products: Product[];
  initialPlayerName?: string;
  initialQuantities?: Record<string, number>;
  onCancel: () => void;
  onSave: (playerName: string, items: { productId: string; quantity: number }[]) => Promise<void>;
}

function ComandaForm({ products, initialPlayerName, initialQuantities, onCancel, onSave }: ComandaFormProps) {
  const [playerName, setPlayerName] = useState(initialPlayerName ?? '');
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities ?? {});
  const [saving, setSaving] = useState(false);

  function setQty(productId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, qty) }));
  }

  const total = products.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * Number(p.price), 0);

  async function handleSubmit() {
    if (!playerName.trim()) return;
    setSaving(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));
      await onSave(playerName.trim(), items);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-brand-200 bg-brand-50/40 p-4">
      <label className="block text-sm font-medium text-gray-700">Nome do jogador</label>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Ex: João"
        className="mt-1 w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <p className="mt-3 text-sm font-medium text-gray-700">Consumo individual</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {products.map((product) => {
          const qty = quantities[product.id] ?? 0;
          return (
            <div key={product.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">{formatBRL(Number(product.price))}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setQty(product.id, qty - 1)} className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm">{qty}</span>
                <button type="button" onClick={() => setQty(product.id, qty + 1)} className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Consumo desta comanda: <span className="font-semibold text-gray-900">{formatBRL(total)}</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !playerName.trim()}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar comanda'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RachaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [racha, setRacha] = useState<Racha | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formMode, setFormMode] = useState<'new' | string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useMemo(
    () => () => {
      if (!id) return;
      api.get<Racha>(`/rachas/${id}`).then((res) => setRacha(res.data));
    },
    [id],
  );

  useEffect(() => {
    load();
    api.get<Product[]>('/products').then((res) => setProducts(res.data));
  }, [load]);

  if (!racha) return <p className="text-sm text-gray-500">Carregando...</p>;

  const isAberto = racha.status === 'ABERTO';

  async function handleFinalize() {
    setUpdatingStatus(true);
    try {
      await api.patch(`/rachas/${id}/status`, { status: 'FECHADO' });
      load();
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleReopen() {
    setUpdatingStatus(true);
    try {
      await api.patch(`/rachas/${id}/status`, { status: 'ABERTO' });
      load();
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCreateComanda(playerName: string, items: { productId: string; quantity: number }[]) {
    await api.post(`/rachas/${id}/comandas`, { playerName, items });
    setFormMode(null);
    load();
  }

  async function handleUpdateComanda(
    comandaId: string,
    playerName: string,
    items: { productId: string; quantity: number }[],
  ) {
    await api.put(`/rachas/${id}/comandas/${comandaId}`, { playerName, items });
    setFormMode(null);
    load();
  }

  async function handleRemoveComanda(comandaId: string) {
    await api.delete(`/rachas/${id}/comandas/${comandaId}`);
    load();
  }

  function comandaInitialQuantities(comanda: ComandaView) {
    return Object.fromEntries(comanda.items.map((item) => [item.productId, item.quantity]));
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button onClick={() => navigate('/rachas')} className="text-sm text-gray-500 hover:underline">
            ← Voltar para Rachas
          </button>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Racha de {formatDateTime(racha.date)}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              isAberto ? 'bg-gray-100 text-gray-600' : 'bg-brand-50 text-brand-700'
            }`}
          >
            {isAberto ? 'Aberta' : 'Concluída'}
          </span>
        </div>
        <div>
          {isAberto ? (
            <button
              onClick={handleFinalize}
              disabled={updatingStatus}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Finalizar racha
            </button>
          ) : (
            <button
              onClick={handleReopen}
              disabled={updatingStatus}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Reabrir racha
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-700">Consumo compartilhado (dividido entre todos)</p>
            <ul className="mt-2 divide-y divide-gray-100 text-sm">
              {racha.summary.items.map((item, idx) => (
                <li key={idx} className="flex justify-between py-1.5">
                  <span className="text-gray-700">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-gray-900">{formatBRL(item.subtotal)}</span>
                </li>
              ))}
              {racha.summary.items.length === 0 && <p className="py-2 text-gray-400">Nenhum item compartilhado.</p>}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Comandas individuais</p>
              {formMode === null && (
                <button
                  onClick={() => setFormMode('new')}
                  className="flex items-center gap-1 rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <UserPlus size={14} />
                  Abrir comanda
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Use quando um jogador quiser pagar o próprio consumo em vez de dividir com o grupo.
            </p>

            <div className="mt-3 space-y-3">
              {racha.summary.comandas.map((comanda) => (
                <div key={comanda.id} className="rounded-md border border-gray-200 p-3">
                  {formMode === comanda.id ? (
                    <ComandaForm
                      products={products}
                      initialPlayerName={comanda.playerName}
                      initialQuantities={comandaInitialQuantities(comanda)}
                      onCancel={() => setFormMode(null)}
                      onSave={(playerName, items) => handleUpdateComanda(comanda.id, playerName, items)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{comanda.playerName}</p>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-brand-700">{formatBRL(comanda.totalToPay)}</span>
                          <button
                            onClick={() => setFormMode(comanda.id)}
                            className="text-xs text-gray-500 hover:text-brand-700 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleRemoveComanda(comanda.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <ul className="mt-1 text-xs text-gray-500">
                        {comanda.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity}x {item.productName} — {formatBRL(item.subtotal)}
                          </li>
                        ))}
                        {comanda.items.length === 0 && <li>Sem consumo próprio, só a parte rateada.</li>}
                      </ul>
                    </>
                  )}
                </div>
              ))}

              {formMode === 'new' && (
                <ComandaForm products={products} onCancel={() => setFormMode(null)} onSave={handleCreateComanda} />
              )}

              {racha.summary.comandas.length === 0 && formMode === null && (
                <p className="text-sm text-gray-400">Nenhuma comanda aberta.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 h-fit">
          <p className="text-sm font-medium text-gray-700">Resumo</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Valor da quadra</dt>
              <dd className="text-gray-900">{formatBRL(racha.summary.courtPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Consumo compartilhado</dt>
              <dd className="text-gray-900">{formatBRL(racha.summary.consumptionTotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <dt className="text-gray-500">Rateado ({racha.numberOfPlayers} jogadores)</dt>
              <dd className="text-gray-900">{formatBRL(racha.summary.perPlayer)}/pessoa</dd>
            </div>
            {racha.summary.comandas.length > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Consumo em comandas</dt>
                <dd className="text-gray-900">{formatBRL(racha.summary.comandasTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-medium">
              <dt>Total geral</dt>
              <dd>{formatBRL(racha.summary.total)}</dd>
            </div>
          </dl>

          {racha.summary.comandas.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs font-medium text-gray-500">Valor a cobrar por pessoa</p>
              <ul className="mt-2 space-y-1 text-sm">
                {racha.summary.comandas.map((comanda) => (
                  <li key={comanda.id} className="flex justify-between">
                    <span className="text-gray-700">{comanda.playerName}</span>
                    <span className="font-medium text-gray-900">{formatBRL(comanda.totalToPay)}</span>
                  </li>
                ))}
                <li className="flex justify-between text-gray-500">
                  <span>Demais jogadores (sem comanda)</span>
                  <span>{formatBRL(racha.summary.perPlayer)} cada</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
