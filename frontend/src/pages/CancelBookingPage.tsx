import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { BookingWithCourt } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CancelBookingPage() {
  const { slug, bookingId } = useParams<{ slug: string; bookingId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [booking, setBooking] = useState<BookingWithCourt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!slug || !bookingId || !token) {
      setError("Link de cancelamento inválido.");
      setLoading(false);
      return;
    }
    api
      .get(`/booking/${slug}/bookings/${bookingId}`, { params: { token } })
      .then((res) => setBooking(res.data))
      .catch((err) => setError(err.response?.data?.message ?? "Reserva não encontrada."))
      .finally(() => setLoading(false));
  }, [slug, bookingId, token]);

  async function handleCancel() {
    if (!slug || !bookingId) return;
    setCancelling(true);
    setError(null);
    try {
      await api.post(`/booking/${slug}/bookings/${bookingId}/cancel`, { token });
      setCancelled(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível cancelar a reserva.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-primary-700">Cancelar reserva</h1>

      {loading && <p className="text-sm text-gray-500">Carregando...</p>}

      {!loading && error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {!loading && booking && !cancelled && (
        <div className="space-y-4 rounded-lg border bg-white p-4 text-sm">
          <div>
            <p className="font-semibold">{booking.court.name}</p>
            <p className="text-gray-600">
              {new Date(`${booking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} · {booking.startTime}–
              {booking.endTime}
            </p>
            <p className="text-gray-600">Total: {currencyFormatter.format(Number(booking.totalPrice))}</p>
            <p className="text-gray-600">Status: {booking.status === "CONFIRMADA" ? "Confirmada" : "Cancelada"}</p>
          </div>

          {booking.status === "CONFIRMADA" ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirmar cancelamento
            </button>
          ) : (
            <p className="text-gray-500">Essa reserva já está cancelada.</p>
          )}
        </div>
      )}

      {cancelled && (
        <p className="rounded bg-primary-50 px-3 py-2 text-sm text-primary-700">
          Reserva cancelada com sucesso. O horário já está disponível para outras pessoas.
        </p>
      )}
    </div>
  );
}
