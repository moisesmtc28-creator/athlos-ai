"use client";

import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg transition hover:-translate-y-1 hover:border-emerald-500/20">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
          {icon ?? "📊"}
        </div>

        <ArrowUpRight
          size={18}
          className="text-zinc-600 transition group-hover:text-emerald-400"
        />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-black text-white">
        {value}
      </h3>

      {subtitle && (
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {subtitle}
        </p>
      )}
    </article>
  );
}
