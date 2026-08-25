import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askGemini } from "@/services/ai-provider";

function tokenFrom(request: NextRequest) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

function client(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");
  return createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const token = tokenFrom(request);
    if (!token) return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    const body = await request.json() as { startDate?: string; endDate?: string; note?: string };
    if (!body.startDate || !body.endDate) return NextResponse.json({ error: "Período inválido." }, { status: 400 });
    const supabase = client(token);
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("athlete_profiles").select("*").eq("user_id", auth.user.id).single();
    if (profileError) throw new Error(profileError.message);

    const { data: sessions, error: sessionsError } = await supabase.from("training_sessions")
      .select("id,title,description,scheduled_date,duration_minutes,zone,status,session_type")
      .eq("profile_id", profile.id).gte("scheduled_date", body.startDate).lte("scheduled_date", body.endDate)
      .in("status", ["planned","in_progress"]).order("scheduled_date");
    if (sessionsError) throw new Error(sessionsError.message);

    const { data: checkins } = await supabase.from("daily_checkins").select("checkin_date,readiness_score,fatigue,muscle_soreness,sleep_hours")
      .eq("profile_id", profile.id).gte("checkin_date", body.startDate).lte("checkin_date", body.endDate).order("checkin_date");

    if (!sessions?.length) return NextResponse.json({ changes: [], message: "Não há treinos planejados para reorganizar." });

    const prompt = `Você é o planejador do Athlos AI. Reorganize APENAS as datas dos treinos abaixo sem excluir sessões. Considere recuperação entre ciclismo intenso e musculação pesada. Respeite os dias disponíveis quando possível. Datas permitidas: ${body.startDate} até ${body.endDate}. Observação do atleta: ${body.note || "nenhuma"}.\nDias disponíveis: ${(profile.available_days ?? []).join(", ")}. Dias academia: ${(profile.gym_days ?? []).join(", ")}.\nCheck-ins: ${JSON.stringify(checkins ?? [])}.\nTreinos: ${JSON.stringify(sessions)}.\nRetorne SOMENTE JSON válido no formato {"message":"resumo curto","changes":[{"id":"uuid","date":"AAAA-MM-DD","reason":"motivo curto"}]}. Inclua todos os treinos e preserve seus ids.`;
    const raw = await askGemini(prompt);
    const plan = JSON.parse(raw.replace(/```json/gi, "").replace(/```/g, "").trim()) as { message?: string; changes?: Array<{id:string;date:string;reason?:string}> };
    const allowedIds = new Set(sessions.map(s => s.id));
    const valid = (plan.changes ?? []).filter(c => allowedIds.has(c.id) && c.date >= body.startDate! && c.date <= body.endDate!);

    for (const change of valid) {
      const current = sessions.find(s => s.id === change.id)!;
      if (current.scheduled_date === change.date) continue;
      const { error } = await supabase.from("training_sessions").update({
        scheduled_date: change.date,
        original_scheduled_date: current.scheduled_date,
        reschedule_reason: change.reason ?? "Semana reorganizada pela IA",
        updated_at: new Date().toISOString(),
      }).eq("id", change.id);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ message: plan.message ?? "Semana reorganizada pela IA.", changes: valid });
  } catch (error) {
    return NextResponse.json({ error: "Não foi possível reorganizar a semana.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
