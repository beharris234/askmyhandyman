"use client";

import { useState, useTransition } from "react";

export function CheckoutButton({ tierId, label }: { tierId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function checkout() {
    setError(null);
    const formData = new FormData();
    formData.set("tier", tierId);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST", body: formData });
        const body = await res.json();
        if (!body.ok || !body.url) {
          setError(body.error || "Checkout failed");
          return;
        }
        window.location.href = body.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      }
    });
  }

  return (
    <div>
      <button
        onClick={checkout}
        disabled={pending}
        className="w-full bg-[var(--navy-900)] text-white font-bold py-2 rounded-md hover:bg-[var(--green-600)] transition disabled:opacity-50 text-sm"
      >
        {pending ? "Loading…" : `${label} →`}
      </button>
      {error && <div className="text-[10px] text-red-700 mt-1">{error}</div>}
    </div>
  );
}
