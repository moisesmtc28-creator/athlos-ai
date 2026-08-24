"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAiCoach } from "@/hooks/use-ai-coach";
import { useTrainings } from "@/hooks/use-trainings";
import {
  closeTrainingWeek,
  resetTrainings,
} from "@/services/training.service";
import type {
  Training,
  TrainingStatus,
  TrainingZone,
} from "@/types/training";

export default function TrainingPage() {
  const queryClient = useQueryClient();
  const generatePlan = useAiCoach();

  const {
    data: trainings = [],
    isLoading,
    isError,
    error,
  } = useTrainings();

  const [isClosingWeek, setIsClosingWeek] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

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

  const orderedTrainings = [...trainings].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const currentWeek = getCurrentWeekRange();
  const nextWeek = getNextWeekRange();

  const currentWeekTrainings = orderedTrainings.filter(
    (training) =>
      training.date >= currentWeek.start &&
      training.date <= currentWeek.end,
  );

  const nextWeekTrainings = orderedTrainings.filter(
    (training) =>
      training.date >= nextWeek.start &&
      training.date <= nextWeek.end,
  );

  const historyTrainings = orderedTrainings.filter(
    (training) => training.date < currentWeek.start,
  );

  const futureTrainings = orderedTrainings.filter(
    (training) => training.date > nextWeek.end,
  );

  const pendingCurrentWeek = currentWeekTrainings.filter(
    (training) =>
      training.status === "planned" ||
      training.status === "in_progress",
  );

  const finalizedCurrentWeek = currentWeekTrainings.filter(
    (training) =>
      training.status === "completed" ||
      training.status === "missed" ||
      training.status === "cancelled",
  );

  const weekIsClosed =
    currentWeekTrainings.length > 0 &&
    pendingCurrentWeek.length === 0;

  const canGenerateNextWeek =
    weekIsClosed && nextWeekTrainings.length === 0;

  async function handleCloseWeek() {
    setActionMessage("");
    setActionError("");

    if (currentWeekTrainings.length === 0) {
      setActionError(
        "Não existem treinos cadastrados na semana atual.",
      );
      return;
    }

    const confirmed = window.confirm(
      pendingCurrentWeek.length > 0
        ? `Existem ${pendingCurrentWeek.length} treino(s) ainda não finalizado(s). Ao fechar a semana, eles serão marcados como não realizados. Deseja continuar?`
        : "Deseja fechar esta semana?",
    );

    if (!confirmed) return;

    setIsClosingWeek(true);

    try {
      const result = await closeTrainingWeek(
        currentWeek.start,
        currentWeek.end,
      );

      await queryClient.invalidateQueries({
        queryKey: ["trainings"],
      });

      setActionMessage(
        result.updatedCount > 0
          ? `Semana fechada. ${result.updatedCount} treino(s) pendente(s) foram marcados como não realizados.`
          : "Semana fechada com sucesso.",
      );
    } catch (closeError) {
      setActionError(
        closeError instanceof Error
          ? closeError.message
          : "Não foi possível fechar a semana.",
      );
    } finally {
      setIsClosingWeek(false);
    }
  }

  async function handleResetAndGenerateCurrentWeek() {
    setActionMessage("");
    setActionError("");

    const confirmed = window.confirm(
      "Esta ação vai fechar treinos antigos pendentes, apagar os treinos da semana atual e futuros e criar um novo plano para ESTA semana. O histórico anterior será preservado. Deseja continuar?",
    );

    if (!confirmed) return;

    setIsResetting(true);

    try {
      await resetTrainings();
      await generatePlan.mutateAsync("current");

      await queryClient.invalidateQueries({
        queryKey: ["trainings"],
      });

      setActionMessage(
        "Treinos zerados e novo plano desta semana criado com sucesso.",
      );
    } catch (resetError) {
      setActionError(
        resetError instanceof Error
          ? resetError.message
          : "Não foi possível zerar e recriar esta semana.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  async function handleGenerateNextWeek() {
    setActionMessage("");
    setActionError("");

    if (!weekIsClosed) {
      setActionError(
        "Feche a semana atual antes de gerar a próxima.",
      );
      return;
    }

    try {
      await generatePlan.mutateAsync("next");

      await queryClient.invalidateQueries({
        queryKey: ["trainings"],
      });

      setActionMessage(
        "Plano da próxima semana gerado com sucesso.",
      );
    } catch (generateError) {
      setActionError(
        generateError instanceof Error
          ? generateError.message
          : "Não foi possível gerar a próxima semana.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-6 text-white sm:px-6 lg:px-10">
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
              Finalize a semana atual e gere o plano da próxima
              semana.
            </p>
          </div>

          <Link
            href="/calendar"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-500/50"
          >
            <CalendarDays size={19} />
            Calendário
          </Link>
        </header>

        {(actionMessage || actionError) && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${
              actionError
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {actionError || actionMessage}
          </div>
        )}

        <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Semana atual
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {formatPeriod(
                  currentWeek.start,
                  currentWeek.end,
                )}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {currentWeekTrainings.length} treino(s):{" "}
                {finalizedCurrentWeek.length} finalizado(s) e{" "}
                {pendingCurrentWeek.length} pendente(s).
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => void handleResetAndGenerateCurrentWeek()}
                disabled={isResetting || generatePlan.isPending}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResetting ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <RotateCcw size={19} />
                )}
                {isResetting ? "Recriando..." : "Zerar e criar esta semana"}
              </button>

              {weekIsClosed ? (
                <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 font-semibold text-emerald-300">
                  <CheckCircle2 size={19} />
                  Semana fechada
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleCloseWeek()}
                  disabled={
                    isClosingWeek ||
                    currentWeekTrainings.length === 0
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isClosingWeek ? (
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <LockKeyhole size={19} />
                  )}

                  {isClosingWeek
                    ? "Fechando..."
                    : "Fechar semana"}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  void handleGenerateNextWeek()
                }
                disabled={
                  !canGenerateNextWeek ||
                  generatePlan.isPending
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatePlan.isPending ? (
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles size={19} />
                )}

                {generatePlan.isPending
                  ? "Gerando..."
                  : nextWeekTrainings.length > 0
                    ? "Próxima semana criada"
                    : "Gerar próxima semana"}
              </button>
            </div>
          </div>

          {!weekIsClosed &&
            currentWeekTrainings.length > 0 && (
              <p className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-400">
                Antes de gerar a próxima semana, conclua os
                treinos restantes ou clique em{" "}
                <strong className="text-amber-300">
                  Fechar semana
                </strong>
                . Os treinos pendentes serão marcados como não
                realizados.
              </p>
            )}
        </section>

        {trainings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                    Esta semana
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {formatPeriod(
                      currentWeek.start,
                      currentWeek.end,
                    )}
                  </h2>
                </div>

                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
                  {currentWeekTrainings.length} treino(s)
                </span>
              </div>

              {currentWeekTrainings.length === 0 ? (
                <EmptyPeriod text="Nenhum treino nesta semana." />
              ) : (
                <TrainingGrid
                  trainings={currentWeekTrainings}
                />
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Próxima semana
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {formatPeriod(
                      nextWeek.start,
                      nextWeek.end,
                    )}
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
                    Feche a semana atual e use o botão{" "}
                    <strong>Gerar próxima semana</strong>.
                  </p>
                </div>
              ) : (
                <TrainingGrid
                  trainings={nextWeekTrainings}
                  highlight
                />
              )}
            </section>

            {historyTrainings.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">
                  Histórico
                </h2>

                <TrainingGrid
                  trainings={[...historyTrainings].reverse()}
                />
              </section>
            )}

            {futureTrainings.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">
                  Outros treinos futuros
                </h2>

                <TrainingGrid trainings={futureTrainings} />
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
              <p className="text-sm text-slate-500">
                {formatDate(training.date)}
              </p>

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
    </div>
  );
}

function EmptyPeriod({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-8 text-center text-slate-400">
      {text}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
      <h2 className="text-xl font-semibold">
        Nenhum treino encontrado
      </h2>

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

function getCurrentWeekRange() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const day = today.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  const start = new Date(today);
  start.setDate(today.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
}

function getNextWeekRange() {
  const current = getCurrentWeekRange();
  const currentStart = new Date(
    `${current.start}T12:00:00`,
  );

  const start = new Date(currentStart);
  start.setDate(currentStart.getDate() + 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPeriod(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${formatter.format(
    new Date(`${start}T12:00:00`),
  )} a ${formatter.format(
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
