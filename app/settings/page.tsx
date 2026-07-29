"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/layout/Sidebar";
import { supabase } from "../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  async function logout(){await supabase.auth.signOut();router.replace("/login");router.refresh();}
  return <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0"><Sidebar />
    <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8"><div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Configurações</h1><p className="mt-2 text-zinc-400">Preferências e segurança da conta.</p>
      <div className="mt-8 space-y-5">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-semibold">Conta</h2><p className="mt-2 text-zinc-400">Encerre sua sessão neste dispositivo.</p><button onClick={logout} className="mt-5 rounded-xl border border-red-700 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/50">Sair da conta</button></section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-semibold">Privacidade</h2><p className="mt-2 leading-7 text-zinc-400">Seus dados esportivos ficam associados à sua conta do Supabase e são usados para gerar planos personalizados.</p></section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-semibold">Versão</h2><p className="mt-2 text-zinc-400">Athlos AI 1.0</p></section>
      </div>
    </div></section>
  </main>;
}
