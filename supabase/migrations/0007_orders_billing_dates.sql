-- Subscription billing details for the customer dashboard, kept in sync by
-- the Stripe webhook so the dashboard never has to call the Stripe API live.
alter table public.orders
  add column if not exists trial_end_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;
