"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Preparer = { id: string; full_name: string; email: string };

export function AssignmentWidget({
  clientId,
  currentAssignedId,
  currentUserId,
  preparers,
  canReassign,
}: {
  clientId: string;
  currentAssignedId: string | null;
  currentUserId: string;
  preparers: Preparer[];
  canReassign: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentAssignedId || "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(newId: string) {
    if (newId === currentAssignedId) return;
    setError(null);
    setSelected(newId);
    const formData = new FormData();
    if (newId) formData.set("preparer_id", newId);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/assign`, {
          method: "POST",
          body: formData,
        });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error || "Update failed");
          setSelected(currentAssignedId || "");
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
        setSelected(currentAssignedId || "");
      }
    });
  }

  // Preparer with no permission to reassign sees a simpler "Claim" button
  if (!canReassign) {
    const mine = currentAssignedId === currentUserId;
    if (mine) {
      return (
        <span className="text-xs font-semibold text-[var(--green-600)]">
          👤 Assigned to you
        </span>
      );
    }
    if (currentAssignedId) {
      const owner = preparers.find((p) => p.id === currentAssignedId);
      return (
        <span className="text-xs text-[var(--text-muted)]">
          Assigned to {owner?.full_name || "another preparer"}
        </span>
      );
    }
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => update(currentUserId)}
        className="text-xs font-bold px-3 py-1.5 rounded-md bg-[var(--green-500)] text-white hover:bg-[var(--green-600)] transition disabled:opacity-50"
      >
        {pending ? "Claiming…" : "+ Claim This Client"}
      </button>
    );
  }

  // Owner/admin gets a full dropdown
  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => update(e.target.value)}
        disabled={pending}
        className="text-sm px-3 py-1.5 rounded-md border-2 border-slate-200 focus:border-[var(--green-500)] outline-none bg-white text-[var(--navy-900)]"
      >
        <option value="">— Unassigned —</option>
        {preparers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
            {p.id === currentUserId ? " (you)" : ""}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
