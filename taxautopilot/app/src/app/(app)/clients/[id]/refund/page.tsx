import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewRefundForm } from "./NewRefundForm";
import { RefundTrackCard } from "./RefundTrackCard";

export default async function ClientRefundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, phone")
    .eq("id", id)
    .single();
  if (!client) notFound();

  const { data: tracks } = await supabase
    .from("refund_tracks")
    .select("*")
    .eq("client_id", id)
    .order("tax_year", { ascending: false });

  // Pull scheduled SMS per track
  const trackIds = (tracks || []).map((t) => t.id);
  const { data: schedules } = trackIds.length
    ? await supabase
        .from("scheduled_messages")
        .select("id, refund_track_id, template_id, body, scheduled_for, status, sent_at, skip_reason")
        .in("refund_track_id", trackIds)
        .order("scheduled_for", { ascending: true })
    : { data: [] };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <Link
        href={`/clients/${id}`}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to {client.full_name}
      </Link>

      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Refund Tracking
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Track this client&apos;s refund status and auto-text them updates along the
        way.
      </p>

      {!client.phone && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠️ This client has no phone number — alerts will be scheduled but skipped at send time. Add one on their profile to fix.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Existing tracks */}
        <div>
          {tracks && tracks.length > 0 ? (
            <div className="space-y-4">
              {tracks.map((t) => (
                <RefundTrackCard
                  key={t.id}
                  track={t}
                  schedule={(schedules || []).filter((s) => s.refund_track_id === t.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <div className="text-4xl mb-3 opacity-40">💰</div>
              <h3 className="font-bold text-[var(--navy-900)] mb-1">No refund tracking yet</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Add a tracking record on the right when you file this client&apos;s return.
              </p>
            </div>
          )}
        </div>

        {/* New track form */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sticky top-6">
            <h3 className="font-bold text-[var(--navy-900)] mb-4">Start tracking a return</h3>
            <NewRefundForm clientId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
