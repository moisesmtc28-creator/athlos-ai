export type TrainingZone =
  | "Z1"
  | "Z2"
  | "Z3"
  | "Z4"
  | "Z5"
  | "Z6";

export type TrainingStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "missed"
  | "cancelled";

export interface Training {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  zone: TrainingZone;
  status: TrainingStatus;
}

export interface TrainingDetails extends Training {
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