import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askCoachAI, askGemini } from "@/services/ai-provider";
import { scheduleTrainingWeek } from "@/services/planning-engine";

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


function calendarChangeRequested(message: string): boolean {
  return /\b(mova|move|mude|altere|troque|passe|reagende|reorganize|reorganiza|coloque|quero\s+(?:mover|mudar|trocar)|pode\s+(?:mover|mudar|trocar|reorganizar))\b/i.test(message);
}

function brazilDateIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addIsoDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function weekBounds(value: string): { start: string; end: string; dates: string[] } {
  const date = new Date(`${value}T12:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  const start = date.toISOString().slice(0, 10);
  const dates = Array.from({ length: 7 }, (_, index) => addIsoDays(start, index));
  return { start, end: dates[6], dates };
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

    const { data: checkins } = await supabase
      .from("daily_checkins")
      .select("checkin_date,readiness_score,sleep_hours,fatigue,muscle_soreness,motivation")
      .eq("profile_id", profile.id)
      .order("checkin_date", { ascending: false })
      .limit(7);

    const { data: strengthRows } = await supabase
      .from("strength_workouts")
      .select(`
        workout_label,focus,status,
        training_sessions!inner(scheduled_date),
        strength_exercises(exercise_name,strength_sets(performed_load_kg,performed_reps,rpe,completed))
      `)
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: memories } = await supabase
      .from("athlete_memory")
      .select("memory_key,memory_value,confidence,last_observed_at")
      .eq("profile_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    const completedCount = (sessions ?? []).filter((item: any) => item.status === "completed").length;
    const decidedCount = (sessions ?? []).filter((item: any) => ["completed","missed","cancelled"].includes(item.status)).length;
    const adherence = decidedCount ? Math.round((completedCount / decidedCount) * 100) : null;
    if (adherence !== null) {
      await supabase.from("athlete_memory").upsert({
        profile_id: profile.id,
        memory_key: "recent_adherence",
        memory_value: `Aderência recente aproximada: ${adherence}% nos treinos com status finalizado.`,
        confidence: 0.9,
        source: "system",
        last_observed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id,memory_key" });
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

HISTÓRICO RECENTE DE CICLISMO/SESSÕES
${recentSessions || "Nenhum treino registrado."}

CHECK-INS RECENTES
${JSON.stringify(checkins ?? [])}

HISTÓRICO ESTRUTURADO DE MUSCULAÇÃO
${JSON.stringify(strengthRows ?? [])}

MEMÓRIA ESPORTIVA CONSOLIDADA
${(memories ?? []).map((m: any) => `${m.memory_key}: ${m.memory_value}`).join("\n") || "Sem memórias consolidadas ainda."}

CONVERSA RECENTE
${history || "Sem conversa anterior."}

PERGUNTA DO ATLETA
${message}
`;

    let answer = await askCoachAI(prompt);
    const calendarChanges: Array<{ id: string; from: string; to: string; reason: string }> = [];

    // Quando o atleta pede uma mudança concreta, Coach e calendário deixam de ser sistemas separados.
    // A IA interpreta o pedido e o motor determinístico valida a semana antes de persistir.
    if (calendarChangeRequested(message)) {
      const today = brazilDateIso();
      const horizon = addIsoDays(today, 21);
      const { data: plannedRows, error: plannedError } = await supabase
        .from("training_sessions")
        .select("id,title,description,scheduled_date,duration_minutes,zone,status,session_type,original_scheduled_date")
        .eq("profile_id", profile.id)
        .gte("scheduled_date", today)
        .lte("scheduled_date", horizon)
        .in("status", ["planned", "in_progress"])
        .order("scheduled_date");

      if (!plannedError && plannedRows?.length) {
        const allowedDates = Array.from({ length: 22 }, (_, index) => addIsoDays(today, index));
        const actionPrompt = `
Você interpreta pedidos de alteração de calendário esportivo.
Pedido do atleta: ${message}
Treinos futuros: ${JSON.stringify(plannedRows)}
Datas permitidas: ${allowedDates.join(", ")}
Retorne SOMENTE JSON válido no formato:
{"moves":[{"id":"uuid","date":"AAAA-MM-DD","reason":"motivo curto"}],"reorganize":false,"summary":"resumo"}
REGRAS: use apenas ids existentes; não invente treinos; se o pedido for geral para equilibrar a semana, use reorganize=true e moves=[]; se pedir mudança de um treino específico, identifique o id e a data exata.`;

        try {
          const rawAction = await askGemini(actionPrompt);
          const action = JSON.parse(rawAction.replace(/```json/gi, "").replace(/```/g, "").trim()) as {
            moves?: Array<{ id: string; date: string; reason?: string }>;
            reorganize?: boolean;
            summary?: string;
          };
          const knownIds = new Set(plannedRows.map((row) => row.id));
          const requestedMoves = (action.moves ?? []).filter((move) => knownIds.has(move.id) && allowedDates.includes(move.date));
          const nextWeekRequested = /pr[oó]xima\s+semana/i.test(message);
          const nextWeekAnchor = nextWeekRequested ? addIsoDays(weekBounds(today).start, 7) : null;
          const affectedDates = requestedMoves.length
            ? requestedMoves.map((move) => move.date)
            : action.reorganize
              ? [nextWeekAnchor ?? plannedRows[0].scheduled_date]
              : [];

          const affectedWeeks = new Map<string, { start: string; end: string; dates: string[] }>();
          for (const date of affectedDates) {
            const bounds = weekBounds(date);
            affectedWeeks.set(bounds.start, bounds);
          }

          for (const bounds of affectedWeeks.values()) {
            const rows = plannedRows.filter((row) => row.scheduled_date >= bounds.start && row.scheduled_date <= bounds.end);
            if (!rows.length) continue;
            const forcedDates: Record<string, string> = {};
            for (const move of requestedMoves) {
              if (move.date >= bounds.start && move.date <= bounds.end) forcedDates[move.id] = move.date;
            }
            const schedule = scheduleTrainingWeek(
              rows.map((row) => ({
                id: row.id, title: row.title, description: row.description, duration: row.duration_minutes,
                zone: row.zone, type: row.session_type === "strength" ? "strength" as const : row.session_type === "recovery" ? "recovery" as const : "bike" as const,
                preferredDate: row.scheduled_date,
              })),
              bounds.dates,
              { availableDays: profile.available_days, gymDays: profile.gym_days, availableMinutesByDay: profile.available_minutes_by_day },
              forcedDates,
            );

            for (const scheduled of schedule) {
              const current = rows.find((row) => row.id === scheduled.id);
              if (!current || current.scheduled_date === scheduled.date) continue;
              const requestedReason = requestedMoves.find((move) => move.id === scheduled.id)?.reason;
              const reason = requestedReason || scheduled.scheduleReason;
              const { error: updateError } = await supabase.from("training_sessions").update({
                scheduled_date: scheduled.date,
                original_scheduled_date: current.original_scheduled_date ?? current.scheduled_date,
                reschedule_reason: reason,
                updated_at: new Date().toISOString(),
              }).eq("id", scheduled.id);
              if (!updateError) calendarChanges.push({ id: scheduled.id!, from: current.scheduled_date, to: scheduled.date, reason });
            }
          }

          if (calendarChanges.length) {
            const details = calendarChanges.map((change) => `${change.from} → ${change.to}`).join("; ");
            answer += `\n\nCalendário atualizado automaticamente: ${details}. Reorganizei os demais treinos da semana quando necessário para proteger a recuperação.`;
          } else if (action.reorganize || requestedMoves.length) {
            answer += "\n\nAnalisei o calendário, mas a configuração atual já é a opção mais coerente dentro da sua disponibilidade.";
          }
        } catch (calendarError) {
          console.error("Falha ao aplicar mudança pedida no Coach:", calendarError);
          answer += "\n\nEntendi que você pediu uma alteração no calendário, mas não consegui aplicá-la automaticamente agora. Nenhum treino foi alterado.";
        }
      }
    }

    return NextResponse.json({ answer, calendarChanges });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Erro desconhecido.";
    console.error("Erro no Coach IA:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar o treinador.", details },
      { status: 500 },
    );
  }
}
