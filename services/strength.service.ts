import { supabase } from "@/app/lib/supabase";
import type { StrengthProgress, StrengthWorkout } from "@/types/strength";

async function getProfileId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user) throw new Error("Usuário não autenticado.");
  const { data: profile, error: profileError } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Perfil esportivo não encontrado.");
  return profile.id as string;
}

export async function getStrengthWorkouts(): Promise<StrengthWorkout[]> {
  const profileId = await getProfileId();
  const { data, error } = await supabase
    .from("strength_workouts")
    .select(`
      id, training_session_id, workout_label, focus, status, notes,
      training_sessions!inner(scheduled_date,title),
      strength_exercises(
        id, exercise_name, muscle_group, exercise_order, target_sets, target_reps,
        target_load_kg, rest_seconds, instructions,
        strength_sets(id,set_number,planned_reps,performed_reps,planned_load_kg,performed_load_kg,rpe,rir,completed,notes)
      )
    `)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao carregar musculação: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    trainingSessionId: row.training_session_id,
    label: row.workout_label,
    focus: row.focus ?? "",
    status: row.status,
    date: row.training_sessions?.scheduled_date ?? "",
    title: row.training_sessions?.title ?? row.workout_label,
    notes: row.notes ?? "",
    exercises: (row.strength_exercises ?? [])
      .sort((a: any, b: any) => a.exercise_order - b.exercise_order)
      .map((exercise: any) => ({
        id: exercise.id,
        name: exercise.exercise_name,
        muscleGroup: exercise.muscle_group ?? "",
        order: exercise.exercise_order,
        targetSets: exercise.target_sets,
        targetReps: exercise.target_reps,
        targetLoadKg: exercise.target_load_kg == null ? null : Number(exercise.target_load_kg),
        restSeconds: exercise.rest_seconds,
        instructions: exercise.instructions ?? "",
        sets: (exercise.strength_sets ?? [])
          .sort((a: any, b: any) => a.set_number - b.set_number)
          .map((set: any) => ({
            id: set.id,
            setNumber: set.set_number,
            plannedReps: set.planned_reps,
            performedReps: set.performed_reps,
            plannedLoadKg: set.planned_load_kg == null ? null : Number(set.planned_load_kg),
            performedLoadKg: set.performed_load_kg == null ? null : Number(set.performed_load_kg),
            rpe: set.rpe == null ? null : Number(set.rpe),
            rir: set.rir == null ? null : Number(set.rir),
            completed: Boolean(set.completed),
            notes: set.notes ?? "",
          })),
      })),
  }));
}

export async function updateStrengthSet(input: {
  setId: string;
  performedReps: number | null;
  performedLoadKg: number | null;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
  notes?: string;
}) {
  const { error } = await supabase
    .from("strength_sets")
    .update({
      performed_reps: input.performedReps,
      performed_load_kg: input.performedLoadKg,
      rpe: input.rpe,
      rir: input.rir,
      completed: input.completed,
      notes: input.notes ?? "",
      completed_at: input.completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.setId);
  if (error) throw new Error(error.message);
}

export async function finishStrengthWorkout(workoutId: string, trainingSessionId: string) {
  const now = new Date().toISOString();
  const { error: workoutError } = await supabase
    .from("strength_workouts")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", workoutId);
  if (workoutError) throw new Error(workoutError.message);

  const { error: trainingError } = await supabase
    .from("training_sessions")
    .update({ status: "completed", updated_at: now })
    .eq("id", trainingSessionId);
  if (trainingError) throw new Error(trainingError.message);
}

export async function getStrengthProgress(): Promise<StrengthProgress[]> {
  const workouts = await getStrengthWorkouts();
  const byExercise = new Map<string, StrengthProgress["points"]>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const completed = exercise.sets.filter((s) => s.completed && s.performedLoadKg != null && s.performedReps != null);
      if (!completed.length) continue;
      const maxLoadKg = Math.max(...completed.map((s) => s.performedLoadKg ?? 0));
      const bestReps = Math.max(...completed.map((s) => s.performedReps ?? 0));
      const totalVolumeKg = completed.reduce((sum, s) => sum + (s.performedLoadKg ?? 0) * (s.performedReps ?? 0), 0);
      const points = byExercise.get(exercise.name) ?? [];
      points.push({ date: workout.date, maxLoadKg, totalVolumeKg, bestReps });
      byExercise.set(exercise.name, points);
    }
  }

  return Array.from(byExercise.entries()).map(([exerciseName, points]) => ({
    exerciseName,
    points: points.sort((a, b) => a.date.localeCompare(b.date)),
  }));
}
