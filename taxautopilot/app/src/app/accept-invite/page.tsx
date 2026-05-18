import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteButton } from "./AcceptInviteButton";

type SearchParams = Promise<{ token?: string }>;

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <Wrap>
        <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-2">No invitation token</h1>
        <p className="text-sm text-[var(--text-muted)]">
          This URL is missing the invitation code. Ask whoever sent you the link to send it again.
        </p>
      </Wrap>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Look up the invite
  const { data: invite } = await supabase
    .from("invitations")
    .select("*, organizations(name)")
    .eq("token", token)
    .single();

  if (!invite) {
    return (
      <Wrap>
        <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-2">Invitation not found</h1>
        <p className="text-sm text-[var(--text-muted)]">
          This invitation may have been revoked or the link is incorrect.
        </p>
      </Wrap>
    );
  }

  const orgRaw = invite.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { name: string } | null;
  const orgName = org?.name ?? "the tax office";

  if (invite.status !== "pending") {
    return (
      <Wrap>
        <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-2">
          Invitation {invite.status}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          This invitation has already been {invite.status}. Ask {orgName} to send a fresh one if you need access.
        </p>
        <Link href="/login" className="text-sm font-semibold text-[var(--green-600)] hover:underline">
          Back to login →
        </Link>
      </Wrap>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <Wrap>
        <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-2">Invitation expired</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Ask {orgName} to send a new invitation.
        </p>
      </Wrap>
    );
  }

  // Not signed in — redirect to signup, pass the token along
  if (!user) {
    redirect(`/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`);
  }

  // Signed in — show "accept this invitation" button
  return (
    <Wrap>
      <div className="inline-flex items-center gap-2 bg-[var(--green-100)] text-[var(--green-600)] px-3 py-1 rounded-full text-xs font-semibold mb-3">
        <span className="w-1.5 h-1.5 bg-[var(--green-500)] rounded-full animate-pulse" />
        You&apos;ve been invited
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">
        Join {orgName}
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        You&apos;re being added as a <strong>{invite.role}</strong>. Accept below to join the team.
      </p>
      <AcceptInviteButton token={token} />
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-[var(--navy-900)] flex items-center justify-center shadow-md">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-[var(--navy-900)] tracking-tight">TaxAutopilot</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
