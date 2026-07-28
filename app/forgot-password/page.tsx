"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setMessage(error ? error.message : "Enviamos um link de redefinição para seu e-mail.");
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8"><h1 className="text-3xl font-bold">Recuperar senha</h1><p className="mt-2 text-slate-400">Informe seu e-mail cadastrado.</p><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-500" />{message && <p className="mt-4 rounded-xl bg-slate-950 p-3 text-sm text-slate-300">{message}</p>}<button disabled={loading} className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">{loading ? "Enviando..." : "Enviar link"}</button><Link href="/login" className="mt-5 block text-center text-sm text-emerald-400">Voltar ao login</Link></form></main>;
}
