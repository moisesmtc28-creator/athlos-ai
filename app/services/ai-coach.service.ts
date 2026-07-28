import { supabase } from "@/app/lib/supabase";
import type { Training } from "@/app/types/training";

type GeneratePlanResponse = {
  planId: string;
  weekGoal: string;
  trainings: Training[];
  historyAnalyzed: number;
  plannedWeek: {
    start: string;
    end: string;
  };
};

export async function generateWeeklyPlan(): Promise<GeneratePlanResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      `Erro ao recuperar a sessão: ${sessionError.message}`,
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "Sua sessão expirou. Entre novamente para gerar o plano.",
    );
  }

  const response = await fetch("/api/ai/generate-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        data?.error ??
          "Já existe um plano criado para essa semana.",
      );
    }

    throw new Error(
      data?.details ??
        data?.error ??
        "Não foi possível gerar o plano de treinos.",
    );
  }

  return data as GeneratePlanResponse;
}