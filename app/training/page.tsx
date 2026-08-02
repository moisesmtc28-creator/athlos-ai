"use client";

import Link from "next/link";

import { useTrainings } from "@/hooks/use-trainings";
import type {
  TrainingStatus,
  TrainingZone,
} from "@/types/training";

export default function TrainingPage() {
  const {
    data: trainings,
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
          <p className="max-w-lg text-sm text-slate-400">
            {error.message}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-24 pt-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              ATHLOS AI
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Meus treinos
            </h1>

            <p className="mt-2 text-slate-400">
              Acompanhe seus treinos planejados e registre seus resultados.
            </p>
          </div>

          <Link
            href="/coach"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            ➕ Criar Treinos
          </Link>

        </header>

        {!trainings || trainings.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              Nenhum treino encontrado
            </h2>

            <p className="mt-2 text-slate-400">
              Gere um novo plano para adicionar treinos ao calendário.
            </p>

            <div className="mt-6">
              <Link
                href="/coach"
                className="inline-flex rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Criar Primeiro Treino
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trainings.map((training) => (
              <Link
                key={training.id}
                href={`/training/${training.id}`}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500/60 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-cyan-950/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {formatDate(training.date)}
                    </p>

                    <h2 className="mt-2 text-xl font-semibold text-white transition group-hover:text-cyan-300">
                      {training.title}
                    </h2>
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
                  {training.description ||
                    "Treino sem descrição."}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">
                      Duração
                    </p>

                    <p className="mt-1 font-semibold">
                      {training.duration} min
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">
                      Intensidade
                    </p>

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
          </section>
        )}
      </div>
    </main>
  );
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
    planned:
      "border-blue-800 bg-blue-950/50 text-blue-300",
    in_progress:
      "border-amber-800 bg-amber-950/50 text-amber-300",
    completed:
      "border-emerald-800 bg-emerald-950/50 text-emerald-300",
    missed:
      "border-red-800 bg-red-950/50 text-red-300",
    cancelled:
      "border-slate-700 bg-slate-800 text-slate-300",
  };

  return classes[status];
}