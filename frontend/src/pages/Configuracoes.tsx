import { FormEvent, useEffect, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Arena, Court } from '../types';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Mesma regra do backend: primeira hora + um bloco extra a cada N minutos. */
function priceForDuration(court: Court, totalMinutes: number): number {
  const extraMinutes = Math.max(0, totalMinutes - 60);
  const blocks = court.extraBlockMinutes > 0 ? Math.ceil(extraMinutes / court.extraBlockMinutes) : 0;
  return Number(court.hourlyRate) + blocks * Number(court.extraBlockPrice);
}

const emptyCourt = { name: '', hourlyRate: '140', extraBlockMinutes: '20', extraBlockPrice: '30' };

export default function Configuracoes() {
  const { user, refreshUser } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

  const [showCourtForm, setShowCourtForm] = useState(false);
  const [newCourt, setNewCourt] = useState(emptyCourt);
  const [savingCourt, setSavingCourt] = useState(false);
  const [courtError, setCourtError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bookingUrl = user?.arena ? `${window.location.origin}/agendar/${user.arena.slug}` : '';

  function loadCourts() {
    return api.get<Court[]>('/courts').then((res) => setCourts(res.data));
  }

  useEffect(() => {
    Promise.all([
      api.get<Arena>('/arena/settings').then((res) => {
        setOpenTime(res.data.bookingOpenTime);
        setCloseTime(res.data.bookingCloseTime);
      }),
      loadCourts(),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleSaveHours(e: FormEvent) {
    e.preventDefault();
    setSavingHours(true);
    setHoursSaved(false);
    setHoursError(null);
    try {
      await api.put('/arena/settings', { bookingOpenTime: openTime, bookingCloseTime: closeTime });
      await refreshUser();
      setHoursSaved(true);
    } catch {
      setHoursError('Não foi possível salvar. Confira se a abertura é antes do fechamento.');
    } finally {
      setSavingHours(false);
    }
  }

  async function handleCreateCourt(e: FormEvent) {
    e.preventDefault();
    setSavingCourt(true);
    setCourtError(null);
    try {
      await api.post('/courts', {
        name: newCourt.name,
        hourlyRate: Number(newCourt.hourlyRate),
        extraBlockMinutes: Number(newCourt.extraBlockMinutes),
        extraBlockPrice: Number(newCourt.extraBlockPrice),
      });
      setNewCourt(emptyCourt);
      setShowCourtForm(false);
      await loadCourts();
    } catch {
      setCourtError('Não foi possível criar a quadra.');
    } finally {
      setSavingCourt(false);
    }
  }

  async function handleUpdateCourt(court: Court, field: keyof Court, value: string) {
    await api.put(`/courts/${court.id}`, { [field]: field === 'name' ? value : Number(value) });
    await loadCourts();
  }

  async function handleRemoveCourt(court: Court) {
    setCourtError(null);
    try {
      await api.delete(`/courts/${court.id}`);
      await loadCourts();
    } catch {
      setCourtError('A arena precisa ter ao menos uma quadra ativa.');
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Quadras, preços e horário de funcionamento da sua arena.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-gray-700">Link de agendamento</p>
        <p className="mt-1 text-xs text-gray-500">
          Divulgue este link para seus clientes reservarem horário sozinhos, sem precisar de login.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {bookingUrl}
          </code>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <form onSubmit={handleSaveHours}>
          <p className="text-sm font-medium text-gray-700">Horário de funcionamento</p>
          <p className="mt-1 text-xs text-gray-500">Usado para montar a grade de horários do agendamento.</p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Abre às</label>
              <input
                type="time"
                required
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha às</label>
              <input
                type="time"
                required
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingHours}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {savingHours ? 'Salvando...' : 'Salvar'}
            </button>
            {hoursSaved && <span className="text-sm text-green-600">Salvo.</span>}
            {hoursError && <span className="text-sm text-red-600">{hoursError}</span>}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Quadras</p>
            <p className="mt-1 text-xs text-gray-500">Cada quadra tem seu próprio preço de locação.</p>
          </div>
          {!showCourtForm && (
            <button
              onClick={() => setShowCourtForm(true)}
              className="flex items-center gap-1 rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              <Plus size={14} />
              Adicionar quadra
            </button>
          )}
        </div>

        {courtError && <p className="mt-3 text-sm text-red-600">{courtError}</p>}

        {showCourtForm && (
          <form onSubmit={handleCreateCourt} className="mt-4 rounded-md border border-brand-200 bg-brand-50/40 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Nome</label>
                <input
                  required
                  value={newCourt.name}
                  onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
                  placeholder="Quadra 2"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">1ª hora (R$)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCourt.hourlyRate}
                  onChange={(e) => setNewCourt({ ...newCourt, hourlyRate: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Bloco extra (min)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newCourt.extraBlockMinutes}
                  onChange={(e) => setNewCourt({ ...newCourt, extraBlockMinutes: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Valor do bloco (R$)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCourt.extraBlockPrice}
                  onChange={(e) => setNewCourt({ ...newCourt, extraBlockPrice: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={savingCourt}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {savingCourt ? 'Salvando...' : 'Criar quadra'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCourt(emptyCourt);
                  setShowCourtForm(false);
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 space-y-3">
          {courts.map((court) => (
            <div key={court.id} className="rounded-md border border-gray-200 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Nome</label>
                  <input
                    defaultValue={court.name}
                    onBlur={(e) => e.target.value !== court.name && handleUpdateCourt(court, 'name', e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">1ª hora (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={court.hourlyRate}
                    onBlur={(e) =>
                      e.target.value !== court.hourlyRate && handleUpdateCourt(court, 'hourlyRate', e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Bloco extra (min)</label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={court.extraBlockMinutes}
                    onBlur={(e) =>
                      Number(e.target.value) !== court.extraBlockMinutes &&
                      handleUpdateCourt(court, 'extraBlockMinutes', e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Valor do bloco (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={court.extraBlockPrice}
                    onBlur={(e) =>
                      e.target.value !== court.extraBlockPrice &&
                      handleUpdateCourt(court, 'extraBlockPrice', e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  1h = {formatBRL(Number(court.hourlyRate))} · 1h40 = {formatBRL(priceForDuration(court, 100))} · 2h ={' '}
                  {formatBRL(priceForDuration(court, 120))}
                </p>
                <button
                  onClick={() => handleRemoveCourt(court)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                  Desativar
                </button>
              </div>
            </div>
          ))}
          {courts.length === 0 && <p className="text-sm text-gray-400">Nenhuma quadra cadastrada.</p>}
        </div>
      </section>
    </div>
  );
}
