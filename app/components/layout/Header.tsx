"use client";

import { useAthlete } from "../../../hooks/use-athlete";

export default function Header() {
  const { data: athlete } = useAthlete();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Bom dia, {athlete?.name ?? "Atleta"} 👋
        </h1>

        <p className="mt-1 text-zinc-400">
          Bem-vindo ao Athlos AI
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 font-bold text-white">
          {athlete?.name?.charAt(0).toUpperCase() ?? "A"}
        </div>
      </div>
    </header>
  );
}