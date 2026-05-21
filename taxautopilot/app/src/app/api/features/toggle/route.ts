import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FEATURES, DEFAULT_FEATURE_SETTINGS, type FeatureKey } from "@/lib/feature-toggles";
import { isManager } from "@/lib/permissions";

export const runtime = "nodejs";

const VALID_KEYS = new Set(FEATURES.map((f) => f.key));

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }
  if (!isManager(profile.role)) {
    return NextResponse.json({ ok: false, error: "permission_denied" }, { status: 403 });
  }

  const form = await request.formData();
  const feature = String(form.get("feature") || "");
  const enabled = String(form.get("enabled") || "true") === "true";

  if (!VALID_KEYS.has(feature as FeatureKey)) {
    return NextResponse.json({ ok: false, error: "invalid_feature" }, { status: 400 });
  }

  // Coming-soon features can't be turned on
  const meta = FEATURES.find((f) => f.key === feature);
  if (meta?.comingSoon && enabled) {
    return NextResponse.json(
      { ok: false, error: `${meta.label} is coming soon — can't enable yet.` },
      { status: 400 }
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("feature_settings")
    .eq("id", profile.organization_id)
    .single();

  const current = (org?.feature_settings as Record<string, boolean> | null) ?? DEFAULT_FEATURE_SETTINGS;
  const next = { ...current, [feature]: enabled };

  const { error } = await supabase
    .from("organizations")
    .update({ feature_settings: next })
    .eq("id", profile.organization_id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
