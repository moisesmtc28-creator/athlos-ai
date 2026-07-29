"use client";

import Link from "next/link";
import {
  Clock3,
  Gauge,
  HeartPulse,
  Play,
  Route,
} from "lucide-react";

export default function TrainingCard() {
  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl">
      <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Treino de hoje
            </div>

            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-400">
              Planejado
            </span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Ciclismo
            </p>

            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Endurance Z2
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Sessão contínua em intensidade moderada para desenvolver base
              aeróbica, melhorar a resistência e acumular volume com controle.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TrainingInfo
              icon={<Clock3 size={18} />}
              label="Duração"
              value="1h30"
            />

            <TrainingInfo
              icon={<HeartPulse size={18} />}
              label="Frequência"
              value="118–145 bpm"
            />

            <TrainingInfo
              icon={<Gauge size={18} />}
              label="Intensidade"
              value="Zona 2"
            />

            <TrainingInfo
              icon={<Route size={18} />}
              label="Terreno"
              value="Plano / ondulado"
            />
          </div>
        </section>

        <aside className="flex flex-col justify-between border-t border-zinc-800 bg-zinc-950/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Orientação
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Comece leve nos primeiros 10 minutos, estabilize o esforço na
              zona planejada e finalize com 5 minutos de recuperação.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/trainings"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-zinc-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              <Play size={19} fill="currentColor" />
              Ver treino
            </Link>

            <p className="text-center text-xs text-zinc-600">
              Ajuste a intensidade conforme sua recuperação.
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function TrainingInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}
