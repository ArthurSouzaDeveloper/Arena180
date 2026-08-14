import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Availability, Booking, MensalistaHours, MensalistaQuote, PublicCourt, Subscription } from "../types";
import "../styles/publicBooking.css";

const PAYMENT_POLL_INTERVAL_MS = 4000;

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
  const [pixEnabled, setPixEnabled] = useState(false);
  const [allowDepositPayment, setAllowDepositPayment] = useState(false);
  const [allowFullPayment, setAllowFullPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"DEPOSITO" | "INTEGRAL">("DEPOSITO");
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
  const [pixCopied, setPixCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<"AVULSO" | "MENSALISTA">("AVULSO");
  const [mensalistaWeekday, setMensalistaWeekday] = useState(new Date().getDay());
  const [mensalistaStartTime, setMensalistaStartTime] = useState("");
  const [mensalistaHours, setMensalistaHours] = useState<MensalistaHours | null>(null);
  const [mensalistaQuote, setMensalistaQuote] = useState<MensalistaQuote | null>(null);
  const [mensalistaQuoteLoading, setMensalistaQuoteLoading] = useState(false);
  const [mensalistaCustomerName, setMensalistaCustomerName] = useState("");
  const [mensalistaCustomerPhone, setMensalistaCustomerPhone] = useState("");
  const [mensalistaError, setMensalistaError] = useState<string | null>(null);
  const [mensalistaSubmitting, setMensalistaSubmitting] = useState(false);
  const [confirmedSubscription, setConfirmedSubscription] = useState<Subscription | null>(null);
  const [mensalistaPaymentExpired, setMensalistaPaymentExpired] = useState(false);
  const [mensalistaPixCopied, setMensalistaPixCopied] = useState(false);
  const mensalistaPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.get(`/booking/${slug}/courts`).then((res) => {
      setArenaName(res.data.arenaName);
      setCourts(res.data.courts);
      setPixEnabled(res.data.pixEnabled);
      setAllowDepositPayment(res.data.allowDepositPayment);
      setAllowFullPayment(res.data.allowFullPayment);
      setPaymentMode(res.data.allowDepositPayment ? "DEPOSITO" : "INTEGRAL");
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

  useEffect(() => {
    if (!slug || !courtId || mode !== "MENSALISTA") return;
    setMensalistaQuote(null);
    setMensalistaStartTime("");
    api
      .get(`/booking/${slug}/courts/${courtId}/mensalista/hours`, { params: { weekday: mensalistaWeekday } })
      .then((res) => setMensalistaHours(res.data))
      .catch(() => setMensalistaHours({ open: false }));
  }, [slug, courtId, mode, mensalistaWeekday]);

  useEffect(() => {
    if (!slug || !confirmedSubscription || confirmedSubscription.status !== "AGUARDANDO_PAGAMENTO") {
      return;
    }

    function poll() {
      api
        .get(`/booking/${slug}/subscriptions/${confirmedSubscription!.id}/payment-status`, {
          params: { token: confirmedSubscription!.cancelToken },
        })
        .then((res) => {
          if (res.data.status === "ATIVA") {
            setConfirmedSubscription((prev) => (prev ? { ...prev, status: "ATIVA" } : prev));
            if (mensalistaPollingRef.current) clearInterval(mensalistaPollingRef.current);
          } else if (res.data.status === "CANCELADA") {
            setMensalistaPaymentExpired(true);
            if (mensalistaPollingRef.current) clearInterval(mensalistaPollingRef.current);
          }
        })
        .catch(() => {
          // Ignora falhas isoladas de rede durante o polling, tenta novamente na próxima.
        });
    }

    poll();
    mensalistaPollingRef.current = setInterval(poll, PAYMENT_POLL_INTERVAL_MS);
    return () => {
      if (mensalistaPollingRef.current) clearInterval(mensalistaPollingRef.current);
    };
  }, [slug, confirmedSubscription?.id, confirmedSubscription?.status]);

  const selectedCourt = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId]);

  const mensalistaTimeOptions = useMemo(() => {
    if (!mensalistaHours?.open || !mensalistaHours.openTime || !mensalistaHours.closeTime || !mensalistaHours.slotMinutes) {
      return [] as string[];
    }
    const options: string[] = [];
    let cursor = mensalistaHours.openTime;
    while (cursor < mensalistaHours.closeTime) {
      const [h, m] = cursor.split(":").map(Number);
      const end = new Date(0, 0, 0, h, m + mensalistaHours.slotMinutes);
      const endStr = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      if (endStr > mensalistaHours.closeTime) break;
      options.push(cursor);
      cursor = endStr;
    }
    return options;
  }, [mensalistaHours]);

  async function handleMensalistaQuote() {
    if (!slug || !courtId || !mensalistaStartTime) return;
    setMensalistaQuoteLoading(true);
    setMensalistaError(null);
    setMensalistaQuote(null);
    try {
      const res = await api.get(`/booking/${slug}/courts/${courtId}/mensalista/quote`, {
        params: { weekday: mensalistaWeekday, startTime: mensalistaStartTime },
      });
      setMensalistaQuote(res.data);
    } catch (err: any) {
      setMensalistaError(err.response?.data?.message ?? "Não foi possível consultar a disponibilidade.");
    } finally {
      setMensalistaQuoteLoading(false);
    }
  }

  async function handleMensalistaSubmit() {
    if (!slug || !courtId || !mensalistaStartTime) return;
    setMensalistaSubmitting(true);
    setMensalistaError(null);
    setConfirmedSubscription(null);
    setMensalistaPaymentExpired(false);
    try {
      const res = await api.post(`/booking/${slug}/courts/${courtId}/mensalista`, {
        weekday: mensalistaWeekday,
        startTime: mensalistaStartTime,
        customerName: mensalistaCustomerName,
        customerPhone: mensalistaCustomerPhone,
      });
      setConfirmedSubscription(res.data);
      setMensalistaQuote(null);
      setMensalistaCustomerName("");
      setMensalistaCustomerPhone("");
    } catch (err: any) {
      setMensalistaError(err.response?.data?.message ?? "Não foi possível concluir a assinatura.");
    } finally {
      setMensalistaSubmitting(false);
    }
  }

  function handleMensalistaRetryAfterExpiration() {
    setConfirmedSubscription(null);
    setMensalistaPaymentExpired(false);
  }

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

  const showPaymentModeChoice = pixEnabled && allowDepositPayment && allowFullPayment;

  const amountDueNow = useMemo(() => {
    if (!pixEnabled) return totalPrice;
    return paymentMode === "INTEGRAL" ? totalPrice : Math.round(totalPrice * 0.2 * 100) / 100;
  }, [pixEnabled, paymentMode, totalPrice]);

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
        paymentMode: pixEnabled ? paymentMode : undefined,
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
          {slug && (
            <p className="pb-foot-note" style={{ marginTop: "0.85rem" }}>
              <Link to={`/agendar/${slug}/minhas-reservas`} style={{ color: "var(--pb-accent)", fontWeight: 600 }}>
                Já reservou? Veja suas reservas
              </Link>
            </p>
          )}
        </header>

        {courts.length === 0 && <p className="pb-empty">Nenhuma quadra disponível para agendamento.</p>}

        {courts.length > 0 && (
          <>
            {selectedCourt?.mensalistaHourlyRate && (
              <div className="pb-checkbox-row" style={{ justifyContent: "center", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setMode("AVULSO")}
                  className="pb-cta"
                  style={{
                    width: "auto",
                    padding: "0.5rem 1.1rem",
                    background: mode === "AVULSO" ? "var(--pb-accent)" : "var(--pb-surface)",
                    color: mode === "AVULSO" ? "var(--pb-surface)" : "var(--pb-ink)",
                    border: "1px solid var(--pb-line)",
                  }}
                >
                  Avulso
                </button>
                <button
                  type="button"
                  onClick={() => setMode("MENSALISTA")}
                  className="pb-cta"
                  style={{
                    width: "auto",
                    padding: "0.5rem 1.1rem",
                    background: mode === "MENSALISTA" ? "var(--pb-accent)" : "var(--pb-surface)",
                    color: mode === "MENSALISTA" ? "var(--pb-surface)" : "var(--pb-ink)",
                    border: "1px solid var(--pb-line)",
                  }}
                >
                  Mensalista
                </button>
              </div>
            )}

            <div className="pb-field-group" style={mode === "MENSALISTA" ? { gridTemplateColumns: "1fr" } : undefined}>
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
              {mode === "AVULSO" && (
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
              )}
            </div>

            {mode === "MENSALISTA" && (
              <div className="pb-section">
                {confirmedSubscription && confirmedSubscription.status === "AGUARDANDO_PAGAMENTO" && confirmedSubscription.pix && (
                  <div className="pb-confirm-card">
                    <p className="pb-confirm-title">Pague o sinal para garantir o horário fixo</p>
                    <p>
                      {WEEKDAY_LABELS[confirmedSubscription.weekday]} · {confirmedSubscription.startTime}–
                      {confirmedSubscription.endTime}
                    </p>
                    {confirmedSubscription.dates && (
                      <p className="pb-note-muted">
                        {confirmedSubscription.dates.length} datas neste ciclo: {" "}
                        {confirmedSubscription.dates.map((d) => d.split("-").reverse().join("/")).join(", ")}
                      </p>
                    )}
                    <p>
                      Sinal de {currencyFormatter.format(Number(confirmedSubscription.depositAmount ?? 0))}. Escaneie o
                      QR Code abaixo com o aplicativo do seu banco. Você tem 20 minutos para pagar, senão o horário é
                      liberado de novo.
                    </p>
                    <img
                      src={`data:image/png;base64,${confirmedSubscription.pix.qrCodeBase64}`}
                      alt="QR Code do Pix"
                      style={{ maxWidth: "220px", margin: "0.75rem auto", display: "block" }}
                    />
                    <p className="pb-note-muted" style={{ marginBottom: "0.35rem" }}>
                      Ou copie o código abaixo e cole na área "Pix Copia e Cola" do aplicativo do seu banco:
                    </p>
                    <div className="pb-pix-copy-row">
                      <input readOnly value={confirmedSubscription.pix.qrCode} onFocus={(e) => e.target.select()} />
                      <button
                        type="button"
                        onClick={() => {
                          const text = confirmedSubscription.pix!.qrCode;
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(text);
                          } else {
                            const textarea = document.createElement("textarea");
                            textarea.value = text;
                            textarea.style.position = "fixed";
                            textarea.style.opacity = "0";
                            document.body.appendChild(textarea);
                            textarea.focus();
                            textarea.select();
                            document.execCommand("copy");
                            document.body.removeChild(textarea);
                          }
                          setMensalistaPixCopied(true);
                          setTimeout(() => setMensalistaPixCopied(false), 2000);
                        }}
                      >
                        {mensalistaPixCopied ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <p className="pb-note-muted">Aguardando confirmação do pagamento...</p>
                  </div>
                )}

                {confirmedSubscription && confirmedSubscription.status === "ATIVA" && (
                  <div className="pb-confirm-card">
                    <p className="pb-confirm-title">Assinatura mensalista confirmada!</p>
                    <p>
                      {WEEKDAY_LABELS[confirmedSubscription.weekday]} · {confirmedSubscription.startTime}–
                      {confirmedSubscription.endTime}, todo mês, até você ou a arena cancelar.
                    </p>
                    <p>
                      Guarde este link para cancelar sua assinatura se precisar:{" "}
                      <Link
                        to={`/agendar/${slug}/mensalista/${confirmedSubscription.id}/cancelar?token=${confirmedSubscription.cancelToken}`}
                      >
                        Cancelar esta assinatura
                      </Link>
                    </p>
                  </div>
                )}

                {mensalistaPaymentExpired && (
                  <div className="pb-alert pb-alert-warn" style={{ marginBottom: "1.75rem" }}>
                    O prazo para pagamento do sinal expirou e o horário foi liberado.{" "}
                    <button
                      onClick={handleMensalistaRetryAfterExpiration}
                      className="pb-note-muted"
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                    >
                      Escolher horário novamente
                    </button>
                  </div>
                )}

                {!confirmedSubscription && (
                  <>
                    <div className="pb-field-group">
                      <div className="pb-field">
                        <label htmlFor="mensalistaWeekday">Dia da semana</label>
                        <select
                          id="mensalistaWeekday"
                          value={mensalistaWeekday}
                          onChange={(e) => setMensalistaWeekday(Number(e.target.value))}
                        >
                          {WEEKDAY_LABELS.map((label, idx) => (
                            <option key={idx} value={idx}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="pb-field">
                        <label htmlFor="mensalistaStartTime">Horário</label>
                        <select
                          id="mensalistaStartTime"
                          value={mensalistaStartTime}
                          onChange={(e) => setMensalistaStartTime(e.target.value)}
                          disabled={!mensalistaHours?.open}
                        >
                          <option value="">Selecione</option>
                          {mensalistaTimeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {mensalistaHours && !mensalistaHours.open && (
                      <p className="pb-alert pb-alert-warn">Quadra fechada nesse dia da semana.</p>
                    )}

                    {mensalistaHours?.open && mensalistaHours.pricePerOccurrence && (
                      <p className="pb-duration-note">
                        Valor por sessão mensal:{" "}
                        <strong>{currencyFormatter.format(mensalistaHours.pricePerOccurrence)}</strong>
                      </p>
                    )}

                    {mensalistaError && <p className="pb-error">{mensalistaError}</p>}

                    {!mensalistaQuote && (
                      <button
                        onClick={handleMensalistaQuote}
                        disabled={mensalistaQuoteLoading || !mensalistaStartTime}
                        className="pb-cta"
                        style={{ marginBottom: "1.25rem" }}
                      >
                        {mensalistaQuoteLoading ? "Consultando..." : "Consultar disponibilidade"}
                      </button>
                    )}

                    {mensalistaQuote && (
                      <div className="pb-order-card">
                        <p className="pb-note-muted" style={{ marginBottom: "0.5rem" }}>
                          {mensalistaQuote.dates.length} datas neste ciclo de 30 dias:{" "}
                          {mensalistaQuote.dates.map((d) => d.split("-").reverse().join("/")).join(", ")}
                        </p>

                        <div className="pb-summary">
                          <span className="pb-summary-label">Total do ciclo</span>
                          <span className="pb-summary-value">{currencyFormatter.format(mensalistaQuote.totalPrice)}</span>
                        </div>

                        <p className="pb-note-muted" style={{ marginBottom: "1rem" }}>
                          Sinal de 20% agora: <strong>{currencyFormatter.format(mensalistaQuote.depositAmount)}</strong>.
                          O restante de cada mês é acertado presencialmente com a arena.
                        </p>

                        <div className="pb-customer-fields">
                          <div>
                            <label htmlFor="mensalistaCustomerName">Seu nome</label>
                            <input
                              id="mensalistaCustomerName"
                              required
                              value={mensalistaCustomerName}
                              onChange={(e) => setMensalistaCustomerName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="mensalistaCustomerPhone">Telefone</label>
                            <input
                              id="mensalistaCustomerPhone"
                              required
                              value={mensalistaCustomerPhone}
                              onChange={(e) => setMensalistaCustomerPhone(e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleMensalistaSubmit}
                          disabled={mensalistaSubmitting || !mensalistaCustomerName || !mensalistaCustomerPhone}
                          className="pb-cta"
                        >
                          {mensalistaSubmitting
                            ? "Enviando..."
                            : `Confirmar assinatura — pagar ${currencyFormatter.format(mensalistaQuote.depositAmount)} agora`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {mode === "AVULSO" && confirmedBooking && confirmedBooking.status === "PENDENTE_PAGAMENTO" && confirmedBooking.pix && (
              <div className="pb-confirm-card">
                <p className="pb-confirm-title">
                  {confirmedBooking.paymentMode === "INTEGRAL"
                    ? "Pague o valor integral para garantir o horário"
                    : "Pague o sinal para garantir o horário"}
                </p>
                <p>
                  {new Date(`${confirmedBooking.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                  {confirmedBooking.startTime}–{confirmedBooking.endTime}
                </p>
                <p>
                  {confirmedBooking.paymentMode === "INTEGRAL" ? "Valor" : "Sinal"} de{" "}
                  {currencyFormatter.format(Number(confirmedBooking.depositAmount ?? 0))}. Escaneie o QR Code abaixo
                  com o aplicativo do seu banco. Você tem 20 minutos para pagar, senão o horário é liberado de novo.
                </p>
                <img
                  src={`data:image/png;base64,${confirmedBooking.pix.qrCodeBase64}`}
                  alt="QR Code do Pix"
                  style={{ maxWidth: "220px", margin: "0.75rem auto", display: "block" }}
                />
                <p className="pb-note-muted" style={{ marginBottom: "0.35rem" }}>
                  Ou copie o código abaixo e cole na área "Pix Copia e Cola" do aplicativo do seu banco:
                </p>
                <div className="pb-pix-copy-row">
                  <input readOnly value={confirmedBooking.pix.qrCode} onFocus={(e) => e.target.select()} />
                  <button
                    type="button"
                    onClick={() => {
                      const text = confirmedBooking.pix!.qrCode;
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(text);
                      } else {
                        const textarea = document.createElement("textarea");
                        textarea.value = text;
                        textarea.style.position = "fixed";
                        textarea.style.opacity = "0";
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                      }
                      setPixCopied(true);
                      setTimeout(() => setPixCopied(false), 2000);
                    }}
                  >
                    {pixCopied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className="pb-note-muted">Aguardando confirmação do pagamento...</p>
              </div>
            )}

            {mode === "AVULSO" && confirmedBooking && confirmedBooking.status === "CONFIRMADA" && (
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

            {mode === "AVULSO" && paymentExpired && (
              <div className="pb-alert pb-alert-warn" style={{ marginBottom: "1.75rem" }}>
                O prazo para pagamento do sinal expirou e o horário foi liberado.{" "}
                <button onClick={handleRetryAfterExpiration} className="pb-note-muted" style={{ textDecoration: "underline", cursor: "pointer" }}>
                  Escolher horário novamente
                </button>
              </div>
            )}

            {mode === "AVULSO" && loadingAvailability && <p className="pb-alert-loading">Carregando horários...</p>}

            {mode === "AVULSO" && !loadingAvailability && availability && !availability.open && (
              <p className="pb-alert pb-alert-warn">
                Quadra fechada nessa data{availability.reason ? ` (${availability.reason})` : ""}.
              </p>
            )}

            {mode === "AVULSO" && !loadingAvailability && availability?.open && (
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
                      onClick={() => setSelectedSlot((prev) => (prev === slot.startTime ? null : slot.startTime))}
                      className={`pb-slot ${selectedSlot === slot.startTime ? "pb-slot-selected" : ""}`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "AVULSO" && selectedSlot && selectedCourt && (
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

                {showPaymentModeChoice && (
                  <div className="pb-checkbox-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentMode === "DEPOSITO"}
                        onChange={() => setPaymentMode("DEPOSITO")}
                      />
                      <span>Pagar sinal de 20% agora ({currencyFormatter.format(totalPrice * 0.2)}) e o restante presencialmente</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentMode === "INTEGRAL"}
                        onChange={() => setPaymentMode("INTEGRAL")}
                      />
                      <span>Pagar o valor integral agora ({currencyFormatter.format(totalPrice)})</span>
                    </label>
                  </div>
                )}

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
                  {pixEnabled
                    ? `Confirmar reserva — pagar ${currencyFormatter.format(amountDueNow)} agora`
                    : `Confirmar reserva — ${currencyFormatter.format(totalPrice)}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
