import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPlanConfirmedEmail, renderTrialEndingEmail, type EmailOrderItem } from "@/lib/email";

const NOTIFY_TO = "hello@renewmere.com";

async function sendEmail(to: string, subject: string, opts: { text?: string; html?: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return; // Not configured yet — don't fail the webhook over it.
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Renewmere <notifications@renewmere.com>", to: [to], subject, ...opts }),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  // Stripe's test-mode and live-mode webhooks both deliver to this same production
  // URL (there's no separate test domain), so accept either signing secret.
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_TEST].filter(
    (s): s is string => !!s,
  );

  let event: Stripe.Event | undefined;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature!, secret);
      break;
    } catch {
      // Try the next secret.
    }
  }
  if (!event) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Billing periods live on subscription items, not the subscription itself
  // (Stripe's flexible-billing model) — every leg is single-interval, so the
  // first item's period covers the whole subscription for our purposes.
  function subscriptionBillingFields(subscription: Stripe.Subscription) {
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    return {
      status: subscription.status,
      trial_end_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;
      if (!orderId) break;

      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      const subscription = subscriptionId
        ? await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product"] })
        : null;
      const billingFields = subscription ? subscriptionBillingFields(subscription) : {};

      await admin
        .from("orders")
        .update({
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: subscriptionId,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          status: session.mode === "subscription" ? "trialing" : "paid",
          ...billingFields,
        })
        .eq("id", orderId);

      // Map each subscription item back to its order_item (matched by the
      // product name Checkout was given) so a customer can later cancel just
      // that one obligation instead of the whole subscription.
      if (subscription) {
        const { data: unassigned } = await admin
          .from("order_items")
          .select("id, title, module_name")
          .eq("order_id", orderId)
          .is("stripe_subscription_item_id", null);
        for (const subItem of subscription.items.data) {
          const product = subItem.price.product;
          const productName = typeof product === "string" ? null : (product as Stripe.Product).name;
          if (!productName) continue;
          const match = (unassigned ?? []).find((oi) => `${oi.title} — ${oi.module_name}` === productName);
          if (!match) continue;
          await admin
            .from("order_items")
            .update({ stripe_subscription_item_id: subItem.id })
            .eq("id", match.id);
          unassigned!.splice(unassigned!.indexOf(match), 1);
        }
      }

      const { data: order } = await admin
        .from("orders")
        .select("items, total_one_time_pence, total_annual_pence, total_recurring_pence, trial_end_at")
        .eq("id", orderId)
        .single();
      const customerEmail = session.customer_details?.email ?? session.customer_email;
      if (order && customerEmail) {
        const html = renderPlanConfirmedEmail({
          orderId,
          customerEmail,
          items: order.items as EmailOrderItem[],
          totalOneTimePence: order.total_one_time_pence,
          totalAnnualPence: order.total_annual_pence,
          totalRecurringPence: order.total_recurring_pence,
          trialEndsAt: order.trial_end_at,
        });
        await sendEmail(
          NOTIFY_TO,
          `Payment confirmed (${(order.items as EmailOrderItem[]).length} item${(order.items as EmailOrderItem[]).length === 1 ? "" : "s"})`,
          { html },
        );
      }
      break;
    }

    case "checkout.session.expired": {
      // Customer started checkout but never completed it — stop it showing
      // as an active plan; a fresh checkout attempt creates its own order.
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;
      if (!orderId) break;
      await admin.from("orders").update({ status: "canceled" }).eq("id", orderId).eq("status", "pending_payment");
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await admin
        .from("orders")
        .update(subscriptionBillingFields(subscription))
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: order } = await admin
        .from("orders")
        .select("items, total_one_time_pence, total_annual_pence, total_recurring_pence")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();
      if (!order) break;

      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const customer = await stripe.customers.retrieve(customerId);
      const email = !customer.deleted ? customer.email : null;
      if (!email) break;

      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
      const items = order.items as EmailOrderItem[];

      await sendEmail(email, "Your Renewmere free trial ends in 3 days", {
        html: renderTrialEndingEmail({
          trialEndsAt: trialEnd ? trialEnd.toISOString() : null,
          items,
          totalOneTimePence: order.total_one_time_pence,
          totalAnnualPence: order.total_annual_pence,
          totalRecurringPence: order.total_recurring_pence,
        }),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await admin
        .from("orders")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
