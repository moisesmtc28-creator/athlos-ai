import { supabase } from "./supabase";

export async function getAuthenticatedDestination(): Promise<
  "/" | "/profile" | "/login"
> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return "/login";
  }

  const user = session.user;

  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao verificar perfil:",
      error,
    );

    return "/profile";
  }

  return data?.onboarding_completed
    ? "/"
    : "/profile";
}