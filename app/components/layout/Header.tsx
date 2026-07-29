"use client";

import { Bell, CalendarDays, Menu } from "lucide-react";
import { useAthlete } from "@/app/hooks/use-athlete";

export default function Header() {
  const { data: athlete } = useAthlete();

  const athleteName = athlete?.name?.trim() || "Atleta";
  const firstName = athleteName.split(" ")[0];

  const currentDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  const formattedDate =
    currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          <CalendarDays size={15} />
          <span className="truncate">{formattedDate}</span>
        </div>

        <h1 className="mt-2 truncate text-2xl font-black text-white sm:text-3xl">
          Bom dia, {firstName} 👋
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Seu progresso começa com a sessão de hoje.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Abrir notificações"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <Bell size={20} />

          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-zinc-900" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-2 py-2 sm:pr-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-black text-zinc-950">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-36 truncate text-sm font-bold text-white">
              {athleteName}
            </p>

            <p className="text-xs text-zinc-500">
              Perfil do atleta
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
