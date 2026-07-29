export type CyclingLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "elite";

export type CyclingType =
  | "mtb"
  | "speed"
  | "gravel"
  | "indoor"
  | "mixed";

export type PreferredTrainingTime =
  | "morning"
  | "afternoon"
  | "evening"
  | "variable";

export type Sex = "male" | "female";

export interface AthleteProfile {
  id?: string;
  user_id?: string;

  full_name: string;
  birth_date: string;
  sex: Sex | "";

  height_cm: number | null;
  current_weight: number | null;
  target_weight: number | null;

  max_heart_rate: number | null;
  resting_heart_rate: number | null;
  ftp: number | null;

  cycling_level: CyclingLevel;
  preferred_bike: string;
  main_cycling_type: CyclingType | "";
  terrain: string;

  weekly_hours: number | null;
  goal: string;
  goal_details: string;

  cycling_years: number | null;
  training_frequency: number | null;
  longest_recent_ride_km: number | null;
  average_speed_kmh: number | null;

  has_heart_rate_monitor: boolean;
  has_power_meter: boolean;
  has_cadence_sensor: boolean;
  has_speed_sensor: boolean;
  has_indoor_trainer: boolean;
  has_gps_computer: boolean;

  does_strength_training: boolean;
  strength_days_per_week: number | null;

  preferred_training_time: PreferredTrainingTime | "";

  available_days: string[];
  available_minutes_by_day: Record<string, number>;
  gym_days: string[];

  physical_limitations: string;

  target_event_name: string;
  target_event_date: string;

  onboarding_completed: boolean;

  created_at?: string;
  updated_at?: string;
}

export const emptyAthleteProfile: AthleteProfile = {
  full_name: "",
  birth_date: "",
  sex: "",

  height_cm: null,
  current_weight: null,
  target_weight: null,

  max_heart_rate: null,
  resting_heart_rate: null,
  ftp: null,

  cycling_level: "intermediate",
  preferred_bike: "",
  main_cycling_type: "",
  terrain: "",

  weekly_hours: null,
  goal: "",
  goal_details: "",

  cycling_years: null,
  training_frequency: null,
  longest_recent_ride_km: null,
  average_speed_kmh: null,

  has_heart_rate_monitor: false,
  has_power_meter: false,
  has_cadence_sensor: false,
  has_speed_sensor: false,
  has_indoor_trainer: false,
  has_gps_computer: false,

  does_strength_training: false,
  strength_days_per_week: null,

  preferred_training_time: "",

  available_days: [],
  available_minutes_by_day: {},
  gym_days: [],

  physical_limitations: "",

  target_event_name: "",
  target_event_date: "",

  onboarding_completed: false,
};