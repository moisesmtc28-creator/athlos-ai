import type { AthleteProfile } from "@/app/types/athlete-profile";

export const mockAthleteProfile: AthleteProfile = {
  id: "mock-profile-1",
  user_id: "mock-user-1",

  full_name: "Moisés",
  birth_date: "1985-08-01",
  sex: "male",

  height_cm: 192,
  current_weight: 120,
  target_weight: 105,

  max_heart_rate: 180,
  resting_heart_rate: null,
  ftp: 220,

  cycling_level: "intermediate",
  preferred_bike: "MTB",
  main_cycling_type: "mixed",
  terrain: "Montanhoso",

  weekly_hours: 8,
  goal: "Melhorar performance",
  goal_details: "Melhorar desempenho em subidas e reduzir o peso corporal.",

  cycling_years: 5,
  training_frequency: 4,
  longest_recent_ride_km: 60,
  average_speed_kmh: 20,

  has_heart_rate_monitor: true,
  has_power_meter: false,
  has_cadence_sensor: false,
  has_speed_sensor: true,
  has_indoor_trainer: true,
  has_gps_computer: true,

  does_strength_training: true,
  strength_days_per_week: 4,

  preferred_training_time: "evening",

  available_days: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ],

  available_minutes_by_day: {
    monday: 60,
    tuesday: 90,
    wednesday: 60,
    thursday: 90,
    friday: 60,
    saturday: 240,
  },

  gym_days: ["monday", "tuesday", "thursday", "friday"],

  physical_limitations: "",

  target_event_name: "",
  target_event_date: "",

  onboarding_completed: true,
};