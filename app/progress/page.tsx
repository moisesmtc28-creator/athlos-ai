"use client";

import { useQuery } from "@tanstack/react-query";
import Sidebar from "../components/layout/Sidebar";
import BackButton from "../components/layout/BackButton";
import { useTrainings } from "@/hooks/use-trainings";
import { useAthleteProfile } from "@/hooks/use-athlete-profile";
import { getStrengthProgress, getStrengthWorkouts } from "@/services/strength.service";
import { getRecentCheckins } from "@/services/readiness.service";

export default function ProgressPage() {
  const { data: trainings = [], isLoading } = useTrainings();
  const { data: profile } = useAthleteProfile();
  const { data: strength=[] } = useQuery({queryKey:["strength-workouts"],queryFn:getStrengthWorkouts});
  const { data: strengthProgress=[] } = useQuery({queryKey:["strength-progress"],queryFn:getStrengthProgress});
  const { data: checkins=[] } = useQuery({queryKey:["daily-checkins"],queryFn:()=>getRecentCheckins(14)});
  const completed = trainings.filter(t => t.status === "completed");
  const decided = trainings.filter(t => ["completed","missed","cancelled"].includes(t.status));
  const plannedMinutes = trainings.reduce((sum, t) => sum + t.duration, 0);
  const completedMinutes = completed.reduce((sum, t) => sum + t.duration, 0);
  const adherence = decided.length ? Math.round((completed.length / decided.length) * 100) : 0;
  const bikes = completed.filter(t => t.type !== "strength").length;
  const gyms = strength.filter(w => w.status === "completed").length;
  const readiness = checkins.length ? Math.round(checkins.reduce((s,c)=>s+c.readinessScore,0)/checkins.length) : 0;

  const biggestStrengthGain = strengthProgress.map(p=>{const first=p.points[0],last=p.points[p.points.length-1]; return {name:p.exerciseName,gain:first&&last?last.maxLoadKg-first.maxLoadKg:0,last:last?.maxLoadKg??0};}).sort((a,b)=>b.gain-a.gain)[0];

  return <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0"><Sidebar />
    <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8"><div className="mx-auto max-w-6xl">
      <BackButton />
      <h1 className="text-3xl font-bold">Evolução</h1><p className="mt-2 text-zinc-400">Ciclismo, musculação, aderência e recuperação no mesmo histórico.</p>
      {isLoading ? <p className="mt-8">Carregando...</p> : <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat title="Aderência" value={`${adherence}%`} subtitle={`${completed.length} concluídos de ${decided.length} finalizados`} />
          <Stat title="Ciclismo concluído" value={String(bikes)} subtitle="sessões registradas" />
          <Stat title="Academia concluída" value={String(gyms)} subtitle="fichas no histórico" />
          <Stat title="Prontidão média" value={checkins.length?`${readiness}%`:"—"} subtitle={`${checkins.length} check-ins recentes`} />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold">Volume de treino</h2><p className="mt-1 text-sm text-zinc-400">Tempo concluído comparado ao planejado.</p></div><span className="text-2xl font-bold text-emerald-400">{completedMinutes} min</span></div>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${plannedMinutes ? Math.min(100, completedMinutes/plannedMinutes*100) : 0}%` }} /></div><p className="mt-3 text-xs text-zinc-500">Planejado: {plannedMinutes} min</p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-zinc-900 p-6"><h2 className="text-xl font-semibold">Destaque da musculação</h2>{biggestStrengthGain?<><p className="mt-4 text-3xl font-black text-violet-400">{biggestStrengthGain.name}</p><p className="mt-2 text-zinc-400">Carga atual {biggestStrengthGain.last} kg · evolução {biggestStrengthGain.gain>=0?"+":""}{biggestStrengthGain.gain.toFixed(1)} kg no histórico.</p></>:<p className="mt-4 text-zinc-500">Registre cargas na ficha para a IA medir sua evolução.</p>}</div>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-semibold">Objetivo atual</h2><p className="mt-3 text-zinc-400">Peso atual: <strong className="text-white">{profile?.current_weight ? `${profile.current_weight} kg` : "—"}</strong>{profile?.target_weight ? ` · Meta: ${profile.target_weight} kg` : ""}. Estes indicadores, junto com o histórico de treinos e check-ins, ficam disponíveis para o treinador IA.</p></div>
      </>}
    </div></section>
  </main>;
}
function Stat({title,value,subtitle}:{title:string;value:string;subtitle:string}){return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">{title}</p><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-emerald-400">{subtitle}</p></div>}
