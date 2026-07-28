import { supabase } from "./supabase";

export async function getAuthenticatedDestination(): Promise<
  "/" | "/profile"
> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return "/profile";
  }

  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar perfil:", error);
    return "/profile";
  }

  return data?.onboarding_completed ? "/" : "/profile";
}
