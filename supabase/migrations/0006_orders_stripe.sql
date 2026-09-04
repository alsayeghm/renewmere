-- Real Stripe billing for orders. Checkout Sessions can't mix subscription
-- items with different billing intervals (Stripe limitation), so a cart that
-- has both annual and monthly recurring items is billed as two sequential
-- Checkout Sessions ("legs") against the same Stripe customer. The second
-- leg's items are parked in pending_leg_items until the first leg completes.
alter table public.orders
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists pending_leg_items jsonb,
  add column if not exists parent_order_id uuid references public.orders(id) on delete set null;

create index if not exists orders_stripe_subscription_id_idx on public.orders(stripe_subscription_id);
create index if not exists orders_stripe_checkout_session_id_idx on public.orders(stripe_checkout_session_id);
