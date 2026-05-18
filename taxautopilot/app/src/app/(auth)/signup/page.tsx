import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signUpAction } from "../actions";
import { SignUpForm } from "./SignUpForm";

type SearchParams = Promise<{ ref?: string; invite?: string; email?: string }>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ref = params.ref?.toUpperCase() || null;
  const inviteToken = params.invite || null;
  const prefilledEmail = params.email || null;

  // Look up invite info if present
  let inviteOrgName: string | null = null;
  let inviteRole: string | null = null;
  let inviteEmail: string | null = null;
  if (inviteToken) {
    const supabase = await createClient();
    const { data: invite } = await supabase
      .from("invitations")
      .select("status, email, role, organizations(name)")
      .eq("token", inviteToken)
      .maybeSingle();
    if (invite && invite.status === "pending") {
      const orgRaw = invite.organizations as unknown;
      const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { name: string } | null;
      inviteOrgName = org?.name ?? null;
      inviteRole = invite.role;
      inviteEmail = invite.email;
    }
  }

  // Look up the referrer's office name so we can show "Referred by X"
  let referrerName: string | null = null;
  if (ref && !inviteToken) {
    const supabase = await createClient();
    const { data: referrer } = await supabase
      .from("organizations")
      .select("name")
      .eq("referral_code", ref)
      .maybeSingle();
    referrerName = referrer?.name ?? null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <div className="inline-flex items-center gap-2 bg-[var(--green-100)] text-[var(--green-600)] px-3 py-1 rounded-full text-xs font-semibold mb-3">
        <span className="w-1.5 h-1.5 bg-[var(--green-500)] rounded-full animate-pulse" />
        {inviteOrgName ? "Team Invitation" : "Founders Pricing"}
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">
        {inviteOrgName ? `Join ${inviteOrgName}` : "Set up your office"}
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        {inviteOrgName
          ? `You're joining as a ${inviteRole}. Create your login below.`
          : "Takes 30 seconds. Lifetime price locked."}
      </p>

      {referrerName && (
        <div className="mb-5 rounded-xl bg-gradient-to-r from-[var(--green-100)] to-amber-50 border border-[var(--green-500)]/30 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎁</span>
            <div>
              <div className="font-bold text-[var(--navy-900)] text-sm">
                Referred by {referrerName}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                You&apos;ll get <strong className="text-[var(--green-600)]">$250 off</strong> your first year automatically.
              </div>
            </div>
          </div>
        </div>
      )}

      <SignUpForm
        action={signUpAction}
        initialReferralCode={ref}
        inviteToken={inviteToken}
        inviteEmail={inviteEmail || prefilledEmail}
        isInvite={!!inviteOrgName}
      />

      <div className="mt-6 text-sm text-center text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--green-600)] font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
