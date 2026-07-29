"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bike,
  Dumbbell,
  HeartPulse,
  Loader2,
  Moon,
  Scale,
  Target,
  TrendingDown,
} from "lucide-react";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import TrainingCard from "./components/cards/TrainingCard";
import StatCard from "./components/cards/StatCard";
import CoachCard from "./components/cards/CoachCard";
import WeightChart from "./components/charts/WeightChart";

import { useAthlete } from "./hooks/use-athlete";
import { supabase } from "./lib/supabase";

export default function Home() {
  const router = useRouter();

  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error || !session) {
          setIsAuthenticated(false);
          setSessionChecked(true);
          router.replace("/login");
          return;
        }

        setIsAuthenticated(true);
        setSessionChecked(true);
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);

        if (isMounted) {
          setIsAuthenticated(false);
          setSessionChecked(true);
          router.replace("/login");
        }
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        setIsAuthenticated(false);
        setSessionChecked(true);
        router.replace("/login");
        return;
      }

      setIsAuthenticated(true);
      setSessionChecked(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!sessionChecked || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-400" />

          <p className="mt-4 text-sm text-zinc-400">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  return <AuthenticatedDashboard />;
}

function AuthenticatedDashboard() {
  const {
    data: athlete,
    isLoading,
    isError,
    refetch,
  } = useAthlete();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-400" />

          <p className="mt-4 text-sm text-zinc-400">
            Carregando o Athlos AI...
          </p>
        </div>
      </main>
    );
  }

  if (isError || !athlete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-zinc-900 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <Activity className="text-red-400" size={26} />
          </div>

          <h1 className="mt-5 text-xl font-bold">
            Não foi possível carregar seus dados
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Verifique sua conexão e tente novamente.
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  const currentWeight = Number(athlete.currentWeight ?? 0);
  const goalWeight = Number(athlete.goalWeight ?? 0);
  const remainingWeight = Math.max(currentWeight - goalWeight, 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-white lg:flex">
      <Sidebar />

      <section className="min-w-0 flex-1 pb-24 lg:pb-0">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Header />

          <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-950 p-5 shadow-2xl sm:p-7">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <Target size={15} />
                  Foco da semana
                </div>

                <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                  Consistência hoje.
                  <span className="block text-emerald-400">
                    Performance amanhã.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                  Acompanhe seu treino, recuperação e evolução em um só lugar.
                  O Athlos AI organiza sua rotina para você treinar com mais
                  segurança e propósito.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <TrendingDown className="text-emerald-400" size={20} />
                  </div>

                  <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
                    Falta para a meta
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {remainingWeight.toFixed(1).replace(".", ",")} kg
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                    <Bike className="text-cyan-400" size={20} />
                  </div>

                  <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
                    Modalidade
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    Ciclismo
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <TrainingCard />
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            <StatCard
              icon="❤️"
              title="Recuperação"
              value="87%"
              subtitle="Excelente"
            />

            <StatCard
              icon="⚖️"
              title="Peso"
              value={`${currentWeight} kg`}
              subtitle={`Meta: ${goalWeight} kg`}
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
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <WeightChart />
            </div>

            <div className="min-w-0">
              <CoachCard />
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickStatus
              icon={<HeartPulse size={20} />}
              title="Frequência cardíaca"
              value="Pronto para treinar"
              description="Mantenha o esforço dentro da zona planejada."
            />

            <QuickStatus
              icon={<Moon size={20} />}
              title="Recuperação"
              value="Boa condição"
              description="Sono e descanso adequados para a sessão."
            />

            <QuickStatus
              icon={<Dumbbell size={20} />}
              title="Força"
              value="Sessão programada"
              description="Evite treinar pernas pesado antes do pedal intenso."
            />

            <QuickStatus
              icon={<Scale size={20} />}
              title="Objetivo"
              value={`${goalWeight} kg`}
              description="Acompanhe a tendência semanal, não apenas o dia."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

type QuickStatusProps = {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
};

function QuickStatus({
  icon,
  title,
  value,
  description,
}: QuickStatusProps) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </p>

      <h2 className="mt-1 text-lg font-bold text-white">
        {value}
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </article>
  );
}
