import Link from "next/link";
import { loginAction } from "../actions";
import { LoginForm } from "./LoginForm";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">Welcome back</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Sign in to your tax office.</p>

      <LoginForm action={loginAction} next={params.next} initialError={params.error} />

      <div className="mt-4 text-xs text-center">
        <Link href="/forgot-password" className="text-[var(--text-muted)] hover:text-[var(--navy-900)] hover:underline">
          Forgot your password?
        </Link>
      </div>

      <div className="mt-6 text-sm text-center text-[var(--text-muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[var(--green-600)] font-semibold hover:underline">
          Create one
        </Link>
      </div>
    </div>
  );
}
