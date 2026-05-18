"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createClientAction(formData: FormData) {
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const ssn_last4 = String(formData.get("ssn_last4") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!full_name) return { error: "Full name is required." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) return { error: "No organization linked to your profile." };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: profile.organization_id,
      full_name,
      email,
      phone,
      ssn_last4,
      notes,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}
