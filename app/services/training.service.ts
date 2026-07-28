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