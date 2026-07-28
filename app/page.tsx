"use client";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import TrainingCard from "./components/cards/TrainingCard";
import StatCard from "./components/cards/StatCard";
import CoachCard from "./components/cards/CoachCard";
import WeightChart from "./components/charts/WeightChart";
import { useAthlete } from "./hooks/use-athlete";

export default function Home() {
  const { data: athlete, isLoading, isError } = useAthlete();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Carregando Athlos AI...
      </main>
    );
  }

  if (isError || !athlete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Não foi possível carregar os dados do atleta.
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <section className="flex-1 overflow-y-auto p-8">
        <Header />

        <div className="mt-8">
          <TrainingCard />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="❤️"
            title="Recuperação"
            value="87%"
            subtitle="Excelente"
          />

          <StatCard
            icon="⚖️"
            title="Peso"
            value={`${athlete.currentWeight} kg`}
            subtitle={`Meta: ${athlete.goalWeight} kg`}
          />

          <StatCard
            icon="😴"
            title="Sono"
            value="7h12"
            subtitle="Boa recuperação"
          />

          <StatCard
            icon="🏋️"
            title="Academia"
            value="Costas"
            subtitle="Bíceps"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WeightChart />
          </div>

          <CoachCard />
        </div>
      </section>
    </main>
  );
}