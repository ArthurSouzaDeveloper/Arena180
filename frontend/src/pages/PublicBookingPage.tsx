import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Availability, Booking, PublicCourt } from "../types";
import "../styles/publicBooking.css";

const PAYMENT_POLL_INTERVAL_MS = 4000;

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(minutes?: number) {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${String(mins).padStart(2, "0")}`;
}

export function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [arenaName, setArenaName] = useState<string | null>(null);
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
  const [paymentExpired, setPaymentExpired] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.get(`/booking/${slug}/courts`).then((res) => {
      setArenaName(res.data.arenaName);
      setCourts(res.data.courts);
      if (res.data.courts.length > 0) setCourtId(res.data.courts[0].id);
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

  useEffect(() => {
    if (!slug || !confirmedBooking || confirmedBooking.status !== "PENDENTE_PAGAMENTO") {
      return;
    }

    function poll() {
      api
        .get(`/booking/${slug}/bookings/${confirmedBooking!.id}/payment-status`, {
          params: { token: confirmedBooking!.cancelToken },
        })
        .then((res) => {
          if (res.data.status === "CONFIRMADA") {
            setConfirmedBooking((prev) => (prev ? { ...prev, status: "CONFIRMADA" } : prev));
            if (pollingRef.current) clearInterval(pollingRef.current);
          } else if (res.data.status === "CANCELADA") {
            setPaymentExpired(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        })
        .catch(() => {
          // Ignora falhas isoladas de rede durante o polling, tenta novamente na próxima.
        });
    }

    poll();
    pollingRef.current = setInterval(poll, PAYMENT_POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [slug, confirmedBooking?.id, confirmedBooking?.status]);

  const selectedCourt = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId]);

  const totalPrice = useMemo(() => {
    if (!availability?.hourlyRate) return 0;
    const base = Number(availability.hourlyRate);
    const extra = withExtraBlock ? Number(availability.extraBlockPrice ?? 0) : 0;
    return base + extra;
  }, [availability, withExtraBlock]);

  const selectedSlotEnd = useMemo(
    () => availability?.slots.find((s) => s.startTime === selectedSlot)?.endTime,
    [availability, selectedSlot],
  );

  async function handleSubmit() {
    if (!slug || !courtId || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setConfirmedBooking(null);
    setPaymentExpired(false);
    try {
      const bookingRes = await api.post(`/booking/${slug}/courts/${courtId}`, {
        date,
        startTime: selectedSlot,
        withExtraBlock,
        customerName,
        customerPhone,
      });
      const booking: Booking = bookingRes.data;
      setSuccess(booking.status === "PENDENTE_PAGAMENTO" ? null : "Reserva confirmada com sucesso!");
      setConfirmedBooking(booking);
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

  function handleRetryAfterExpiration() {
    setConfirmedBooking(null);
    setPaymentExpired(false);
    setSuccess(null);
    if (slug && courtId && date) {
      api.get(`/booking/${slug}/courts/${courtId}/availability`, { params: { date } }).then((res) => setAvailability(res.data));
    }
  }

  return (
    <div className="pb-page">
      <div className="pb-wrap">
        <header className="pb-header">
          <p className="pb-eyebrow">Agendamento</p>
          <h1 className="pb-title">{arenaName ?? " "}</h1>
          <div className="pb-rule" />
          <p className="pb-subtitle">Reserve seu horário em menos de um minuto.</p>
        </header>

        {courts.length === 0 && <p className="pb-empty">Nenhuma quadra disponível para agendamento.</p>}

        {courts.length > 0 && (
          <>
            <div className="pb-field-group">
              <div className="pb-field">
                <label htmlFor="courtSelect">Quadra</label>
                <select id="courtSelect" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pb-field">
                <label htmlFor="dateInput">Data</label>
                <input
                  id="dateInput"
                  type="date"
                  min={todayIso()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {confirmedBooking && confirmedBooking.status === "PENDENTE_PAGAMENTO" && confirmedBooking.pix && (
              <div className="pb-confirm-card">
                <p className="pb-confirm-title">Pague o sinal para garantir o horário</p>
                <p>
                  {new Date(`${confirmedBooking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                  {confirmedBooking.startTime}–{confirmedBooking.endTime}
                </p>
                <p>
                  Sinal de {currencyFormatter.format(Number(confirmedBooking.depositAmount ?? 0))}. Escaneie o QR
                  Code abaixo com o aplicativo do seu banco. Você tem 20 minutos para pagar, senão o horário é
                  liberado de novo.
                </p>
                <img
                  src={`data:image/png;base64,${confirmedBooking.pix.qrCodeBase64}`}
                  alt="QR Code do Pix"
                  style={{ maxWidth: "220px", margin: "0.75rem auto", display: "block" }}
                />
                <p className="pb-note-muted">Aguardando confirmação do pagamento...</p>
              </div>
            )}

            {confirmedBooking && confirmedBooking.status === "CONFIRMADA" && (
              <div className="pb-confirm-card">
                <p className="pb-confirm-title">{success ?? "Reserva confirmada com sucesso!"}</p>
                <p>
                  {new Date(`${confirmedBooking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                  {confirmedBooking.startTime}–{confirmedBooking.endTime}
                </p>
                <p>
                  Guarde este link para cancelar sua reserva se precisar:{" "}
                  <Link to={`/agendar/${slug}/cancelar/${confirmedBooking.id}?token=${confirmedBooking.cancelToken}`}>
                    Cancelar esta reserva
                  </Link>
                </p>
              </div>
            )}

            {paymentExpired && (
              <div className="pb-alert pb-alert-warn" style={{ marginBottom: "1.75rem" }}>
                O prazo para pagamento do sinal expirou e o horário foi liberado.{" "}
                <button onClick={handleRetryAfterExpiration} className="pb-note-muted" style={{ textDecoration: "underline", cursor: "pointer" }}>
                  Escolher horário novamente
                </button>
              </div>
            )}

            {loadingAvailability && <p className="pb-alert-loading">Carregando horários...</p>}

            {!loadingAvailability && availability && !availability.open && (
              <p className="pb-alert pb-alert-warn">
                Quadra fechada nessa data{availability.reason ? ` (${availability.reason})` : ""}.
              </p>
            )}

            {!loadingAvailability && availability?.open && (
              <div className="pb-section">
                <div className="pb-section-head">
                  <h2>Horários disponíveis</h2>
                  {availability.hourlyRate && (
                    <span className="pb-price">{currencyFormatter.format(Number(availability.hourlyRate))} / sessão</span>
                  )}
                </div>
                {availability.slotMinutes && (
                  <p className="pb-duration-note">
                    Cada sessão dura <strong>{formatDuration(availability.slotMinutes)}</strong>.
                  </p>
                )}
                <div className="pb-slots">
                  {availability.slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`pb-slot ${selectedSlot === slot.startTime ? "pb-slot-selected" : ""}`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSlot && selectedCourt && (
              <div className="pb-order-card">
                {Number(selectedCourt.extraBlockMinutes) > 0 && (
                  <label className="pb-checkbox-row">
                    <input
                      type="checkbox"
                      checked={withExtraBlock}
                      onChange={(e) => setWithExtraBlock(e.target.checked)}
                    />
                    <span>
                      Adicionar bloco extra de {selectedCourt.extraBlockMinutes} min por{" "}
                      {currencyFormatter.format(Number(selectedCourt.extraBlockPrice ?? 0))}
                    </span>
                  </label>
                )}

                <div className="pb-summary">
                  <span className="pb-summary-label">
                    {selectedSlot}
                    {selectedSlotEnd ? `–${selectedSlotEnd}` : ""}
                  </span>
                  <span className="pb-summary-value">{currencyFormatter.format(totalPrice)}</span>
                </div>

                <div className="pb-customer-fields">
                  <div>
                    <label htmlFor="customerName">Seu nome</label>
                    <input
                      id="customerName"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="customerPhone">Telefone</label>
                    <input
                      id="customerPhone"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="pb-error">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !customerName || !customerPhone}
                  className="pb-cta"
                >
                  Confirmar reserva — {currencyFormatter.format(totalPrice)}
                </button>
                <p className="pb-foot-note">Sem necessidade de login</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
