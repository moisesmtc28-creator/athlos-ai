"use client";

import Sidebar from "../components/layout/Sidebar";
import { useTrainings } from "../hooks/use-trainings";
import { useAthleteProfile } from "../hooks/use-athlete-profile";

export default function ProgressPage() {
  const { data: trainings = [], isLoading } = useTrainings();
  const { data: profile } = useAthleteProfile();
  const completed = trainings.filter(t => t.status === "completed");
  const plannedMinutes = trainings.reduce((sum, t) => sum + t.duration, 0);
  const completedMinutes = completed.reduce((sum, t) => sum + t.duration, 0);
  const adherence = trainings.length ? Math.round((completed.length / trainings.length) * 100) : 0;

  return <main className="flex min-h-screen bg-zinc-950 text-white"><Sidebar />
    <section className="min-w-0 flex-1 p-5 md:p-8"><div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold">Evolução</h1><p className="mt-2 text-zinc-400">Resumo do seu progresso com base nos treinos registrados.</p>
      {isLoading ? <p className="mt-8">Carregando...</p> : <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat title="Treinos concluídos" value={String(completed.length)} subtitle={`de ${trainings.length} planejados`} />
          <Stat title="Aderência" value={`${adherence}%`} subtitle="treinos concluídos" />
          <Stat title="Volume planejado" value={`${Math.round(plannedMinutes/60)} h`} subtitle={`${plannedMinutes} minutos`} />
          <Stat title="Peso atual" value={profile?.current_weight ? `${profile.current_weight} kg` : "—"} subtitle={profile?.target_weight ? `Meta: ${profile.target_weight} kg` : "Meta não informada"} />
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold">Conclusão dos treinos</h2><p className="mt-1 text-sm text-zinc-400">Volume concluído comparado ao planejado.</p></div><span className="text-2xl font-bold text-emerald-400">{completedMinutes} min</span></div>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${plannedMinutes ? Math.min(100, completedMinutes/plannedMinutes*100) : 0}%` }} /></div>
        </div>
      </>}
    </div></section>
  </main>;
}
function Stat({title,value,subtitle}:{title:string;value:string;subtitle:string}){return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">{title}</p><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-emerald-400">{subtitle}</p></div>}
