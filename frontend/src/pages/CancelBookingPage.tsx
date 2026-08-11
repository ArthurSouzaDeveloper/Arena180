import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { BookingWithCourt } from "../types";
import "../styles/publicBooking.css";

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
    <div className="pb-page">
      <div className="pb-wrap">
        <header className="pb-header">
          <p className="pb-eyebrow">Reserva</p>
          <h1 className="pb-title">Cancelar reserva</h1>
          <div className="pb-rule" />
        </header>

        {loading && <p className="pb-loading">Carregando...</p>}

        {!loading && error && !booking && <p className="pb-error">{error}</p>}

        {!loading && booking && !cancelled && (
          <div className="pb-card">
            <p className="pb-card-title">{booking.court.name}</p>
            <p className="pb-card-meta">
              {new Date(`${booking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} · {booking.startTime}–
              {booking.endTime}
            </p>
            <p className="pb-card-meta">
              Total: <strong>{currencyFormatter.format(Number(booking.totalPrice))}</strong>
            </p>
            <span
              className={`pb-status-pill ${
                booking.status === "CONFIRMADA" ? "pb-status-confirmed" : "pb-status-cancelled"
              }`}
            >
              {booking.status === "CONFIRMADA" ? "Confirmada" : "Cancelada"}
            </span>

            <div className="pb-card-divider" />

            {booking.status !== "CONFIRMADA" ? (
              <p className="pb-note-muted">Essa reserva já está cancelada.</p>
            ) : booking.cancellable ? (
              <>
                {error && <p className="pb-error">{error}</p>}
                <button onClick={handleCancel} disabled={cancelling} className="pb-cta-danger">
                  {cancelling ? "Cancelando..." : "Confirmar cancelamento"}
                </button>
              </>
            ) : (
              <p className="pb-alert pb-alert-warn">
                O cancelamento só pode ser feito até {booking.cancelMinHoursBefore}h antes do horário reservado. Entre
                em contato diretamente com a quadra se precisar cancelar agora.
              </p>
            )}
          </div>
        )}

        {cancelled && (
          <div className="pb-success-card">Reserva cancelada com sucesso. O horário já está disponível para outras pessoas.</div>
        )}
      </div>
    </div>
  );
}
