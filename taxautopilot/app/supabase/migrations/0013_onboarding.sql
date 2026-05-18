-- ============================================================
-- TaxAutopilot — Phase 9.5: Onboarding state on profiles
-- ============================================================
-- Tracks whether each user has seen the welcome modal so we don't
-- nag them every dashboard visit.

alter table profiles
  add column onboarded_at timestamptz;
