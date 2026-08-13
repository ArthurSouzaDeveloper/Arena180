import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Court } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ReservationRow {
  id: string;
  courtId: string;
  court: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  totalPrice: string;
  status: "CONFIRMADA" | "CANCELADA" | "PENDENTE_PAGAMENTO";
  depositAmount: string | null;
  paymentMode: "DEPOSITO" | "INTEGRAL" | null;
}

const statusLabels: Record<ReservationRow["status"], string> = {
  CONFIRMADA: "Confirmada",
  PENDENTE_PAGAMENTO: "Pendente pagamento",
  CANCELADA: "Cancelada",
};

const statusClasses: Record<ReservationRow["status"], string> = {
  CONFIRMADA: "bg-primary-50 text-primary-700",
  PENDENTE_PAGAMENTO: "bg-amber-100 text-amber-700",
  CANCELADA: "bg-gray-100 text-gray-500",
};

export function ReservationsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/courts").then((res) => setCourts(res.data));
  }, []);

  function loadReservations() {
    setLoading(true);
    api
      .get("/reservas", {
        params: {
          courtId: courtId || undefined,
          status: status || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      })
      .then((res) => setReservations(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId, status, dateFrom, dateTo]);

  async function cancelReservation(row: ReservationRow) {
    await api.put(`/reservas/${row.courtId}/${row.id}/cancel`);
    loadReservations();
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Reservas</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Quadra</label>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="PENDENTE_PAGAMENTO">Pendente pagamento</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {(courtId || status || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setCourtId("");
              setStatus("");
              setDateFrom("");
              setDateTo("");
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Quadra</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && reservations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            )}
            {!loading &&
              reservations.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(`${row.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.startTime}–{row.endTime}
                  </td>
                  <td className="px-4 py-3">{row.court.name}</td>
                  <td className="px-4 py-3">
                    <div>{row.customerName}</div>
                    <div className="text-xs text-gray-500">{row.customerPhone}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {currencyFormatter.format(Number(row.totalPrice))}
                    {row.paymentMode === "DEPOSITO" && (
                      <div className="text-xs text-blue-600">
                        Sinal pago · falta {currencyFormatter.format(Number(row.totalPrice) - Number(row.depositAmount ?? 0))}
                      </div>
                    )}
                    {row.paymentMode === "INTEGRAL" && <div className="text-xs text-green-600">Pago integralmente</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClasses[row.status]}`}>
                      {statusLabels[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status !== "CANCELADA" && (
                      <button
                        onClick={() => cancelReservation(row)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
