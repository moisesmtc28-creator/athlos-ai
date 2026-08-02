"use client";

import Link from "next/link";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, type ReactNode } from "react";

import Sidebar from "../components/layout/Sidebar";
import { supabase } from "../lib/supabase";
import { useAiCoach } from "@/hooks/use-ai-coach";
import { useAthleteProfile } from "@/hooks/use-athlete-profile";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function CoachPage() {
  const router = useRouter();
  const profileQuery = useAthleteProfile();
  const generatePlan = useAiCoach();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou seu treinador do Athlos AI. Pergunte sobre o treino de hoje, recuperação, zonas de frequência cardíaca ou organização da próxima semana.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const profile = profileQuery.data;
  const canGenerate = Boolean(profile?.onboarding_completed);

  const recentHistory = useMemo(
    () => messages.slice(-8),
    [messages],
  );

  async function handleGenerate() {
    try {
      await generatePlan.mutateAsync();
      router.push("/training");
      router.refresh();
    } catch {
      // A mensagem é exibida na própria página.
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || sending) return;

    setChatError("");
    setSending(true);
    setInput("");
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          history: recentHistory,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { answer?: string; error?: string; details?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.details ?? data?.error ?? "Não foi possível falar com o treinador.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data?.answer ?? "Não recebi uma resposta válida.",
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar sua mensagem.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0">
      <Sidebar />

      <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/70 to-zinc-900 p-6 md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950">
              <Bot size={30} />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Coach IA
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-5xl">
              Converse com seu treinador
            </h1>

            <p className="mt-4 max-w-3xl leading-7 text-zinc-300">
              Tire dúvidas sobre seus treinos e gere o plano da próxima semana usando seus dados reais.
            </p>

            <div className="mt-7 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
              <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                        message.role === "user"
                          ? "bg-emerald-500 font-medium text-zinc-950"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-200"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                      <Loader2 size={17} className="animate-spin" />
                      Analisando seus dados...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ex.: Terminei a semana. Como devo começar a próxima?"
                  rows={2}
                  disabled={sending}
                  className="min-h-14 flex-1 resize-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500"
                />

                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Enviar mensagem"
                  className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? <Loader2 className="animate-spin" /> : <Send />}
                </button>
              </form>

              {chatError && (
                <div className="mt-4 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
                  {chatError}
                </div>
              )}
            </div>

            {profileQuery.isLoading ? (
              <div className="mt-8 flex items-center gap-3 text-zinc-400">
                <Loader2 className="animate-spin" /> Carregando perfil...
              </div>
            ) : profileQuery.isError ? (
              <div className="mt-8 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-red-300">
                Não foi possível carregar seu perfil.
              </div>
            ) : !canGenerate ? (
              <div className="mt-8 rounded-2xl border border-amber-700 bg-amber-950/40 p-5">
                <p className="font-semibold text-amber-300">
                  Finalize seu perfil antes de gerar um plano.
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-semibold text-zinc-950"
                >
                  Completar perfil
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <button
                  onClick={handleGenerate}
                  disabled={generatePlan.isPending}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-500 px-6 py-4 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {generatePlan.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  {generatePlan.isPending
                    ? "Criando seu plano..."
                    : "Gerar plano da próxima semana"}
                </button>
              </div>
            )}

            {generatePlan.isError && (
              <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/50 p-5 text-red-300">
                {generatePlan.error instanceof Error
                  ? generatePlan.error.message
                  : "Não foi possível gerar o plano."}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Info
              icon={<CheckCircle2 />}
              title="Perfil analisado"
              text="Nível, peso, objetivo, limitações e equipamentos."
            />
            <Info
              icon={<CalendarDays />}
              title="Agenda respeitada"
              text="Os treinos usam apenas os dias e tempos disponíveis."
            />
            <Info
              icon={<Sparkles />}
              title="Progressão inteligente"
              text="O histórico ajuda a evitar aumentos bruscos de carga."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="text-emerald-400">{icon}</div>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
    </article>
  );
}
