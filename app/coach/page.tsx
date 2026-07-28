"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { useAiCoach } from "../hooks/use-ai-coach";
import { useAthleteProfile } from "../hooks/use-athlete-profile";
import { supabase } from "../lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const quickQuestions = [
  "Hoje estou cansado. Como devo treinar?",
  "Tenho apenas 40 minutos hoje.",
  "Quero melhorar nas subidas.",
  "Analise meus últimos treinos.",
];

export default function CoachPage() {
  const router = useRouter();
  const profileQuery = useAthleteProfile();
  const generatePlan = useAiCoach();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const profile = profileQuery.data;
  const canUseCoach = Boolean(profile?.onboarding_completed);

  const athleteFirstName = useMemo(() => {
    const name = profile?.full_name?.trim();
    return name ? name.split(" ")[0] : "atleta";
  }, [profile?.full_name]);

  async function handleGenerate() {
    try {
      await generatePlan.mutateAsync();
      router.push("/training");
      router.refresh();
    } catch {
      // A mensagem é exibida na interface.
    }
  }

  async function sendMessage(text: string) {
    const normalized = text.trim();
    if (!normalized || isSending) return;

    setChatError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: normalized }];
    setMessages(nextMessages);
    setMessage("");
    setIsSending(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          message: normalized,
          history: messages.slice(-8),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.details ?? data?.error ?? "Não foi possível falar com o treinador.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer },
      ]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Erro ao consultar o treinador.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(message);
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <section className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <header className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/70 to-zinc-900 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950">
                  <Bot size={27} />
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Treinador Athlos AI
                </p>
                <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                  Olá, {athleteFirstName}. Vamos planejar seu próximo passo.
                </h1>
                <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
                  O treinador usa seu perfil, disponibilidade e histórico registrado para orientar o treino e montar sua semana.
                </p>
              </div>

              {canUseCoach && (
                <button
                  onClick={handleGenerate}
                  disabled={generatePlan.isPending}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatePlan.isPending ? <Loader2 className="animate-spin" /> : <CalendarDays />}
                  {generatePlan.isPending ? "Gerando..." : "Gerar semana"}
                </button>
              )}
            </div>

            {generatePlan.isError && (
              <div className="mt-5 rounded-2xl border border-red-800 bg-red-950/50 p-4 text-red-300">
                {generatePlan.error instanceof Error
                  ? generatePlan.error.message
                  : "Não foi possível gerar o plano."}
              </div>
            )}
          </header>

          {profileQuery.isLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
              <Loader2 className="animate-spin" /> Carregando seus dados...
            </div>
          ) : profileQuery.isError ? (
            <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 p-5 text-red-300">
              Não foi possível carregar seu perfil.
            </div>
          ) : !canUseCoach ? (
            <div className="mt-6 rounded-2xl border border-amber-700 bg-amber-950/40 p-6">
              <p className="font-semibold text-amber-300">Finalize seu perfil para liberar o treinador.</p>
              <Link
                href="/profile"
                className="mt-4 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-semibold text-zinc-950"
              >
                Completar perfil
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-5 py-4">
                  <h2 className="font-semibold">Conversa com o treinador</h2>
                  <p className="mt-1 text-sm text-zinc-400">Pergunte sobre o treino de hoje, recuperação ou ajustes da semana.</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-center">
                      <Bot className="mx-auto text-emerald-400" size={32} />
                      <p className="mt-3 font-semibold">O treinador está pronto.</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Escolha uma pergunta rápida ou escreva o que está acontecendo hoje.
                      </p>
                    </div>
                  )}

                  {messages.map((item, index) => (
                    <article
                      key={`${item.role}-${index}`}
                      className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {item.role === "assistant" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950">
                          <Bot size={19} />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                          item.role === "user"
                            ? "bg-emerald-500 text-zinc-950"
                            : "border border-zinc-700 bg-zinc-950 text-zinc-200"
                        }`}
                      >
                        {item.content}
                      </div>
                      {item.role === "user" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-700">
                          <UserRound size={19} />
                        </div>
                      )}
                    </article>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <Loader2 className="animate-spin text-emerald-400" size={20} />
                      Analisando seus dados...
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 p-4">
                  {chatError && (
                    <div className="mb-3 rounded-xl border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
                      {chatError}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void sendMessage(message);
                        }
                      }}
                      placeholder="Ex.: dormi mal e tenho 60 minutos. O que faço hoje?"
                      className="min-h-14 flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                      maxLength={2000}
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || isSending}
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Enviar mensagem"
                    >
                      {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </button>
                  </form>
                </div>
              </section>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                  <h2 className="font-semibold">Perguntas rápidas</h2>
                  <div className="mt-4 space-y-2">
                    {quickQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => void sendMessage(question)}
                        disabled={isSending}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-emerald-500 hover:text-white disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                <InfoCard
                  icon={<CheckCircle2 />}
                  title="Perfil analisado"
                  text="Objetivo, equipamentos, limitações e disponibilidade entram na resposta."
                />
                <InfoCard
                  icon={<Sparkles />}
                  title="Histórico considerado"
                  text="Os últimos treinos registrados ajudam a ajustar volume e intensidade."
                />
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="text-emerald-400">{icon}</div>
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
    </article>
  );
}
