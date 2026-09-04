import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLACEHOLDER_PRICE_PENCE } from "@/lib/pricing";
import { BillingType } from "@/lib/modules/types";

const TRIAL_DAYS = 7;

type CartItem = {
  key: string;
  moduleName: string;
  title: string;
  billing: BillingType;
  pricePence: number;
};

function cartTotals(items: CartItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.billing] += item.pricePence;
      return acc;
    },
    { one_time: 0, annual: 0, recurring: 0 } as Record<BillingType, number>,
  );
}

function toLineItems(items: CartItem[]): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return items.map((item) => ({
    quantity: 1,
    price_data: {
      currency: "gbp",
      unit_amount: PLACEHOLDER_PRICE_PENCE[item.billing],
      product_data: { name: `${item.title} — ${item.moduleName}` },
      ...(item.billing === "one_time"
        ? {}
        : { recurring: { interval: item.billing === "annual" ? "year" : "month" } }),
    },
  }));
}

/**
 * A single Stripe subscription can't mix items billed at different intervals
 * in Checkout, so a cart with both annual and monthly items is split into two
 * legs billed one after the other against the same customer. Leg 1 covers
 * one-off items plus whichever recurring interval appears first (monthly
 * takes priority); leg 2, if needed, covers the remaining interval.
 */
function splitIntoLegs(items: CartItem[]) {
  const oneTime = items.filter((i) => i.billing === "one_time");
  const annual = items.filter((i) => i.billing === "annual");
  const recurring = items.filter((i) => i.billing === "recurring");

  if (recurring.length > 0) {
    return { leg1: [...oneTime, ...recurring], leg2: annual };
  }
  return { leg1: [...oneTime, ...annual], leg2: [] as CartItem[] };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, checkId, parentOrderId } = body as {
    items: CartItem[];
    checkId: string | null;
    parentOrderId?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const siteUrl = new URL(request.url).origin;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  // Recompute prices server-side from the billing type — never trust client-sent amounts.
  const priced = items.map((item) => ({ ...item, pricePence: PLACEHOLDER_PRICE_PENCE[item.billing] }));
  const { leg1, leg2 } = splitIntoLegs(priced);
  const totals = cartTotals(priced);

  const admin = createAdminClient();

  let orderId = parentOrderId;
  let existingCustomerId: string | null = null;

  if (parentOrderId) {
    // Read the customer straight from Stripe rather than our own DB: the
    // webhook that copies it onto the order row may not have landed yet by
    // the time the success page immediately kicks off leg 2.
    const { data: parentOrder } = await admin
      .from("orders")
      .select("stripe_customer_id, stripe_checkout_session_id")
      .eq("id", parentOrderId)
      .single();
    if (parentOrder?.stripe_checkout_session_id) {
      const leg1Session = await stripe.checkout.sessions.retrieve(parentOrder.stripe_checkout_session_id);
      existingCustomerId = typeof leg1Session.customer === "string" ? leg1Session.customer : null;
    }
    existingCustomerId ??= parentOrder?.stripe_customer_id ?? null;
  } else {
    const { data: inserted, error } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        check_id: checkId,
        items: priced,
        total_one_time_pence: totals.one_time,
        total_annual_pence: totals.annual,
        total_recurring_pence: totals.recurring,
        status: "pending_payment",
        pending_leg_items: leg2.length > 0 ? leg2 : null,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return NextResponse.json({ error: "order_create_failed" }, { status: 500 });
    }
    orderId = inserted.id;

    await admin.from("order_items").insert(
      priced.map((item) => ({
        order_id: orderId,
        item_key: item.key,
        title: item.title,
        module_name: item.moduleName,
        billing: item.billing,
        price_pence: item.pricePence,
      })),
    );
  }

  const legItems = parentOrderId ? priced : leg1;
  const mode: Stripe.Checkout.SessionCreateParams.Mode = legItems.some((i) => i.billing !== "one_time")
    ? "subscription"
    : "payment";

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: toLineItems(legItems),
    customer: existingCustomerId ?? undefined,
    customer_email: existingCustomerId ? undefined : user.email,
    client_reference_id: orderId,
    metadata: { order_id: orderId!, user_id: user.id },
    subscription_data:
      mode === "subscription"
        ? { trial_period_days: TRIAL_DAYS, metadata: { order_id: orderId! } }
        : undefined,
    success_url: `${siteUrl}/check?checkout=success&order_id=${orderId}`,
    cancel_url: `${siteUrl}/check?checkout=cancelled`,
  });

  // Clear pending_leg_items once leg 2's session is created so returning from
  // it doesn't re-trigger the same leg again (this order_id is reused in its
  // success_url since there's no separate row for leg 2).
  await admin
    .from("orders")
    .update({
      stripe_checkout_session_id: session.id,
      ...(parentOrderId ? { pending_leg_items: null } : {}),
    })
    .eq("id", orderId!);

  return NextResponse.json({ url: session.url });
}
