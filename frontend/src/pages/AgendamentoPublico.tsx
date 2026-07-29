import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarCheck, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import { Availability, PublicArena, PublicCourt } from '../types';

const publicApi = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

const SLOT_MINUTES = 30;
const DURATION_OPTIONS = [60, 90, 120, 150, 180];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Mesma regra do backend: primeira hora + um bloco extra a cada N minutos. */
function priceFor(court: PublicCourt, durationMinutes: number): number {
  const extra = Math.max(0, durationMinutes - 60);
  const blocks = court.extraBlockMinutes > 0 ? Math.ceil(extra / court.extraBlockMinutes) : 0;
  return Number(court.hourlyRate) + blocks * Number(court.extraBlockPrice);
}

interface Confirmation {
  courtName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  playerName: string;
}

export default function AgendamentoPublico() {
  const { slug } = useParams<{ slug: string }>();
  const [arena, setArena] = useState<PublicArena | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [startTime, setStartTime] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    publicApi
      .get<PublicArena>(`/public/arenas/${slug}`)
      .then((res) => {
        setArena(res.data);
        if (res.data.courts.length > 0) setCourtId(res.data.courts[0].id);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!courtId || !date) return;
    setLoadingSlots(true);
    setStartTime(null);
    publicApi
      .get<Availability>(`/public/arenas/${slug}/availability`, { params: { courtId, date } })
      .then((res) => setAvailability(res.data))
      .finally(() => setLoadingSlots(false));
  }, [slug, courtId, date]);

  const selectedCourt = arena?.courts.find((court) => court.id === courtId);

  /** Intervalos ocupados convertidos para minutos do dia, para comparar com a grade. */
  const busyRanges = useMemo(() => {
    if (!availability) return [];
    return availability.busy.map((interval) => {
      const start = new Date(interval.startsAt);
      const end = new Date(interval.endsAt);
      return { start: start.getHours() * 60 + start.getMinutes(), end: end.getHours() * 60 + end.getMinutes() };
    });
  }, [availability]);

  function isFree(startMinutes: number, duration: number): boolean {
    if (!availability) return false;
    const endMinutes = startMinutes + duration;
    if (endMinutes > timeToMinutes(availability.closeTime)) return false;

    const isToday = date === todayISO();
    if (isToday) {
      const now = new Date();
      if (startMinutes <= now.getHours() * 60 + now.getMinutes()) return false;
    }

    return !busyRanges.some((range) => startMinutes < range.end && endMinutes > range.start);
  }

  const slots = useMemo(() => {
    if (!availability) return [];
    const open = timeToMinutes(availability.openTime);
    const close = timeToMinutes(availability.closeTime);
    const result: { minutes: number; label: string; free: boolean }[] = [];
    for (let m = open; m + SLOT_MINUTES <= close; m += SLOT_MINUTES) {
      result.push({ minutes: m, label: minutesToTime(m), free: isFree(m, SLOT_MINUTES) });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, busyRanges, date]);

  const availableDurations = startTime
    ? DURATION_OPTIONS.filter((duration) => isFree(timeToMinutes(startTime), duration))
    : [];

  useEffect(() => {
    if (startTime && availableDurations.length > 0 && !availableDurations.includes(durationMinutes)) {
      setDurationMinutes(availableDurations[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, availability]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startTime || !selectedCourt) return;
    setSubmitting(true);
    setError(null);
    try {
      const startsAt = `${date}T${startTime}:00`;
      await publicApi.post(`/public/arenas/${slug}/bookings`, {
        courtId,
        startsAt,
        durationMinutes,
        playerName,
        playerPhone,
      });
      setConfirmation({
        courtName: selectedCourt.name,
        date,
        startTime,
        durationMinutes,
        price: priceFor(selectedCourt, durationMinutes),
        playerName,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Não foi possível concluir a reserva. Tente novamente.';
      setError(message);
      // O horário pode ter sido tomado nesse meio tempo: recarrega a grade.
      publicApi
        .get<Availability>(`/public/arenas/${slug}/availability`, { params: { courtId, date } })
        .then((res) => setAvailability(res.data));
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Arena não encontrada</h1>
          <p className="mt-1 text-sm text-gray-500">Confira o link com o responsável pela arena.</p>
        </div>
      </div>
    );
  }

  if (!arena) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Carregando...</div>;
  }

  if (confirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <CalendarCheck className="text-brand-700" size={24} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Horário reservado!</h1>
          <p className="mt-1 text-sm text-gray-500">{arena.name}</p>

          <dl className="mt-6 space-y-2 rounded-md bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Quadra</dt>
              <dd className="font-medium text-gray-900">{confirmation.courtName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Data</dt>
              <dd className="font-medium text-gray-900">
                {new Date(`${confirmation.date}T00:00:00`).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Horário</dt>
              <dd className="font-medium text-gray-900">
                {confirmation.startTime} ({formatDuration(confirmation.durationMinutes)})
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <dt className="text-gray-500">Valor da quadra</dt>
              <dd className="font-semibold text-brand-700">{formatBRL(confirmation.price)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-gray-500">
            Guarde estas informações — não enviamos confirmação por e-mail ou SMS. Em caso de imprevisto, avise a arena.
          </p>

          <button
            onClick={() => {
              setConfirmation(null);
              setPlayerName('');
              setPlayerPhone('');
              setStartTime(null);
            }}
            className="mt-6 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Fazer outra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">{arena.name}</h1>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
            <Clock size={14} />
            Aberto das {arena.bookingOpenTime} às {arena.bookingCloseTime}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin size={16} />
              Escolha a quadra
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {arena.courts.map((court) => (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => setCourtId(court.id)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    courtId === court.id
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900">{court.name}</p>
                  <p className="text-xs text-gray-500">a partir de {formatBRL(Number(court.hourlyRate))} / hora</p>
                </button>
              ))}
            </div>
            {arena.courts.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">Nenhuma quadra disponível para agendamento no momento.</p>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <p className="mt-4 text-sm font-medium text-gray-700">Horário de início</p>
            {loadingSlots ? (
              <p className="mt-2 text-sm text-gray-500">Carregando horários...</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => (
                  <button
                    key={slot.minutes}
                    type="button"
                    disabled={!slot.free}
                    onClick={() => setStartTime(slot.label)}
                    className={`rounded-md border py-2 text-sm transition-colors ${
                      startTime === slot.label
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : slot.free
                          ? 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50'
                          : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
            {!loadingSlots && slots.every((slot) => !slot.free) && slots.length > 0 && (
              <p className="mt-2 text-sm text-amber-700">Não há horários livres nesta data. Tente outro dia.</p>
            )}
          </section>

          {startTime && selectedCourt && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-700">Por quanto tempo?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableDurations.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setDurationMinutes(duration)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      durationMinutes === duration
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {formatDuration(duration)} · {formatBRL(priceFor(selectedCourt, duration))}
                  </button>
                ))}
              </div>
              {availableDurations.length === 0 && (
                <p className="mt-2 text-sm text-amber-700">
                  Não há tempo livre suficiente a partir desse horário. Escolha outro.
                </p>
              )}
            </section>
          )}

          {startTime && availableDurations.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-700">Seus dados</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    required
                    minLength={2}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Seu nome"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    required
                    minLength={8}
                    value={playerPhone}
                    onChange={(e) => setPlayerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {selectedCourt && (
                <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {selectedCourt.name} · {startTime} · {formatDuration(durationMinutes)}
                    </span>
                    <span className="font-semibold text-brand-700">
                      {formatBRL(priceFor(selectedCourt, durationMinutes))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Valor da quadra. O consumo de bebidas e comidas é acertado no local.
                  </p>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? 'Reservando...' : 'Confirmar reserva'}
              </button>
            </section>
          )}
        </form>
      </div>
    </div>
  );
}
