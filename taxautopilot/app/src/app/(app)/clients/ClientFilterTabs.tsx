"use client";

import Link from "next/link";

export function ClientFilterTabs({
  active,
  mineCount,
  allCount,
  unassignedCount,
}: {
  active: "mine" | "all" | "unassigned";
  mineCount: number;
  allCount: number;
  unassignedCount: number;
}) {
  const tabs = [
    { key: "mine", label: "My Clients", count: mineCount },
    { key: "all", label: "All Clients", count: allCount },
    { key: "unassigned", label: "Unassigned", count: unassignedCount },
  ] as const;

  return (
    <div className="flex gap-1 border-b border-slate-200 mt-2">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.key === "all" ? "/clients" : `/clients?filter=${t.key}`}
            className={`px-4 py-2 -mb-px text-sm font-semibold border-b-2 transition ${
              isActive
                ? "border-[var(--green-500)] text-[var(--navy-900)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--navy-900)]"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${
                isActive ? "bg-[var(--green-100)] text-[var(--green-600)]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
