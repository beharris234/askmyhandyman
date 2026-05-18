import Link from "next/link";
import { signUpAction } from "../actions";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <div className="inline-flex items-center gap-2 bg-[var(--green-100)] text-[var(--green-600)] px-3 py-1 rounded-full text-xs font-semibold mb-3">
        <span className="w-1.5 h-1.5 bg-[var(--green-500)] rounded-full animate-pulse" />
        Founders Pricing
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">
        Set up your office
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Takes 30 seconds. Lifetime price locked.
      </p>

      <SignUpForm action={signUpAction} />

      <div className="mt-6 text-sm text-center text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--green-600)] font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
