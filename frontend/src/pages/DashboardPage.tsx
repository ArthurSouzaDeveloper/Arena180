import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { DashboardSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary-700">{value}</p>
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

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Faturamento</h1>

      <BookingLinkCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje" value={currencyFormatter.format(summary?.revenueToday ?? 0)} />
        <StatCard label="Esta semana" value={currencyFormatter.format(summary?.revenueWeek ?? 0)} />
        <StatCard label="Este mês" value={currencyFormatter.format(summary?.revenueMonth ?? 0)} />
        <StatCard label="Rachas fechadas" value={String(summary?.totalRachas ?? 0)} />
      </div>
    </div>
  );
}
