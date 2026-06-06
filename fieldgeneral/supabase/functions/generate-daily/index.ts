// FieldGeneral — generate-daily Edge Function
// Keeps your Anthropic API key server-side (never in the browser).
//
// Deploy:
//   supabase functions deploy generate-daily
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// The client calls supabase.functions.invoke('generate-daily', { body }).
// Until this is deployed, the app uses the built-in local generator (config.js),
// so the whole flow works today with no key.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MODEL = "claude-haiku-4-5"; // fast + cheap for high-volume daily generation

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");

    const b = await req.json();
    const examples = (b.examples || []).filter(Boolean).map((t: string) => `- "${t}"`).join("\n");
    const guardrails = (b.guardrails || []).map((g: string) => `- ${g}`).join("\n");

    // ---- QUOTE MODE: one short "Word of the Day" in the coach's voice ----
    if (b.mode === "quote") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 120,
          system: `You write ONE short motivational line for a high school football team, in the head coach's voice. Match this cadence:\n${examples || "(confident, short, demanding-but-caring)"}\nTone notes: ${b.toneNotes || "(none)"}. One sentence, no quotes around it, no emojis. Keep it clean and team-first.`,
          messages: [{ role: "user", content: "Give me today's one-line word of the day for the team." }],
        }),
      });
      const d = await r.json();
      const quote = (d?.content?.[0]?.text || "").trim().replace(/^["']|["']$/g, "");
      return new Response(JSON.stringify({ quote }), { headers: { ...cors, "content-type": "application/json" } });
    }

    const system = `You are the AI chief of staff for a high school football coach. You write the day's
team message and a position-group workout IN THE COACH'S OWN VOICE so every player feels personally texted.

NON-NEGOTIABLE CHILD-SAFETY GUARDRAILS (these users are minors):
${guardrails}

Match the coach's tone from these example texts:
${examples || "(no examples provided — keep it confident, concise, and motivating)"}

Tone notes from the coach: ${b.toneNotes || "(none)"}

Respond with STRICT JSON only, no prose, in this shape:
{"message": "<2-4 short paragraphs in the coach's voice>",
 "workout": [{"name":"...","sets":"...","reps":"..."}, ...],
 "nutrition": "<one general healthy-habit tip, NO calorie/macro/diet targets>"}`;

    const user = `Write today's drop for the ${b.group} (${b.focus}) position group of ${b.teamName || "the team"}.
Coach name: ${b.coachName || "Coach"}. Sign-off to use: ${b.signOff || "— Coach"}.
Today's vibe/focus from the coach: ${b.vibe || "(none — pick a strong daily theme)"}.
Give 4-6 position-appropriate exercises.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const data = await r.json();
    const text = data?.content?.[0]?.text || "{}";
    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
