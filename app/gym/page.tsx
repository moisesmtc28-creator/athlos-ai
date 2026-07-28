"use client";

import Sidebar from "../components/layout/Sidebar";
import { useAthleteProfile } from "../hooks/use-athlete-profile";

export default function GymPage() {
  const { data: profile, isLoading } = useAthleteProfile();
  const days = profile?.gym_days ?? [];
  return <main className="flex min-h-screen bg-zinc-950 text-white"><Sidebar />
    <section className="min-w-0 flex-1 p-5 md:p-8"><div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Academia</h1><p className="mt-2 text-zinc-400">Organização do treino de força junto com o ciclismo.</p>
      {isLoading ? <p className="mt-8">Carregando...</p> : !profile?.does_strength_training ? <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"><h2 className="text-xl font-semibold">Musculação não ativada</h2><p className="mt-2 text-zinc-400">Ative essa opção no Perfil para integrar a academia ao plano.</p></div> : <>
        <div className="mt-8 grid gap-4 md:grid-cols-3"><Metric title="Dias por semana" value={String(profile.strength_days_per_week ?? days.length)} /><Metric title="Dias cadastrados" value={String(days.length)} /><Metric title="Prioridade" value="Força útil" /></div>
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-semibold">Estrutura recomendada</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
          <Workout title="Treino A — Pernas e estabilidade" items={["Agachamento ou leg press", "Levantamento terra romeno leve", "Panturrilhas", "Core e estabilidade"]} />
          <Workout title="Treino B — Tronco" items={["Puxada ou remada", "Supino ou flexão", "Desenvolvimento de ombros", "Core e mobilidade"]} />
        </div><p className="mt-5 text-sm leading-6 text-zinc-400">Evite treino pesado de pernas antes do pedal intenso ou do longão. Ajuste cargas com orientação profissional.</p></div>
      </>}
    </div></section>
  </main>;
}
function Metric({title,value}:{title:string;value:string}){return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">{title}</p><p className="mt-2 text-2xl font-bold text-emerald-400">{value}</p></div>}
function Workout({title,items}:{title:string;items:string[]}){return <div className="rounded-xl bg-zinc-950 p-5"><h3 className="font-semibold">{title}</h3><ul className="mt-3 space-y-2 text-sm text-zinc-400">{items.map(i=><li key={i}>• {i}</li>)}</ul></div>}
