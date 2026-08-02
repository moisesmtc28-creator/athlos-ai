"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bot, CalendarDays, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { useAiCoach } from "@/hooks/use-ai-coach";
import { useAthleteProfile } from "@/hooks/use-athlete-profile";
export default function CoachPage() {
  const router = useRouter();
  const profileQuery = useAthleteProfile();
  const generatePlan = useAiCoach();

  async function handleGenerate() {
    try {
      await generatePlan.mutateAsync();
      router.push("/training");
      router.refresh();
    } catch {
      // A mensagem é exibida abaixo.
    }
  }

  const profile = profileQuery.data;
  const canGenerate = Boolean(profile?.onboarding_completed);

  return (
    <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0">
      <Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/70 to-zinc-900 p-6 md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950">
              <Bot size={30} />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Coach IA</p>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">Seu próximo plano, criado com seus dados</h1>
            <p className="mt-4 max-w-3xl leading-7 text-zinc-300">
              O Athlos AI analisa seu perfil, disponibilidade, objetivos e histórico recente para montar uma semana segura e progressiva.
            </p>

            {profileQuery.isLoading ? (
              <div className="mt-8 flex items-center gap-3 text-zinc-400"><Loader2 className="animate-spin" /> Carregando perfil...</div>
            ) : profileQuery.isError ? (
              <div className="mt-8 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-red-300">Não foi possível carregar seu perfil.</div>
            ) : !canGenerate ? (
              <div className="mt-8 rounded-2xl border border-amber-700 bg-amber-950/40 p-5">
                <p className="font-semibold text-amber-300">Finalize seu perfil antes de gerar um plano.</p>
                <Link href="/profile" className="mt-4 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-semibold text-zinc-950">Completar perfil</Link>
              </div>
            ) : (
              <div className="mt-8">
                <button
                  onClick={handleGenerate}
                  disabled={generatePlan.isPending}
                  className="inline-flex items-center gap-3 rounded-xl bg-emerald-500 px-6 py-4 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatePlan.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {generatePlan.isPending ? "Criando seu plano..." : "Gerar plano da próxima semana"}
                </button>
              </div>
            )}

            {generatePlan.isError && (
              <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/50 p-5 text-red-300">
                {generatePlan.error instanceof Error ? generatePlan.error.message : "Não foi possível gerar o plano."}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Info icon={<CheckCircle2 />} title="Perfil analisado" text="Nível, peso, objetivo, limitações e equipamentos." />
            <Info icon={<CalendarDays />} title="Agenda respeitada" text="Os treinos usam apenas os dias e tempos disponíveis." />
            <Info icon={<Sparkles />} title="Progressão inteligente" text="O histórico ajuda a evitar aumentos bruscos de carga." />
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="text-emerald-400">{icon}</div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></article>;
}
