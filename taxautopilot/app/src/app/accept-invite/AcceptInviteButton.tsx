"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    const formData = new FormData();
    formData.set("token", token);
    startTransition(async () => {
      try {
        const res = await fetch("/api/invitations/accept", { method: "POST", body: formData });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error || "Accept failed");
          return;
        }
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Accept failed");
      }
    });
  }

  return (
    <div>
      <button
        onClick={accept}
        disabled={pending}
        className="w-full bg-[var(--navy-900)] text-white font-bold py-3 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-60"
      >
        {pending ? "Joining…" : "Accept Invitation →"}
      </button>
      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
