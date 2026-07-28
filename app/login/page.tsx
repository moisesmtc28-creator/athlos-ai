"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isCheckingSession, setIsCheckingSession] =
    useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/profile");
          return;
        }
      } catch (error) {
        console.error(
          "Erro ao verificar sessão:",
          error,
        );
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, [router]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

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
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error(
          "Não foi possível criar a sessão do usuário.",
        );
      }

      setMessage("Login realizado com sucesso!");
      setMessageType("success");

      router.replace("/profile");
      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível entrar.";

      if (
        errorMessage
          .toLowerCase()
          .includes("invalid login credentials")
      ) {
        setMessage("E-mail ou senha incorretos.");
      } else if (
        errorMessage
          .toLowerCase()
          .includes("email not confirmed")
      ) {
        setMessage(
          "Confirme seu e-mail antes de entrar.",
        );
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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

          <p className="mt-4 text-sm text-slate-400">
            Verificando sessão...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="absolute bottom-[-100px] right-[-100px] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-3xl font-black text-slate-950 shadow-lg shadow-emerald-500/20">
            A
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Athlos AI
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Bem-vindo
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Entre para acessar seus treinos e seu
            perfil de atleta.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur md:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                disabled={isLoading}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Senha
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:text-emerald-400 disabled:cursor-not-allowed"
                >
                  {showPassword
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div
              role="alert"
              className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            Use o e-mail e a senha cadastrados no
            Supabase.
          </p>
        </form>
      </div>
    </main>
  );
}