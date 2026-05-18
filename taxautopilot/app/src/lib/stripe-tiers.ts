/**
 * Tier configuration. Stripe Price IDs come from .env.local — when
 * the user creates Products in Stripe, they paste those IDs here.
 */

export type Tier = "solo" | "growth" | "office" | "enterprise";

export type TierConfig = {
  id: Tier;
  name: string;
  priceCents: number;
  maxPreparers: number | null;
  maxClients: number | null;
  smsLinesIncluded: number;
  stripePriceId: string | undefined;
};

export const TIERS: Record<Tier, TierConfig> = {
  solo: {
    id: "solo",
    name: "Solo Founders",
    priceCents: 249700,
    maxPreparers: 1,
    maxClients: 500,
    smsLinesIncluded: 1,
    stripePriceId: process.env.STRIPE_PRICE_SOLO,
  },
  growth: {
    id: "growth",
    name: "Growth Founders",
    priceCents: 499700,
    maxPreparers: 5,
    maxClients: 1500,
    smsLinesIncluded: 5,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH,
  },
  office: {
    id: "office",
    name: "Office Founders",
    priceCents: 999700,
    maxPreparers: 20,
    maxClients: null,
    smsLinesIncluded: 20,
    stripePriceId: process.env.STRIPE_PRICE_OFFICE,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceCents: 0,
    maxPreparers: null,
    maxClients: null,
    smsLinesIncluded: 999,
    stripePriceId: undefined,
  },
};

export function getTier(id: string | null | undefined): TierConfig {
  if (id && id in TIERS) return TIERS[id as Tier];
  return TIERS.solo;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function tierConfigured(t: TierConfig): boolean {
  return Boolean(t.stripePriceId);
}
