"use client";

import Link from "next/link";
import { Dumbbell, Loader2 } from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import BackButton from "../components/layout/BackButton";
import { useAthleteProfile } from "@/hooks/use-athlete-profile";
import { useTrainings } from "@/hooks/use-trainings";

export default function GymPage() {
  const { data: profile, isLoading } = useAthleteProfile();
  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();
  const days = profile?.gym_days ?? [];
  const strengthTrainings = trainings
    .filter((training) => training.title.startsWith("Musculação —"))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0">
      <Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8">
        <div className="mx-auto max-w-5xl">
      <BackButton />
          <h1 className="text-3xl font-bold">Academia</h1>
          <p className="mt-2 text-zinc-400">
            A IA integra musculação e ciclismo para distribuir melhor a carga da semana.
          </p>

          {isLoading ? (
            <p className="mt-8">Carregando...</p>
          ) : !profile?.does_strength_training ? (
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
              <h2 className="text-xl font-semibold">Musculação não ativada</h2>
              <p className="mt-2 text-zinc-400">
                Ative essa opção no Perfil para a IA incluir musculação no plano semanal.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <Metric
                  title="Dias por semana"
                  value={String(profile.strength_days_per_week ?? days.length)}
                />
                <Metric title="Dias cadastrados" value={String(days.length)} />
                <Metric title="Treinos IA" value={String(strengthTrainings.length)} />
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-zinc-900 p-6">
                <div className="flex items-center gap-3">
                  <Dumbbell className="text-emerald-400" />
                  <div>
                    <h2 className="text-xl font-semibold">Treinos de musculação criados pela IA</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      A geração semanal considera seus dias de academia e evita conflito com pedais intensos.
                    </p>
                  </div>
                </div>

                {trainingsLoading ? (
                  <div className="mt-6 flex items-center gap-2 text-zinc-400">
                    <Loader2 className="animate-spin" size={18} /> Carregando treinos...
                  </div>
                ) : strengthTrainings.length === 0 ? (
                  <div className="mt-6 rounded-xl bg-zinc-950 p-5 text-sm text-zinc-400">
                    Ainda não há musculação gerada pela IA. Use o botão de geração em
                    Meus treinos para criar o plano da semana.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {strengthTrainings.map((training) => (
                      <Link
                        key={training.id}
                        href={`/training/${training.id}`}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-emerald-500/50"
                      >
                        <p className="text-xs text-emerald-400">
                          {formatDate(training.date)} · {training.duration} min
                        </p>
                        <h3 className="mt-2 font-semibold">{training.title}</h3>
                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                          {training.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-emerald-400">{value}</p>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00`));
}
