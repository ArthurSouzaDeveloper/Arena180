import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Arena } from "../types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function SuperadminPage() {
  const { user, logout } = useAuth();
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadArenas() {
    api.get("/superadmin/arenas").then((res) => setArenas(res.data));
  }

  useEffect(() => {
    loadArenas();
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/superadmin/arenas", {
        name,
        slug,
        adminName,
        adminEmail,
        adminPassword,
      });
      setName("");
      setSlug("");
      setSlugTouched(false);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      loadArenas();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Não foi possível criar a arena.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(arena: Arena) {
    await api.put(`/superadmin/arenas/${arena.id}/active`, { active: !arena.active });
    loadArenas();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-semibold text-primary-700">Arena180 · Superadmin</p>
            <p className="text-xs text-gray-500">{user?.name}</p>
          </div>
          <button onClick={logout} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">Arenas</h1>

        <form onSubmit={handleSubmit} className="mb-8 space-y-3 rounded-lg border bg-white p-4">
          <p className="text-sm font-medium text-gray-700">Criar nova arena</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nome da arena</label>
              <input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Slug (URL pública)</label>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nome do administrador</label>
              <input
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">E-mail do administrador</label>
              <input
                required
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Senha inicial</label>
              <input
                required
                type="password"
                minLength={6}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Criar arena
          </button>
        </form>

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Arena</th>
                <th className="px-4 py-2">Admin</th>
                <th className="px-4 py-2">Quadras</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {arenas.map((arena) => (
                <tr key={arena.id} className="border-t">
                  <td className="px-4 py-2">
                    <p className="font-medium">{arena.name}</p>
                    <p className="text-xs text-gray-500">/agendar/{arena.slug}</p>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {arena.users[0] ? `${arena.users[0].name} (${arena.users[0].email})` : "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{arena._count.courts}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        arena.active
                          ? "rounded bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700"
                          : "rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                      }
                    >
                      {arena.active ? "Ativa" : "Desativada"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toggleActive(arena)}
                      className="rounded bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200"
                    >
                      {arena.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
              {arenas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Nenhuma arena cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
