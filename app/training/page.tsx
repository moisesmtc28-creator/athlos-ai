"use client";

import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

import { useTrainings } from "@/hooks/use-trainings";
import type { Training, TrainingStatus, TrainingZone } from "@/types/training";

export default function TrainingPage() {
  const {
    data: trainings = [],
    isLoading,
    isError,
    error,
  } = useTrainings();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando treinos...
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
        <p className="text-lg font-medium text-red-400">
          Não foi possível carregar os treinos.
        </p>
        {error instanceof Error && (
          <p className="max-w-lg text-sm text-slate-400">{error.message}</p>
        )}
      </main>
    );
  }

  const orderedTrainings = [...trainings].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const { start: nextWeekStart, end: nextWeekEnd } = getNextWeekRange();
  const nextWeekTrainings = orderedTrainings.filter(
    (training) =>
      training.date >= nextWeekStart && training.date <= nextWeekEnd,
  );
  const otherTrainings = orderedTrainings.filter(
    (training) =>
      training.date < nextWeekStart || training.date > nextWeekEnd,
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-24 pt-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              ATHLOS AI
            </p>
            <h1 className="mt-2 text-3xl font-bold">Meus treinos</h1>
            <p className="mt-2 text-slate-400">
              Veja primeiro a próxima semana e depois consulte seu histórico.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/calendar"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-500/50"
            >
              <CalendarDays size={19} /> Calendário
            </Link>
            <Link
              href="/coach"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Sparkles size={19} /> Gerar próxima semana
            </Link>
          </div>
        </header>

        {trainings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Próxima semana
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {formatPeriod(nextWeekStart, nextWeekEnd)}
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                  {nextWeekTrainings.length} treino(s)
                </span>
              </div>

              {nextWeekTrainings.length === 0 ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
                  <h3 className="font-bold text-amber-200">
                    Ainda não existe plano para a próxima semana
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-100/70">
                    Gere o novo plano no Coach IA. Depois os treinos aparecerão aqui e no calendário.
                  </p>
                  <Link
                    href="/coach"
                    className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-bold text-zinc-950"
                  >
                    Gerar plano agora
                  </Link>
                </div>
              ) : (
                <TrainingGrid trainings={nextWeekTrainings} highlight />
              )}
            </section>

            {otherTrainings.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Histórico e outros treinos</h2>
                <TrainingGrid trainings={otherTrainings} />
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function TrainingGrid({
  trainings,
  highlight = false,
}: {
  trainings: Training[];
  highlight?: boolean;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {trainings.map((training) => (
        <Link
          key={training.id}
          href={`/training/${training.id}`}
          className={`group rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-xl ${
            highlight
              ? "border-emerald-500/30 bg-emerald-950/25 hover:border-emerald-400/70 hover:shadow-emerald-950/30"
              : "border-slate-800 bg-slate-900 hover:border-cyan-500/60 hover:shadow-cyan-950/20"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{formatDate(training.date)}</p>
              <h3 className="mt-2 text-xl font-semibold text-white transition group-hover:text-cyan-300">
                {training.title}
              </h3>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                training.status,
              )}`}
            >
              {getStatusLabel(training.status)}
            </span>
          </div>

          <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-400">
            {training.description || "Treino sem descrição."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950 p-3">
              <p className="text-xs text-slate-500">Duração</p>
              <p className="mt-1 font-semibold">{training.duration} min</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <p className="text-xs text-slate-500">Intensidade</p>
              <p className="mt-1 font-semibold text-cyan-300">
                {getZoneLabel(training.zone)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end text-sm font-medium text-cyan-400">
            Abrir treino →
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
      <h2 className="text-xl font-semibold">Nenhum treino encontrado</h2>
      <p className="mt-2 text-slate-400">
        Gere um plano para adicionar treinos ao calendário.
      </p>
      <Link
        href="/coach"
        className="mt-6 inline-flex rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        Criar primeiro plano
      </Link>
    </section>
  );
}

function getNextWeekRange() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const day = today.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + daysUntilMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPeriod(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${formatter.format(new Date(`${start}T12:00:00`))} a ${formatter.format(
    new Date(`${end}T12:00:00`),
  )}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getZoneLabel(zone: TrainingZone) {
  const labels: Record<TrainingZone, string> = {
    Z1: "Z1 — Recuperação",
    Z2: "Z2 — Endurance",
    Z3: "Z3 — Ritmo",
    Z4: "Z4 — Limiar",
    Z5: "Z5 — VO₂ máximo",
    Z6: "Z6 — Potência",
  };

  return labels[zone];
}

function getStatusLabel(status: TrainingStatus) {
  const labels: Record<TrainingStatus, string> = {
    planned: "Planejado",
    in_progress: "Em andamento",
    completed: "Concluído",
    missed: "Não realizado",
    cancelled: "Cancelado",
  };

  return labels[status];
}

function getStatusClasses(status: TrainingStatus) {
  const classes: Record<TrainingStatus, string> = {
    planned: "border-blue-800 bg-blue-950/50 text-blue-300",
    in_progress: "border-amber-800 bg-amber-950/50 text-amber-300",
    completed: "border-emerald-800 bg-emerald-950/50 text-emerald-300",
    missed: "border-red-800 bg-red-950/50 text-red-300",
    cancelled: "border-slate-700 bg-slate-800 text-slate-300",
  };

  return classes[status];
}
