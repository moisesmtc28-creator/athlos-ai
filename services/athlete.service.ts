import { supabase } from "@/app/lib/supabase";
import type { Athlete } from "@/types/athlete";

function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const birth = new Date(`${birthDate}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

export async function getAthlete(): Promise<Athlete> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("id, full_name, birth_date, height_cm, current_weight, target_weight, max_heart_rate, resting_heart_rate, ftp, preferred_bike, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar perfil: ${error.message}`);
  if (!data) throw new Error("Complete seu perfil esportivo.");

  return {
    id: data.id,
    name: data.full_name ?? user.email ?? "Atleta",
    age: calculateAge(data.birth_date),
    height: Number(data.height_cm ?? 0),
    currentWeight: Number(data.current_weight ?? 0),
    goalWeight: Number(data.target_weight ?? 0),
    maxHeartRate: Number(data.max_heart_rate ?? 0),
    restingHeartRate: data.resting_heart_rate ? Number(data.resting_heart_rate) : undefined,
    ftp: data.ftp ? Number(data.ftp) : undefined,
    bike: data.preferred_bike ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
