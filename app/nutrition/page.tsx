"use client";

import Sidebar from "../components/layout/Sidebar";
import { useAthleteProfile } from "../hooks/use-athlete-profile";

export default function NutritionPage() {
  const { data: profile, isLoading } = useAthleteProfile();
  const weight = profile?.current_weight ?? null;
  const hydration = weight ? Math.round(weight * 35) : null;
  return <main className="flex min-h-screen bg-zinc-950 text-white"><Sidebar />
    <section className="min-w-0 flex-1 p-5 md:p-8"><div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Nutrição</h1><p className="mt-2 text-zinc-400">Orientações gerais para apoiar seus treinos. Não substituem acompanhamento profissional.</p>
      {isLoading ? <p className="mt-8">Carregando...</p> : <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card title="Hidratação diária" value={hydration ? `${(hydration/1000).toFixed(1)} L` : "Informe seu peso"} text="Estimativa geral de 35 ml por kg, ajustando por calor, suor e duração do treino." />
        <Card title="Antes do treino" value="1 a 3 horas antes" text="Prefira uma refeição de fácil digestão, com carboidrato e proteína, evitando excesso de gordura." />
        <Card title="Durante o pedal" value="Treinos longos" text="Em sessões acima de 90 minutos, planeje líquidos e carboidratos de forma gradual, testando no treino." />
        <Card title="Após o treino" value="Recupere bem" text="Combine proteína, carboidrato, líquidos e uma refeição equilibrada para favorecer a recuperação." />
      </div>}
      <div className="mt-6 rounded-2xl border border-amber-700/50 bg-amber-950/30 p-5 text-sm leading-6 text-amber-200">Como seu perfil pode incluir histórico de cirurgia bariátrica ou desconfortos digestivos, qualquer estratégia alimentar específica deve ser confirmada com médico ou nutricionista.</div>
    </div></section>
  </main>;
}
function Card({title,value,text}:{title:string;value:string;text:string}){return <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-emerald-400">{title}</p><h2 className="mt-2 text-2xl font-bold">{value}</h2><p className="mt-3 leading-7 text-zinc-400">{text}</p></article>}
