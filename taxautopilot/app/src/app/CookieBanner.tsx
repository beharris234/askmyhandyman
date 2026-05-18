"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem("ta_cookie_consent");
    if (!consent) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem("ta_cookie_consent", "accepted");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--navy-900)] text-white p-4 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="text-xs sm:text-sm flex-1">
          🍪 We use essential cookies for authentication and to remember your
          preferences. By continuing you agree to our{" "}
          <Link href="/privacy" className="underline font-semibold text-[var(--green-500)]">
            Privacy Policy
          </Link>
          {" "}and{" "}
          <Link href="/terms" className="underline font-semibold text-[var(--green-500)]">
            Terms
          </Link>.
        </div>
        <button
          onClick={accept}
          className="bg-[var(--green-500)] text-white font-bold px-4 py-2 rounded-md text-sm hover:bg-[var(--green-600)] transition whitespace-nowrap shrink-0"
        >
          OK, got it
        </button>
      </div>
    </div>
  );
}
