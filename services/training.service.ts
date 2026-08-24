import { supabase } from "@/app/lib/supabase";
import type { Training } from "@/types/training";

type TrainingSessionRow = {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number;
  zone: Training["zone"];
  status: Training["status"];
};

type CloseTrainingWeekResult = {
  updatedCount: number;
};

async function getAuthenticatedProfileId(): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `Erro ao localizar o perfil: ${profileError.message}`,
    );
  }

  return profile?.id ?? null;
}

export async function getTrainings(): Promise<Training[]> {
  const profileId = await getAuthenticatedProfileId();

  if (!profileId) return [];

  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      `
        id,
        title,
        description,
        scheduled_date,
        duration_minutes,
        zone,
        status
      `,
    )
    .eq("profile_id", profileId)
    .order("scheduled_date", { ascending: true });

  if (error) {
    throw new Error(
      `Erro ao carregar treinos: ${error.message}`,
    );
  }

  return ((data ?? []) as TrainingSessionRow[]).map(
    (session) => ({
      id: session.id,
      title: session.title,
      description: session.description ?? "",
      date: session.scheduled_date,
      duration: session.duration_minutes,
      zone: session.zone,
      status: session.status,
    }),
  );
}

export async function closeTrainingWeek(
  startDate: string,
  endDate: string,
): Promise<CloseTrainingWeekResult> {
  const profileId = await getAuthenticatedProfileId();

  if (!profileId) {
    throw new Error(
      "Perfil do atleta não encontrado.",
    );
  }

  const { data: pendingSessions, error: searchError } =
    await supabase
      .from("training_sessions")
      .select("id")
      .eq("profile_id", profileId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .in("status", ["planned", "in_progress"]);

  if (searchError) {
    throw new Error(
      `Erro ao verificar a semana: ${searchError.message}`,
    );
  }

  const pendingIds = (pendingSessions ?? []).map(
    (session) => session.id as string,
  );

  if (pendingIds.length === 0) {
    return {
      updatedCount: 0,
    };
  }

  const { error: updateError } = await supabase
    .from("training_sessions")
    .update({
      status: "missed",
    })
    .in("id", pendingIds)
    .eq("profile_id", profileId);

  if (updateError) {
    throw new Error(
      `Erro ao fechar a semana: ${updateError.message}`,
    );
  }

  return {
    updatedCount: pendingIds.length,
  };
}


export async function resetTrainings(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const response = await fetch("/api/training/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.details ?? data?.error ?? "Não foi possível zerar os treinos.",
    );
  }
}
