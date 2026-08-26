export type TrainingRole =
  | "bike_recovery"
  | "bike_endurance"
  | "bike_tempo"
  | "bike_threshold"
  | "bike_vo2"
  | "bike_long"
  | "strength_lower_heavy"
  | "strength_upper_posture"
  | "strength_lower_unilateral"
  | "strength_core_prevention"
  | "strength_full_body";

export type ProfessionalSlot = {
  role: TrainingRole;
  type: "bike" | "strength";
  label: string;
  purpose: string;
  preferredZone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "Z6";
  targetDuration: number;
  lowerBodyLoad: "none" | "low" | "moderate" | "high";
  priority: number;
  rules: string[];
};

export type ProfessionalPlanInput = {
  bikeDays: number;
  strengthDays: number;
  cyclingLevel?: string | null;
  goal?: string | null;
  goalDetails?: string | null;
  targetEventName?: string | null;
  targetEventDate?: string | null;
  weeklyHours?: number | null;
  longestRecentRideKm?: number | null;
  availableMinutesByDay?: Record<string, number> | null;
  availableDays?: string[] | null;
  averageReadiness?: number | null;
  recentAdherence?: number | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function maxAvailableMinutes(minutes?: Record<string, number> | null): number | null {
  if (!minutes) return null;
  const values = Object.values(minutes).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : null;
}

function bikeQualityRole(input: ProfessionalPlanInput): "bike_threshold" | "bike_vo2" {
  const text = `${input.goal ?? ""} ${input.goalDetails ?? ""} ${input.targetEventName ?? ""}`.toLowerCase();
  const level = String(input.cyclingLevel ?? "").toLowerCase();
  if ((input.averageReadiness ?? 100) < 60) return "bike_threshold";
  if (/prova|mtb|xc|xco|subida|performance|velocidade|compet|vo2|explos/.test(text) && level !== "beginner") {
    return "bike_vo2";
  }
  return "bike_threshold";
}

function bikeDuration(role: TrainingRole, input: ProfessionalPlanInput): number {
  const maxWindow = maxAvailableMinutes(input.availableMinutesByDay);
  const weeklyMinutes = input.weeklyHours && input.weeklyHours > 0 ? input.weeklyHours * 60 : null;

  if (role === "bike_long") {
    const baseline = weeklyMinutes ? Math.round(weeklyMinutes * 0.35) : 150;
    const readinessFactor = (input.averageReadiness ?? 100) < 60 ? 0.85 : 1;
    const adherenceFactor = (input.recentAdherence ?? 100) < 70 ? 0.9 : 1;
    const candidate = clamp(Math.round(baseline * readinessFactor * adherenceFactor), 90, 240);
    const available = new Set(input.availableDays ?? []);
    const weekendWindows = ["saturday", "sunday"]
      .filter((day) => !available.size || available.has(day))
      .map((day) => Number(input.availableMinutesByDay?.[day] ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const weekendMax = weekendWindows.length ? Math.max(...weekendWindows) : null;
    const usableWindow = weekendMax ?? maxWindow;
    return usableWindow ? Math.min(candidate, usableWindow) : candidate;
  }
  if (role === "bike_recovery") return 45;
  if (role === "bike_endurance") return 60;
  if (role === "bike_tempo") return 60;
  if (role === "bike_threshold") return 60;
  if (role === "bike_vo2") return 55;
  return 60;
}

function bikeSlot(role: TrainingRole, input: ProfessionalPlanInput): ProfessionalSlot {
  const common = {
    type: "bike" as const,
    targetDuration: bikeDuration(role, input),
    lowerBodyLoad: "none" as const,
  };

  switch (role) {
    case "bike_recovery":
      return { ...common, role, label: "Recuperação ativa e técnica", purpose: "Recuperar mantendo frequência de pedal e técnica.", preferredZone: "Z1", priority: 40, rules: ["Não transformar em treino de ritmo.", "Ideal após sessão-chave ou longão."] };
    case "bike_endurance":
      return { ...common, role, label: "Base aeróbica / endurance", purpose: "Construir resistência aeróbica com baixo custo de fadiga.", preferredZone: "Z2", priority: 55, rules: ["Ritmo conversável e estável.", "Pode coexistir com musculação de superiores/core se necessário."] };
    case "bike_tempo":
      return { ...common, role, label: "Tempo / ritmo sustentado", purpose: "Sustentar potência/esforço moderado e melhorar economia.", preferredZone: "Z3", priority: 70, rules: ["Não colocar ao lado de outro treino-chave quando houver alternativa."] };
    case "bike_threshold":
      return { ...common, role, label: "Limiar controlado", purpose: "Desenvolver tolerância a esforço próximo do limiar sem excesso de fadiga.", preferredZone: "Z4", priority: 90, rules: ["Separar de pernas pesadas por pelo menos 48 h quando possível.", "Nunca no mesmo dia de pernas pesadas."] };
    case "bike_vo2":
      return { ...common, role, label: "VO2 / intervalos de alta intensidade", purpose: "Elevar potência aeróbica e capacidade de repetir esforços intensos.", preferredZone: "Z5", priority: 95, rules: ["Somente um treino VO2 na semana padrão.", "Separar de pernas pesadas e longão."] };
    case "bike_long":
      return { ...common, role, label: "Longão de endurance", purpose: "Desenvolver resistência específica, estratégia de ritmo, hidratação e alimentação.", preferredZone: "Z2", priority: 100, rules: ["EXATAMENTE um longão por semana.", "Priorizar sábado/domingo quando disponíveis.", "Usar a maior janela de tempo disponível.", "Não combinar com treino intenso ou pernas pesadas."] };
    default:
      return { ...common, role: "bike_endurance", label: "Base aeróbica", purpose: "Base aeróbica.", preferredZone: "Z2", priority: 50, rules: [] };
  }
}

function strengthSlot(role: TrainingRole): ProfessionalSlot {
  switch (role) {
    case "strength_lower_heavy":
      return { role, type: "strength", label: "Força de membros inferiores + core", purpose: "Desenvolver força máxima/submáxima útil ao ciclismo com baixo volume e alta qualidade técnica.", preferredZone: "Z1", targetDuration: 55, lowerBodyLoad: "high", priority: 85, rules: ["RIR 2-3; evitar falha muscular.", "2-4 exercícios principais de pernas + core.", "Não posicionar no mesmo dia ou na véspera de tiros/limiar/VO2/longão."] };
    case "strength_upper_posture":
      return { role, type: "strength", label: "Superiores + estabilidade postural", purpose: "Melhorar sustentação na bike, equilíbrio escapular e resistência de tronco.", preferredZone: "Z1", targetDuration: 45, lowerBodyLoad: "none", priority: 45, rules: ["Priorizar puxadas, remadas, empurradas e controle escapular.", "Pode coexistir com pedal leve quando necessário."] };
    case "strength_lower_unilateral":
      return { role, type: "strength", label: "Unilateral + cadeia posterior + core", purpose: "Corrigir assimetrias, reforçar glúteos/posteriores e controle unilateral sem repetir a sessão pesada.", preferredZone: "Z1", targetDuration: 50, lowerBodyLoad: "moderate", priority: 70, rules: ["Carga moderada; RIR 3.", "Menor volume que a sessão pesada de pernas.", "Evitar proximidade de treino-chave quando houver alternativa."] };
    case "strength_core_prevention":
      return { role, type: "strength", label: "Core + mobilidade + prevenção", purpose: "Aumentar estabilidade, tolerância postural e reduzir custo de fadiga periférica.", preferredZone: "Z1", targetDuration: 40, lowerBodyLoad: "low", priority: 35, rules: ["Sem carga pesada de pernas.", "Incluir anti-rotação, estabilidade lateral, mobilidade e prevenção."] };
    case "strength_full_body":
      return { role, type: "strength", label: "Força geral do ciclista", purpose: "Sessão única equilibrada para pernas, tronco e superiores, sem falha muscular.", preferredZone: "Z1", targetDuration: 55, lowerBodyLoad: "moderate", priority: 75, rules: ["Equilibrar padrão de agachar, dobrar quadril, puxar, empurrar e core.", "Não concentrar volume excessivo de pernas."] };
    default:
      return strengthSlot("strength_core_prevention");
  }
}

export function buildProfessionalWeek(input: ProfessionalPlanInput): ProfessionalSlot[] {
  const bikeDays = clamp(Math.round(input.bikeDays || 0), 0, 7);
  const strengthDays = clamp(Math.round(input.strengthDays || 0), 0, 4);
  const quality = bikeQualityRole(input);

  let bikeRoles: TrainingRole[] = [];
  if (bikeDays === 1) bikeRoles = ["bike_endurance"];
  if (bikeDays === 2) bikeRoles = [quality, "bike_long"];
  if (bikeDays === 3) bikeRoles = ["bike_endurance", quality, "bike_long"];
  if (bikeDays === 4) bikeRoles = ["bike_recovery", "bike_tempo", quality, "bike_long"];
  if (bikeDays === 5) bikeRoles = ["bike_recovery", "bike_endurance", "bike_tempo", quality, "bike_long"];
  if (bikeDays >= 6) bikeRoles = ["bike_recovery", "bike_endurance", "bike_tempo", quality, "bike_endurance", "bike_long", "bike_recovery"].slice(0, bikeDays);

  let strengthRoles: TrainingRole[] = [];
  if (strengthDays === 1) strengthRoles = ["strength_full_body"];
  if (strengthDays === 2) strengthRoles = ["strength_lower_heavy", "strength_upper_posture"];
  if (strengthDays === 3) strengthRoles = ["strength_lower_heavy", "strength_upper_posture", "strength_core_prevention"];
  if (strengthDays === 4) strengthRoles = ["strength_lower_heavy", "strength_upper_posture", "strength_lower_unilateral", "strength_core_prevention"];

  return [
    ...bikeRoles.map((role) => bikeSlot(role, input)),
    ...strengthRoles.map((role) => strengthSlot(role)),
  ];
}

export function professionalPlanSummary(slots: ProfessionalSlot[]): string {
  return slots
    .map((slot, index) => `${index + 1}. ${slot.role} | ${slot.label} | ${slot.targetDuration} min | ${slot.preferredZone} | ${slot.purpose} | Regras: ${slot.rules.join(" ")}`)
    .join("\n");
}

export function validateProfessionalWeek(slots: ProfessionalSlot[], expectedBike: number, expectedStrength: number): string[] {
  const errors: string[] = [];
  const bike = slots.filter((slot) => slot.type === "bike");
  const strength = slots.filter((slot) => slot.type === "strength");
  const longCount = slots.filter((slot) => slot.role === "bike_long").length;
  const heavyLowerCount = slots.filter((slot) => slot.role === "strength_lower_heavy").length;
  const relevantLowerCount = slots.filter((slot) => slot.lowerBodyLoad === "high" || slot.lowerBodyLoad === "moderate").length;

  if (bike.length !== expectedBike) errors.push(`Estrutura possui ${bike.length} pedais; esperado: ${expectedBike}.`);
  if (strength.length !== expectedStrength) errors.push(`Estrutura possui ${strength.length} musculações; esperado: ${expectedStrength}.`);
  if (expectedBike >= 2 && longCount !== 1) errors.push(`A semana precisa ter exatamente 1 longão; encontrado: ${longCount}.`);
  if (heavyLowerCount > 1) errors.push("A semana não pode ter mais de uma sessão pesada de membros inferiores.");
  if (relevantLowerCount > 2) errors.push("A semana não pode ter mais de duas sessões com carga relevante de membros inferiores.");
  return errors;
}
