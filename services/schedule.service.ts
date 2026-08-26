import { supabase } from "@/app/lib/supabase";

export async function moveTraining(trainingId: string, newDate: string, reason = "Movido manualmente pelo atleta no calendário") {
  const { data: current, error: readError } = await supabase
    .from("training_sessions")
    .select("scheduled_date, original_scheduled_date")
    .eq("id", trainingId)
    .single();
  if (readError) throw new Error(readError.message);

  // Movimento manual é soberano: o Athlos salva exatamente o dia escolhido pelo atleta.
  // A reorganização automática só acontece quando o atleta clicar em
  // "Reorganizar como treinador". Assim o motor não desfaz um arraste manual.
  const { error } = await supabase.from("training_sessions").update({
    scheduled_date: newDate,
    original_scheduled_date: current.original_scheduled_date ?? current.scheduled_date,
    reschedule_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", trainingId);
  if (error) throw new Error(error.message);
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
