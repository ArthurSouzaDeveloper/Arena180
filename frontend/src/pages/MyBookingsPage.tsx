import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { BookingWithCourt } from "../types";
import "../styles/publicBooking.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel: Record<BookingWithCourt["status"], string> = {
  CONFIRMADA: "Confirmada",
  PENDENTE_PAGAMENTO: "Pendente pagamento",
  CANCELADA: "Cancelada",
};

export function MyBookingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingWithCourt[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleSearch() {
    if (!slug || !phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/booking/${slug}/my-bookings`, { params: { phone } });
      setBookings(res.data);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível buscar suas reservas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!slug) return;
    setCancellingId(bookingId);
    setError(null);
    try {
      await api.post(`/booking/${slug}/my-bookings/${bookingId}/cancel`, { phone });
      const res = await api.get(`/booking/${slug}/my-bookings`, { params: { phone } });
      setBookings(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível cancelar a reserva.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="pb-page">
      <div className="pb-wrap">
        <header className="pb-header">
          <p className="pb-eyebrow">Minhas reservas</p>
          <h1 className="pb-title">Consulte suas reservas</h1>
          <div className="pb-rule" />
          <p className="pb-subtitle">Informe seu nome e telefone para ver suas reservas e o status de cada uma.</p>
        </header>

        <div className="pb-field-group" style={{ marginBottom: "1rem" }}>
          <div className="pb-field">
            <label htmlFor="myName">Seu nome</label>
            <input
              id="myName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", border: "none", background: "none", fontFamily: "inherit", fontSize: "0.96rem", fontWeight: 500 }}
            />
          </div>
          <div className="pb-field">
            <label htmlFor="myPhone">Telefone</label>
            <input
              id="myPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", border: "none", background: "none", fontFamily: "inherit", fontSize: "0.96rem", fontWeight: 500 }}
            />
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading || !phone} className="pb-cta" style={{ marginBottom: "1.5rem" }}>
          {loading ? "Buscando..." : "Ver minhas reservas"}
        </button>

        {error && <p className="pb-error">{error}</p>}

        {searched && !loading && bookings.length === 0 && !error && (
          <p className="pb-empty">Nenhuma reserva encontrada com esse telefone.</p>
        )}

        {bookings.map((booking) => (
          <div key={booking.id} className="pb-card" style={{ marginBottom: "1rem" }}>
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
              {statusLabel[booking.status]}
            </span>

            {booking.status === "CONFIRMADA" && (
              <>
                <div className="pb-card-divider" />
                {booking.cancellable ? (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="pb-cta-danger"
                  >
                    {cancellingId === booking.id ? "Cancelando..." : "Cancelar esta reserva"}
                  </button>
                ) : (
                  <p className="pb-alert pb-alert-warn">
                    O cancelamento só pode ser feito até {booking.cancelMinHoursBefore}h antes do horário reservado.
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
