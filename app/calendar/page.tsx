"use client";

import Link from "next/link";
import Sidebar from "../components/layout/Sidebar";
import BackButton from "../components/layout/BackButton";
import { useTrainings } from "@/hooks/use-trainings";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarPage() {
  const { data: trainings = [], isLoading, isError } = useTrainings();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + totalDays }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(today);

  return (
    <main className="flex min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0"><Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:p-8"><div className="mx-auto max-w-6xl">
      <BackButton />
        <h1 className="text-3xl font-bold">Calendário</h1><p className="mt-2 capitalize text-zinc-400">{monthLabel}</p>
        {isLoading ? <p className="mt-8 text-zinc-400">Carregando...</p> : isError ? <p className="mt-8 text-red-400">Erro ao carregar treinos.</p> : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80">{days.map(day => <div key={day} className="p-3 text-center text-xs font-semibold text-zinc-400">{day}</div>)}</div>
            <div className="grid grid-cols-7">{cells.map((day, index) => {
              const date = day ? `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}` : "";
              const dayTrainings = trainings.filter(t => t.date === date);
              const isToday = day === today.getDate();
              return <div key={index} className="min-h-28 border-b border-r border-zinc-800 p-2 md:min-h-36">
                {day && <><div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday ? "bg-emerald-500 font-bold text-zinc-950" : "text-zinc-400"}`}>{day}</div>
                <div className="mt-2 space-y-2">{dayTrainings.map(t => <Link key={t.id} href={`/training/${t.id}`} className="block rounded-lg bg-emerald-950/70 p-2 text-xs text-emerald-300 hover:bg-emerald-900/70"><strong className="block truncate">{t.title}</strong><span>{t.duration} min · {t.zone}</span></Link>)}</div></>}
              </div>;
            })}</div>
          </div>
        )}
      </div></section>
    </main>
  );
}
