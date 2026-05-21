import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FEATURES, CATEGORY_LABELS, DEFAULT_FEATURE_SETTINGS, type FeatureMeta } from "@/lib/feature-toggles";
import { isManager } from "@/lib/permissions";
import { FeatureToggleRow } from "./FeatureToggleRow";

export default async function FeaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id, organizations(feature_settings)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id || !isManager(profile.role)) {
    redirect("/settings");
  }

  const orgRaw = profile.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | { feature_settings: Record<string, boolean> | null }
    | null;
  const settings = org?.feature_settings ?? DEFAULT_FEATURE_SETTINGS;

  // Group features by category
  const byCategory = new Map<FeatureMeta["category"], FeatureMeta[]>();
  for (const f of FEATURES) {
    if (!byCategory.has(f.category)) byCategory.set(f.category, []);
    byCategory.get(f.category)!.push(f);
  }

  const categoryOrder: FeatureMeta["category"][] = ["ai", "revenue", "comms", "addon", "coming"];

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <Link
        href="/settings"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to settings
      </Link>

      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Features
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Turn features on or off for your office. Changes apply immediately to all teammates.
      </p>

      {categoryOrder.map((cat) => {
        const items = byCategory.get(cat);
        if (!items || items.length === 0) return null;
        return (
          <div key={cat} className="bg-white rounded-2xl border border-slate-200 mb-5 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((feature) => (
                <FeatureToggleRow
                  key={feature.key}
                  feature={feature}
                  initialOn={settings[feature.key] ?? DEFAULT_FEATURE_SETTINGS[feature.key] ?? false}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="text-xs text-[var(--text-muted)] mt-4 text-center">
        💡 Turning a feature off pauses all automation but keeps your data safe.
      </div>
    </div>
  );
}
