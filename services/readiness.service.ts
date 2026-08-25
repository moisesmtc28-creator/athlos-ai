import { supabase } from "@/app/lib/supabase";

export type DailyCheckin = {
  date: string;
  sleepHours: number | null;
  sleepQuality: number;
  fatigue: number;
  muscleSoreness: number;
  motivation: number;
  restingHeartRate: number | null;
  bodyWeight: number | null;
  notes: string;
  readinessScore: number;
};

async function profileId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");
  const { data, error } = await supabase.from("athlete_profiles").select("id").eq("user_id", user.id).single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export function calculateReadiness(input: Omit<DailyCheckin, "date" | "readinessScore">) {
  const sleepScore = Math.min(100, Math.max(0, (input.sleepQuality / 5) * 100));
  const fatigueScore = Math.min(100, Math.max(0, ((6 - input.fatigue) / 5) * 100));
  const sorenessScore = Math.min(100, Math.max(0, ((6 - input.muscleSoreness) / 5) * 100));
  const motivationScore = Math.min(100, Math.max(0, (input.motivation / 5) * 100));
  const hoursScore = input.sleepHours == null ? 70 : Math.min(100, Math.max(20, (input.sleepHours / 8) * 100));
  return Math.round(sleepScore * .25 + fatigueScore * .25 + sorenessScore * .2 + motivationScore * .15 + hoursScore * .15);
}

export async function saveDailyCheckin(checkin: Omit<DailyCheckin, "readinessScore">) {
  const id = await profileId();
  const readinessScore = calculateReadiness(checkin);
  const { error } = await supabase.from("daily_checkins").upsert({
    profile_id: id,
    checkin_date: checkin.date,
    sleep_hours: checkin.sleepHours,
    sleep_quality: checkin.sleepQuality,
    fatigue: checkin.fatigue,
    muscle_soreness: checkin.muscleSoreness,
    motivation: checkin.motivation,
    resting_heart_rate: checkin.restingHeartRate,
    body_weight: checkin.bodyWeight,
    notes: checkin.notes,
    readiness_score: readinessScore,
    updated_at: new Date().toISOString(),
  }, { onConflict: "profile_id,checkin_date" });
  if (error) throw new Error(error.message);
  return readinessScore;
}

export async function getRecentCheckins(limit = 14): Promise<DailyCheckin[]> {
  const id = await profileId();
  const { data, error } = await supabase.from("daily_checkins").select("*").eq("profile_id", id).order("checkin_date", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    date: r.checkin_date,
    sleepHours: r.sleep_hours == null ? null : Number(r.sleep_hours),
    sleepQuality: r.sleep_quality,
    fatigue: r.fatigue,
    muscleSoreness: r.muscle_soreness,
    motivation: r.motivation,
    restingHeartRate: r.resting_heart_rate,
    bodyWeight: r.body_weight == null ? null : Number(r.body_weight),
    notes: r.notes ?? "",
    readinessScore: r.readiness_score,
  }));
}
