"use client";

export function PrintReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[var(--navy-900)] text-white font-bold px-4 py-2 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
    >
      📥 Save as PDF
    </button>
  );
}
