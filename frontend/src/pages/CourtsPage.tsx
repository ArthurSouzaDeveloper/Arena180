import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Booking, Court, CourtHours } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [extraBlockMinutes, setExtraBlockMinutes] = useState("");
  const [extraBlockPrice, setExtraBlockPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadCourts() {
    api.get("/courts").then((res) => setCourts(res.data));
  }

  useEffect(() => {
    loadCourts();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/courts", {
        name,
        hourlyRate: Number(hourlyRate),
        extraBlockMinutes: extraBlockMinutes ? Number(extraBlockMinutes) : undefined,
        extraBlockPrice: extraBlockPrice ? Number(extraBlockPrice) : undefined,
      });
      setName("");
      setHourlyRate("");
      setExtraBlockMinutes("");
      setExtraBlockPrice("");
      loadCourts();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(court: Court) {
    await api.put(`/courts/${court.id}`, { active: !court.active });
    loadCourts();
  }

  async function handleDelete(id: string) {
    await api.delete(`/courts/${id}`);
    loadCourts();
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Quadras</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Preço/hora</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-28 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bloco extra (min)</label>
          <input
            type="number"
            min="0"
            value={extraBlockMinutes}
            onChange={(e) => setExtraBlockMinutes(e.target.value)}
            className="w-28 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Preço bloco extra</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={extraBlockPrice}
            onChange={(e) => setExtraBlockPrice(e.target.value)}
            className="w-28 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Adicionar quadra
        </button>
      </form>

      <div className="space-y-6">
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            onToggleActive={() => handleToggleActive(court)}
            onDelete={() => handleDelete(court.id)}
            onChanged={loadCourts}
          />
        ))}
      </div>
    </div>
  );
}

function CourtCard({
  court,
  onToggleActive,
  onDelete,
  onChanged,
}: {
  court: Court;
  onToggleActive: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [hours, setHours] = useState<CourtHours[]>(
    Array.from({ length: 7 }, (_, weekday) => {
      const existing = court.hours.find((h) => h.weekday === weekday);
      return existing ?? { id: "", weekday, openTime: "08:00", closeTime: "23:00", closed: false };
    }),
  );
  const [savingHours, setSavingHours] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);

  function loadBookings() {
    api.get(`/courts/${court.id}/bookings`).then((res) => setBookings(res.data));
  }

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [court.id]);

  async function cancelBooking(bookingId: string) {
    await api.put(`/courts/${court.id}/bookings/${bookingId}/cancel`);
    loadBookings();
  }

  function updateHour(weekday: number, patch: Partial<CourtHours>) {
    setHours((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  }

  async function saveHours() {
    setSavingHours(true);
    try {
      await api.put(`/courts/${court.id}/hours`, hours.map(({ weekday, openTime, closeTime, closed }) => ({
        weekday,
        openTime,
        closeTime,
        closed,
      })));
    } finally {
      setSavingHours(false);
    }
  }

  async function addBlock(event: FormEvent) {
    event.preventDefault();
    await api.post(`/courts/${court.id}/blocks`, {
      date: blockDate,
      startTime: blockStart || undefined,
      endTime: blockEnd || undefined,
      reason: blockReason || undefined,
    });
    setBlockDate("");
    setBlockStart("");
    setBlockEnd("");
    setBlockReason("");
    onChanged();
  }

  async function removeBlock(blockId: string) {
    await api.delete(`/courts/${court.id}/blocks/${blockId}`);
    onChanged();
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{court.name}</p>
          <p className="text-sm text-gray-500">
            {currencyFormatter.format(Number(court.hourlyRate))}/hora
            {court.extraBlockMinutes > 0 && court.extraBlockPrice
              ? ` · bloco extra de ${court.extraBlockMinutes} min por ${currencyFormatter.format(Number(court.extraBlockPrice))}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={onToggleActive} className="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200">
            {court.active ? "Desativar" : "Ativar"}
          </button>
          <button onClick={onDelete} className="rounded bg-red-50 px-3 py-1 text-red-600 hover:bg-red-100">
            Excluir
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Horário de funcionamento por dia</p>
        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h.weekday} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-20">{WEEKDAY_LABELS[h.weekday]}</span>
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) => updateHour(h.weekday, { closed: e.target.checked })}
                />
                Fechado
              </label>
              {!h.closed && (
                <>
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => updateHour(h.weekday, { openTime: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1"
                  />
                  <span>às</span>
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => updateHour(h.weekday, { closeTime: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={saveHours}
          disabled={savingHours}
          className="mt-3 rounded bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Salvar horários
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Bloqueios pontuais (feriados, manutenção)</p>
        <form onSubmit={addBlock} className="mb-3 flex flex-wrap items-end gap-2 text-sm">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Data</label>
            <input
              required
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Início (opcional)</label>
            <input
              type="time"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Fim (opcional)</label>
            <input
              type="time"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Motivo</label>
            <input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Feriado, manutenção..."
              className="rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <button type="submit" className="rounded bg-gray-100 px-3 py-1.5 font-semibold hover:bg-gray-200">
            Bloquear
          </button>
        </form>
        <ul className="space-y-1 text-sm">
          {court.blocks.length === 0 && <li className="text-gray-400">Nenhum bloqueio futuro.</li>}
          {court.blocks.map((block) => (
            <li key={block.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
              <span>
                {new Date(`${block.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")}
                {block.startTime && block.endTime ? ` · ${block.startTime}–${block.endTime}` : " · dia inteiro"}
                {block.reason ? ` · ${block.reason}` : ""}
              </span>
              <button onClick={() => removeBlock(block.id)} className="text-xs text-red-600 hover:underline">
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t pt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Próximas reservas</p>
        <ul className="space-y-1 text-sm">
          {bookings.length === 0 && <li className="text-gray-400">Nenhuma reserva confirmada.</li>}
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
              <span>
                {new Date(`${booking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                {booking.startTime}–{booking.endTime} · {booking.customerName} ({booking.customerPhone})
              </span>
              <button onClick={() => cancelBooking(booking.id)} className="text-xs text-red-600 hover:underline">
                Cancelar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
