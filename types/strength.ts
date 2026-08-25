export type StrengthSet = {
  id: string;
  setNumber: number;
  plannedReps: number | null;
  performedReps: number | null;
  plannedLoadKg: number | null;
  performedLoadKg: number | null;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
  notes: string;
};

export type StrengthExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  order: number;
  targetSets: number;
  targetReps: string;
  targetLoadKg: number | null;
  restSeconds: number;
  instructions: string;
  sets: StrengthSet[];
};

export type StrengthWorkout = {
  id: string;
  trainingSessionId: string;
  label: string;
  focus: string;
  status: string;
  date: string;
  title: string;
  notes: string;
  exercises: StrengthExercise[];
};

export type StrengthProgress = {
  exerciseName: string;
  points: Array<{
    date: string;
    maxLoadKg: number;
    totalVolumeKg: number;
    bestReps: number;
  }>;
};
