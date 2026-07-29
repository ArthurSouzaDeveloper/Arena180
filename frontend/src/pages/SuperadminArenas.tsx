import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { ArenaListItem } from '../types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function SuperadminArenas() {
  const [arenas, setArenas] = useState<ArenaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  function load() {
    setLoading(true);
    api
      .get<ArenaListItem[]>('/superadmin/arenas')
      .then((res) => setArenas(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function resetForm() {
    setName('');
    setSlug('');
    setSlugTouched(false);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/superadmin/arenas', {
        name,
        slug: slug || slugify(name),
        adminName,
        adminEmail,
        adminPassword,
      });
      resetForm();
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Não foi possível criar a arena.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(arena: ArenaListItem) {
    await api.patch(`/superadmin/arenas/${arena.id}/active`, { active: !arena.active });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Arenas</h1>
          <p className="mt-1 text-sm text-gray-500">Clientes cadastrados na plataforma GestQuadra.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            Nova arena
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-700">Cadastrar nova arena</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome da arena</label>
              <input
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Arena Cillos"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Identificador (link)</label>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="arena-cillos"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Usado no link público de agendamento.</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700">Login do dono da arena</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  required
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Criando...' : 'Criar arena'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Arena</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Responsável</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Rachas</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Criada em</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {arenas.map((arena) => (
              <tr key={arena.id}>
                <td className="px-4 py-2">
                  <p className="font-medium text-gray-900">{arena.name}</p>
                  <p className="text-xs text-gray-500">/{arena.slug}</p>
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {arena.admins.length > 0 ? (
                    <>
                      <p>{arena.admins[0].name}</p>
                      <p className="text-xs text-gray-500">{arena.admins[0].email}</p>
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-700">{arena.rachasCount}</td>
                <td className="px-4 py-2 text-gray-700">{formatDate(arena.createdAt)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      arena.active ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {arena.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => toggleActive(arena)} className="text-xs text-gray-500 hover:underline">
                    {arena.active ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && arenas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma arena cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
