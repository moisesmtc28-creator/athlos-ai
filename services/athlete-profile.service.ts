import { supabase } from "@/app/lib/supabase";
import type { AthleteProfile } from "../types/athlete-profile";

function optionalText(
  value: string | null | undefined,
): string | null {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue === "" ? null : normalizedValue;
}

export async function getAthleteProfile(): Promise<AthleteProfile | null> {
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

  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as AthleteProfile | null;
}

export async function saveAthleteProfile(
  profile: AthleteProfile,
): Promise<AthleteProfile> {
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

  const payload = {
    user_id: user.id,

    full_name: optionalText(profile.full_name),
    birth_date: optionalText(profile.birth_date),
    sex: optionalText(profile.sex),

    height_cm: profile.height_cm ?? null,
    current_weight: profile.current_weight ?? null,
    target_weight: profile.target_weight ?? null,

    max_heart_rate: profile.max_heart_rate ?? null,
    resting_heart_rate:
      profile.resting_heart_rate ?? null,
    ftp: profile.ftp ?? null,

    cycling_level:
      optionalText(profile.cycling_level) ??
      "intermediate",

    preferred_bike: optionalText(
      profile.preferred_bike,
    ),

    main_cycling_type: optionalText(
      profile.main_cycling_type,
    ),

    terrain: optionalText(profile.terrain),

    weekly_hours: profile.weekly_hours ?? null,

    goal: optionalText(profile.goal),

    goal_details: optionalText(
      profile.goal_details,
    ),

    cycling_years: profile.cycling_years ?? null,

    training_frequency:
      profile.training_frequency ?? null,

    longest_recent_ride_km:
      profile.longest_recent_ride_km ?? null,

    average_speed_kmh:
      profile.average_speed_kmh ?? null,

    has_heart_rate_monitor:
      Boolean(profile.has_heart_rate_monitor),

    has_power_meter:
      Boolean(profile.has_power_meter),

    has_cadence_sensor:
      Boolean(profile.has_cadence_sensor),

    has_speed_sensor:
      Boolean(profile.has_speed_sensor),

    has_indoor_trainer:
      Boolean(profile.has_indoor_trainer),

    has_gps_computer:
      Boolean(profile.has_gps_computer),

    does_strength_training:
      Boolean(profile.does_strength_training),

    strength_days_per_week:
      profile.does_strength_training
        ? profile.strength_days_per_week ?? 0
        : 0,

    preferred_training_time: optionalText(
      profile.preferred_training_time,
    ),

    available_days:
      profile.available_days ?? [],

    available_minutes_by_day:
      profile.available_minutes_by_day ?? {},

    gym_days: profile.does_strength_training
      ? profile.gym_days ?? []
      : [],

    physical_limitations: optionalText(
      profile.physical_limitations,
    ),

    target_event_name: optionalText(
      profile.target_event_name,
    ),

    target_event_date: optionalText(
      profile.target_event_date,
    ),

    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("athlete_profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AthleteProfile;
}