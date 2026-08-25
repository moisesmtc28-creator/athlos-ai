"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Dumbbell, History, Loader2, Save, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";

import Sidebar from "../components/layout/Sidebar";
import BackButton from "../components/layout/BackButton";
import { useAthleteProfile } from "@/hooks/use-athlete-profile";
import { finishStrengthWorkout, getStrengthProgress, getStrengthWorkouts, updateStrengthSet } from "@/services/strength.service";
import type { StrengthSet } from "@/types/strength";

export default function GymPage() {
  const { data: profile, isLoading: profileLoading } = useAthleteProfile();
  const [tab, setTab] = useState<"sheet" | "history">("sheet");
  const { data: workouts = [], isLoading } = useQuery({ queryKey: ["strength-workouts"], queryFn: getStrengthWorkouts });
  const { data: progress = [] } = useQuery({ queryKey: ["strength-progress"], queryFn: getStrengthProgress });
  const current = workouts.find(w => w.status !== "completed") ?? workouts[0];
  const completed = workouts.filter(w => w.status === "completed").length;
  const best = useMemo(() => progress.flatMap(p => p.points.map(x => ({...x, exerciseName:p.exerciseName}))).sort((a,b)=>b.maxLoadKg-a.maxLoadKg)[0], [progress]);

  if (profileLoading) return <Shell><p className="text-zinc-400">Carregando...</p></Shell>;
  if (!profile?.does_strength_training) return <Shell><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8"><h1 className="text-2xl font-bold">Musculação não ativada</h1><p className="mt-2 text-zinc-400">Ative a musculação no Perfil para a IA criar fichas integradas ao ciclismo.</p></div></Shell>;

  return <Shell>
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><h1 className="text-3xl font-bold">Academia</h1><p className="mt-2 text-zinc-400">Ficha estruturada, carga por série, histórico e progressão acompanhada pela IA.</p></div>
      <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        <TabButton active={tab==="sheet"} onClick={()=>setTab("sheet")}><Dumbbell size={16}/> Ficha</TabButton>
        <TabButton active={tab==="history"} onClick={()=>setTab("history")}><History size={16}/> Evolução</TabButton>
      </div>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Metric label="Treinos registrados" value={String(workouts.length)}/>
      <Metric label="Concluídos" value={String(completed)}/>
      <Metric label="Maior carga registrada" value={best ? `${best.maxLoadKg} kg` : "—"}/>
    </div>

    {isLoading ? <div className="mt-8 flex items-center gap-2 text-zinc-400"><Loader2 className="animate-spin"/> Carregando ficha...</div> : tab === "sheet" ? (
      current ? <WorkoutSheet workout={current}/> : <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Ainda não existe uma ficha estruturada. Gere uma nova semana em Meus treinos depois de aplicar a migração do Supabase incluída nesta versão.</div>
    ) : <ProgressView progress={progress}/>} 
  </Shell>;
}

function Shell({children}:{children:React.ReactNode}) { return <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0"><Sidebar/><section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8"><div className="mx-auto max-w-6xl"><BackButton/>{children}</div></section></main>; }
function TabButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}) { return <button onClick={onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${active?"bg-emerald-500 text-zinc-950":"text-zinc-400 hover:text-white"}`}>{children}</button>; }
function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black text-emerald-400">{value}</p></div>; }

function WorkoutSheet({ workout }: { workout: Awaited<ReturnType<typeof getStrengthWorkouts>>[number] }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Partial<StrengthSet>>>({});
  const saveMutation = useMutation({ mutationFn: updateStrengthSet, onSuccess: async()=>{ await queryClient.invalidateQueries({queryKey:["strength-workouts"]}); await queryClient.invalidateQueries({queryKey:["strength-progress"]}); } });
  const finishMutation = useMutation({ mutationFn: ()=>finishStrengthWorkout(workout.id, workout.trainingSessionId), onSuccess: async()=>{ await queryClient.invalidateQueries({queryKey:["strength-workouts"]}); await queryClient.invalidateQueries({queryKey:["trainings"]}); toast.success("Treino de musculação concluído e adicionado ao histórico."); } });

  const done = workout.exercises.flatMap(e=>e.sets).filter(s=>s.completed).length;
  const total = workout.exercises.flatMap(e=>e.sets).length;

  async function saveSet(set: StrengthSet) {
    const d = drafts[set.id] ?? {};
    try { await saveMutation.mutateAsync({ setId:set.id, performedReps:d.performedReps ?? set.performedReps ?? set.plannedReps, performedLoadKg:d.performedLoadKg ?? set.performedLoadKg ?? set.plannedLoadKg, rpe:d.rpe ?? set.rpe, rir:d.rir ?? set.rir, completed:d.completed ?? true, notes:d.notes ?? set.notes }); toast.success(`Série ${set.setNumber} salva.`); }
    catch(e){ toast.error(e instanceof Error?e.message:"Erro ao salvar série."); }
  }

  return <div className="mt-8 space-y-5">
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-6">
      <p className="text-xs uppercase tracking-wider text-emerald-400">{new Intl.DateTimeFormat("pt-BR").format(new Date(`${workout.date}T12:00:00`))}</p>
      <h2 className="mt-1 text-2xl font-black">{workout.title}</h2><p className="mt-2 text-zinc-400">{workout.focus || "Ficha gerada pela IA"}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-emerald-500" style={{width:`${total?Math.round(done/total*100):0}%`}}/></div><p className="mt-2 text-xs text-zinc-500">{done}/{total} séries concluídas</p>
    </div>

    {workout.exercises.map(exercise => <section key={exercise.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{exercise.order}. {exercise.name}</h3><p className="mt-1 text-sm text-zinc-400">{exercise.muscleGroup || "Grupo muscular"} · {exercise.targetSets} séries · {exercise.targetReps} reps · descanso {exercise.restSeconds}s</p></div>{exercise.targetLoadKg!=null&&<span className="rounded-lg bg-violet-500/10 px-3 py-1 text-sm text-violet-300">Meta {exercise.targetLoadKg} kg</span>}</div>{exercise.instructions&&<p className="mt-3 text-sm text-zinc-500">{exercise.instructions}</p>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-zinc-950/60 text-zinc-500"><tr><th className="p-3 text-left">Série</th><th className="p-3">Carga kg</th><th className="p-3">Reps</th><th className="p-3">RPE</th><th className="p-3">RIR</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead><tbody>{exercise.sets.map(set => {
        const d=drafts[set.id]??{}; return <tr key={set.id} className="border-t border-zinc-800"><td className="p-3 font-bold">{set.setNumber}</td>
          <CellInput value={d.performedLoadKg ?? set.performedLoadKg ?? set.plannedLoadKg ?? ""} onChange={v=>setDrafts(x=>({...x,[set.id]:{...x[set.id],performedLoadKg:v}}))}/>
          <CellInput value={d.performedReps ?? set.performedReps ?? set.plannedReps ?? ""} step="1" onChange={v=>setDrafts(x=>({...x,[set.id]:{...x[set.id],performedReps:v}}))}/>
          <CellInput value={d.rpe ?? set.rpe ?? ""} onChange={v=>setDrafts(x=>({...x,[set.id]:{...x[set.id],rpe:v}}))}/>
          <CellInput value={d.rir ?? set.rir ?? ""} onChange={v=>setDrafts(x=>({...x,[set.id]:{...x[set.id],rir:v}}))}/>
          <td className="p-3 text-center">{set.completed?<span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 size={16}/> Feita</span>:<span className="text-zinc-600">Pendente</span>}</td>
          <td className="p-3"><button onClick={()=>saveSet(set)} className="rounded-lg bg-emerald-500 p-2 text-zinc-950" title="Salvar série"><Save size={16}/></button></td></tr>})}</tbody></table></div>
    </section>)}
    <button onClick={()=>finishMutation.mutate()} disabled={finishMutation.isPending} className="w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-zinc-950 disabled:opacity-50">{finishMutation.isPending?"Finalizando...":"Finalizar treino e salvar no histórico"}</button>
  </div>;
}

function CellInput({value,onChange,step="0.5"}:{value:number|string;onChange:(v:number|null)=>void;step?:string}) { return <td className="p-3"><input type="number" step={step} value={value} onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))} className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-center outline-none focus:border-emerald-500"/></td>; }

function ProgressView({progress}:{progress:Awaited<ReturnType<typeof getStrengthProgress>>}) {
  if (!progress.length) return <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Conclua algumas séries para começar a formar o histórico de evolução.</div>;
  return <div className="mt-8 grid gap-4 md:grid-cols-2">{progress.map(item=>{const last=item.points[item.points.length-1]; const first=item.points[0]; const delta=last.maxLoadKg-first.maxLoadKg; return <div key={item.exerciseName} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex items-start justify-between"><div><h3 className="font-bold">{item.exerciseName}</h3><p className="mt-1 text-xs text-zinc-500">{item.points.length} registros</p></div><Trophy className="text-amber-400" size={20}/></div><div className="mt-5 grid grid-cols-3 gap-3"><Small label="Carga atual" value={`${last.maxLoadKg} kg`}/><Small label="Evolução" value={`${delta>=0?"+":""}${delta.toFixed(1)} kg`}/><Small label="Volume" value={`${Math.round(last.totalVolumeKg)} kg`}/></div><div className="mt-4 flex items-center gap-2 text-xs text-emerald-400"><TrendingUp size={14}/> Histórico salvo para a IA usar nas próximas fichas.</div></div>})}</div>;
}
function Small({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-zinc-950 p-3"><p className="text-[10px] uppercase text-zinc-600">{label}</p><p className="mt-1 font-bold">{value}</p></div>}
