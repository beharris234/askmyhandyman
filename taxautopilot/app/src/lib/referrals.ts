/**
 * Referral economics — single source of truth for credit math.
 */

export const REFERRAL_CONFIG = {
  /** What the referrer gets credited per successful referral. */
  referrerCreditPerReferral: 250,
  /** What the new referee gets off their first year. */
  refereeFirstYearDiscount: 250,
  /** Full annual subscription price (Founders Pricing). */
  annualSubscriptionPrice: 2497,
  /** Max credit per renewal — capped at full annual price (no negative bills). */
  maxCreditPerRenewal: 2497,
  /** Number of referrals to earn a free year. */
  freeYearReferralThreshold: 10,
} as const;

export type ReferralRollup = {
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  creditBalance: number;
  lifetimeCredits: number;
  referralsToNextFreeYear: number;
  progressToFreeYear: number;
  appliedNextRenewalPrice: number;
};

export function summarize(
  creditBalance: number,
  lifetimeCredits: number,
  referrals: Array<{ status: string }>
): ReferralRollup {
  const totalReferrals = referrals.length;
  const qualifiedReferrals = referrals.filter(
    (r) => r.status === "qualified" || r.status === "applied"
  ).length;
  const pendingReferrals = referrals.filter((r) => r.status === "signed_up").length;

  const applied = Math.min(creditBalance, REFERRAL_CONFIG.maxCreditPerRenewal);
  const appliedNextRenewalPrice = Math.max(
    REFERRAL_CONFIG.annualSubscriptionPrice - applied,
    0
  );

  const referralsToNextFreeYear = Math.max(
    REFERRAL_CONFIG.freeYearReferralThreshold - qualifiedReferrals,
    0
  );
  const progressToFreeYear = Math.min(
    qualifiedReferrals / REFERRAL_CONFIG.freeYearReferralThreshold,
    1
  );

  return {
    totalReferrals,
    qualifiedReferrals,
    pendingReferrals,
    creditBalance,
    lifetimeCredits,
    referralsToNextFreeYear,
    progressToFreeYear,
    appliedNextRenewalPrice,
  };
}

export function buildReferralUrl(referralCode: string, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/signup?ref=${encodeURIComponent(referralCode)}`;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
