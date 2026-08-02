import { supabase } from "./supabase";

export type AuthenticatedDestination =
  | "/"
  | "/admin"
  | "/profile"
  | "/login"
  | "/pending"
  | "/rejected";

type AthleteAccessProfile = {
  onboarding_completed: boolean | null;
  status: string | null;
  role: string | null;
};

export async function getAuthenticatedDestination(): Promise<AuthenticatedDestination> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        "Erro ao verificar sessão:",
        sessionError,
      );

      return "/login";
    }

    if (!session?.user) {
      return "/login";
    }

    const user = session.user;

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("athlete_profiles")
      .select(
        `
          onboarding_completed,
          status,
          role
        `,
      )
      .eq("user_id", user.id)
      .maybeSingle<AthleteAccessProfile>();

    if (profileError) {
      console.error(
        "Erro ao verificar perfil:",
        profileError,
      );

      return "/login";
    }

    if (!profile) {
      const fullName =
        typeof user.user_metadata?.full_name ===
        "string"
          ? user.user_metadata.full_name.trim()
          : "";

      const { error: createProfileError } =
        await supabase
          .from("athlete_profiles")
          .upsert(
            {
              user_id: user.id,
              full_name: fullName || null,
              onboarding_completed: false,
              status: "pending",
              role: "athlete",
            },
            {
              onConflict: "user_id",
            },
          );

      if (createProfileError) {
        console.error(
          "Erro ao criar perfil pendente:",
          createProfileError,
        );

        return "/login";
      }

      return "/pending";
    }

    const status =
      profile.status?.trim().toLowerCase();

    const role =
      profile.role?.trim().toLowerCase();

    if (status === "pending") {
      return "/pending";
    }

    if (status === "rejected") {
      return "/rejected";
    }

    const isApproved =
      status === "approved" || !status;

    if (!isApproved) {
      return "/pending";
    }

    /*
     * Administrador aprovado entra diretamente
     * no painel administrativo.
     */
    if (role === "admin") {
      return "/admin";
    }

    /*
     * Atleta aprovado ainda precisa preencher
     * os dados do perfil.
     */
    if (!profile.onboarding_completed) {
      return "/profile";
    }

    return "/";
  } catch (error) {
    console.error(
      "Erro inesperado ao decidir destino:",
      error,
    );

    return "/login";
  }
}