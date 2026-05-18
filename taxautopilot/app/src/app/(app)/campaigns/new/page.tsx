import Link from "next/link";
import { NewCampaignWizard } from "./NewCampaignWizard";

export default function NewCampaignPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <Link
        href="/campaigns"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to campaigns
      </Link>

      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        New Campaign
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Pick your audience, pick your channel. Preview before launch. AI writes a personal message for every recipient.
      </p>

      <NewCampaignWizard />
    </div>
  );
}
