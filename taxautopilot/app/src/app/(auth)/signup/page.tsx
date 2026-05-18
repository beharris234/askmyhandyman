import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signUpAction } from "../actions";
import { SignUpForm } from "./SignUpForm";

type SearchParams = Promise<{ ref?: string }>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ref = params.ref?.toUpperCase() || null;

  // Look up the referrer's office name so we can show "Referred by X"
  let referrerName: string | null = null;
  if (ref) {
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
        Founders Pricing
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">
        Set up your office
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Takes 30 seconds. Lifetime price locked.
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

      <SignUpForm action={signUpAction} initialReferralCode={ref} />

      <div className="mt-6 text-sm text-center text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--green-600)] font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
