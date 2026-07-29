"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { week: "S1", weight: 124 },
  { week: "S2", weight: 123.2 },
  { week: "S3", weight: 122.5 },
  { week: "S4", weight: 121.8 },
  { week: "S5", weight: 121 },
  { week: "Hoje", weight: 120 },
];

export default function WeightChart() {
  const current = data[data.length - 1].weight;
  const start = data[0].weight;
  const diff = (start - current).toFixed(1).replace(".", ",");

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Evolução
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Peso corporal
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Últimas 6 medições
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-black text-emerald-400">
            -{diff} kg
          </p>

          <p className="text-xs text-zinc-500">
            desde o início
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{fill:"#71717a"}}/>
            <YAxis domain={[118,126]} tickLine={false} axisLine={false} tick={{fill:"#71717a"}}/>

            <Tooltip
              formatter={(value)=>[`${value} kg`,"Peso"]}
              contentStyle={{
                background:"#18181b",
                border:"1px solid #3f3f46",
                borderRadius:16,
                color:"#fff",
              }}
            />

            <Area
              type="monotone"
              dataKey="weight"
              stroke="#22c55e"
              strokeWidth={3}
              fill="url(#g)"
              activeDot={{r:6}}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
