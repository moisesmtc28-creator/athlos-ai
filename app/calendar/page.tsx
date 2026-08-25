"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Brain, CalendarDays, ChevronLeft, ChevronRight, Dumbbell, GripVertical, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import Sidebar from "../components/layout/Sidebar";
import BackButton from "../components/layout/BackButton";
import { useTrainings } from "@/hooks/use-trainings";
import { moveTraining, reorganizeWeek } from "@/services/schedule.service";
import type { Training } from "@/types/training";

const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function iso(date: Date) { return date.toISOString().slice(0, 10); }
function addDays(date: Date, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function mondayOf(date: Date) {
  const d = new Date(date); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); d.setHours(12,0,0,0); return d;
}
function niceDate(date: Date) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date); }

function TrainingChip({ training }: { training: Training }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: training.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const strength = training.type === "strength" || training.title.startsWith("Musculação");
  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border p-3 text-xs shadow-lg transition ${strength ? "border-violet-500/30 bg-violet-950/60 text-violet-200" : "border-emerald-500/30 bg-emerald-950/60 text-emerald-200"} ${isDragging ? "z-50 opacity-70" : ""}`}>
      <div className="flex items-start gap-2">
        <button {...listeners} {...attributes} className="mt-0.5 cursor-grab text-zinc-500 hover:text-white" title="Arrastar treino"><GripVertical size={15}/></button>
        <Link href={`/training/${training.id}`} className="min-w-0 flex-1">
          <strong className="block truncate">{training.title}</strong>
          <span className="mt-1 block text-[11px] opacity-75">{training.duration} min {strength ? "· Academia" : `· ${training.zone}`}</span>
          {training.originalDate && training.originalDate !== training.date && <span className="mt-1 block text-[10px] text-amber-300">Reagendado</span>}
        </Link>
      </div>
    </div>
  );
}

function DayColumn({ date, trainings }: { date: Date; trainings: Training[] }) {
  const key = iso(date);
  const { setNodeRef, isOver } = useDroppable({ id: `day:${key}` });
  const isToday = key === iso(new Date());
  return (
    <div ref={setNodeRef} className={`min-h-48 rounded-2xl border p-3 transition ${isOver ? "border-emerald-400 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900"}`}>
      <div className="mb-3 flex items-center justify-between">
        <div><p className="text-xs uppercase text-zinc-500">{dayLabels[(date.getDay()+6)%7]}</p><p className={`text-lg font-bold ${isToday ? "text-emerald-400" : "text-white"}`}>{niceDate(date)}</p></div>
        <span className="text-xs text-zinc-600">{trainings.length}</span>
      </div>
      <div className="space-y-2">{trainings.map(t => <TrainingChip key={t.id} training={t}/>)}</div>
      {trainings.length === 0 && <div className="mt-8 text-center text-xs text-zinc-700">Solte um treino aqui</div>}
    </div>
  );
}

export default function CalendarPage() {
  const { data: trainings = [], isLoading, isError } = useTrainings();
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState(() => mondayOf(new Date()));
  const [reorganizing, setReorganizing] = useState(false);
  const weekDates = useMemo(() => Array.from({length:7}, (_,i) => addDays(anchor,i)), [anchor]);
  const startDate = iso(weekDates[0]); const endDate = iso(weekDates[6]);
  const weekTrainings = trainings.filter(t => t.date >= startDate && t.date <= endDate);

  async function handleDragEnd(event: DragEndEvent) {
    const trainingId = String(event.active.id); const over = event.over?.id ? String(event.over.id) : "";
    if (!over.startsWith("day:")) return;
    const newDate = over.slice(4); const training = trainings.find(t => t.id === trainingId);
    if (!training || training.date === newDate) return;
    try {
      await moveTraining(trainingId, newDate);
      await queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Treino movido. A IA poderá considerar essa mudança nos próximos ajustes.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível mover o treino."); }
  }

  async function handleAIReorganize() {
    setReorganizing(true);
    try {
      const result = await reorganizeWeek(startDate, endDate, "Equilibrar ciclismo, musculação e recuperação");
      await queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success(result.message || "Semana reorganizada.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao reorganizar semana."); }
    finally { setReorganizing(false); }
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0"><Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8"><div className="mx-auto max-w-7xl">
        <BackButton />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><h1 className="text-3xl font-bold">Calendário semanal</h1><p className="mt-2 text-zinc-400">Arraste qualquer treino para outro dia. A IA usa as mudanças como parte do histórico.</p></div>
          <button onClick={handleAIReorganize} disabled={reorganizing || weekTrainings.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 disabled:opacity-50">
            {reorganizing ? <Loader2 className="animate-spin" size={18}/> : <Brain size={18}/>} Reorganizar com IA
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <button onClick={() => setAnchor(addDays(anchor,-7))} className="rounded-lg p-2 hover:bg-zinc-800"><ChevronLeft/></button>
          <div className="flex items-center gap-2 font-semibold"><CalendarDays size={18} className="text-emerald-400"/>{niceDate(weekDates[0])} — {niceDate(weekDates[6])}</div>
          <button onClick={() => setAnchor(addDays(anchor,7))} className="rounded-lg p-2 hover:bg-zinc-800"><ChevronRight/></button>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-400"><Dumbbell className="mr-2 inline text-violet-400" size={16}/> Roxo = musculação · Verde = ciclismo. Treinos reagendados ficam marcados e entram na memória do planejamento.</div>

        {isLoading ? <p className="mt-8 text-zinc-400">Carregando...</p> : isError ? <p className="mt-8 text-red-400">Erro ao carregar treinos.</p> : (
          <DndContext onDragEnd={handleDragEnd}>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">{weekDates.map(date => <DayColumn key={iso(date)} date={date} trainings={weekTrainings.filter(t => t.date === iso(date))}/>)}</div>
          </DndContext>
        )}
      </div></section>
    </main>
  );
}
