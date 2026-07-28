"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6 || password !== confirm) {
      setMessage("Use pelo menos 6 caracteres e confirme a mesma senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setMessage(error.message);
    else router.replace("/login");
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8"><h1 className="text-3xl font-bold">Nova senha</h1><input type="password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /><input type="password" placeholder="Confirmar senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />{message && <p className="mt-4 text-sm text-red-300">{message}</p>}<button disabled={loading} className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">{loading ? "Salvando..." : "Salvar nova senha"}</button></form></main>;
}
