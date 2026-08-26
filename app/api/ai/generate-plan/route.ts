import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askGemini } from "@/services/ai-provider";
import { scheduleTrainingWeek } from "@/services/planning-engine";
import { buildProfessionalWeek, professionalPlanSummary, validateProfessionalWeek, type ProfessionalSlot, type TrainingRole } from "@/services/professional-plan";
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
  role?: TrainingRole;
};

type GeminiPlan = {
  weekGoal: string;
  sessions: GeminiSession[];
};

function fallbackBikeSession(index: number): GeminiSession & { type: "bike" } {
  const templates: Array<Omit<GeminiSession, "date" | "type"> & { type: "bike" }> = [
    { title: "Rodagem de Base e Técnica", description: "Pedale de forma contínua e confortável, priorizando cadência fluida, técnica e baixa fadiga. Termine com sensação de que conseguiria continuar.", duration: 60, zone: "Z2", type: "bike", focus: "Base aeróbica e eficiência", exercises: [] },
    { title: "Intervalado de Ritmo Sustentado", description: "Aqueça progressivamente. Faça 3 blocos de 8 minutos em ritmo sustentado Z3, com 4 minutos leves entre os blocos. Desaqueça ao final.", duration: 60, zone: "Z3", type: "bike", focus: "Resistência de ritmo", exercises: [] },
    { title: "Tiros de Limiar Controlados", description: "Aqueça bem. Faça 4 blocos de 4 minutos em Z4, recuperando 4 minutos em Z1/Z2. Mantenha a execução controlada, sem sprintar.", duration: 60, zone: "Z4", type: "bike", focus: "Limiar e capacidade aeróbica", exercises: [] },
    { title: "Longão de Resistência Aeróbica", description: "Pedal longo predominantemente em Z2. Mantenha alimentação, hidratação e ritmo constantes, evitando transformar o treino em prova.", duration: 180, zone: "Z2", type: "bike", focus: "Endurance e resistência aeróbica", exercises: [] },
  ];
  const template = templates[index % templates.length];
  return { ...template, date: "" };
}

function fallbackStrengthSession(index: number): GeminiSession & { type: "strength" } {
  const templates: Array<Omit<GeminiSession, "date" | "type"> & { type: "strength" }> = [
    {
      title: "Treino A — Força de pernas e core", description: "Sessão de força complementar ao ciclismo. Trabalhe com técnica limpa e 2 a 3 repetições em reserva.", duration: 55, zone: "Z1", type: "strength", focus: "Força de membros inferiores e estabilidade de core",
      exercises: [
        { name: "Agachamento", muscleGroup: "Quadríceps e glúteos", sets: 3, reps: "6-8", loadKg: null, restSeconds: 120, instructions: "Amplitude confortável e tronco estável." },
        { name: "Levantamento terra romeno", muscleGroup: "Posterior e glúteos", sets: 3, reps: "8-10", loadKg: null, restSeconds: 120, instructions: "Quadril para trás e coluna neutra." },
        { name: "Afundo", muscleGroup: "Pernas", sets: 3, reps: "8 por lado", loadKg: null, restSeconds: 90, instructions: "Controle o joelho e mantenha equilíbrio." },
        { name: "Panturrilha em pé", muscleGroup: "Panturrilhas", sets: 3, reps: "12-15", loadKg: null, restSeconds: 60, instructions: "Use amplitude completa." },
        { name: "Prancha", muscleGroup: "Core", sets: 3, reps: "30-45 s", loadKg: null, restSeconds: 60, instructions: "Mantenha quadril e tronco alinhados." },
      ],
    },
    {
      title: "Treino B — Superiores e estabilidade postural", description: "Sessão para sustentação na bicicleta, postura e equilíbrio muscular, sem gerar fadiga importante nas pernas.", duration: 50, zone: "Z1", type: "strength", focus: "Costas, peito, ombros e estabilidade escapular",
      exercises: [
        { name: "Puxada frontal", muscleGroup: "Costas", sets: 3, reps: "10-12", loadKg: null, restSeconds: 75, instructions: "Puxe com os cotovelos sem balançar o tronco." },
        { name: "Supino com halteres", muscleGroup: "Peito", sets: 3, reps: "8-12", loadKg: null, restSeconds: 90, instructions: "Controle a descida e não treine até a falha." },
        { name: "Remada baixa", muscleGroup: "Costas", sets: 3, reps: "10-12", loadKg: null, restSeconds: 75, instructions: "Aproxime as escápulas no final." },
        { name: "Desenvolvimento com halteres", muscleGroup: "Ombros", sets: 3, reps: "8-10", loadKg: null, restSeconds: 75, instructions: "Mantenha abdômen ativo." },
        { name: "Pallof press", muscleGroup: "Core", sets: 3, reps: "10 por lado", loadKg: null, restSeconds: 60, instructions: "Resista à rotação do tronco." },
      ],
    },
    {
      title: "Treino C — Unilateral, posterior e core", description: "Força funcional com ênfase unilateral. Use carga moderada e preserve qualidade para os pedais-chave.", duration: 55, zone: "Z1", type: "strength", focus: "Cadeia posterior, controle unilateral e core",
      exercises: [
        { name: "Step-up", muscleGroup: "Pernas e glúteos", sets: 3, reps: "8 por lado", loadKg: null, restSeconds: 90, instructions: "Suba sem impulso da perna de trás." },
        { name: "Mesa flexora", muscleGroup: "Posterior", sets: 3, reps: "10-12", loadKg: null, restSeconds: 75, instructions: "Controle todo o movimento." },
        { name: "Hip thrust", muscleGroup: "Glúteos", sets: 3, reps: "8-10", loadKg: null, restSeconds: 90, instructions: "Finalize com glúteos, sem hiperestender a lombar." },
        { name: "Remada unilateral", muscleGroup: "Costas", sets: 3, reps: "10 por lado", loadKg: null, restSeconds: 75, instructions: "Mantenha quadril estável." },
        { name: "Dead bug", muscleGroup: "Core", sets: 3, reps: "8 por lado", loadKg: null, restSeconds: 60, instructions: "Mantenha a lombar apoiada." },
      ],
    },
    {
      title: "Treino D — Superiores, core e prevenção", description: "Sessão de menor custo para as pernas, adequada para complementar semanas com bastante ciclismo.", duration: 45, zone: "Z1", type: "strength", focus: "Parte superior, core e prevenção de lesões",
      exercises: [
        { name: "Face pull", muscleGroup: "Ombros e escápulas", sets: 3, reps: "12-15", loadKg: null, restSeconds: 60, instructions: "Mantenha ombros baixos e controle a volta." },
        { name: "Remada sentada", muscleGroup: "Costas", sets: 3, reps: "10-12", loadKg: null, restSeconds: 75, instructions: "Evite compensar com a lombar." },
        { name: "Flexão ou chest press", muscleGroup: "Peito", sets: 3, reps: "8-12", loadKg: null, restSeconds: 75, instructions: "Pare antes da falha técnica." },
        { name: "Elevação lateral", muscleGroup: "Ombros", sets: 3, reps: "12-15", loadKg: null, restSeconds: 60, instructions: "Use carga leve e movimento controlado." },
        { name: "Prancha lateral", muscleGroup: "Core", sets: 3, reps: "30 s por lado", loadKg: null, restSeconds: 60, instructions: "Mantenha o corpo alinhado." },
      ],
    },
  ];
  const template = templates[index % templates.length];
  return { ...template, date: "" };
}


function inferTrainingRole(session: GeminiSession): TrainingRole | null {
  if (session.role) return session.role;
  const text = `${session.title ?? ""} ${session.focus ?? ""} ${session.description ?? ""}`.toLowerCase();
  if (session.type === "strength" || /muscula|academia|agach|supino|remada|core/.test(text)) {
    if (/superior|postur|escap|costas|peito|ombro/.test(text) && !/perna|quadr|gl[uú]te|posterior|agach|terra|afundo/.test(text)) return "strength_upper_posture";
    if (/unilateral|posterior|step|afundo|avan[cç]o|hip thrust/.test(text)) return "strength_lower_unilateral";
    if (/preven|mobil|core|estabil/.test(text) && !/perna|quadr|gl[uú]te|posterior|agach|terra/.test(text)) return "strength_core_prevention";
    if (/perna|quadr|gl[uú]te|agach|terra|for[cç]a/.test(text)) return "strength_lower_heavy";
    return "strength_full_body";
  }
  if (/long[aã]o|fundo|endurance longo|resist[eê]ncia longa/.test(text) || Number(session.duration) >= 100) return "bike_long";
  if (/vo2|z5|z6|anaer[oó]b|sprint/.test(text)) return "bike_vo2";
  if (/limiar|z4|sweet spot|sub[- ]?limiar|tiro/.test(text)) return "bike_threshold";
  if (/tempo|ritmo sustentado|z3/.test(text)) return "bike_tempo";
  if (/recuper|regener|z1|leve/.test(text)) return "bike_recovery";
  return "bike_endurance";
}

function fallbackForProfessionalSlot(slot: ProfessionalSlot): GeminiSession {
  const base: GeminiSession = {
    title: slot.label,
    description: slot.purpose,
    date: "",
    duration: slot.targetDuration,
    zone: slot.preferredZone,
    type: slot.type,
    focus: slot.purpose,
    exercises: [],
    role: slot.role,
  };

  if (slot.type === "bike") {
    if (slot.role === "bike_long") return { ...base, title: "Longão de Endurance", description: "Pedal longo predominantemente em Z2, com ritmo constante. Pratique hidratação e alimentação. Evite picos desnecessários de intensidade." };
    if (slot.role === "bike_vo2") return { ...base, title: "Intervalos de VO2 Controlados", description: "Aqueça 15 min. Execute blocos curtos em Z5 com recuperação completa, preservando qualidade. Desaqueça 10 min." };
    if (slot.role === "bike_threshold") return { ...base, title: "Limiar Controlado", description: "Aqueça 15 min. Faça blocos em Z4 com recuperação ativa suficiente para manter técnica e consistência. Finalize leve." };
    if (slot.role === "bike_tempo") return { ...base, title: "Ritmo Sustentado", description: "Sessão de tempo em Z3 com blocos sustentados, cadência fluida e controle de esforço." };
    if (slot.role === "bike_recovery") return { ...base, title: "Recuperação Ativa e Técnica", description: "Pedal muito leve em Z1, focado em soltar as pernas, cadência e técnica. Sem esforços adicionais." };
    return { ...base, title: "Base Aeróbica", description: "Pedal contínuo em Z2, confortável e estável, priorizando eficiência e baixa fadiga." };
  }

  const strengthTemplateIndex: Record<string, number> = {
    strength_lower_heavy: 0,
    strength_upper_posture: 1,
    strength_lower_unilateral: 2,
    strength_core_prevention: 3,
    strength_full_body: 0,
  };
  const template = fallbackStrengthSession(strengthTemplateIndex[slot.role] ?? 3);
  if (slot.role === "strength_full_body") {
    return {
      ...template,
      role: slot.role,
      title: "Força Geral do Ciclista",
      focus: slot.purpose,
      duration: slot.targetDuration,
      exercises: [
        { name: "Agachamento goblet", muscleGroup: "Pernas", sets: 3, reps: "8-10", loadKg: null, restSeconds: 90, instructions: "RIR 2-3, técnica perfeita." },
        { name: "Levantamento terra romeno", muscleGroup: "Posterior", sets: 3, reps: "8-10", loadKg: null, restSeconds: 90, instructions: "Quadril para trás e coluna neutra." },
        { name: "Remada", muscleGroup: "Costas", sets: 3, reps: "10-12", loadKg: null, restSeconds: 75, instructions: "Controle escapular." },
        { name: "Supino com halteres", muscleGroup: "Peito", sets: 3, reps: "8-12", loadKg: null, restSeconds: 75, instructions: "Pare antes da falha." },
        { name: "Pallof press", muscleGroup: "Core", sets: 3, reps: "10 por lado", loadKg: null, restSeconds: 60, instructions: "Resista à rotação." },
      ],
    };
  }
  return { ...template, role: slot.role, title: slot.label, focus: slot.purpose, duration: slot.targetDuration };
}

function isLowerBodyExercise(exercise: GeminiExercise): boolean {
  const text = `${exercise.name ?? ""} ${exercise.muscleGroup ?? ""}`.toLowerCase();
  return /perna|quadr|gl[uú]te|posterior|panturr|agach|terra|afundo|avan[cç]o|leg press|flexora|extensora|hip thrust|step/.test(text);
}

function sanitizeStrengthExercises(
  exercises: GeminiExercise[] | undefined,
  fallbackExercises: GeminiExercise[] | undefined,
  role: TrainingRole,
): GeminiExercise[] {
  const source = Array.isArray(exercises) ? exercises.filter((exercise) => exercise?.name?.trim()) : [];
  const fallback = Array.isArray(fallbackExercises) ? fallbackExercises : [];
  let filtered = source;

  // Superiores/core/prevenção não podem virar uma segunda ficha de pernas.
  if (role === "strength_upper_posture" || role === "strength_core_prevention") {
    filtered = source.filter((exercise) => !isLowerBodyExercise(exercise));
  }

  // Em sessão unilateral permitimos pernas, mas com volume menor: no máximo 3 exercícios de MMII.
  if (role === "strength_lower_unilateral") {
    let lowerCount = 0;
    filtered = source.filter((exercise) => {
      if (!isLowerBodyExercise(exercise)) return true;
      lowerCount += 1;
      return lowerCount <= 3;
    });
  }

  const names = new Set(filtered.map((exercise) => exercise.name.trim().toLowerCase()));
  for (const exercise of fallback) {
    if (filtered.length >= 5) break;
    if (!exercise.name?.trim()) continue;
    if ((role === "strength_upper_posture" || role === "strength_core_prevention") && isLowerBodyExercise(exercise)) continue;
    const key = exercise.name.trim().toLowerCase();
    if (!names.has(key)) {
      filtered.push(exercise);
      names.add(key);
    }
  }

  return filtered.slice(0, 8);
}

function buildRecentStrengthLoadMap(history: any[]): Map<string, number> {
  const loads = new Map<string, number>();
  for (const workout of history ?? []) {
    for (const exercise of workout?.strength_exercises ?? []) {
      const key = String(exercise?.exercise_name ?? "").trim().toLowerCase();
      if (!key || loads.has(key)) continue;
      const completedLoads = (exercise?.strength_sets ?? [])
        .filter((set: any) => set?.completed && Number.isFinite(Number(set?.performed_load_kg)))
        .map((set: any) => Number(set.performed_load_kg))
        .filter((value: number) => value > 0);
      if (completedLoads.length) loads.set(key, Math.max(...completedLoads));
    }
  }
  return loads;
}

function applyStrengthHistory(session: GeminiSession, loads: Map<string, number>): GeminiSession {
  if (session.type !== "strength" || !session.exercises?.length || !loads.size) return session;
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      const previous = loads.get(String(exercise.name ?? "").trim().toLowerCase());
      if (!previous) return exercise;
      return {
        ...exercise,
        loadKg: exercise.loadKg == null ? previous : exercise.loadKg,
        instructions: `${exercise.instructions?.trim() || "Execução técnica e controlada."} Referência da última carga concluída: ${previous} kg. Aumente somente se concluir todas as séries com técnica e RIR planejado.`,
      };
    }),
  };
}

function fitSessionToSlot(session: GeminiSession | undefined, slot: ProfessionalSlot): GeminiSession {
  const fallback = fallbackForProfessionalSlot(slot);
  if (!session) return fallback;

  const exercises = slot.type === "strength"
    ? sanitizeStrengthExercises(session.exercises, fallback.exercises, slot.role)
    : session.exercises;

  return {
    ...fallback,
    ...session,
    type: slot.type,
    role: slot.role,
    zone: slot.type === "strength" ? "Z1" : (isValidZone(session.zone) ? session.zone : slot.preferredZone),
    duration: Number.isFinite(Number(session.duration)) && Number(session.duration) > 0
      ? Math.min(Math.max(Math.round(Number(session.duration)), Math.max(30, slot.targetDuration - 20)), slot.targetDuration + 20)
      : slot.targetDuration,
    focus: session.focus?.trim() || slot.purpose,
    exercises,
  };
}

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
    const recentAdherencePct = finalizedHistory.length
      ? Math.round((completedHistory.length / finalizedHistory.length) * 100)
      : null;
    if (finalizedHistory.length && recentAdherencePct !== null) {
      const adherence = recentAdherencePct;
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

    const configuredStrengthDays = Math.max(
      profile.strength_days_per_week ?? profile.gym_days?.length ?? 0,
      0,
    );
    const gymAvailabilityCount = new Set(profile.gym_days ?? []).size;
    const requestedStrengthDays = profile.does_strength_training
      ? Math.min(
          configuredStrengthDays,
          gymAvailabilityCount > 0 ? gymAvailabilityCount : configuredStrengthDays,
          4,
        )
      : 0;

    const readinessValues = (recentCheckins ?? [])
      .map((item: any) => Number(item.readiness_score))
      .filter((value: number) => Number.isFinite(value));
    const averageReadiness = readinessValues.length
      ? Math.round(readinessValues.reduce((sum: number, value: number) => sum + value, 0) / readinessValues.length)
      : null;

    // SCRIPT PROFISSIONAL PRÉ-IA: define a estrutura fisiológica da semana antes
    // de qualquer chamada ao modelo. A IA apenas detalha o conteúdo de cada slot.
    const professionalSlots = buildProfessionalWeek({
      bikeDays: weeklyBikeDays,
      strengthDays: requestedStrengthDays,
      cyclingLevel: profile.cycling_level,
      goal: profile.goal,
      goalDetails: profile.goal_details,
      targetEventName: profile.target_event_name,
      targetEventDate: profile.target_event_date,
      weeklyHours: profile.weekly_hours,
      longestRecentRideKm: profile.longest_recent_ride_km,
      availableMinutesByDay: profile.available_minutes_by_day,
      availableDays: profile.available_days,
      averageReadiness,
      recentAdherence: recentAdherencePct,
    });

    const professionalErrors = validateProfessionalWeek(professionalSlots, weeklyBikeDays, requestedStrengthDays);
    if (professionalErrors.length) {
      throw new Error(`Falha na estrutura profissional da semana: ${professionalErrors.join(" ")}`);
    }

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

ESTRUTURA PROFISSIONAL DEFINIDA PELO ATHLOS ANTES DA IA

${professionalPlanSummary(professionalSlots)}

Você NÃO pode inventar, remover, duplicar ou trocar esses papéis fisiológicos. Gere exatamente uma sessão para cada role acima. O campo "role" é obrigatório e deve ser exatamente um dos roles fornecidos.

REGRAS OBRIGATÓRIAS

- Crie exatamente ${professionalSlots.length} sessões: uma e somente uma para cada role da estrutura profissional acima.
- Cada sessão deve informar "role" exatamente igual ao slot correspondente e "type": "bike" ou "strength".
- É PROIBIDO criar dois longões. O único role de longão permitido é "bike_long".
- Não converta um slot de base/recuperação/tempo em outro longão.
- Não converta musculação de superiores/core em sessão pesada de pernas.
- Para musculação, use EXCLUSIVAMENTE os dias de academia quando informados e detalhe exercícios, séries, repetições, descanso e orientação de carga.
- Nunca crie duas fichas de musculação para o mesmo dia.
- As fichas de musculação precisam ter funções diferentes na semana. Não repita "pernas e core" em todas.
- Se houver 3 ou 4 sessões de musculação, limite a no máximo 2 sessões com carga relevante de membros inferiores; use as demais para membros superiores, estabilidade escapular, core e prevenção de lesões do ciclista.
- Não coloque duas sessões pesadas de membros inferiores em dias consecutivos.
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
      "role": "bike_endurance",
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
      "role": "strength_lower_heavy",
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
      if (session.type === "strength" || hasExercises || /muscula|força|forca|academia|agachamento|supino|remada/.test(`${title} ${focus}`)) return "strength";
      return "bike";
    };

    // A estrutura fisiológica não é decidida pelo modelo. Cada resposta é
    // encaixada em um slot profissional previamente calculado. Isso impede
    // dois longões, quatro fichas de pernas ou ausência de um tipo de sessão.
    const candidates = plan.sessions.map((session) => ({
      ...session,
      type: normalizeSessionType(session),
      role: inferTrainingRole({ ...session, type: normalizeSessionType(session) }),
    }));
    const used = new Set<number>();

    const recentStrengthLoads = buildRecentStrengthLoadMap(strengthHistory ?? []);
    plan.sessions = professionalSlots.map((slot) => {
      const selectedIndex = candidates.findIndex((session, index) =>
        !used.has(index) && session.role === slot.role && session.type === slot.type,
      );
      // Se o modelo não entregou o role correto, usamos o fallback daquele
      // slot em vez de reaproveitar outra sessão do mesmo tipo. Isso evita,
      // por exemplo, transformar um segundo longão em "base" só no rótulo.
      if (selectedIndex >= 0) used.add(selectedIndex);
      const fitted = fitSessionToSlot(selectedIndex >= 0 ? candidates[selectedIndex] : undefined, slot);
      return applyStrengthHistory(fitted, recentStrengthLoads);
    });

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
        role: session.role ?? null,
        // O dia é responsabilidade do motor profissional, não da sugestão da IA.
        preferredDate: null,
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