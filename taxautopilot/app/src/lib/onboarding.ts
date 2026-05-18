import type { SupabaseClient } from "@supabase/supabase-js";

export type StepKey =
  | "create_office"
  | "import_clients"
  | "connect_inbox"
  | "connect_phone"
  | "invite_team"
  | "activate_subscription"
  | "try_extractor";

export type SetupStep = {
  key: StepKey;
  title: string;
  description: string;
  done: boolean;
  href: string;
  ctaLabel: string;
  optional?: boolean;
};

/**
 * Inspect the org's state and return what onboarding steps are done.
 * Pure DB lookups — no caching, called from dashboard on every render.
 */
export async function getOnboardingProgress(
  supabase: SupabaseClient,
  orgId: string
): Promise<SetupStep[]> {
  const [
    clientsCount,
    connectionsCount,
    twilioCount,
    membersCount,
    invitesCount,
    orgRow,
    extractionsCount,
  ] = await Promise.all([
    countOf(supabase, "clients", orgId),
    countOf(supabase, "email_connections", orgId),
    countOf(supabase, "twilio_numbers", orgId),
    countOf(supabase, "profiles", orgId, "organization_id"),
    pendingInvitesCount(supabase, orgId),
    supabase
      .from("organizations")
      .select("subscription_status")
      .eq("id", orgId)
      .single()
      .then((r) => r.data),
    countOf(supabase, "extractions", orgId),
  ]);

  const isSubscribed = ["active", "trialing"].includes(
    (orgRow as { subscription_status?: string } | null)?.subscription_status || ""
  );

  return [
    {
      key: "create_office",
      title: "Create your office",
      description: "Done at signup.",
      done: true,
      href: "/dashboard",
      ctaLabel: "✓",
    },
    {
      key: "import_clients",
      title: "Import or add your clients",
      description: "Bulk upload via CSV or add them one at a time.",
      done: clientsCount > 0,
      href: "/clients/import",
      ctaLabel: clientsCount > 0 ? "Manage →" : "Import CSV →",
    },
    {
      key: "connect_inbox",
      title: "Connect an inbox",
      description: "Gmail, Outlook, or any IMAP. Lets AI read client emails.",
      done: connectionsCount > 0,
      href: "/settings",
      ctaLabel: connectionsCount > 0 ? "Manage →" : "Connect →",
    },
    {
      key: "connect_phone",
      title: "Connect an SMS number",
      description: "Twilio number — AI texts clients refund updates automatically.",
      done: twilioCount > 0,
      href: "/settings/twilio",
      ctaLabel: twilioCount > 0 ? "Manage →" : "Set up Twilio →",
    },
    {
      key: "invite_team",
      title: "Invite your team",
      description: "Each preparer gets their own dashboard, inbox, SMS line.",
      done: membersCount > 1 || invitesCount > 0,
      href: "/team",
      ctaLabel: membersCount > 1 ? "View team →" : "Invite →",
      optional: true,
    },
    {
      key: "activate_subscription",
      title: "Activate your subscription",
      description: "Lock in Founders Pricing — your rate stays locked for life.",
      done: isSubscribed,
      href: "/settings/billing",
      ctaLabel: isSubscribed ? "Manage →" : "Choose plan →",
    },
    {
      key: "try_extractor",
      title: "Try the AI document extractor",
      description: "Drop a W-2 photo — get every field extracted in seconds.",
      done: extractionsCount > 0,
      href: "/demo",
      ctaLabel: extractionsCount > 0 ? "Use again →" : "Try now →",
    },
  ];
}

async function countOf(
  supabase: SupabaseClient,
  table: string,
  orgId: string,
  col = "organization_id"
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(col, orgId);
  return count ?? 0;
}

async function pendingInvitesCount(supabase: SupabaseClient, orgId: string): Promise<number> {
  const { count } = await supabase
    .from("invitations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "pending");
  return count ?? 0;
}

export function progressPercent(steps: SetupStep[]): number {
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / total) * 100);
}
