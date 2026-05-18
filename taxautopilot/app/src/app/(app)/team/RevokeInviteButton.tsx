"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RevokeInviteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Revoke this invitation?")) return;
        startTransition(async () => {
          await fetch(`/api/team/${id}/revoke`, { method: "POST" });
          router.refresh();
        });
      }}
      disabled={pending}
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
    >
      {pending ? "..." : "Revoke"}
    </button>
  );
}
