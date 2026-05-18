import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ACCEPTED_COLUMNS = {
  full_name: ["full_name", "name", "client_name", "client name", "full name"],
  email: ["email", "email_address", "email address"],
  phone: ["phone", "phone_number", "phone number", "mobile", "cell"],
  ssn_last4: ["ssn_last4", "ssn last 4", "last 4 ssn", "ssn"],
  last_filed_year: ["last_filed_year", "last filed", "last year", "last_year"],
  notes: ["notes", "comments", "memo"],
};

type ParsedRow = Record<string, string>;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "file_too_large_max_10mb" }, { status: 413 });
  }

  const text = await file.text();
  const parsed = Papa.parse<ParsedRow>(text, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return NextResponse.json(
      { ok: false, error: `CSV parse failed: ${parsed.errors[0].message}` },
      { status: 400 }
    );
  }

  // Build a column → canonical name map
  const headers = parsed.meta.fields || [];
  const headerMap: Record<string, string> = {};
  for (const h of headers) {
    const normalized = h.trim().toLowerCase();
    for (const [canonical, aliases] of Object.entries(ACCEPTED_COLUMNS)) {
      if (aliases.includes(normalized)) {
        headerMap[h] = canonical;
        break;
      }
    }
  }

  if (!Object.values(headerMap).includes("full_name")) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "CSV must have a column named 'full_name' (or 'name'). Other recognized columns: email, phone, ssn_last4, last_filed_year, notes.",
      },
      { status: 400 }
    );
  }

  const isPreparer = profile.role === "preparer";

  // Build insert rows
  type ClientInsert = {
    organization_id: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    ssn_last4?: string | null;
    last_filed_year?: string | null;
    notes?: string | null;
    assigned_preparer_id?: string | null;
  };

  const rows: ClientInsert[] = [];
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const insertRow: ClientInsert = {
      organization_id: profile.organization_id,
      full_name: "",
    };

    for (const [headerKey, value] of Object.entries(row)) {
      const canonical = headerMap[headerKey];
      if (!canonical) continue;
      const v = (value || "").toString().trim();
      if (!v) continue;
      if (canonical === "full_name") insertRow.full_name = v;
      else if (canonical === "email") insertRow.email = v;
      else if (canonical === "phone") insertRow.phone = v;
      else if (canonical === "ssn_last4") insertRow.ssn_last4 = v.slice(-4).replace(/\D/g, "");
      else if (canonical === "last_filed_year") insertRow.last_filed_year = v.match(/\d{4}/)?.[0] || v;
      else if (canonical === "notes") insertRow.notes = v;
    }

    if (!insertRow.full_name) {
      skipped.push({ row: i + 2, reason: "missing_full_name" });
      continue;
    }

    // If creator is a preparer, auto-assign to them (trigger does this too, but explicit)
    if (isPreparer) insertRow.assigned_preparer_id = user.id;

    rows.push(insertRow);
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid client rows found in CSV." },
      { status: 400 }
    );
  }

  // Batch insert — 500 at a time to avoid hitting Supabase payload limits
  const BATCH = 500;
  let inserted = 0;
  const insertErrors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("clients")
      .insert(slice)
      .select("id");
    if (error) {
      insertErrors.push(`Batch ${i / BATCH + 1}: ${error.message}`);
      continue;
    }
    inserted += data?.length ?? 0;
  }

  return NextResponse.json({
    ok: true,
    total_rows: parsed.data.length,
    inserted,
    skipped_count: skipped.length,
    skipped_sample: skipped.slice(0, 10),
    errors: insertErrors,
  });
}
