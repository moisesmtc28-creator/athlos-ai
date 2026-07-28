import { supabase } from "@/app/lib/supabase";

export interface UpdateTrainingInput {
  id: string;
  status: "planned" | "in_progress" | "completed" | "missed" | "cancelled";

  completedDurationMinutes: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  distanceKm: number | null;
  averageSpeed: number | null;
  cadence: number | null;
  calories: number | null;
  elevationGain: number | null;
  perceivedEffort: number | null;
  athleteFeedback: string;
}

export async function updateTraining(
  input: UpdateTrainingInput,
) {
  const { error } = await supabase
    .from("training_sessions")
    .update({
      status: input.status,

      completed_duration_minutes:
        input.completedDurationMinutes,

      average_heart_rate:
        input.averageHeartRate,

      max_heart_rate:
        input.maxHeartRate,

      distance_km:
        input.distanceKm,

      average_speed:
        input.averageSpeed,

      cadence:
        input.cadence,

      calories:
        input.calories,

      elevation_gain:
        input.elevationGain,

      perceived_effort:
        input.perceivedEffort,

      athlete_feedback:
        input.athleteFeedback,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(error.message);
  }
}