import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { DashboardSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary-700 tabular-nums">{value}</p>
    </div>
  );
}

function BookingLinkCard() {
  const { quadra } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!quadra) return null;

  const bookingUrl = `${window.location.origin}/agendar/${quadra.slug}`;

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bookingUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = bookingUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the input is still selectable for manual copy.
    }
  }

  return (
    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-700">Link de agendamento para seus clientes</p>
      <p className="mb-3 text-xs text-gray-500">
        Envie este link para seus clientes reservarem horário sem precisar de login.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={bookingUrl}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
        <button
          onClick={handleCopy}
          className="shrink-0 rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}

function PixSettingsCard() {
  const [pixEnabled, setPixEnabled] = useState(false);
  const [allowDepositPayment, setAllowDepositPayment] = useState(true);
  const [allowFullPayment, setAllowFullPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingOptions, setSavingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/quadra/payment-settings")
      .then((res) => {
        setPixEnabled(res.data.pixEnabled);
        setAllowDepositPayment(res.data.allowDepositPayment);
        setAllowFullPayment(res.data.allowFullPayment);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.put("/quadra/payment-settings", { accessToken });
      setPixEnabled(res.data.pixEnabled);
      setAccessToken("");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível salvar o token.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.delete("/quadra/payment-settings");
      setPixEnabled(res.data.pixEnabled);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível remover o token.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleOption(field: "allowDepositPayment" | "allowFullPayment", value: boolean) {
    const nextDeposit = field === "allowDepositPayment" ? value : allowDepositPayment;
    const nextFull = field === "allowFullPayment" ? value : allowFullPayment;
    setSavingOptions(true);
    setOptionsError(null);
    try {
      const res = await api.put("/quadra/payment-options", {
        allowDepositPayment: nextDeposit,
        allowFullPayment: nextFull,
      });
      setAllowDepositPayment(res.data.allowDepositPayment);
      setAllowFullPayment(res.data.allowFullPayment);
    } catch (err: any) {
      setOptionsError(err.response?.data?.message ?? "Não foi possível salvar essa opção.");
    } finally {
      setSavingOptions(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-700">Pagamento via Pix na reserva</p>
      <p className="mb-3 text-xs text-gray-500">
        Cadastre o Access Token do Mercado Pago da sua arena para cobrar automaticamente pelo Pix em cada reserva.
        Enquanto não cadastrar, o agendamento continua funcionando sem cobrança.
      </p>

      <p className="mb-3 text-sm">
        Status:{" "}
        {pixEnabled ? (
          <span className="font-semibold text-primary-700">ativo</span>
        ) : (
          <span className="font-semibold text-gray-500">desativado</span>
        )}
      </p>

      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="password"
          placeholder="Access Token do Mercado Pago"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving || !accessToken}
          className="shrink-0 rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Salvar
        </button>
        {pixEnabled && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="shrink-0 rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Desativar
          </button>
        )}
      </div>

      {pixEnabled && (
        <div className="border-t pt-3">
          <p className="mb-2 text-xs font-medium text-gray-700">Formas de pagamento oferecidas ao cliente</p>
          {optionsError && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{optionsError}</p>}
          <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allowDepositPayment}
              disabled={savingOptions}
              onChange={(e) => handleToggleOption("allowDepositPayment", e.target.checked)}
            />
            Sinal de 20% do valor
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allowFullPayment}
              disabled={savingOptions}
              onChange={(e) => handleToggleOption("allowFullPayment", e.target.checked)}
            />
            Valor integral da reserva
          </label>
        </div>
      )}
    </div>
  );
}

function WhatsappSettingsCard() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adminNotificationPhone, setAdminNotificationPhone] = useState("");
  const [notifyBookingConfirmation, setNotifyBookingConfirmation] = useState(true);
  const [notifyBookingReminder, setNotifyBookingReminder] = useState(true);
  const [notifyMensalistaRenewal, setNotifyMensalistaRenewal] = useState(true);
  const [notifyNewAvulsaBooking, setNotifyNewAvulsaBooking] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/quadra/whatsapp-settings")
      .then((res) => {
        setWhatsappEnabled(res.data.whatsappEnabled);
        setAdminNotificationPhone(res.data.adminNotificationPhone ?? "");
        setNotifyBookingConfirmation(res.data.notifyBookingConfirmation);
        setNotifyBookingReminder(res.data.notifyBookingReminder);
        setNotifyMensalistaRenewal(res.data.notifyMensalistaRenewal);
        setNotifyNewAvulsaBooking(res.data.notifyNewAvulsaBooking);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.put("/quadra/whatsapp-settings", { accessToken, phoneNumberId });
      setWhatsappEnabled(res.data.whatsappEnabled);
      setAccessToken("");
      setPhoneNumberId("");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível salvar as credenciais.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.delete("/quadra/whatsapp-settings");
      setWhatsappEnabled(res.data.whatsappEnabled);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível remover as credenciais.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications() {
    setSavingNotifications(true);
    setNotificationsError(null);
    try {
      const res = await api.put("/quadra/notification-settings", {
        adminNotificationPhone: adminNotificationPhone || null,
        notifyBookingConfirmation,
        notifyBookingReminder,
        notifyMensalistaRenewal,
        notifyNewAvulsaBooking,
      });
      setAdminNotificationPhone(res.data.adminNotificationPhone ?? "");
      setNotifyBookingConfirmation(res.data.notifyBookingConfirmation);
      setNotifyBookingReminder(res.data.notifyBookingReminder);
      setNotifyMensalistaRenewal(res.data.notifyMensalistaRenewal);
      setNotifyNewAvulsaBooking(res.data.notifyNewAvulsaBooking);
    } catch (err: any) {
      setNotificationsError(err.response?.data?.message ?? "Não foi possível salvar as notificações.");
    } finally {
      setSavingNotifications(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-700">Notificação automática por WhatsApp</p>
      <p className="mb-3 text-xs text-gray-500">
        Cadastre o Access Token e o Phone Number ID da API oficial do WhatsApp (Meta Cloud API) da sua arena para
        enviar avisos automáticos. Enquanto não cadastrar, nenhuma mensagem é enviada.
      </p>

      <p className="mb-3 text-sm">
        Status:{" "}
        {whatsappEnabled ? (
          <span className="font-semibold text-primary-700">ativo</span>
        ) : (
          <span className="font-semibold text-gray-500">desativado</span>
        )}
      </p>

      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="password"
          placeholder="Access Token do WhatsApp"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Phone Number ID"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving || !accessToken || !phoneNumberId}
          className="shrink-0 rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Salvar
        </button>
        {whatsappEnabled && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="shrink-0 rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Desativar
          </button>
        )}
      </div>

      {whatsappEnabled && (
        <div className="border-t pt-3">
          <p className="mb-2 text-xs font-medium text-gray-700">Avisos automáticos</p>
          {notificationsError && (
            <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{notificationsError}</p>
          )}

          <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={notifyBookingConfirmation}
              onChange={(e) => setNotifyBookingConfirmation(e.target.checked)}
            />
            Confirmar reserva para o cliente
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={notifyBookingReminder}
              onChange={(e) => setNotifyBookingReminder(e.target.checked)}
            />
            Lembrete de horário para o cliente
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={notifyMensalistaRenewal}
              onChange={(e) => setNotifyMensalistaRenewal(e.target.checked)}
            />
            Aviso de renovação para o mensalista
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={notifyNewAvulsaBooking}
              onChange={(e) => setNotifyNewAvulsaBooking(e.target.checked)}
            />
            Avisar a arena quando uma reserva avulsa nova for feita
          </label>

          <label className="mb-1 block text-xs font-medium text-gray-700">
            Número de WhatsApp da arena, para receber o aviso de reserva avulsa
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="+55 19 99999-9999"
              value={adminNotificationPhone}
              onChange={(e) => setAdminNotificationPhone(e.target.value)}
              className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleSaveNotifications}
              disabled={savingNotifications}
              className="shrink-0 rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Salvar avisos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecoveryPhoneCard() {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/auth/me").then((res) => setPhone(res.data.phone ?? ""));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch("/auth/phone", { phone });
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível salvar o telefone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-700">Telefone para recuperação de senha</p>
      <p className="mb-3 text-xs text-gray-500">
        Cadastre seu próprio número de WhatsApp para poder receber um código e redefinir sua senha caso a esqueça.
        Só funciona depois que o WhatsApp da arena estiver configurado acima.
      </p>

      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">Telefone salvo.</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="+55 19 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving || !phone}
          className="shrink-0 rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Faturamento</h1>

      <BookingLinkCard />
      <PixSettingsCard />
      <WhatsappSettingsCard />
      <RecoveryPhoneCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje" value={currencyFormatter.format(summary?.revenueToday ?? 0)} />
        <StatCard label="Esta semana" value={currencyFormatter.format(summary?.revenueWeek ?? 0)} />
        <StatCard label="Este mês" value={currencyFormatter.format(summary?.revenueMonth ?? 0)} />
        <StatCard label="Rachas fechadas" value={String(summary?.totalRachas ?? 0)} />
      </div>
    </div>
  );
}
