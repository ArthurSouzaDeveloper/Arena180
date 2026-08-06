import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Availability, Booking, PublicCourt } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [courts, setCourts] = useState<PublicCourt[]>([]);
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [withExtraBlock, setWithExtraBlock] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/booking/${slug}/courts`).then((res) => {
      setCourts(res.data);
      if (res.data.length > 0) setCourtId(res.data[0].id);
    });
  }, [slug]);

  useEffect(() => {
    if (!slug || !courtId || !date) return;
    setLoadingAvailability(true);
    setSelectedSlot(null);
    api
      .get(`/booking/${slug}/courts/${courtId}/availability`, { params: { date } })
      .then((res) => setAvailability(res.data))
      .finally(() => setLoadingAvailability(false));
  }, [slug, courtId, date]);

  const selectedCourt = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId]);

  const totalPrice = useMemo(() => {
    if (!availability?.hourlyRate) return 0;
    const base = Number(availability.hourlyRate);
    const extra = withExtraBlock ? Number(availability.extraBlockPrice ?? 0) : 0;
    return base + extra;
  }, [availability, withExtraBlock]);

  async function handleSubmit() {
    if (!slug || !courtId || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setConfirmedBooking(null);
    try {
      const bookingRes = await api.post(`/booking/${slug}/courts/${courtId}`, {
        date,
        startTime: selectedSlot,
        withExtraBlock,
        customerName,
        customerPhone,
      });
      setSuccess("Reserva confirmada com sucesso!");
      setConfirmedBooking(bookingRes.data);
      setSelectedSlot(null);
      setCustomerName("");
      setCustomerPhone("");
      const res = await api.get(`/booking/${slug}/courts/${courtId}/availability`, { params: { date } });
      setAvailability(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível concluir a reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-primary-700">Agendar horário</h1>
      <p className="mb-6 text-sm text-gray-500">Escolha a quadra, a data e o horário disponível.</p>

      {courts.length === 0 && <p className="text-sm text-gray-500">Nenhuma quadra disponível para agendamento.</p>}

      {courts.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quadra</label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data</label>
              <input
                type="date"
                min={todayIso()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {confirmedBooking && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm">
              <p className="mb-1 font-semibold text-primary-700">{success}</p>
              <p className="text-gray-600">
                {new Date(`${confirmedBooking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                {confirmedBooking.startTime}–{confirmedBooking.endTime}
              </p>
              <p className="mt-2">
                Guarde este link para cancelar sua reserva se precisar:{" "}
                <Link
                  to={`/agendar/${slug}/cancelar/${confirmedBooking.id}?token=${confirmedBooking.cancelToken}`}
                  className="font-semibold text-primary-700 underline"
                >
                  Cancelar esta reserva
                </Link>
              </p>
            </div>
          )}

          {loadingAvailability && <p className="text-sm text-gray-500">Carregando horários...</p>}

          {!loadingAvailability && availability && !availability.open && (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Quadra fechada nessa data{availability.reason ? ` (${availability.reason})` : ""}.
            </p>
          )}

          {!loadingAvailability && availability?.open && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Horários disponíveis</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    className={`rounded border px-2 py-2 text-sm ${
                      !slot.available
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                        : selectedSlot === slot.startTime
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-gray-300 hover:border-primary-500"
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSlot && selectedCourt && (
            <div className="space-y-4 rounded-lg border bg-white p-4">
              {Number(selectedCourt.extraBlockMinutes) > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={withExtraBlock}
                    onChange={(e) => setWithExtraBlock(e.target.checked)}
                  />
                  Adicionar bloco extra de {selectedCourt.extraBlockMinutes} min por{" "}
                  {currencyFormatter.format(Number(selectedCourt.extraBlockPrice ?? 0))}
                </label>
              )}

              <p className="text-sm font-semibold">Total: {currencyFormatter.format(totalPrice)}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Seu nome</label>
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting || !customerName || !customerPhone}
                className="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Confirmar reserva
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
