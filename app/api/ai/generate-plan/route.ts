import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askGemini } from "@/app/services/ai-provider";
import type { Training } from "@/app/types/training";

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
};

type GeminiSession = {
  title: string;
  description: string;
  date: string;
  duration: number;
  zone: string;
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

function getNextWeekDates(): string[] {
  const today = new Date();
  const currentDay = today.getDay();

  const daysUntilNextMonday =
    currentDay === 0 ? 1 : 8 - currentDay;

  const nextMonday = new Date(today);
  nextMonday.setHours(12, 0, 0, 0);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(nextMonday);
    date.setDate(nextMonday.getDate() + index);

    return formatDate(date);
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
     * 2. Definir a próxima semana
     */
    const nextWeekDates = getNextWeekDates();
    const startDate = nextWeekDates[0];
    const endDate = nextWeekDates[6];

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
            status
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
          elevation_gain
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
`,
            )
            .join("\n");

    /*
     * 5. Criar o prompt
     */
    const prompt = `
Você é o treinador virtual do Athlos AI, especializado em ciclismo, progressão segura e planejamento individualizado.

Crie um plano de ciclismo para a próxima semana usando somente os dados fornecidos.

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
Quantidade de treinos solicitada: ${weeklyBikeDays}
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

SEMANA A SER PLANEJADA

As únicas datas permitidas são:

${nextWeekDates.join(", ")}

REGRAS OBRIGATÓRIAS

- Crie exatamente ${weeklyBikeDays} treinos.
- Use somente as datas permitidas.
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
      "zone": "Z2"
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

    if (plan.sessions.length !== weeklyBikeDays) {
      throw new Error(
        `A IA retornou ${plan.sessions.length} treinos, mas deveria retornar ${weeklyBikeDays}.`,
      );
    }

    /*
     * 7. Validar os treinos
     */
    const usedDates = new Set<string>();

    const trainings: Training[] = plan.sessions.map(
      (session, index) => {
        const availableFallbackDate =
          nextWeekDates.find((date) => !usedDates.has(date)) ??
          nextWeekDates[
            Math.min(index, nextWeekDates.length - 1)
          ];

        const validDate =
          nextWeekDates.includes(session.date) &&
          !usedDates.has(session.date)
            ? session.date
            : availableFallbackDate;

        usedDates.add(validDate);

        const validZone = isValidZone(session.zone)
          ? session.zone
          : "Z2";

        const suppliedDuration = Number(session.duration);

        const validDuration =
          Number.isFinite(suppliedDuration) &&
          suppliedDuration > 0
            ? Math.round(suppliedDuration)
            : 60;

        return {
          id: crypto.randomUUID(),
          title:
            session.title?.trim() || `Treino ${index + 1}`,
          description:
            session.description?.trim() ||
            "Treino gerado pelo treinador Athlos AI.",
          date: validDate,
          duration: validDuration,
          zone: validZone,
          status: "planned",
        };
      },
    );

    trainings.sort(
      (first, second) =>
        new Date(first.date).getTime() -
        new Date(second.date).getTime(),
    );

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
          status
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

    const returnedTrainings: Training[] = savedSessions.map(
      (session) => ({
        id: session.id,
        title: session.title,
        description: session.description ?? "",
        date: session.scheduled_date,
        duration: session.duration_minutes,
        zone: session.zone as Training["zone"],
        status: session.status as Training["status"],
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
    console.error("Erro ao gerar plano com Gemini:", {
      createdPlanId,
      error,
    });

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