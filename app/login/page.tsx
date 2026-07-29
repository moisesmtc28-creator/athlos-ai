"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "../lib/supabase";
import { getAuthenticatedDestination } from "../lib/auth-navigation";

type MessageType = "success" | "error" | "";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");

  useEffect(() => {
    async function initializePage() {
      try {
        const confirmed = searchParams.get("confirmed");

        if (confirmed === "1") {
          setMessage("E-mail confirmado. Agora você já pode entrar.");
          setMessageType("success");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const destination = await getAuthenticatedDestination();
          router.replace(destination);
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setIsCheckingSession(false);
      }
    }

    void initializePage();
  }, [router, searchParams]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Informe seu e-mail.");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Informe sua senha.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error("Não foi possível iniciar sua sessão.");
      }

      setMessage("Login realizado com sucesso.");
      setMessageType("success");

      const destination = await getAuthenticatedDestination();

      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sua conta.";

      const normalizedMessage = errorMessage.toLowerCase();

      if (normalizedMessage.includes("invalid login credentials")) {
        setMessage("E-mail ou senha incorretos.");
      } else if (normalizedMessage.includes("email not confirmed")) {
        setMessage("Confirme seu e-mail antes de entrar.");
      } else if (normalizedMessage.includes("too many requests")) {
        setMessage("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else {
        setMessage(errorMessage);
      }

      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-400" />

          <p className="mt-4 text-sm text-zinc-400">
            Verificando sua sessão...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_40%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-14 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-black text-zinc-950">
                A
              </div>

              <div>
                <p className="text-sm font-bold text-white">Athlos AI</p>
                <p className="text-xs text-emerald-300">
                  Seu treinador inteligente
                </p>
              </div>
            </div>

            <h1 className="mt-8 text-5xl font-black leading-tight">
              Treinos melhores.
              <span className="block text-emerald-400">
                Evolução consistente.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-400">
              Organize seus treinos, acompanhe sua evolução e receba
              orientações personalizadas para ciclismo, academia e recuperação.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["Treinos", "Planejamento semanal"],
                ["Coach IA", "Orientação personalizada"],
                ["Evolução", "Indicadores em um só lugar"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full max-w-md">
          <div className="mb-7 text-center lg:text-left">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-3xl font-black text-zinc-950 shadow-lg shadow-emerald-500/20 lg:mx-0">
              A
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
              Athlos AI
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Bem-vindo de volta
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Entre para acessar seus treinos e seu perfil de atleta.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 shadow-2xl backdrop-blur sm:p-7"
          >
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  E-mail
                </label>

                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={19}
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    inputMode="email"
                    disabled={isLoading}
                    required
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-zinc-300"
                  >
                    Senha
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                  >
                    Esqueci minha senha
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={19}
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 py-3.5 pl-12 pr-14 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-emerald-400 disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
            </div>

            {message && (
              <div
                role="alert"
                aria-live="polite"
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  messageType === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-zinc-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Ainda não possui conta?{" "}
              <Link
                href="/register"
                className="font-bold text-emerald-400 transition hover:text-emerald-300"
              >
                Criar conta
              </Link>
            </p>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-600">
            Athlos AI • Treinamento inteligente para ciclistas
          </p>
        </section>
      </div>
    </main>
  );
}
