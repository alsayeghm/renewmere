import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { order_item_id } = body as { order_item_id: string };
  if (!order_item_id) {
    return NextResponse.json({ error: "missing_order_item_id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("order_items")
    .select("id, order_id, billing, stripe_subscription_item_id, canceled_at, orders(user_id, stripe_subscription_id)")
    .eq("id", order_item_id)
    .single();

  const order = item?.orders as unknown as { user_id: string; stripe_subscription_id: string | null } | null;
  if (!item || !order || order.user_id !== userData.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (item.canceled_at) {
    return NextResponse.json({ error: "already_canceled" }, { status: 400 });
  }
  if (item.billing === "one_time" || !item.stripe_subscription_item_id || !order.stripe_subscription_id) {
    return NextResponse.json({ error: "not_cancelable" }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
  if (subscription.items.data.length <= 1) {
    // Last remaining item — cancel the whole subscription rather than
    // leaving an empty one behind.
    await stripe.subscriptions.cancel(order.stripe_subscription_id);
  } else {
    await stripe.subscriptionItems.del(item.stripe_subscription_item_id, { proration_behavior: "create_prorations" });
  }

  await admin.from("order_items").update({ canceled_at: new Date().toISOString() }).eq("id", order_item_id);

  return NextResponse.json({ ok: true });
}
