"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || `office-${Math.random().toString(36).slice(2, 8)}`;
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const officeName = String(formData.get("office_name") || "").trim();
  const software = String(formData.get("software") || "").trim() || null;
  const referralCode = String(formData.get("referral_code") || "").trim().toUpperCase() || null;

  if (!email || !password || !fullName || !officeName) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  // Validate referral code BEFORE creating the user so we don't half-onboard
  let referrerOrgId: string | null = null;
  if (referralCode) {
    const { data: referrer } = await supabase
      .from("organizations")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!referrer) {
      return { error: `Referral code ${referralCode} is invalid.` };
    }
    referrerOrgId = referrer.id;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (signUpError) return { error: signUpError.message };
  if (!signUpData.user) return { error: "Signup failed. Try again." };

  // Create organization
  const baseSlug = slugify(officeName);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: officeName,
      slug,
      software,
      referred_by_org_id: referrerOrgId,
    })
    .select()
    .single();

  if (orgError) return { error: `Couldn't create office: ${orgError.message}` };

  // Link profile to org as owner
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: org.id, role: "owner", full_name: fullName })
    .eq("id", signUpData.user.id);

  if (profileError) return { error: `Couldn't link profile: ${profileError.message}` };

  // If referred: insert referral row + award credit to referrer
  if (referrerOrgId && referralCode) {
    await supabase.from("referrals").insert({
      referrer_org_id: referrerOrgId,
      referee_org_id: org.id,
      referral_code: referralCode,
      status: "signed_up",
    });
    // Fire-and-forget credit award via RPC. Failure isn't fatal — we have
    // an audit log via the referrals table to reconcile if needed.
    await supabase.rpc("award_referral_credit", {
      p_org_id: referrerOrgId,
      p_amount: 250,
      p_reason: "referral_earned",
      p_referral_id: null,
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) return { error: "Email and password required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
