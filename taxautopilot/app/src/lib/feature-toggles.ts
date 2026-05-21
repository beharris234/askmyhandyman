/**
 * Per-org feature toggles. The owner can flip features on/off via
 * /settings/features. Code that gates on a feature reads from here.
 */

export type FeatureKey =
  | "refund_alerts"
  | "win_back_campaigns"
  | "ai_email_drafting"
  | "ai_sms_drafting"
  | "document_extraction"
  | "inbox_processing"
  | "money_report"
  | "client_portal"
  | "year_end_summary"
  | "document_requests"
  | "bilingual_ai"
  | "appointment_booking"
  | "esignature"
  | "quickbooks_sync";

export type FeatureMeta = {
  key: FeatureKey;
  label: string;
  description: string;
  category: "comms" | "ai" | "revenue" | "addon" | "coming";
  defaultOn: boolean;
  comingSoon?: boolean;
};

export const FEATURES: FeatureMeta[] = [
  // Core AI
  {
    key: "document_extraction",
    label: "AI Document Extraction",
    description: "Pull every field from W-2s, 1099s, etc. — the core AI brain.",
    category: "ai",
    defaultOn: true,
  },
  {
    key: "inbox_processing",
    label: "Inbox Processing",
    description: "AI reads incoming client emails, files attachments, classifies.",
    category: "ai",
    defaultOn: true,
  },
  {
    key: "ai_email_drafting",
    label: "AI Email Drafting",
    description: "AI drafts replies for every client email you get.",
    category: "ai",
    defaultOn: true,
  },
  {
    key: "ai_sms_drafting",
    label: "AI SMS Drafting",
    description: "AI auto-replies to client texts (you approve before send).",
    category: "ai",
    defaultOn: true,
  },
  {
    key: "bilingual_ai",
    label: "Bilingual AI (Spanish + more)",
    description: "AI replies in your client's language (Spanish, Vietnamese, Chinese, etc.).",
    category: "ai",
    defaultOn: true,
  },

  // Revenue
  {
    key: "money_report",
    label: "Money Report Audits",
    description: "Run audits showing missed revenue. Free for prospects, on-demand for you.",
    category: "revenue",
    defaultOn: true,
  },
  {
    key: "win_back_campaigns",
    label: "Win-back Campaigns",
    description: "AI-personalized outreach to lapsed clients.",
    category: "revenue",
    defaultOn: true,
  },
  {
    key: "refund_alerts",
    label: "Refund Status Auto-Texts",
    description: "Day 0/3/14/21/28 SMS schedule for every filed return.",
    category: "revenue",
    defaultOn: true,
  },
  {
    key: "document_requests",
    label: "Document Request Automation",
    description: "Smart asks: 'Hey [client], still need your W-2.' Auto-followups.",
    category: "comms",
    defaultOn: true,
  },
  {
    key: "year_end_summary",
    label: "Year-End Client Summary",
    description: "Auto-PDF for every client every December. Drives renewal + referrals.",
    category: "revenue",
    defaultOn: true,
  },

  // Coming soon
  {
    key: "client_portal",
    label: "Client Portal",
    description: "Your clients log in to upload docs, see refund status, sign forms.",
    category: "coming",
    defaultOn: false,
    comingSoon: true,
  },
  {
    key: "esignature",
    label: "E-Signature (Form 8879)",
    description: "Engagement letters + 8879 signed in-app. No DocuSign needed.",
    category: "coming",
    defaultOn: false,
    comingSoon: true,
  },
  {
    key: "appointment_booking",
    label: "Appointment Booking",
    description: "Calendly-style — clients schedule themselves.",
    category: "coming",
    defaultOn: false,
    comingSoon: true,
  },
  {
    key: "quickbooks_sync",
    label: "QuickBooks / Xero Sync",
    description: "Pull P&L data for Schedule C clients. Auto-categorize expenses.",
    category: "coming",
    defaultOn: false,
    comingSoon: true,
  },
];

export const DEFAULT_FEATURE_SETTINGS: Record<FeatureKey, boolean> = FEATURES.reduce(
  (acc, f) => {
    acc[f.key] = f.defaultOn;
    return acc;
  },
  {} as Record<FeatureKey, boolean>
);

/**
 * Read whether a feature is on for a given org. Defaults to the
 * spec'd default if missing from the stored settings object.
 */
export function isFeatureOn(
  settings: Record<string, boolean> | null | undefined,
  key: FeatureKey
): boolean {
  if (!settings) return DEFAULT_FEATURE_SETTINGS[key] ?? false;
  return key in settings ? settings[key] : DEFAULT_FEATURE_SETTINGS[key] ?? false;
}

export const CATEGORY_LABELS: Record<FeatureMeta["category"], string> = {
  ai: "🤖 AI Engine",
  revenue: "💰 Revenue Tools",
  comms: "📨 Client Communications",
  addon: "🧩 Add-ons",
  coming: "🚧 Rolling Out",
};
