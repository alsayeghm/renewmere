import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

const ALLOWED_STATUSES = ["not_started", "in_progress", "waiting_on_customer", "completed"];

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!isAdminEmail(userData.user?.email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { id, fulfillment_status, admin_notes, customer_note } = body as {
    id: string;
    fulfillment_status?: string;
    admin_notes?: string | null;
    customer_note?: string | null;
  };
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  if (fulfillment_status && !ALLOWED_STATUSES.includes(fulfillment_status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fulfillment_status !== undefined) update.fulfillment_status = fulfillment_status;
  if (admin_notes !== undefined) update.admin_notes = admin_notes;
  if (customer_note !== undefined) update.customer_note = customer_note;

  const admin = createAdminClient();
  const { error } = await admin.from("order_items").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
