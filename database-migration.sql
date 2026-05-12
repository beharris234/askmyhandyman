-- ════════════════════════════════════════════
-- PRIVATEBLAST — Complete Database Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE: profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  display_name text,
  role text CHECK (role IN ('entertainer_f','entertainer_m','companion','wellness','creator','dj','host','talent','club')),
  privacy_setting text DEFAULT 'private' CHECK (privacy_setting IN ('private','selective','open')),
  plan text DEFAULT 'free' CHECK (plan IN ('free','basic','vip','business')),
  avatar_emoji text DEFAULT '💃',
  referral_code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: sub_profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sub_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  profile_name text,
  role text,
  icon_emoji text,
  privacy_setting text DEFAULT 'private',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: contacts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  sub_profile_id uuid REFERENCES public.sub_profiles ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  group_name text,
  group_color text,
  group_emoji text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: groups
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  sub_profile_id uuid REFERENCES public.sub_profiles ON DELETE CASCADE,
  name text,
  color text,
  emoji text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: blasts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blasts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  sub_profile_id uuid REFERENCES public.sub_profiles ON DELETE CASCADE,
  message text,
  media_type text DEFAULT 'text',
  groups_sent text[],
  recipient_count integer DEFAULT 0,
  is_private boolean DEFAULT true,
  tip_link_included boolean DEFAULT false,
  scheduled_at timestamptz,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: venues
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  city text,
  is_owned boolean DEFAULT false,
  tipout_type text DEFAULT 'percentage' CHECK (tipout_type IN ('flat','percentage','manual')),
  tipout_amount decimal DEFAULT 0,
  tipout_min decimal DEFAULT 0,
  tipout_max decimal DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: shifts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues ON DELETE SET NULL,
  venue_name text,
  cash decimal DEFAULT 0,
  chips decimal DEFAULT 0,
  card_tips decimal DEFAULT 0,
  digital_tips decimal DEFAULT 0,
  vip_room decimal DEFAULT 0,
  private_dances decimal DEFAULT 0,
  guarantee_fee decimal DEFAULT 0,
  other decimal DEFAULT 0,
  tipout_dj decimal DEFAULT 0,
  tipout_house decimal DEFAULT 0,
  tipout_bar decimal DEFAULT 0,
  tipout_other decimal DEFAULT 0,
  gross_total decimal DEFAULT 0,
  net_total decimal DEFAULT 0,
  notes text,
  shift_date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: tip_out_rules
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tip_out_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES auth.users ON DELETE CASCADE,
  business_name text,
  recipient_name text,
  recipient_emoji text DEFAULT '💰',
  rule_type text DEFAULT 'percentage' CHECK (rule_type IN ('flat','percentage')),
  amount decimal DEFAULT 0,
  minimum_amount decimal DEFAULT 0,
  maximum_amount decimal DEFAULT 0,
  is_active boolean DEFAULT true,
  shift_type text DEFAULT 'all' CHECK (shift_type IN ('all','day','night','vip')),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: performers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.performers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES auth.users ON DELETE CASCADE,
  business_name text,
  name text NOT NULL,
  emoji text DEFAULT '💃',
  color text DEFAULT '#b496ff',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: performer_shifts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.performer_shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES auth.users ON DELETE CASCADE,
  performer_id uuid REFERENCES public.performers ON DELETE CASCADE,
  business_name text,
  earned decimal DEFAULT 0,
  tipout_dj decimal DEFAULT 0,
  tipout_house decimal DEFAULT 0,
  tipout_bar decimal DEFAULT 0,
  tipout_other decimal DEFAULT 0,
  total_tipout decimal DEFAULT 0,
  keeps decimal DEFAULT 0,
  is_paid boolean DEFAULT false,
  is_late boolean DEFAULT false,
  exemption_type text DEFAULT 'none' CHECK (exemption_type IN ('none','birthday','firstnight','custom')),
  exemption_reason text,
  shift_date date DEFAULT current_date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: referrals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid REFERENCES auth.users ON DELETE CASCADE,
  referred_id uuid REFERENCES auth.users ON DELETE CASCADE,
  referred_email text,
  plan_level text DEFAULT 'free',
  is_active boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  cancelled_at timestamptz
);

-- ─────────────────────────────────────────────
-- TABLE: subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  plan text DEFAULT 'free' CHECK (plan IN ('free','basic','vip','business')),
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','free_via_referral')),
  price decimal DEFAULT 0,
  billing_date date,
  referral_count integer DEFAULT 0,
  is_free_month boolean DEFAULT false,
  payment_method text,
  ccbill_subscription_id text,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: blacklist
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blacklist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by uuid REFERENCES auth.users ON DELETE SET NULL,
  phone_number text NOT NULL,
  reason text,
  city text,
  is_community boolean DEFAULT false,
  verified_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: payment_links
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  cashapp_tag text,
  venmo_username text,
  zelle_contact text,
  crypto_address text,
  tip_message text DEFAULT 'Thanks for the love 💜',
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TABLE: notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  type text,
  title text,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_out_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════
-- RLS POLICIES
-- ════════════════════════════════════════════

-- profiles: users manage their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- sub_profiles: users manage their own
CREATE POLICY "sub_profiles_all_own" ON public.sub_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contacts: users manage their own
CREATE POLICY "contacts_all_own" ON public.contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- groups: users manage their own
CREATE POLICY "groups_all_own" ON public.groups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- blasts: users manage their own
CREATE POLICY "blasts_all_own" ON public.blasts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- venues: users manage their own
CREATE POLICY "venues_all_own" ON public.venues FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shifts: users manage their own
CREATE POLICY "shifts_all_own" ON public.shifts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tip_out_rules: owners manage their own
CREATE POLICY "tip_out_rules_all_own" ON public.tip_out_rules FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- performers: owners manage their own
CREATE POLICY "performers_all_own" ON public.performers FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- performer_shifts: owners manage their own
CREATE POLICY "performer_shifts_all_own" ON public.performer_shifts FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- referrals: referrers can see/update, anyone can insert
CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "referrals_insert" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_update_own" ON public.referrals FOR UPDATE USING (auth.uid() = referrer_id);

-- subscriptions: users manage their own
CREATE POLICY "subscriptions_all_own" ON public.subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- blacklist: own entries + community entries readable by all authenticated users
CREATE POLICY "blacklist_select" ON public.blacklist FOR SELECT USING (auth.uid() = reported_by OR is_community = true);
CREATE POLICY "blacklist_insert" ON public.blacklist FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "blacklist_update_own" ON public.blacklist FOR UPDATE USING (auth.uid() = reported_by);

-- payment_links: users manage their own
CREATE POLICY "payment_links_all_own" ON public.payment_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications: users manage their own
CREATE POLICY "notifications_all_own" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
