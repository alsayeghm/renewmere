import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { sendEmail, renderStepWaitingEmail, renderItemCompletedEmail } from "@/lib/email";

const ALLOWED_STATUSES = ["not_started", "in_progress", "waiting_on_customer", "done"];

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  return isAdminEmail(userData.user?.email);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { order_item_id, title, description } = body as {
    order_item_id: string;
    title: string;
    description?: string;
  };
  if (!order_item_id || !title?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("order_item_steps")
    .select("id", { count: "exact", head: true })
    .eq("order_item_id", order_item_id);

  const { data, error } = await admin
    .from("order_item_steps")
    .insert({
      order_item_id,
      title: title.trim(),
      description: description?.trim() || null,
      position: count ?? 0,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  return NextResponse.json({ step: data });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { id, status, customer_prompt, title, description } = body as {
    id: string;
    status?: string;
    customer_prompt?: string | null;
    title?: string;
    description?: string | null;
  };
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) update.status = status;
  if (customer_prompt !== undefined) update.customer_prompt = customer_prompt;
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;

  const admin = createAdminClient();
  const { data: step, error } = await admin
    .from("order_item_steps")
    .update(update)
    .eq("id", id)
    .select("id, order_item_id, title, status, customer_prompt")
    .single();
  if (error || !step) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  const { data: item } = await admin
    .from("order_items")
    .select("id, title, module_name, fulfillment_status, orders(user_id)")
    .eq("id", step.order_item_id)
    .single();
  const customerId = (item?.orders as unknown as { user_id: string } | null)?.user_id;
  let customerEmail: string | null = null;
  if (customerId) {
    const { data: userData } = await admin.auth.admin.getUserById(customerId);
    customerEmail = userData.user?.email ?? null;
  }

  // A step just started waiting on the customer — tell them what's needed.
  if (status === "waiting_on_customer" && step.customer_prompt && customerEmail && item) {
    await sendEmail(
      customerEmail,
      "We need something from you — Renewmere",
      {
        html: renderStepWaitingEmail({
          itemTitle: item.title,
          moduleName: item.module_name,
          stepTitle: step.title,
          customerPrompt: step.customer_prompt,
        }),
      },
    );
  }

  if (item) {
    // First activity on a previously untouched item — reflect that at the item level.
    if (status && status !== "not_started" && item.fulfillment_status === "not_started") {
      await admin.from("order_items").update({ fulfillment_status: "in_progress" }).eq("id", item.id);
    }

    // If every step for this item is now done, mark the item completed and tell the customer.
    if (status === "done") {
      const { data: siblingSteps } = await admin
        .from("order_item_steps")
        .select("status")
        .eq("order_item_id", item.id);
      const allDone = (siblingSteps ?? []).length > 0 && (siblingSteps ?? []).every((s) => s.status === "done");
      if (allDone && item.fulfillment_status !== "completed") {
        await admin.from("order_items").update({ fulfillment_status: "completed" }).eq("id", item.id);
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "You're compliant on one item — Renewmere",
            { html: renderItemCompletedEmail({ itemTitle: item.title, moduleName: item.module_name }) },
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
