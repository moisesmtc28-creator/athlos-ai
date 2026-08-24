import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

function createAuthenticatedClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Variáveis do Supabase não configuradas.");
  }

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function getCurrentWeekRange() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const today = new Date(Date.UTC(year, month - 1, day, 12));

  const weekday = today.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;

  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - daysSinceMonday);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const supabase = createAuthenticatedClient(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
    }

    const user = authData.user;
    const { data: profile, error: profileError } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(profileError?.message ?? "Perfil esportivo não encontrado.");
    }

    const week = getCurrentWeekRange();

    // Fecha qualquer treino antigo que tenha ficado pendente.
    const { error: closeOldError } = await supabase
      .from("training_sessions")
      .update({ status: "missed" })
      .eq("profile_id", profile.id)
      .lt("scheduled_date", week.start)
      .in("status", ["planned", "in_progress"]);

    if (closeOldError) {
      throw new Error(`Erro ao fechar treinos antigos: ${closeOldError.message}`);
    }

    // Remove sessões da semana atual em diante. Isso é intencional: o botão é
    // um reset de correção para reconstruir o calendário a partir desta semana.
    const { error: deleteSessionsError } = await supabase
      .from("training_sessions")
      .delete()
      .eq("profile_id", profile.id)
      .gte("scheduled_date", week.start);

    if (deleteSessionsError) {
      throw new Error(`Erro ao zerar os treinos: ${deleteSessionsError.message}`);
    }

    // Remove também os planos atuais/futuros para liberar a restrição única.
    const { error: deletePlansError } = await supabase
      .from("training_plans")
      .delete()
      .eq("user_id", user.id)
      .gte("end_date", week.start);

    if (deletePlansError) {
      throw new Error(`Erro ao limpar os planos: ${deletePlansError.message}`);
    }

    return NextResponse.json({
      ok: true,
      currentWeek: week,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Erro desconhecido.";
    console.error("Erro ao zerar treinos:", error);

    return NextResponse.json(
      { error: "Não foi possível zerar os treinos.", details },
      { status: 500 },
    );
  }
}
