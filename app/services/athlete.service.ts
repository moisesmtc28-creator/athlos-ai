import { supabase } from "@/app/lib/supabase";
import type { Athlete } from "@/app/types/athlete";

function calculateAge(birthDate?: string | null): number {
  if (!birthDate) {
    return 41;
  }

  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference =
    today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export async function getAthlete(): Promise<Athlete> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Erro ao buscar usuário:", userError);

    throw new Error(
      `Erro ao verificar usuário: ${userError.message}`,
    );
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
    console.error(
      "Erro ao buscar athlete_profiles:",
      error,
    );

    throw new Error(
      `Erro ao buscar perfil: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "Nenhum perfil de atleta foi encontrado para este usuário.",
    );
  }

  return {
    id: data.id,
    name: data.full_name || "Atleta",
    age: calculateAge(data.birth_date),
    height: Number(data.height_cm ?? 0),
    currentWeight: Number(data.current_weight ?? 0),
    goalWeight: Number(data.target_weight ?? 0),
    maxHeartRate: Number(data.max_heart_rate ?? 0),

    restingHeartRate:
      data.resting_heart_rate !== null &&
      data.resting_heart_rate !== undefined
        ? Number(data.resting_heart_rate)
        : undefined,

    ftp:
      data.ftp !== null && data.ftp !== undefined
        ? Number(data.ftp)
        : undefined,

    bike: data.preferred_bike || undefined,

    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}