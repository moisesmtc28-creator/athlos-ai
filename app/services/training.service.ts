import { supabase } from "@/app/lib/supabase";
import type { Training } from "@/app/types/training";

type TrainingSessionRow = {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number;
  zone: Training["zone"];
  status: Training["status"];
};

export async function getTrainings(): Promise<Training[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("Usuário não autenticado.");

  const { data: profile, error: profileError } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Erro ao localizar o perfil: ${profileError.message}`);
  }

  if (!profile) return [];

  const { data, error } = await supabase
    .from("training_sessions")
    .select(`
      id,
      title,
      description,
      scheduled_date,
      duration_minutes,
      zone,
      status
    `)
    .eq("profile_id", profile.id)
    .order("scheduled_date", { ascending: true });

  if (error) {
    throw new Error(`Erro ao carregar treinos: ${error.message}`);
  }

  return ((data ?? []) as TrainingSessionRow[]).map((session) => ({
    id: session.id,
    title: session.title,
    description: session.description ?? "",
    date: session.scheduled_date,
    duration: session.duration_minutes,
    zone: session.zone,
    status: session.status,
  }));
}
