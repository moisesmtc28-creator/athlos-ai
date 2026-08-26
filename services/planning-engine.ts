import type { TrainingRole } from "@/services/professional-plan";

export type PlannerSessionType = "bike" | "strength" | "recovery";

export type PlannerSession = {
  id?: string;
  title: string;
  description?: string | null;
  duration: number;
  zone?: string | null;
  type: PlannerSessionType;
  focus?: string | null;
  exercises?: Array<{ muscleGroup?: string | null; name?: string | null }>;
  preferredDate?: string | null;
  role?: TrainingRole | null;
};

export type PlannerProfile = {
  availableDays?: string[] | null;
  gymDays?: string[] | null;
  availableMinutesByDay?: Record<string, number> | null;
};

export type ScheduledPlannerSession<T extends PlannerSession = PlannerSession> = T & {
  date: string;
  scheduleReason: string;
};

const weekdayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const lowerBodyPattern = /perna|quadr[ií]ceps|posterior|gl[uú]te|panturr|agach|leg press|terra|afundo|avan[cç]o|stiff|hamstring/i;
const corePattern = /core|abd[oô]m|prancha|lombar/i;
const upperBodyPattern = /superior|peito|costas|ombro|bra[cç]o|supino|remada|puxada|tr[ií]ceps|b[ií]ceps/i;
const longRidePattern = /long[aã]o|long ride|endurance longo|fundo|resist[eê]ncia longa/i;
const hardBikePattern = /tiro|interval|vo2|limiar|sprint|anaer[oó]b|sub[- ]?limiar|sweet spot/i;

function dayKey(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  return weekdayKeys[parsed.getUTCDay()] ?? "monday";
}

function isStrengthLower(session: PlannerSession): boolean {
  if (session.type !== "strength") return false;
  if (session.role === "strength_lower_heavy" || session.role === "strength_lower_unilateral" || session.role === "strength_full_body") return true;
  if (session.role === "strength_upper_posture" || session.role === "strength_core_prevention") return false;
  const exerciseText = (session.exercises ?? []).map((exercise) => `${exercise.name ?? ""} ${exercise.muscleGroup ?? ""}`).join(" ");
  const text = `${session.title} ${session.focus ?? ""} ${session.description ?? ""} ${exerciseText}`;
  if (lowerBodyPattern.test(text)) return true;
  if (upperBodyPattern.test(text) && !lowerBodyPattern.test(text)) return false;
  return !corePattern.test(text);
}

function isLongRide(session: PlannerSession): boolean {
  if (session.type !== "bike") return false;
  if (session.role === "bike_long") return true;
  if (session.role && session.role !== "bike_long") return false;
  return longRidePattern.test(`${session.title} ${session.description ?? ""}`) || session.duration >= 100;
}

function isHardBike(session: PlannerSession): boolean {
  if (session.type !== "bike") return false;
  if (session.role === "bike_threshold" || session.role === "bike_vo2") return true;
  if (session.role && ["bike_recovery", "bike_endurance", "bike_tempo", "bike_long"].includes(session.role)) return false;
  const zone = String(session.zone ?? "").toUpperCase();
  return ["Z4", "Z5", "Z6"].includes(zone) || hardBikePattern.test(`${session.title} ${session.description ?? ""}`);
}

function isModerateBike(session: PlannerSession): boolean {
  return session.type === "bike" && String(session.zone ?? "").toUpperCase() === "Z3" && !isHardBike(session);
}

function sessionPriority(session: PlannerSession): number {
  if (isLongRide(session)) return 100;
  if (isHardBike(session)) return 90;
  if (isStrengthLower(session)) return 80;
  if (isModerateBike(session)) return 60;
  if (session.type === "bike") return 50;
  if (session.type === "strength") return 40;
  return 20;
}

function dateDistance(a: string, b: string): number {
  const ms = Math.abs(new Date(`${a}T12:00:00Z`).getTime() - new Date(`${b}T12:00:00Z`).getTime());
  return Math.round(ms / 86_400_000);
}

function allowedDates(session: PlannerSession, weekDates: string[], profile: PlannerProfile): string[] {
  const bikeDays = profile.availableDays?.length ? new Set(profile.availableDays) : null;
  const strengthDays = profile.gymDays?.length ? new Set(profile.gymDays) : bikeDays;
  const allowedDays = session.type === "strength" ? strengthDays : bikeDays;
  const filtered = allowedDays ? weekDates.filter((date) => allowedDays.has(dayKey(date))) : weekDates;
  // Se o atleta informou dias específicos, nunca extrapole essa disponibilidade.
  // O fallback para qualquer dia da semana fazia o motor ignorar o perfil.
  return filtered;
}

function minuteCapacity(date: string, profile: PlannerProfile): number | null {
  const value = profile.availableMinutesByDay?.[dayKey(date)];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function pairPenalty(a: PlannerSession, aDate: string, b: PlannerSession, bDate: string): number {
  const distance = dateDistance(aDate, bDate);
  const sameDay = distance === 0;
  let score = 0;

  if (sameDay) {
    if ((isLongRide(a) && isHardBike(b)) || (isLongRide(b) && isHardBike(a))) score += 2200;
    if (isHardBike(a) && isHardBike(b)) score += 3000;
    if ((isLongRide(a) && b.type === "bike") || (isLongRide(b) && a.type === "bike")) score += 2500;
    if (isStrengthLower(a) && isStrengthLower(b)) score += 1400;
    if (a.type === "strength" && b.type === "strength") score += 700;
    if ((isHardBike(a) && isStrengthLower(b)) || (isHardBike(b) && isStrengthLower(a))) score += 10000;
    if ((isLongRide(a) && isStrengthLower(b)) || (isLongRide(b) && isStrengthLower(a))) score += 12000;
    if ((isHardBike(a) && b.type === "strength") || (isHardBike(b) && a.type === "strength")) score += 700;
    if ((a.type === "bike" && b.type === "strength") || (b.type === "bike" && a.type === "strength")) score += 90;
    if (a.type === b.type) score += 180;
  }

  if (distance === 1) {
    if (isStrengthLower(a) && isStrengthLower(b)) score += 2200;
    if (isHardBike(a) && isHardBike(b)) score += 800;
    if ((isLongRide(a) && isHardBike(b)) || (isLongRide(b) && isHardBike(a))) score += 1800;
    if ((isStrengthLower(a) && isHardBike(b)) || (isStrengthLower(b) && isHardBike(a))) score += 5000;
    if ((isStrengthLower(a) && isLongRide(b)) || (isStrengthLower(b) && isLongRide(a))) score += 6000;
  }

  if (distance === 2) {
    if ((isStrengthLower(a) && isHardBike(b)) || (isStrengthLower(b) && isHardBike(a))) score += 150;
    if ((isStrengthLower(a) && isLongRide(b)) || (isStrengthLower(b) && isLongRide(a))) score += 220;
  }

  return score;
}

function placementPenalty<T extends PlannerSession>(
  session: T,
  date: string,
  placed: Array<ScheduledPlannerSession<T>>,
  profile: PlannerProfile,
  weekDates: string[],
): number {
  let score = 0;
  const capacity = minuteCapacity(date, profile);

  if (capacity !== null && session.duration > capacity) {
    score += 1500 + (session.duration - capacity) * 8;
  }

  const sameDaySessions = placed.filter((item) => item.date === date);
  const sessionsSameDay = sameDaySessions.length;
  if (sessionsSameDay >= 2) score += 5000;
  else if (sessionsSameDay === 1) score += 250;

  // A capacidade é do DIA, não de cada sessão isoladamente.
  // Assim 2 sessões de 55 min não cabem em uma janela de 60 min.
  if (capacity !== null) {
    const usedMinutes = sameDaySessions.reduce((sum, item) => sum + item.duration, 0);
    const overflow = usedMinutes + session.duration - capacity;
    if (overflow > 0) score += 20000 + overflow * 50;
  }

  // Nunca é uma boa solução empilhar duas fichas de musculação no mesmo dia.
  if (session.type === "strength" && sameDaySessions.some((item) => item.type === "strength")) {
    score += 100000;
  }

  // Da mesma forma, dois pedais no mesmo dia só devem ocorrer como último recurso.
  if (session.type === "bike" && sameDaySessions.some((item) => item.type === "bike")) {
    score += 30000;
  }

  if (session.preferredDate && session.preferredDate !== date) score += 8;

  if (isLongRide(session)) {
    const longCandidates = allowedDates(session, weekDates, profile);
    const weekendCandidates = longCandidates.filter((candidate) => {
      const key = dayKey(candidate);
      return key === "saturday" || key === "sunday";
    });
    const capacities = longCandidates
      .map((candidate) => minuteCapacity(candidate, profile) ?? 0)
      .filter((value) => value > 0);
    const maxCapacity = capacities.length ? Math.max(...capacities) : 0;
    const currentCapacity = capacity ?? 0;
    if (maxCapacity > 0) score += Math.max(0, maxCapacity - currentCapacity) * 3;
    const weekday = dayKey(date);
    const isWeekend = weekday === "saturday" || weekday === "sunday";
    if (weekendCandidates.length && !isWeekend) score += 5000;
    if (isWeekend) score -= 500;
  }

  for (const other of placed) score += pairPenalty(session, date, other, other.date);
  return score;
}

function totalPenalty<T extends PlannerSession>(schedule: Array<ScheduledPlannerSession<T>>, profile: PlannerProfile, weekDates: string[]): number {
  let score = 0;
  for (let index = 0; index < schedule.length; index += 1) {
    const session = schedule[index];
    score += placementPenalty(session, session.date, schedule.slice(0, index), profile, weekDates);
  }
  return score;
}

function reasonFor(session: PlannerSession, date: string, profile: PlannerProfile): string {
  const capacity = minuteCapacity(date, profile);
  if (isLongRide(session)) return capacity ? `Longão alocado no dia com maior janela de treino (${capacity} min) e protegido de musculação pesada.` : "Longão protegido de musculação pesada e sessões intensas próximas.";
  if (isHardBike(session)) return "Treino-chave de intensidade separado de musculação pesada de pernas e de outro treino intenso.";
  if (isStrengthLower(session)) return "Musculação de pernas posicionada longe de tiros, limiar e longão para preservar recuperação.";
  if (session.type === "strength") return "Musculação complementar encaixada em dia de academia com menor conflito com o ciclismo.";
  if (String(session.zone ?? "").toUpperCase() === "Z1") return "Sessão leve usada para favorecer recuperação entre treinos-chave.";
  return "Sessão distribuída conforme disponibilidade, duração e equilíbrio de carga da semana.";
}

export function scheduleTrainingWeek<T extends PlannerSession>(
  sessions: T[],
  weekDates: string[],
  profile: PlannerProfile,
  forcedDates: Record<string, string> = {},
): Array<ScheduledPlannerSession<T>> {
  if (!weekDates.length) return [];

  const ordered = sessions
    .map((session, index) => ({ session, index }))
    .sort((a, b) => sessionPriority(b.session) - sessionPriority(a.session));

  const placed: Array<ScheduledPlannerSession<T> & { __index?: number }> = [];

  for (const { session, index } of ordered) {
    const forceKey = session.id ?? String(index);
    const forced = forcedDates[forceKey];
    const allowed = allowedDates(session, weekDates, profile);
    const candidates = forced && weekDates.includes(forced) ? [forced] : allowed;
    // Perfil inconsistente (ex.: pede 4 academias mas liberou só 2 dias) não deve
    // fazer o motor inventar disponibilidade. Mantemos a data preferida, se válida,
    // apenas para que a API consiga explicar o conflito ao usuário.
    const fallbackDate = session.preferredDate && weekDates.includes(session.preferredDate)
      ? session.preferredDate
      : weekDates[0];
    let bestDate = candidates[0] ?? fallbackDate;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const date of candidates) {
      const score = placementPenalty(session, date, placed, profile, weekDates);
      if (score < bestScore) {
        bestScore = score;
        bestDate = date;
      }
    }

    placed.push({ ...session, date: bestDate, scheduleReason: forced ? "Data solicitada pelo atleta; demais sessões foram ajustadas ao redor dela." : reasonFor(session, bestDate, profile), __index: index });
  }

  // Otimização local: tenta mover cada sessão para reduzir conflitos globais.
  for (let pass = 0; pass < 3; pass += 1) {
    let improved = false;
    for (let index = 0; index < placed.length; index += 1) {
      const current = placed[index];
      const forceKey = current.id ?? String(current.__index ?? index);
      if (forcedDates[forceKey]) continue;
      const candidates = allowedDates(current, weekDates, profile);
      if (!candidates.length) continue;
      const basePenalty = totalPenalty(placed, profile, weekDates);
      let bestDate = current.date;
      let bestPenalty = basePenalty;

      for (const date of candidates) {
        if (date === current.date) continue;
        const candidate = placed.map((item, itemIndex) => itemIndex === index ? { ...item, date } : item);
        const penalty = totalPenalty(candidate, profile, weekDates);
        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestDate = date;
        }
      }

      if (bestDate !== current.date) {
        placed[index] = { ...current, date: bestDate, scheduleReason: reasonFor(current, bestDate, profile) };
        improved = true;
      }
    }
    if (!improved) break;
  }

  return placed
    .sort((a, b) => (a.__index ?? 0) - (b.__index ?? 0))
    .map(({ __index: _ignored, ...session }) => session as ScheduledPlannerSession<T>);
}

export function summarizeScheduleConflicts<T extends PlannerSession>(schedule: Array<ScheduledPlannerSession<T>>): string[] {
  const conflicts: string[] = [];
  for (let i = 0; i < schedule.length; i += 1) {
    for (let j = i + 1; j < schedule.length; j += 1) {
      const a = schedule[i];
      const b = schedule[j];
      if (pairPenalty(a, a.date, b, b.date) >= 3000) {
        conflicts.push(`${a.title} e ${b.title} estão próximos demais para uma recuperação ideal.`);
      }
    }
  }
  return conflicts;
}
