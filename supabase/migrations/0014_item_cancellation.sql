-- Per-item cancellation: lets a customer drop a single obligation from a
-- multi-item subscription instead of only being able to cancel everything.
-- stripe_subscription_item_id is set by the checkout.session.completed
-- webhook (matched by product name, since a subscription can be split across
-- two Stripe subscriptions when the cart mixes monthly and annual items).
alter table public.order_items
  add column if not exists stripe_subscription_item_id text,
  add column if not exists canceled_at timestamptz;
