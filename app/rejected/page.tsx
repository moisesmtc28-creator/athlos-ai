"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RejectedPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-5xl">
          ❌
        </div>

        <h1 className="mt-6 text-3xl font-bold">
          Cadastro não aprovado
        </h1>

        <p className="mt-4 leading-7 text-slate-400">
          Seu cadastro não foi aprovado pelo administrador.
        </p>

        <p className="mt-2 leading-7 text-slate-400">
          Entre em contato com o responsável pelo Athlos AI para mais informações.
        </p>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-red-500 font-bold text-white transition hover:bg-red-400"
        >
          Sair
        </button>
      </div>
    </main>
  );
}