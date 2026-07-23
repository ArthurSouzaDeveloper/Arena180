import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Racha } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function RachaHistoryPage() {
  const [rachas, setRachas] = useState<Racha[]>([]);

  useEffect(() => {
    api.get("/rachas").then((res) => setRachas(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Histórico de rachas</h1>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Jogadores</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Por jogador</th>
            </tr>
          </thead>
          <tbody>
            {rachas.map((racha) => (
              <tr key={racha.id} className="border-t">
                <td className="px-4 py-2">{dateFormatter.format(new Date(racha.playedAt))}</td>
                <td className="px-4 py-2">{racha.playersCount}</td>
                <td className="px-4 py-2">{currencyFormatter.format(Number(racha.totalValue))}</td>
                <td className="px-4 py-2 font-semibold text-primary-700">
                  {currencyFormatter.format(Number(racha.valuePerHead))}
                </td>
              </tr>
            ))}
            {rachas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
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
