"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Droplets,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";
import { useAthlete } from "@/app/hooks/use-athlete";

export default function CoachCard() {
  const { data: athlete } = useAthlete();

  const athleteName = athlete?.name?.trim() || "Atleta";
  const firstName = athleteName.split(" ")[0];

  return (
    <article className="h-full rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 p-5 shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20">
            <Bot size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Coach IA
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Orientação do dia
            </h2>
          </div>
        </div>

        <Sparkles className="text-emerald-400" size={21} />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="text-sm font-bold text-white">
          Bom dia, {firstName}!
        </p>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          Sua recuperação está em bom nível. O treino de Endurance Z2 é uma
          boa escolha para hoje. Mantenha o esforço controlado e evite começar
          forte demais nos primeiros minutos.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <CoachTip
          icon={<Droplets size={18} />}
          title="Hidratação"
          description="Comece hidratado e beba pequenos volumes ao longo do treino."
        />

        <CoachTip
          icon={<Utensils size={18} />}
          title="Energia"
          description="Faça uma refeição leve antes do treino, respeitando sua tolerância."
        />

        <CoachTip
          icon={<Zap size={18} />}
          title="Intensidade"
          description="Fique dentro da zona planejada e reduza o ritmo se necessário."
        />
      </div>

      <Link
        href="/coach"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-300 transition hover:bg-emerald-500/15 hover:text-emerald-200"
      >
        Conversar com o Coach
        <ArrowRight size={18} />
      </Link>
    </article>
  );
}

function CoachTip({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}
