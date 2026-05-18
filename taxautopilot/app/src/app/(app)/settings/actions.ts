"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function disconnectConnectionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing connection id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("email_connections").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return {};
}

export async function syncNowAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing connection id." };

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Forward the session cookie so the sync endpoint authenticates as this user
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    const res = await fetch(`${base}/api/sync?connection_id=${id}`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    });
    const body = await res.json();
    revalidatePath("/settings");
    revalidatePath("/inbox");
    if (!res.ok || !body.ok) {
      return { error: body.error || "Sync failed" };
    }
    return { ok: true, results: body.results };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Sync failed" };
  }
}
