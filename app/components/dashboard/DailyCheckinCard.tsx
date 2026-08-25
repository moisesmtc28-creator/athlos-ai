"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getRecentCheckins, saveDailyCheckin } from "@/services/readiness.service";

function todayIso(){ return new Date().toISOString().slice(0,10); }

export default function DailyCheckinCard(){
  const qc=useQueryClient();
  const {data=[]}=useQuery({queryKey:["daily-checkins"],queryFn:()=>getRecentCheckins(7)});
  const today=data.find(x=>x.date===todayIso());
  const [sleepHours,setSleepHours]=useState("7");
  const [sleepQuality,setSleepQuality]=useState(4);
  const [fatigue,setFatigue]=useState(2);
  const [soreness,setSoreness]=useState(2);
  const [motivation,setMotivation]=useState(4);
  const mutation=useMutation({mutationFn:saveDailyCheckin,onSuccess:async(score)=>{await qc.invalidateQueries({queryKey:["daily-checkins"]});toast.success(`Check-in salvo. Prontidão ${score}%.`);}});

  if(today) return <div className="rounded-2xl border border-emerald-500/20 bg-zinc-900 p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-zinc-500">Check-in de hoje</p><h3 className="mt-1 text-xl font-bold">Prontidão {today.readinessScore}%</h3></div><CheckCircle2 className="text-emerald-400"/></div><p className="mt-2 text-sm text-zinc-400">Sono {today.sleepHours ?? "—"}h · fadiga {today.fatigue}/5 · dor muscular {today.muscleSoreness}/5. A IA usa estes dados para ajustar os próximos treinos.</p></div>;

  return <div className="rounded-2xl border border-cyan-500/20 bg-zinc-900 p-5"><div className="flex items-center gap-2"><Activity className="text-cyan-400"/><div><h3 className="font-bold">Check-in diário</h3><p className="text-xs text-zinc-500">Leva menos de 20 segundos e melhora as decisões da IA.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-5"><NumberField label="Sono (h)" value={sleepHours} onChange={setSleepHours}/><Score label="Qualidade" value={sleepQuality} onChange={setSleepQuality}/><Score label="Fadiga" value={fatigue} onChange={setFatigue}/><Score label="Dor muscular" value={soreness} onChange={setSoreness}/><Score label="Motivação" value={motivation} onChange={setMotivation}/></div><button disabled={mutation.isPending} onClick={()=>mutation.mutate({date:todayIso(),sleepHours:Number(sleepHours)||null,sleepQuality,fatigue,muscleSoreness:soreness,motivation,restingHeartRate:null,bodyWeight:null,notes:""})} className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-zinc-950 disabled:opacity-50">{mutation.isPending?"Salvando...":"Salvar check-in"}</button></div>;
}
function NumberField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="text-xs text-zinc-500">{label}<input type="number" step="0.5" value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-white"/></label>}
function Score({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}){return <label className="text-xs text-zinc-500">{label}<select value={value} onChange={e=>onChange(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-white">{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}/5</option>)}</select></label>}
