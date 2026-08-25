"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Dumbbell, History, Loader2, Save, TrendingUp, Trophy } from "lucide-react";
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
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const current = workouts.find((workout) => workout.id === selectedWorkoutId) ?? workouts.find(w => w.status !== "completed") ?? workouts[0];
  const completed = workouts.filter(w => w.status === "completed").length;
  const best = useMemo(() => progress.flatMap(p => p.points.map(x => ({...x, exerciseName:p.exerciseName}))).sort((a,b)=>b.maxLoadKg-a.maxLoadKg)[0], [progress]);

  if (profileLoading) return <Shell><p className="text-zinc-400">Carregando...</p></Shell>;
  if (!profile?.does_strength_training) return <Shell><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8"><h1 className="text-2xl font-bold">Musculação não ativada</h1><p className="mt-2 text-zinc-400">Ative a musculação no Perfil para a IA criar fichas integradas ao ciclismo.</p></div></Shell>;

  return <Shell>
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><h1 className="text-3xl font-bold">Academia</h1><p className="mt-2 text-zinc-400">Ficha estruturada, carga por série, histórico e progressão acompanhada pela IA.</p></div>
      <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        <TabButton active={tab==="sheet"} onClick={()=>setTab("sheet")}><Dumbbell size={16}/> Ficha</TabButton>
        <TabButton active={tab==="history"} onClick={()=>setTab("history")}><History size={16}/> Histórico</TabButton>
      </div>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Metric label="Treinos registrados" value={String(workouts.length)}/>
      <Metric label="Concluídos" value={String(completed)}/>
      <Metric label="Maior carga registrada" value={best ? `${best.maxLoadKg} kg` : "—"}/>
    </div>

    {isLoading ? <div className="mt-8 flex items-center gap-2 text-zinc-400"><Loader2 className="animate-spin"/> Carregando ficha...</div> : tab === "sheet" ? (
      current ? <>
        <WorkoutPicker workouts={workouts} selectedId={current.id} onSelect={setSelectedWorkoutId}/>
        <WorkoutSheet workout={current}/>
      </> : <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Ainda não existe uma ficha estruturada. Gere uma nova semana em Meus treinos para a IA criar as fichas integradas ao calendário.</div>
    ) : <HistoryView workouts={workouts} progress={progress}/>} 
  </Shell>;
}
function ProgressView({progress}:{progress:Awaited<ReturnType<typeof getStrengthProgress>>}) {
  if (!progress.length) return <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Conclua algumas séries para começar a formar o histórico de evolução.</div>;
  return <div className="mt-8 grid gap-4 md:grid-cols-2">{progress.map(item=>{const last=item.points[item.points.length-1]; const first=item.points[0]; const delta=last.maxLoadKg-first.maxLoadKg; return <div key={item.exerciseName} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex items-start justify-between"><div><h3 className="font-bold">{item.exerciseName}</h3><p className="mt-1 text-xs text-zinc-500">{item.points.length} registros</p></div><Trophy className="text-amber-400" size={20}/></div><div className="mt-5 grid grid-cols-3 gap-3"><Small label="Carga atual" value={`${last.maxLoadKg} kg`}/><Small label="Evolução" value={`${delta>=0?"+":""}${delta.toFixed(1)} kg`}/><Small label="Volume" value={`${Math.round(last.totalVolumeKg)} kg`}/></div><div className="mt-4 flex items-center gap-2 text-xs text-emerald-400"><TrendingUp size={14}/> Histórico salvo para a IA usar nas próximas fichas.</div></div>})}</div>;
}
function Small({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-zinc-950 p-3"><p className="text-[10px] uppercase text-zinc-600">{label}</p><p className="mt-1 font-bold">{value}</p></div>}
