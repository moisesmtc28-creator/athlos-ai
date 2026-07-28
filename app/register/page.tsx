"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!name.trim()) {
      setMessage("Informe seu nome.");
      setIsError(true);
      return;
    }
    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      setIsError(true);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("As senhas não são iguais.");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });

      if (error) throw error;

      if (data.session) {
        await supabase.from("athlete_profiles").upsert(
          {
            user_id: data.user?.id,
            full_name: name.trim(),
            onboarding_completed: false,
          },
          { onConflict: "user_id" },
        );
        router.replace("/profile");
        return;
      }

      setMessage("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Athlos AI</p>
        <h1 className="mt-2 text-3xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm text-slate-400">Cadastre-se para criar seus planos de treino.</p>

        <div className="mt-6 space-y-4">
          <Field label="Nome completo"><input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={inputClass} /></Field>
          <Field label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} /></Field>
          <Field label="Senha"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className={inputClass} /></Field>
          <Field label="Confirmar senha"><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={inputClass} /></Field>
        </div>

        {message && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>{message}</div>}

        <button disabled={loading} className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
        <p className="mt-6 text-center text-sm text-slate-500">Já possui conta? <Link href="/login" className="font-semibold text-emerald-400">Entrar</Link></p>
      </form>
    </main>
  );
}

const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm text-slate-300">{label}</span>{children}</label>;
}
