import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Subscription } from "../types";
import "../styles/publicBooking.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const STATUS_LABEL: Record<Subscription["status"], string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  ATIVA: "Ativa",
  CANCELADA: "Cancelada",
};

export function CancelSubscriptionPage() {
  const { slug, subscriptionId } = useParams<{ slug: string; subscriptionId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!slug || !subscriptionId || !token) {
      setError("Link de cancelamento inválido.");
      setLoading(false);
      return;
    }
    api
      .get(`/booking/${slug}/subscriptions/${subscriptionId}`, { params: { token } })
      .then((res) => setSubscription(res.data))
      .catch((err) => setError(err.response?.data?.message ?? "Assinatura não encontrada."))
      .finally(() => setLoading(false));
  }, [slug, subscriptionId, token]);

  async function handleCancel() {
    if (!slug || !subscriptionId) return;
    setCancelling(true);
    setError(null);
    try {
      await api.post(`/booking/${slug}/subscriptions/${subscriptionId}/cancel`, { token });
      setCancelled(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível cancelar a assinatura.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="pb-page">
      <div className="pb-wrap">
        <header className="pb-header">
          <p className="pb-eyebrow">Mensalista</p>
          <h1 className="pb-title">Cancelar assinatura mensalista</h1>
          <div className="pb-rule" />
        </header>

        {loading && <p className="pb-loading">Carregando...</p>}

        {!loading && error && !subscription && <p className="pb-error">{error}</p>}

        {!loading && subscription && !cancelled && (
          <div className="pb-card">
            <p className="pb-card-title">
              {WEEKDAY_LABELS[subscription.weekday]} · {subscription.startTime}–{subscription.endTime}
            </p>
            <p className="pb-card-meta">
              Valor por ocorrência: <strong>{currencyFormatter.format(Number(subscription.pricePerOccurrence))}</strong>
            </p>
            <span
              className={`pb-status-pill ${
                subscription.status === "ATIVA" ? "pb-status-confirmed" : "pb-status-cancelled"
              }`}
            >
              {STATUS_LABEL[subscription.status]}
            </span>

            <div className="pb-card-divider" />

            {subscription.status === "CANCELADA" ? (
              <p className="pb-note-muted">Essa assinatura já está cancelada.</p>
            ) : (
              <>
                {error && <p className="pb-error">{error}</p>}
                <button onClick={handleCancel} disabled={cancelling} className="pb-cta-danger">
                  {cancelling ? "Cancelando..." : "Confirmar cancelamento da assinatura"}
                </button>
              </>
            )}
          </div>
        )}

        {cancelled && (
          <div className="pb-success-card">
            Assinatura cancelada com sucesso. Os horários futuros já foram liberados.
          </div>
        )}
      </div>
    </div>
  );
}
