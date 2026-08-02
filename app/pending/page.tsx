"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function PendingPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-amber-500/20 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-5xl">
          ⏳
        </div>

        <h1 className="mt-6 text-3xl font-bold">
          Cadastro recebido!
        </h1>

        <p className="mt-4 leading-7 text-slate-400">
          Seu cadastro foi realizado com sucesso.
        </p>

        <p className="mt-2 leading-7 text-slate-400">
          Agora ele está aguardando a aprovação do administrador.
        </p>

        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-sm leading-6 text-amber-200">
            Assim que seu acesso for aprovado, você poderá utilizar todos os recursos do Athlos AI.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          Sair
        </button>
      </div>
    </main>
  );
}