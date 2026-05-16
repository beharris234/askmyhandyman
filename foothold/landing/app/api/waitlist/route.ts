import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const MEDICATIONS = new Set([
  "ozempic",
  "wegovy",
  "mounjaro",
  "zepbound",
  "rybelsus",
  "saxenda",
  "victoza",
  "compounded",
  "considering",
  "other",
]);

const PHASES = new Set([
  "considering",
  "starting",
  "titrating",
  "maintaining",
  "tapering",
  "off",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Waitlist is not configured yet. Check back soon." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const rawMed = typeof body.medication === "string" ? body.medication.trim().toLowerCase() : "";
  const medication = rawMed && MEDICATIONS.has(rawMed) ? rawMed : null;

  const rawPhase = typeof body.phase === "string" ? body.phase.trim().toLowerCase() : "";
  const phase = rawPhase && PHASES.has(rawPhase) ? rawPhase : null;

  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  const { error } = await supabase.from("waitlist").insert({
    email,
    medication,
    phase,
    source: "landing",
    user_agent: userAgent,
  });

  if (error) {
    // Treat duplicate signup as success — don't punish users for resubmitting.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    console.error("waitlist insert failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again in a moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
