import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TwilioConnectForm } from "./TwilioConnectForm";

export default async function TwilioSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: numbers } = await supabase
    .from("twilio_numbers")
    .select("id, phone_number, friendly_name, status, preparer_id, visibility, created_at, profiles!twilio_numbers_preparer_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/twilio/sms-incoming`;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <Link
        href="/settings"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to settings
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">📱</div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--navy-900)]">Twilio SMS</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Connect Twilio numbers. Each preparer can have their own line or use the office-wide number.
            </p>
          </div>
        </div>

        {/* Existing numbers */}
        {numbers && numbers.length === 0 && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="font-bold text-amber-900 text-sm mb-1">💰 Heads up about Twilio costs</div>
            <div className="text-xs text-amber-800 leading-relaxed mb-2">
              Twilio is a separate service — you pay them directly (not us). Plan on ~<strong>$1.15/month per number</strong> plus ~<strong>$0.008 per text</strong>. A busy office typically spends <strong>$15-30/month total</strong>.
            </div>
            <a
              href="/pricing-breakdown"
              target="_blank"
              className="text-xs font-bold text-amber-900 underline hover:text-amber-700"
            >
              See full cost breakdown →
            </a>
          </div>
        )}

        {/* Existing numbers */}
        {numbers && numbers.length > 0 && (
          <div className="space-y-2 mb-6">
            <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2">
              Connected numbers ({numbers.length})
            </div>
            {numbers.map((n) => {
              const preparerRaw = n.profiles as unknown;
              const preparer = (Array.isArray(preparerRaw) ? preparerRaw[0] : preparerRaw) as
                | { full_name: string }
                | null;
              return (
                <div
                  key={n.id}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200"
                >
                  <div>
                    <div className="font-semibold text-[var(--navy-900)] font-mono">
                      {n.phone_number}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {n.visibility === "personal" ? (
                        <>👤 Personal · {preparer?.full_name || (n.preparer_id === user?.id ? "You" : "—")}</>
                      ) : (
                        <>🏢 Office-wide · everyone uses this line</>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      n.status === "active"
                        ? "bg-[var(--green-100)] text-[var(--green-600)]"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {n.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Connect form */}
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-3">
            {numbers && numbers.length > 0 ? "Connect another number" : "Connect your first number"}
          </div>
          <TwilioConnectForm />
        </div>

        {/* Webhook URL section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="font-bold text-[var(--navy-900)] mb-2">Set up the incoming SMS webhook</h3>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            In your Twilio Console, set this URL as the &ldquo;A message comes in&rdquo; webhook for EVERY number you connect:
          </p>
          <div className="bg-slate-900 text-green-400 font-mono text-xs p-3 rounded-lg break-all">
            POST {webhookUrl}
          </div>
          <ol className="mt-4 space-y-1.5 text-xs text-[var(--text-muted)] list-decimal list-inside">
            <li>Console → Phone Numbers → Manage → Active numbers</li>
            <li>Click each number → scroll to &ldquo;Messaging configuration&rdquo;</li>
            <li>Webhook URL: paste the URL above (HTTP POST)</li>
            <li>Save. Test by texting your number — it should appear in /messages.</li>
          </ol>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-[var(--text-muted)] space-y-1.5">
          <div>
            🔐 Each Auth Token is encrypted (AES-256-GCM) before storage. Only
            decrypted in memory at send-time.
          </div>
          <div>
            ✋ Don&apos;t have Twilio yet?{" "}
            <a
              href="https://www.twilio.com/try-twilio"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--green-600)] font-semibold hover:underline"
            >
              Sign up free
            </a>
            {" "}— numbers are ~$1/month, texts ~$0.0079 each.
          </div>
        </div>
      </div>
    </div>
  );
}
