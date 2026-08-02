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

const weightData = [
  { week: "Sem 1", weight: 124 },
  { week: "Sem 2", weight: 123.2 },
  { week: "Sem 3", weight: 122.5 },
  { week: "Sem 4", weight: 121.8 },
  { week: "Sem 5", weight: 121 },
  { week: "Atual", weight: 120 },
];

export default function WeightChart() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <div className="mb-6">
        <p className="text-sm text-zinc-400">Evolução</p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Evolução do peso
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Últimas 6 semanas
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">
              -4 kg
            </p>

            <p className="text-xs text-zinc-500">
              desde o início
            </p>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={weightData}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="weightGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#22c55e"
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor="#22c55e"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />

            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#71717a",
                fontSize: 12,
              }}
            />

            <YAxis
              domain={[118, 126]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#71717a",
                fontSize: 12,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "12px",
                color: "#ffffff",
              }}
              formatter={(value) => [`${value} kg`, "Peso"]}
              labelStyle={{
                color: "#a1a1aa",
              }}
            />

            <Area
              type="monotone"
              dataKey="weight"
              stroke="#22c55e"
              strokeWidth={3}
              fill="url(#weightGradient)"
              activeDot={{
                r: 6,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}