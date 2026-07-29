"use client";

import Link from "next/link";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";
import { getAuthenticatedDestination } from "../lib/auth-navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (session) {
          const destination =
            await getAuthenticatedDestination();

          router.replace(destination);
          return;
        }
      } catch (error) {
        console.error(
          "Erro ao verificar sessão:",
          error,
        );
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const normalizedName = name.trim();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (normalizedName.length < 3) {
      setMessage(
        "Informe seu nome completo.",
      );
      setMessageType("error");
      return;
    }

    if (!normalizedEmail) {
      setMessage("Informe seu e-mail.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage(
        "A senha deve ter pelo menos 6 caracteres.",
      );
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "As senhas não são iguais.",
      );
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: normalizedName,
            },
            emailRedirectTo:
              `${window.location.origin}/login?confirmed=1`,
          },
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Não foi possível criar o usuário.",
        );
      }

      /*
       * Quando a confirmação de e-mail estiver desativada
       * no Supabase, o cadastro já retorna uma sessão.
       * Nesse caso, criamos o perfil imediatamente.
       */
      if (data.session) {
        const { error: profileError } =
          await supabase
            .from("athlete_profiles")
            .upsert(
              {
                user_id: data.user.id,
                full_name: normalizedName,
                onboarding_completed: false,
              },
              {
                onConflict: "user_id",
              },
            );

        if (profileError) {
          console.error(
            "Erro ao criar perfil:",
            profileError,
          );
        }

        router.replace("/profile");
        router.refresh();
        return;
      }

      setMessage(
        "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.",
      );

      setMessageType("success");

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(
        "Erro ao criar conta:",
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta.";

      const normalizedError =
        errorMessage.toLowerCase();

      if (
        normalizedError.includes(
          "user already registered",
        ) ||
        normalizedError.includes(
          "already been registered",
        )
      ) {
        setMessage(
          "Este e-mail já possui uma conta.",
        );
      } else if (
        normalizedError.includes(
          "invalid email",
        )
      ) {
        setMessage(
          "Informe um endereço de e-mail válido.",
        );
      } else if (
        normalizedError.includes(
          "password should be",
        )
      ) {
        setMessage(
          "A senha deve ter pelo menos 6 caracteres.",
        );
      } else if (
        normalizedError.includes(
          "signup is disabled",
        )
      ) {
        setMessage(
          "A criação de novas contas está desativada no Supabase.",
        );
      } else {
        setMessage(errorMessage);
      }

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white sm:flex sm:items-center sm:justify-center sm:py-12">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <header className="mb-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-3xl font-black text-slate-950 shadow-lg shadow-emerald-500/20">
            A
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Athlos AI
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Crie sua conta
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Cadastre-se para organizar seus treinos,
            acompanhar sua evolução e usar o treinador
            inteligente.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur sm:p-7"
        >
          <div className="space-y-5">
            <Field
              label="Nome completo"
              htmlFor="name"
            >
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Digite seu nome"
                autoComplete="name"
                disabled={loading}
                required
                className={inputClass}
              />
            </Field>

            <Field
              label="E-mail"
              htmlFor="email"
            >
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                required
                className={inputClass}
              />
            </Field>

            <Field
              label="Senha"
              htmlFor="password"
            >
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
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                  required
                  className={`${inputClass} pr-20`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showPassword
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </Field>

            <Field
              label="Confirmar senha"
              htmlFor="confirm-password"
            >
              <div className="relative">
                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                  required
                  className={`${inputClass} pr-20`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar confirmação de senha"
                      : "Mostrar confirmação de senha"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showConfirmPassword
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </Field>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Ao criar sua conta, você poderá preencher
            seus dados de atleta e receber treinos
            personalizados.
          </p>

          {message && (
            <div
              role="alert"
              aria-live="polite"
              className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-6 ${
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
            disabled={loading}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                Criando conta...
              </>
            ) : (
              "Criar conta"
            )}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

type FieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function Field({
  label,
  htmlFor,
  children,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      {children}
    </div>
  );
}
