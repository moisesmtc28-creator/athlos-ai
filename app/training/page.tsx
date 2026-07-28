"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Clock3,
  Plus,
} from "lucide-react";

import Sidebar from "@/app/components/layout/Sidebar";
import { useTrainings } from "@/app/hooks/use-trainings";

import type {
  TrainingStatus,
  TrainingZone,
} from "@/app/types/training";

export default function TrainingPage() {
  const {
    data: trainings,
    isLoading,
    isError,
    error,
  } = useTrainings();

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              <ArrowLeft size={18} />
              Voltar ao início
            </Link>

            <Link
              href="/coach"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950 lg:hidden"
            >
              <Bot size={18} />
              Coach IA
            </Link>
          </div>

          <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                ATHLOS AI
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Meus treinos
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400">
                Acompanhe seus treinos planejados, consulte os detalhes e
                registre sua evolução.
              </p>
            </div>

            <Link
              href="/coach"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Plus size={19} />
              Criar treinos
            </Link>
          </header>

          {isLoading && <LoadingState />}

          {isError && (
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : "Ocorreu um erro inesperado."
              }
            />
          )}

          {!isLoading &&
            !isError &&
            (!trainings || trainings.length === 0) && (
              <EmptyState />
            )}

          {!isLoading &&
            !isError &&
            trainings &&
            trainings.length > 0 && (
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {trainings.map((training) => (
                  <Link
                    key={training.id}
                    href={`/training/${training.id}`}
                    className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={16} />
                          {formatDate(training.date)}
                        </p>

                        <h2 className="mt-3 line-clamp-2 text-xl font-semibold text-white transition group-hover:text-cyan-300">
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
                      {training.description || "Treino sem descrição."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock3 size={14} />
                          Duração
                        </p>

                        <p className="mt-2 font-semibold">
                          {training.duration} min
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="text-xs text-slate-500">
                          Intensidade
                        </p>

                        <p className="mt-2 font-semibold text-cyan-300">
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
    </div>
  );
}

function LoadingState() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

      <p className="mt-4 text-slate-300">
        Carregando seus treinos...
      </p>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-8 text-center">
      <h2 className="text-xl font-semibold text-red-300">
        Não foi possível carregar os treinos
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        {message}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
        >
          Tentar novamente
        </button>

        <Link
          href="/"
          className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
        <Bot size={32} />
      </div>

      <h2 className="mt-5 text-xl font-semibold">
        Nenhum treino encontrado
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-slate-400">
        Converse com o Coach IA para gerar seu primeiro plano e adicionar
        os treinos ao calendário.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/coach"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={19} />
          Criar primeiro treino
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
        >
          <ArrowLeft size={18} />
          Voltar ao início
        </Link>
      </div>
    </section>
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