import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Product } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ConsumptionLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function NewRachaPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [courtValue, setCourtValue] = useState("");
  const [playersCount, setPlayersCount] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  const lines: ConsumptionLine[] = useMemo(
    () =>
      products
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price),
          quantity: quantities[product.id],
        })),
    [products, quantities],
  );

  const itemsTotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const courtValueNumber = Number(courtValue || 0);
  const playersCountNumber = Number(playersCount || 0);
  const totalValue = courtValueNumber + itemsTotal;
  const valuePerHead = playersCountNumber > 0 ? totalValue / playersCountNumber : 0;

  function setQuantity(productId: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/rachas", {
        courtValue: courtValueNumber,
        playersCount: playersCountNumber,
        items: lines,
      });
      navigate("/rachas");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Calculadora de racha</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Valor da quadra</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={courtValue}
              onChange={(e) => setCourtValue(e.target.value)}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-sm font-medium text-gray-700">Número de jogadores</label>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={playersCount}
              onChange={(e) => setPlayersCount(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Consumo do grupo</p>
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{currencyFormatter.format(Number(product.price))}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantities[product.id] ?? 0}
                    onChange={(e) => setQuantity(product.id, Number(e.target.value))}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-gray-400">Cadastre produtos para lançar consumo.</p>
              )}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">Resumo</h2>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Quadra</span>
              <span>{currencyFormatter.format(courtValueNumber)}</span>
            </div>
            <div className="flex justify-between">
              <span>Consumo</span>
              <span>{currencyFormatter.format(itemsTotal)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span>{currencyFormatter.format(totalValue)}</span>
            </div>
            <div className="flex justify-between text-primary-700">
              <span>Por jogador</span>
              <span className="font-bold">{currencyFormatter.format(valuePerHead)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Fechar racha
          </button>
        </div>
      </form>
    </div>
  );
}
