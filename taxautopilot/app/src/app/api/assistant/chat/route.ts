import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingProgress } from "@/lib/onboarding";
import { SETUP_ASSISTANT_PROMPT } from "@/lib/setup-assistant";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const body = await request.json();
  const messages: ChatMessage[] = body.messages || [];
  const currentPath = String(body.path || "/dashboard");

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ ok: false, error: "no_messages" }, { status: 400 });
  }

  // Build context block: what's the user's setup state right now?
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organization_id, organizations(name, tier, subscription_status)")
    .eq("id", user.id)
    .single();

  let contextBlock = `# Current user context\n- Page they're on: ${currentPath}\n`;
  if (profile?.full_name) contextBlock += `- Name: ${profile.full_name}\n`;
  if (profile?.role) contextBlock += `- Role: ${profile.role}\n`;

  const orgRaw = profile?.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | { name?: string; tier?: string; subscription_status?: string }
    | null;
  if (org) {
    contextBlock += `- Office: ${org.name}\n`;
    contextBlock += `- Tier: ${org.tier || "not yet activated"}\n`;
    contextBlock += `- Subscription: ${org.subscription_status || "inactive"}\n`;
  }

  if (profile?.organization_id) {
    const steps = await getOnboardingProgress(supabase, profile.organization_id);
    contextBlock += "- Setup progress:\n";
    for (const s of steps) {
      contextBlock += `  ${s.done ? "✓" : "○"} ${s.title}\n`;
    }
  }

  try {
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SETUP_ASSISTANT_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: contextBlock },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = result.content.find((b) => b.type === "text");
    const reply = text && text.type === "text" ? text.text : "Sorry, I didn't catch that.";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "chat failed" },
      { status: 500 }
    );
  }
}
