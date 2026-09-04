import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

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
  const { error } = await admin.from("order_item_steps").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
