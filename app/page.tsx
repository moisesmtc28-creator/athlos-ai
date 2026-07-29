"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [sessionChecked, setSessionChecked] =
    useState(false);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
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
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }

        if (!session) {
          setIsAuthenticated(false);
          router.replace("/login");
          return;
        }

        setIsAuthenticated(true);
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!sessionChecked || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Verificando acesso...
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
    error,
  } = useAthlete();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Carregando Athlos AI...
      </main>
    );
  }

  if (isError || !athlete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center text-white">
        <p>
          Não foi possível carregar os dados do atleta.
        </p>

        {error instanceof Error && (
          <p className="max-w-xl text-sm text-zinc-400">
            {error.message}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <section className="min-w-0 flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:p-8">
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