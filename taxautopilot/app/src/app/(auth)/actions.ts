"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  referralEarnedEmailTemplate,
  sendTransactional,
  welcomeEmailTemplate,
} from "@/lib/transactional-email";
import { buildReferralUrl } from "@/lib/referrals";

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
  const inviteToken = String(formData.get("invite_token") || "").trim() || null;

  // Invite flow: office_name not required — they're joining an existing org
  if (inviteToken) {
    if (!email || !password || !fullName) {
      return { error: "Name, email, and password are required." };
    }
  } else if (!email || !password || !fullName || !officeName) {
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

  // Branch: invite flow vs new-org flow
  let orgId: string;
  let assignedRole: string = "owner";

  if (inviteToken) {
    // Joining an existing org via invitation
    const { data: invite } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", inviteToken)
      .single();
    if (!invite || invite.status !== "pending") {
      return { error: "Invitation is no longer valid." };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { error: "Invitation has expired." };
    }
    orgId = invite.organization_id;
    assignedRole = invite.role;

    await supabase
      .from("invitations")
      .update({
        status: "accepted",
        accepted_by: signUpData.user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);
  } else {
    // Creating a new organization
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
    orgId = org.id;
  }

  // Link profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: orgId, role: assignedRole, full_name: fullName })
    .eq("id", signUpData.user.id);

  if (profileError) return { error: `Couldn't link profile: ${profileError.message}` };

  // If referred: insert referral row + award credit to referrer
  // (skip if joining an existing org via invite — referrals are for NEW orgs)
  if (referrerOrgId && referralCode && !inviteToken) {
    await supabase.from("referrals").insert({
      referrer_org_id: referrerOrgId,
      referee_org_id: orgId,
      referral_code: referralCode,
      status: "signed_up",
    });
    const { data: newBalance } = await supabase.rpc("award_referral_credit", {
      p_org_id: referrerOrgId,
      p_amount: 250,
      p_reason: "referral_earned",
      p_referral_id: null,
    });

    // Notify the referrer
    const { data: referrer } = await supabase
      .from("profiles")
      .select("email, full_name, organizations(name)")
      .eq("organization_id", referrerOrgId)
      .eq("role", "owner")
      .maybeSingle();
    if (referrer?.email) {
      const { count: qualifiedCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_org_id", referrerOrgId);
      const template = referralEarnedEmailTemplate({
        refereeName: officeName,
        newBalance: typeof newBalance === "number" ? newBalance : 250,
        referralCount: qualifiedCount ?? 1,
        referralsToFreeYear: Math.max(10 - (qualifiedCount ?? 1), 0),
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      });
      await sendTransactional({
        to: referrer.email,
        subject: template.subject,
        html: template.html,
      });
    }
  }

  // Welcome email for new orgs (not invite-flow joiners — they get the team feel)
  if (!inviteToken) {
    const { data: newOrg } = await supabase
      .from("organizations")
      .select("name, referral_code")
      .eq("id", orgId)
      .single();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (newOrg) {
      const template = welcomeEmailTemplate({
        fullName,
        officeName: newOrg.name,
        referralCode: newOrg.referral_code,
        referralUrl: buildReferralUrl(newOrg.referral_code, appUrl),
        appUrl,
      });
      await sendTransactional({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }
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
