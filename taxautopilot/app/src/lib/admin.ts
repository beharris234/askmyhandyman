import { createServerClient } from "@supabase/ssr";

/**
 * Super-admin = platform operator (you). Different from org-level owner.
 * Configured via SUPER_ADMIN_EMAILS env var (comma-separated).
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/**
 * Service-role Supabase client that bypasses RLS — for cross-org platform
 * analytics only. NEVER expose data from this to a non-super-admin.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY required for admin queries. Set it in .env.local."
    );
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}

/**
 * Tier → annual price in cents. Used to compute MRR/ARR.
 */
export const TIER_ANNUAL_CENTS: Record<string, number> = {
  solo: 249700,
  growth: 499700,
  office: 999700,
  enterprise: 1500000, // placeholder — enterprise is custom
};

export function tierMrr(tier: string): number {
  const annual = TIER_ANNUAL_CENTS[tier] || 0;
  return annual / 12 / 100; // dollars per month
}

export function tierAnnualDollars(tier: string): number {
  return (TIER_ANNUAL_CENTS[tier] || 0) / 100;
}
