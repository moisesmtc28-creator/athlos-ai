import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askGemini } from "@/services/ai-provider";
import { scheduleTrainingWeek } from "@/services/planning-engine";
import type { Training } from "@/types/training";

type AthleteProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  birth_date: string | null;
  sex: string | null;
  height_cm: number | null;
  current_weight: number | null;
  target_weight: number | null;
  max_heart_rate: number | null;
  resting_heart_rate: number | null;
  ftp: number | null;
  cycling_level: string | null;
  preferred_bike: string | null;
  terrain: string | null;
  weekly_hours: number | null;
  goal: string | null;
  cycling_years: number | null;
  main_cycling_type: string | null;
  training_frequency: number | null;
  longest_recent_ride_km: number | null;
  average_speed_kmh: number | null;
  has_heart_rate_monitor: boolean;
  has_power_meter: boolean;
  has_cadence_sensor: boolean;
  has_speed_sensor: boolean;
  has_indoor_trainer: boolean;
  has_gps_computer: boolean;
  does_strength_training: boolean;
  strength_days_per_week: number | null;
  physical_limitations: string | null;
  preferred_training_time: string | null;
  available_days: string[] | null;
  available_minutes_by_day: Record<string, number> | null;
  gym_days: string[] | null;
  goal_details: string | null;
  target_event_name: string | null;
  target_event_date: string | null;
  onboarding_completed: boolean;
};

type PreviousSession = {
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number;
  completed_duration_minutes: number | null;
  zone: string;
  status: string;
  perceived_effort: number | null;
  athlete_feedback: string | null;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  distance_km: number | null;
  average_speed: number | null;
  cadence: number | null;
  elevation_gain: number | null;
  original_scheduled_date?: string | null;
  reschedule_reason?: string | null;
  missed_reason?: string | null;
  session_type?: string | null;
};

type GeminiExercise = {
  name: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
  loadKg?: number | null;
  restSeconds?: number;
  instructions?: string;
};

type GeminiSession = {
  title: string;
  description: string;
  date: string;
  duration: number;
  zone: string;
  type?: "bike" | "strength";
  focus?: string;
  exercises?: GeminiExercise[];
};

type GeminiPlan = {
  weekGoal: string;
  sessions: GeminiSession[];
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatBrazilianDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getBrazilToday(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function getWeekDates(targetWeek: "current" | "next"): string[] {
  const today = getBrazilToday();
  const currentDay = today.getUTCDay();
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - daysSinceMonday);

  if (targetWeek === "next") {
    monday.setUTCDate(monday.getUTCDate() + 7);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date.toISOString().split("T")[0];
  });
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(`${birthDate}T12:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const birthdayHasNotOccurred =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate());

  if (birthdayHasNotOccurred) {
    age--;
  }

  return age;
}

function isValidZone(zone: string): zone is Training["zone"] {
  return ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"].includes(zone);
}

function normalizeAvailableDays(
  availableDays: string[] | null,
): string {
  if (!availableDays?.length) {
    return "não informados";
  }

  return availableDays.join(", ");
}

function normalizeMinutesByDay(
  minutes: Record<string, number> | null,
): string {
  if (!minutes || Object.keys(minutes).length === 0) {
    return "não informado";
  }

  return Object.entries(minutes)
    .map(([day, value]) => `${day}: ${value} minutos`)
    .join(", ");
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.substring(7).trim();
}

function createAuthenticatedClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "As variáveis do Supabase não foram configuradas.",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: "Rota funcionando",
  });
}

export async function POST(request: NextRequest) {
  let createdPlanId: string | null = null;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      targetWeek?: "current" | "next";
    };
    const targetWeek = body.targetWeek === "current" ? "current" : "next";

    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        },
      );
    }

    const supabase = createAuthenticatedClient(accessToken);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Sessão inválida ou expirada.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * 1. Buscar o perfil do usuário autenticado
     */
    const { data: profileData, error: profileError } =
      await supabase
        .from("athlete_profiles")
        .select(`
          id,
          user_id,
          full_name,
          birth_date,
          sex,
          height_cm,
          current_weight,
          target_weight,
          max_heart_rate,
          resting_heart_rate,
          ftp,
          cycling_level,
          preferred_bike,
          terrain,
          weekly_hours,
          goal,
          cycling_years,
          main_cycling_type,
          training_frequency,
          longest_recent_ride_km,
          average_speed_kmh,
          has_heart_rate_monitor,
          has_power_meter,
          has_cadence_sensor,
          has_speed_sensor,
          has_indoor_trainer,
          has_gps_computer,
          does_strength_training,
          strength_days_per_week,
          physical_limitations,
          preferred_training_time,
          available_days,
          available_minutes_by_day,
          gym_days,
          goal_details,
          target_event_name,
          target_event_date,
          onboarding_completed
        `)
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
      throw new Error(
        `Erro ao buscar o perfil: ${profileError.message}`,
      );
    }

    if (!profileData) {
      throw new Error(
        "Perfil esportivo não encontrado. Preencha seu perfil antes de gerar o plano.",
      );
    }

    const profile = profileData as AthleteProfile;

    if (!profile.onboarding_completed) {
      throw new Error(
        "Finalize o cadastro esportivo antes de gerar o plano.",
      );
    }

    /*
     * 2. Definir a semana solicitada
     */
    const plannedWeekDates = getWeekDates(targetWeek);
    const startDate = plannedWeekDates[0];
    const endDate = plannedWeekDates[6];

    /*
     * 3. Verificar se já existe plano para a semana
     */
    const { data: existingPlan, error: existingPlanError } =
      await supabase
        .from("training_plans")
        .select("id, title, start_date, end_date")
        .eq("user_id", user.id)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .maybeSingle();

    if (existingPlanError) {
      throw new Error(
        `Erro ao verificar planos existentes: ${existingPlanError.message}`,
      );
    }

    if (existingPlan) {
      const { data: existingSessions, error: sessionsError } =
        await supabase
          .from("training_sessions")
          .select(`
            id,
            title,
            description,
            scheduled_date,
            duration_minutes,
            zone,
            status,
            session_type
          `)
          .eq("plan_id", existingPlan.id)
          .order("scheduled_date", { ascending: true });

      if (sessionsError) {
        throw new Error(
          `Erro ao carregar o plano existente: ${sessionsError.message}`,
        );
      }

      if (existingSessions?.length) {
        const existingTrainings: Training[] = existingSessions.map(
          (session) => ({
            id: session.id,
            title: session.title,
            description: session.description ?? "",
            date: session.scheduled_date,
            duration: session.duration_minutes,
            zone: session.zone as Training["zone"],
            status: session.status as Training["status"],
            type: (session.session_type === "strength" ? "strength" : session.session_type === "recovery" ? "recovery" : "bike") as Training["type"],
          }),
        );

        return NextResponse.json({
          planId: existingPlan.id,
          weekGoal: existingPlan.title,
          trainings: existingTrainings,
          historyAnalyzed: 0,
          plannedWeek: { start: startDate, end: endDate },
          reusedExistingPlan: true,
        });
      }

      // Remove plano incompleto deixado por uma tentativa anterior.
      const { error: deleteStalePlanError } = await supabase
        .from("training_plans")
        .delete()
        .eq("id", existingPlan.id);

      if (deleteStalePlanError) {
        throw new Error(
          `Existe um plano incompleto e ele não pôde ser corrigido: ${deleteStalePlanError.message}`,
        );
      }
    }

    /*
     * 4. Buscar histórico do atleta
     */
    const { data: historyData, error: historyError } =
      await supabase
        .from("training_sessions")
        .select(`
          title,
          description,
          scheduled_date,
          duration_minutes,
          completed_duration_minutes,
          zone,
          status,
          perceived_effort,
          athlete_feedback,
          average_heart_rate,
          max_heart_rate,
          distance_km,
          average_speed,
          cadence,
          elevation_gain,
          original_scheduled_date,
          reschedule_reason,
          missed_reason,
          session_type
        `)
        .eq("profile_id", profile.id)
        .order("scheduled_date", { ascending: false })
        .limit(30);

    if (historyError) {
      throw new Error(
        `Erro ao buscar o histórico: ${historyError.message}`,
      );
    }

    const previousSessions =
      (historyData ?? []) as PreviousSession[];

    const { data: strengthHistory } = await supabase
      .from("strength_workouts")
      .select(`
        workout_label,focus,status,
        training_sessions!inner(scheduled_date),
        strength_exercises(exercise_name,muscle_group,target_reps,strength_sets(performed_load_kg,performed_reps,rpe,completed))
      `)
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: recentCheckins } = await supabase
      .from("daily_checkins")
      .select("checkin_date,readiness_score,sleep_hours,fatigue,muscle_soreness,motivation")
      .eq("profile_id", profile.id)
      .order("checkin_date", { ascending: false })
      .limit(7);

    const { data: athleteMemory } = await supabase
      .from("athlete_memory")
      .select("memory_key,memory_value,confidence")
      .eq("profile_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    const finalizedHistory = previousSessions.filter((item) => ["completed", "missed", "cancelled"].includes(item.status));
    const completedHistory = finalizedHistory.filter((item) => item.status === "completed");
    if (finalizedHistory.length) {
      const adherence = Math.round((completedHistory.length / finalizedHistory.length) * 100);
      await supabase.from("athlete_memory").upsert({
        profile_id: profile.id,
        memory_key: "recent_adherence",
        memory_value: `Aderência recente: ${adherence}% em ${finalizedHistory.length} sessões finalizadas.`,
        confidence: 0.9,
        source: "system",
        last_observed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id,memory_key" });
    }

    const requestedTrainingFrequency = Math.min(
      Math.max(profile.training_frequency ?? 4, 1),
      7,
    );

    const availableDaysCount =
      profile.available_days?.length ?? 0;

    const weeklyBikeDays =
      availableDaysCount > 0
        ? Math.min(
            requestedTrainingFrequency,
            availableDaysCount,
          )
        : requestedTrainingFrequency;

    const requestedStrengthDays = profile.does_strength_training
      ? Math.min(
          Math.max(
            profile.strength_days_per_week ?? profile.gym_days?.length ?? 0,
            0,
          ),
          4,
        )
      : 0;

    const athleteAge = calculateAge(profile.birth_date);

    const historyText =
      previousSessions.length === 0
        ? "O atleta ainda não possui histórico de treinos."
        : previousSessions
            .map(
              (session) => `
Data: ${session.scheduled_date}
Treino: ${session.title}
Descrição: ${session.description ?? "não informada"}
Zona: ${session.zone}
Duração planejada: ${session.duration_minutes} minutos
Duração concluída: ${
                session.completed_duration_minutes ?? "não informada"
              }
Status: ${session.status}
Esforço percebido: ${
                session.perceived_effort ?? "não informado"
              }
Feedback: ${
                session.athlete_feedback ?? "sem observações"
              }
Frequência média: ${
                session.average_heart_rate ?? "não informada"
              }
Frequência máxima: ${
                session.max_heart_rate ?? "não informada"
              }
Distância: ${session.distance_km ?? "não informada"} km
Velocidade média: ${
                session.average_speed ?? "não informada"
              } km/h
Cadência: ${session.cadence ?? "não informada"} rpm
Ganho de elevação: ${
                session.elevation_gain ?? "não informado"
              } metros
Tipo: ${session.session_type ?? "bike"}
Data original: ${session.original_scheduled_date ?? "igual à atual"}
Motivo do reagendamento: ${session.reschedule_reason ?? "nenhum"}
Motivo de não realização: ${session.missed_reason ?? "nenhum"}
`,
            )
            .join("\n");

    /*
     * 5. Criar o prompt
     */
    const prompt = `
Você é o treinador virtual do Athlos AI, especializado em ciclismo, progressão segura e planejamento individualizado.

Crie um plano integrado de ciclismo e musculação para a semana solicitada usando somente os dados fornecidos.

O plano deve continuar o treinamento anterior. Não crie uma semana aleatória.

DADOS DO ATLETA

Nome: ${profile.full_name ?? "não informado"}
Idade: ${athleteAge ?? "não informada"} anos
Sexo: ${profile.sex ?? "não informado"}
Altura: ${profile.height_cm ?? "não informada"} cm
Peso atual: ${profile.current_weight ?? "não informado"} kg
Peso-alvo: ${profile.target_weight ?? "não informado"} kg

Nível: ${profile.cycling_level ?? "não informado"}
Anos praticando ciclismo: ${
      profile.cycling_years ?? "não informado"
    }
Modalidade principal: ${
      profile.main_cycling_type ?? "não informada"
    }
Bicicleta preferida: ${profile.preferred_bike ?? "não informada"}
Terreno: ${profile.terrain ?? "não informado"}
Objetivo principal: ${profile.goal ?? "não informado"}
Detalhes do objetivo: ${
      profile.goal_details ?? "não informados"
    }

Frequência cardíaca máxima: ${
      profile.max_heart_rate ?? "não informada"
    } bpm
Frequência cardíaca de repouso: ${
      profile.resting_heart_rate ?? "não informada"
    } bpm
FTP: ${profile.ftp ?? "não informado"} watts

Dias disponíveis: ${normalizeAvailableDays(
      profile.available_days,
    )}
Tempo disponível por dia: ${normalizeMinutesByDay(
      profile.available_minutes_by_day,
    )}
Carga semanal disponível: ${
      profile.weekly_hours ?? "não informada"
    } horas
Quantidade de treinos de ciclismo solicitada: ${weeklyBikeDays}
Quantidade de treinos de musculação solicitada: ${requestedStrengthDays}
Horário preferido: ${
      profile.preferred_training_time ?? "não informado"
    }

Maior pedal recente: ${
      profile.longest_recent_ride_km ?? "não informado"
    } km
Velocidade média atual: ${
      profile.average_speed_kmh ?? "não informada"
    } km/h

Possui monitor cardíaco: ${
      profile.has_heart_rate_monitor ? "sim" : "não"
    }
Possui medidor de potência: ${
      profile.has_power_meter ? "sim" : "não"
    }
Possui sensor de cadência: ${
      profile.has_cadence_sensor ? "sim" : "não"
    }
Possui sensor de velocidade: ${
      profile.has_speed_sensor ? "sim" : "não"
    }
Possui rolo de treino: ${
      profile.has_indoor_trainer ? "sim" : "não"
    }
Possui ciclocomputador GPS: ${
      profile.has_gps_computer ? "sim" : "não"
    }

Faz musculação: ${
      profile.does_strength_training ? "sim" : "não"
    }
Dias de musculação por semana: ${
      profile.strength_days_per_week ?? "não informado"
    }
Dias de academia: ${normalizeAvailableDays(profile.gym_days)}
Limitações físicas: ${
      profile.physical_limitations ?? "nenhuma informada"
    }

Evento-alvo: ${
      profile.target_event_name ?? "nenhum informado"
    }
Data do evento-alvo: ${
      profile.target_event_date ?? "não informada"
    }

HISTÓRICO DOS ÚLTIMOS TREINOS

${historyText}

HISTÓRICO ESTRUTURADO DE MUSCULAÇÃO
${JSON.stringify(strengthHistory ?? [])}

CHECK-INS RECENTES DE PRONTIDÃO
${JSON.stringify(recentCheckins ?? [])}

MEMÓRIA ESPORTIVA DO ATLETA
${(athleteMemory ?? []).map((m: any) => `${m.memory_key}: ${m.memory_value}`).join("\n") || "Sem memória consolidada ainda."}

SEMANA A SER PLANEJADA

As únicas datas permitidas são:

${plannedWeekDates.join(", ")}

REGRAS OBRIGATÓRIAS

- Crie exatamente ${weeklyBikeDays} treinos de ciclismo e exatamente ${requestedStrengthDays} treinos de musculação.
- Cada sessão deve informar "type": "bike" ou "strength".
- Para musculação, use os dias de academia quando informados e detalhe exercícios, séries, repetições, descanso e orientação de carga.
- Toda sessão de musculação DEVE incluir o campo "focus" e um array "exercises" com 5 a 8 exercícios estruturados.
- Cada exercício deve ter name, muscleGroup, sets, reps, loadKg (use null quando não houver histórico de carga), restSeconds e instructions.
- Preserve exercícios principais entre semanas quando houver histórico, promovendo progressão gradual em vez de trocar a ficha inteira.
- Para musculação use zone "Z1" apenas como valor técnico do sistema; a intensidade real deve estar descrita no texto.
- A IA define o CONTEÚDO e a prioridade fisiológica das sessões. O Athlos fará a distribuição final dos dias com um motor de periodização.
- Evite sugerir musculação pesada de pernas junto ou na véspera de tiros, limiar, VO2 ou longão.
- Para o longão, considere que ele deve ocupar a maior janela de tempo disponível da semana.
- Use somente as datas permitidas como referência; a data final será validada pelo motor de agenda.
- Respeite os dias disponíveis do atleta.
- Respeite o tempo disponível em cada dia.
- Considere os dias de musculação para evitar excesso de carga.
- Analise o histórico antes de definir volume e intensidade.
- Evite aumentos bruscos de carga.
- Não programe treinos intensos em dias consecutivos.
- Inclua recuperação suficiente.
- Use Z1, Z2, Z3, Z4, Z5 ou Z6.
- Não prescreva potência caso o atleta não possua medidor.
- Priorize frequência cardíaca quando houver monitor cardíaco.
- Escreva em português do Brasil.
- Retorne exclusivamente JSON válido.
- Não use Markdown nem blocos de código.

FORMATO OBRIGATÓRIO

{
  "weekGoal": "objetivo principal da semana",
  "sessions": [
    {
      "title": "nome do treino",
      "description": "instruções completas e objetivas",
      "date": "AAAA-MM-DD",
      "duration": 60,
      "zone": "Z2",
      "type": "bike",
      "focus": "",
      "exercises": []
    },
    {
      "title": "Treino A — Pernas e core",
      "description": "orientações gerais",
      "date": "AAAA-MM-DD",
      "duration": 55,
      "zone": "Z1",
      "type": "strength",
      "focus": "Força de pernas sem comprometer o pedal intenso",
      "exercises": [
        {"name":"Agachamento","muscleGroup":"Pernas","sets":3,"reps":"8-10","loadKg":null,"restSeconds":120,"instructions":"Técnica controlada"}
      ]
    }
  ]
}
`;

    /*
     * 6. Consultar o Gemini
     */
    const rawResponse = await askGemini(prompt);

    const cleanedResponse = rawResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let plan: GeminiPlan;

    try {
      plan = JSON.parse(cleanedResponse) as GeminiPlan;
    } catch {
      throw new Error(
        "A IA retornou uma resposta em formato inválido.",
      );
    }

    if (!plan.weekGoal?.trim()) {
      throw new Error(
        "A IA não informou o objetivo da semana.",
      );
    }

    if (!Array.isArray(plan.sessions)) {
      throw new Error(
        "A IA não retornou uma lista de treinos.",
      );
    }

    const normalizeSessionType = (session: GeminiSession): "bike" | "strength" => {
      const title = String(session.title ?? "").toLowerCase();
      const focus = String(session.focus ?? "").toLowerCase();
      const hasExercises = Array.isArray(session.exercises) && session.exercises.length > 0;

      if (
        session.type === "strength" ||
        hasExercises ||
        /muscula|força|forca|academia|agachamento|supino|remada/.test(`${title} ${focus}`)
      ) {
        return "strength";
      }

      return "bike";
    };

    // Modelos gratuitos podem devolver sessões extras. O Athlos, e não a IA,
    // controla a quantidade final do plano. Normalizamos o tipo, separamos as
    // modalidades e mantemos exatamente a quantidade configurada no perfil.
    const normalizedSessions = plan.sessions.map((session) => ({
      ...session,
      type: normalizeSessionType(session),
    }));

    const bikeSessions = normalizedSessions
      .filter((session) => session.type === "bike")
      .slice(0, weeklyBikeDays);
    const strengthSessions = normalizedSessions
      .filter((session) => session.type === "strength")
      .slice(0, requestedStrengthDays);

    if (bikeSessions.length < weeklyBikeDays || strengthSessions.length < requestedStrengthDays) {
      throw new Error(
        `A IA não retornou treinos suficientes. Recebidos: ${bikeSessions.length}/${weeklyBikeDays} de ciclismo e ${strengthSessions.length}/${requestedStrengthDays} de musculação. Tente gerar novamente.`,
      );
    }

    // Daqui em diante trabalhamos somente com a quantidade correta.
    plan.sessions = [...bikeSessions, ...strengthSessions];

    /*
     * 7. Validar conteúdo e distribuir a semana com o motor de periodização.
     * A IA cria as sessões; o código decide os dias para evitar conflitos.
     */
    const contentSessions = plan.sessions.map((session, index) => {
      const sessionType = session.type === "strength" ? "strength" : "bike";
      const validZone =
        sessionType === "strength"
          ? "Z1"
          : isValidZone(session.zone)
            ? session.zone
            : "Z2";
      const suppliedDuration = Number(session.duration);
      const validDuration = Number.isFinite(suppliedDuration) && suppliedDuration > 0
        ? Math.round(suppliedDuration)
        : 60;

      return {
        id: String(index),
        title:
          sessionType === "strength"
            ? `Musculação — ${(session.title?.trim() || `Treino ${index + 1}`)
                .replace(/^muscula(?:ção|cao)\s*(?:—|-|:)\s*/i, "")
                .trim()}`
            : session.title?.trim() || `Treino ${index + 1}`,
        description: session.description?.trim() || "Treino gerado pelo treinador Athlos AI.",
        duration: validDuration,
        zone: validZone,
        type: sessionType as "bike" | "strength",
        focus: session.focus?.trim() || "",
        exercises: session.exercises ?? [],
        preferredDate: plannedWeekDates.includes(session.date) ? session.date : null,
      };
    });

    const scheduledSessions = scheduleTrainingWeek(
      contentSessions,
      plannedWeekDates,
      {
        availableDays: profile.available_days,
        gymDays: profile.gym_days,
        availableMinutesByDay: profile.available_minutes_by_day,
      },
    );

    const trainings: Training[] = scheduledSessions.map((session) => ({
      id: crypto.randomUUID(),
      title: session.title,
      description: `${session.description}\n\nOrganização da semana: ${session.scheduleReason}`,
      date: session.date,
      duration: session.duration,
      zone: session.zone as Training["zone"],
      status: "planned",
      type: session.type,
    }));

    trainings.sort((first, second) => first.date.localeCompare(second.date));

    // Mantém a data organizada pelo motor também na estrutura usada para criar as fichas.
    plan.sessions = scheduledSessions.map((session) => ({
      title: session.title.replace(/^Musculação\s*—\s*/i, ""),
      description: session.description ?? "",
      date: session.date,
      duration: session.duration,
      zone: String(session.zone ?? "Z1"),
      type: session.type === "strength" ? "strength" : "bike",
      focus: session.focus ?? "",
      exercises: session.exercises as GeminiExercise[],
    }));

    /*
     * 8. Criar o plano
     */
    const planTitle = `Plano semanal - ${formatBrazilianDate(
      startDate,
    )} a ${formatBrazilianDate(endDate)}`;

    const { data: savedPlan, error: savePlanError } =
      await supabase
        .from("training_plans")
        .insert({
          user_id: user.id,
          title: planTitle,
          goal: plan.weekGoal.trim(),
          weeks: 1,
          level: profile.cycling_level ?? "intermediate",
          status: "active",
          start_date: startDate,
          end_date: endDate,
        })
        .select("id")
        .single();

    if (savePlanError || !savedPlan) {
      throw new Error(
        `Erro ao salvar o plano: ${
          savePlanError?.message ?? "registro não retornado"
        }`,
      );
    }

    createdPlanId = savedPlan.id;

    /*
     * 9. Salvar as sessões
     */
    const sessionsToSave = trainings.map((training) => ({
      profile_id: profile.id,
      plan_id: savedPlan.id,
      title: training.title,
      description: training.description,
      scheduled_date: training.date,
      duration_minutes: training.duration,
      zone: training.zone,
      status: training.status,
      generated_by_ai: true,
      session_type: training.type ?? (training.title.startsWith("Musculação") ? "strength" : "bike"),
    }));

    const { data: savedSessions, error: saveSessionsError } =
      await supabase
        .from("training_sessions")
        .insert(sessionsToSave)
        .select(`
          id,
          title,
          description,
          scheduled_date,
          duration_minutes,
          zone,
          status,
          session_type
        `);

    if (saveSessionsError || !savedSessions) {
      await supabase
        .from("training_plans")
        .delete()
        .eq("id", savedPlan.id);

      createdPlanId = null;

      throw new Error(
        `Erro ao salvar os treinos: ${
          saveSessionsError?.message ??
          "registros não retornados"
        }`,
      );
    }

    // 10. Para sessões de musculação, salva a ficha estruturada em tabelas próprias.
    for (const savedSession of savedSessions) {
      if ((savedSession as any).session_type !== "strength") continue;

      const aiSession = plan.sessions.find((item) => {
        const expectedTitle = `Musculação — ${item.title?.trim() || ""}`;
        return item.type === "strength" && item.date === savedSession.scheduled_date && expectedTitle === savedSession.title;
      }) ?? plan.sessions.find((item) => item.type === "strength" && item.date === savedSession.scheduled_date);

      const exercises = aiSession?.exercises?.length ? aiSession.exercises : [
        { name: "Agachamento", muscleGroup: "Pernas", sets: 3, reps: "8-10", loadKg: null, restSeconds: 120, instructions: "Execução controlada; pare antes da falha." },
        { name: "Levantamento terra romeno", muscleGroup: "Posterior", sets: 3, reps: "8-10", loadKg: null, restSeconds: 120, instructions: "Mantenha a coluna neutra." },
        { name: "Remada", muscleGroup: "Costas", sets: 3, reps: "10-12", loadKg: null, restSeconds: 90, instructions: "Controle a fase excêntrica." },
        { name: "Supino", muscleGroup: "Peito", sets: 3, reps: "8-12", loadKg: null, restSeconds: 90, instructions: "Evite falha muscular." },
        { name: "Prancha", muscleGroup: "Core", sets: 3, reps: "30", loadKg: null, restSeconds: 60, instructions: "30 segundos por série." },
      ];

      const { data: workout, error: workoutError } = await supabase.from("strength_workouts").insert({
        profile_id: profile.id,
        training_session_id: savedSession.id,
        workout_label: aiSession?.title?.trim() || "Treino de força",
        focus: aiSession?.focus?.trim() || "Força complementar ao ciclismo",
        status: "planned",
      }).select("id").single();
      if (workoutError || !workout) throw new Error(`Erro ao criar ficha de musculação: ${workoutError?.message ?? "registro não retornado"}`);

      for (const [exerciseIndex, exercise] of exercises.entries()) {
        const sets = Math.min(Math.max(Number(exercise.sets) || 3, 1), 6);
        const repsText = String(exercise.reps || "10");
        const firstRep = Number((repsText.match(/\d+/) || ["10"])[0]);
        const { data: savedExercise, error: exerciseError } = await supabase.from("strength_exercises").insert({
          workout_id: workout.id,
          exercise_name: exercise.name?.trim() || `Exercício ${exerciseIndex + 1}`,
          muscle_group: exercise.muscleGroup?.trim() || null,
          exercise_order: exerciseIndex + 1,
          target_sets: sets,
          target_reps: repsText,
          target_load_kg: exercise.loadKg == null ? null : (Number.isFinite(Number(exercise.loadKg)) ? Number(exercise.loadKg) : null),
          rest_seconds: Math.min(Math.max(Number(exercise.restSeconds) || 90, 30), 300),
          instructions: exercise.instructions?.trim() || null,
        }).select("id").single();
        if (exerciseError || !savedExercise) throw new Error(`Erro ao criar exercício: ${exerciseError?.message ?? "registro não retornado"}`);

        const setRows = Array.from({ length: sets }, (_, setIndex) => ({
          exercise_id: savedExercise.id,
          set_number: setIndex + 1,
          planned_reps: firstRep,
          planned_load_kg: exercise.loadKg == null ? null : (Number.isFinite(Number(exercise.loadKg)) ? Number(exercise.loadKg) : null),
        }));
        const { error: setsError } = await supabase.from("strength_sets").insert(setRows);
        if (setsError) throw new Error(`Erro ao criar séries: ${setsError.message}`);
      }
    }

    const returnedTrainings: Training[] = savedSessions.map(
      (session) => ({
        id: session.id,
        title: session.title,
        description: session.description ?? "",
        date: session.scheduled_date,
        duration: session.duration_minutes,
        zone: session.zone as Training["zone"],
        status: session.status as Training["status"],
        type: (session as any).session_type as Training["type"],
      }),
    );

    return NextResponse.json({
      planId: savedPlan.id,
      weekGoal: plan.weekGoal.trim(),
      trainings: returnedTrainings,
      historyAnalyzed: previousSessions.length,
      plannedWeek: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar plano:", {
      createdPlanId,
      error,
    });

    // Se qualquer etapa depois da criação do plano falhar (incluindo a criação
    // das fichas de musculação), removemos o plano recém-criado. Como as
    // sessões e fichas possuem ON DELETE CASCADE, isso evita deixar uma semana
    // parcialmente salva que seria reutilizada na próxima tentativa.
    if (createdPlanId) {
      try {
        const accessToken = getBearerToken(request);
        if (accessToken) {
          const cleanupClient = createAuthenticatedClient(accessToken);
          await cleanupClient.from("training_plans").delete().eq("id", createdPlanId);
        }
      } catch (cleanupError) {
        console.error("Falha ao limpar plano incompleto:", cleanupError);
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao gerar o plano.";

    return NextResponse.json(
      {
        error: "Não foi possível gerar o plano de treinos.",
        details: message,
      },
      {
        status: 500,
      },
    );
  }
}