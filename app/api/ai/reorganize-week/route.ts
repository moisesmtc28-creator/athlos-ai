import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scheduleTrainingWeek, summarizeScheduleConflicts } from "@/services/planning-engine";

function tokenFrom(request: NextRequest) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

function client(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

function datesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (current <= end && dates.length < 14) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export async function POST(request: NextRequest) {
  try {
    const token = tokenFrom(request);
    if (!token) return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    const body = (await request.json()) as { startDate?: string; endDate?: string; note?: string; forcedMoves?: Array<{ id: string; date: string }> };
    if (!body.startDate || !body.endDate) return NextResponse.json({ error: "Período inválido." }, { status: 400 });

    const supabase = client(token);
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("athlete_profiles")
      .select("id,available_days,gym_days,available_minutes_by_day")
      .eq("user_id", auth.user.id)
      .single();
    if (profileError) throw new Error(profileError.message);

    const { data: sessions, error: sessionsError } = await supabase
      .from("training_sessions")
      .select("id,title,description,scheduled_date,duration_minutes,zone,status,session_type,original_scheduled_date")
      .eq("profile_id", profile.id)
      .gte("scheduled_date", body.startDate)
      .lte("scheduled_date", body.endDate)
      .in("status", ["planned", "in_progress"])
      .order("scheduled_date");
    if (sessionsError) throw new Error(sessionsError.message);
    if (!sessions?.length) return NextResponse.json({ changes: [], message: "Não há treinos planejados para reorganizar." });

    const weekDates = datesBetween(body.startDate, body.endDate);
    const plannerSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      duration: session.duration_minutes,
      zone: session.zone,
      type: (session.session_type === "strength" ? "strength" : session.session_type === "recovery" ? "recovery" : "bike") as "bike" | "strength" | "recovery",
      preferredDate: session.scheduled_date,
    }));

    const sessionIds = new Set(sessions.map((session) => session.id));
    const forcedDates: Record<string, string> = {};
    for (const move of body.forcedMoves ?? []) {
      if (sessionIds.has(move.id) && weekDates.includes(move.date)) forcedDates[move.id] = move.date;
    }
    const schedule = scheduleTrainingWeek(plannerSessions, weekDates, {
      availableDays: profile.available_days,
      gymDays: profile.gym_days,
      availableMinutesByDay: profile.available_minutes_by_day,
    }, forcedDates);

    const changes: Array<{ id: string; date: string; reason: string }> = [];
    for (const scheduled of schedule) {
      const current = sessions.find((session) => session.id === scheduled.id);
      if (!current || current.scheduled_date === scheduled.date) continue;
      const { error } = await supabase
        .from("training_sessions")
        .update({
          scheduled_date: scheduled.date,
          original_scheduled_date: current.original_scheduled_date ?? current.scheduled_date,
          reschedule_reason: scheduled.scheduleReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduled.id);
      if (error) throw new Error(error.message);
      changes.push({ id: scheduled.id!, date: scheduled.date, reason: scheduled.scheduleReason });
    }

    const conflicts = summarizeScheduleConflicts(schedule);
    const note = body.note?.trim();
    const message = changes.length
      ? `Semana reorganizada com ${changes.length} ajuste(s), priorizando recuperação, disponibilidade e coerência entre ciclismo e musculação.${note ? ` Pedido considerado: ${note}.` : ""}`
      : `A semana já está equilibrada; nenhum treino precisou mudar.${note ? ` Pedido considerado: ${note}.` : ""}`;

    return NextResponse.json({ message, changes, conflicts });
  } catch (error) {
    return NextResponse.json(
      { error: "Não foi possível reorganizar a semana.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
