import { supabase } from "@/app/lib/supabase";

function weekBounds(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  const start = date.toISOString().slice(0, 10);
  const endDate = new Date(date);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

export async function moveTraining(trainingId: string, newDate: string, reason = "Movido pelo atleta no calendário") {
  const { data: current, error: readError } = await supabase
    .from("training_sessions")
    .select("scheduled_date, original_scheduled_date, reschedule_reason")
    .eq("id", trainingId)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from("training_sessions").update({
    scheduled_date: newDate,
    original_scheduled_date: current.original_scheduled_date ?? current.scheduled_date,
    reschedule_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", trainingId);
  if (error) throw new Error(error.message);

  // O treino movido vira uma preferência fixa; o motor reorganiza os demais ao redor dele.
  const bounds = weekBounds(newDate);
  try {
    await reorganizeWeek(bounds.start, bounds.end, `${reason}. Preserve o treino movido e ajuste conflitos ao redor.`, [{ id: trainingId, date: newDate }]);
  } catch (reorganizeError) {
    // Evita mostrar sucesso parcial: se o rebalanceamento falhar, devolve o treino para a data anterior.
    await supabase.from("training_sessions").update({
      scheduled_date: current.scheduled_date,
      original_scheduled_date: current.original_scheduled_date,
      reschedule_reason: current.reschedule_reason,
      updated_at: new Date().toISOString(),
    }).eq("id", trainingId);
    throw reorganizeError;
  }
}

export async function markTrainingMissed(trainingId: string, reason: string) {
  const { error } = await supabase.from("training_sessions").update({
    status: "missed",
    missed_reason: reason,
    athlete_feedback: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", trainingId);
  if (error) throw new Error(error.message);
}

export async function reorganizeWeek(startDate: string, endDate: string, note = "", forcedMoves: Array<{ id: string; date: string }> = []) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sua sessão expirou.");
  const response = await fetch("/api/ai/reorganize-week", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ startDate, endDate, note, forcedMoves }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.details ?? data?.error ?? "Erro ao reorganizar semana.");
  return data as { message: string; changes: Array<{id:string;date:string;reason?:string}>; conflicts?: string[] };
}
