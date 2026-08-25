import { supabase } from "@/app/lib/supabase";
import type { TrainingDetails } from "@/types/training";

export async function getTrainingById(
  id: string,
): Promise<TrainingDetails> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    date: data.scheduled_date,
    duration: data.duration_minutes,
    zone: data.zone,
    status: data.status,
    type: data.session_type ?? (data.title?.startsWith("Musculação") ? "strength" : "bike"),
    originalDate: data.original_scheduled_date ?? null,
    rescheduleReason: data.reschedule_reason ?? null,

    completedDurationMinutes:
      data.completed_duration_minutes,

    averageHeartRate:
      data.average_heart_rate,

    maxHeartRate:
      data.max_heart_rate,

    distanceKm:
      data.distance_km,

    averageSpeed:
      data.average_speed,

    cadence:
      data.cadence,

    calories:
      data.calories,

    elevationGain:
      data.elevation_gain,

    perceivedEffort:
      data.perceived_effort,

    athleteFeedback:
      data.athlete_feedback ?? "",
  };
}