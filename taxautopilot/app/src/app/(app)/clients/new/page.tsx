import Link from "next/link";
import { createClientAction } from "../actions";
import { NewClientForm } from "./NewClientForm";

export default function NewClientPage() {
  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link
        href="/clients"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to clients
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">Add a client</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Quick add — you can fill in more details later.
        </p>

        <NewClientForm action={createClientAction} />
      </div>
    </div>
  );
}
