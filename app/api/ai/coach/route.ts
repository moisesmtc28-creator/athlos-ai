import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askGeminiText } from "@/app/services/ai-provider";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestBody = {
  message?: string;
  history?: ChatMessage[];
};

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

function safeHistory(history: ChatMessage[] | undefined): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item): item is ChatMessage =>
        (item?.role === "user" || item?.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-8)
    .map((item) => ({ ...item, content: item.content.trim().slice(0, 1500) }));
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Digite uma pergunta para o treinador." }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "A mensagem é muito longa." }, { status: 400 });
    }

    const supabase = createAuthenticatedClient(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
    }

    const user = authData.user;

    const { data: profile, error: profileError } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Erro ao carregar perfil: ${profileError.message}`);
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Preencha seu perfil esportivo antes de usar o treinador." },
        { status: 400 },
      );
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("training_sessions")
      .select(
        "title, scheduled_date, duration_minutes, completed_duration_minutes, zone, status, perceived_effort, athlete_feedback, average_heart_rate, max_heart_rate, distance_km, average_speed, elevation_gain",
      )
      .eq("profile_id", profile.id)
      .order("scheduled_date", { ascending: false })
      .limit(12);

    if (sessionsError) {
      throw new Error(`Erro ao carregar histórico: ${sessionsError.message}`);
    }

    const history = safeHistory(body.history)
      .map((item) => `${item.role === "user" ? "ATLETA" : "TREINADOR"}: ${item.content}`)
      .join("\n");

    const recentSessions = (sessions ?? [])
      .map(
        (session) =>
          `${session.scheduled_date} | ${session.title} | ${session.zone} | planejado ${session.duration_minutes} min | concluído ${session.completed_duration_minutes ?? "n/i"} min | status ${session.status} | PSE ${session.perceived_effort ?? "n/i"} | FC média ${session.average_heart_rate ?? "n/i"} | distância ${session.distance_km ?? "n/i"} km | elevação ${session.elevation_gain ?? "n/i"} m | feedback ${session.athlete_feedback ?? "nenhum"}`,
      )
      .join("\n");

    const prompt = `
Você é o treinador de ciclismo do Athlos AI. Responda em português do Brasil, de forma objetiva, prática e segura.

REGRAS
- Use somente os dados fornecidos.
- Não invente medições, diagnósticos ou treinos já realizados.
- Quando faltarem dados importantes, diga exatamente o que falta.
- Considere ciclismo, musculação, recuperação e disponibilidade em conjunto.
- Evite aumentos bruscos de volume e intensidade.
- Não prescreva potência se o atleta não possui medidor de potência.
- Quando houver cinta cardíaca, prefira orientar por zonas de frequência cardíaca.
- Não substitua avaliação médica. Diante de dor no peito, desmaio, falta de ar incomum ou dor aguda, oriente interromper o exercício e procurar avaliação.
- Não use Markdown complexo. Pode usar parágrafos curtos e marcadores simples.
- Termine com uma recomendação clara para hoje ou para o próximo treino.

PERFIL DO ATLETA
Nome: ${profile.full_name ?? "não informado"}
Peso atual: ${profile.current_weight ?? "não informado"} kg
Peso-alvo: ${profile.target_weight ?? "não informado"} kg
Nível: ${profile.cycling_level ?? "não informado"}
Objetivo: ${profile.goal ?? "não informado"}
Detalhes do objetivo: ${profile.goal_details ?? "não informados"}
Modalidade: ${profile.main_cycling_type ?? "não informada"}
Terreno: ${profile.terrain ?? "não informado"}
FC máxima: ${profile.max_heart_rate ?? "não informada"} bpm
FC repouso: ${profile.resting_heart_rate ?? "não informada"} bpm
FTP: ${profile.ftp ?? "não informado"} W
Dias disponíveis: ${(profile.available_days ?? []).join(", ") || "não informados"}
Minutos por dia: ${JSON.stringify(profile.available_minutes_by_day ?? {})}
Treinos por semana: ${profile.training_frequency ?? "não informado"}
Horas semanais: ${profile.weekly_hours ?? "não informadas"}
Maior pedal recente: ${profile.longest_recent_ride_km ?? "não informado"} km
Velocidade média: ${profile.average_speed_kmh ?? "não informada"} km/h
Cinta cardíaca: ${profile.has_heart_rate_monitor ? "sim" : "não"}
Potenciômetro: ${profile.has_power_meter ? "sim" : "não"}
Rolo: ${profile.has_indoor_trainer ? "sim" : "não"}
Musculação: ${profile.does_strength_training ? "sim" : "não"}
Dias de academia: ${(profile.gym_days ?? []).join(", ") || "não informados"}
Limitações: ${profile.physical_limitations ?? "nenhuma informada"}
Evento-alvo: ${profile.target_event_name ?? "nenhum"}
Data do evento: ${profile.target_event_date ?? "não informada"}

HISTÓRICO RECENTE
${recentSessions || "Nenhum treino registrado."}

CONVERSA RECENTE
${history || "Sem conversa anterior."}

PERGUNTA DO ATLETA
${message}
`;

    const answer = await askGeminiText(prompt);

    return NextResponse.json({ answer });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Erro desconhecido.";
    console.error("Erro no Coach IA:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar o treinador.", details },
      { status: 500 },
    );
  }
}
