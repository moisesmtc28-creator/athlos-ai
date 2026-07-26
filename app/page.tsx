import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import TrainingCard from "./components/cards/TrainingCard";
import StatCard from "./components/cards/StatCard";
import CoachCard from "./components/cards/CoachCard";
import WeightChart from "./components/charts/WeightChart";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <section className="flex-1 overflow-y-auto p-8">
        <Header />

        {/* Treino */}
        <div className="mt-8">
          <TrainingCard />
        </div>

        {/* Cards */}
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
            value="120 kg"
            subtitle="Meta: 105 kg"
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

        {/* Gráfico + Coach */}
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