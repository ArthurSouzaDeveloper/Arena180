import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setInfo(res.data.message);
      setStep("reset");
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Código inválido ou expirado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={step === "email" ? handleRequestCode : handleResetPassword}
        className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-bold text-primary-700">Arena180</h1>
        <p className="mb-6 text-sm text-gray-500">Recuperar senha</p>

        <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
        <input
          type="email"
          required
          disabled={step === "reset"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
        />

        {step === "reset" && (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Se o e-mail tiver um telefone cadastrado e a arena tiver o WhatsApp configurado, um código de 6
              dígitos foi enviado por WhatsApp. Ele vale por 10 minutos.
            </p>

            <label className="mb-1 block text-sm font-medium text-gray-700">Código recebido</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />

            <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </>
        )}

        {info && step === "email" && <p className="mb-4 text-sm text-gray-600">{info}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : step === "email" ? "Enviar código" : "Redefinir senha"}
        </button>

        <Link to="/login" className="mt-4 block text-center text-sm text-primary-700 hover:underline">
          Voltar para o login
        </Link>
      </form>
    </div>
  );
}
