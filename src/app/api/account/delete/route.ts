import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;
  const admin = createAdminClient();

  const { data: orders } = await admin.from("orders").select("id").eq("user_id", userId);
  for (const order of orders ?? []) {
    const { data: items } = await admin.from("order_items").select("id").eq("order_id", order.id);
    for (const item of items ?? []) {
      await admin.from("order_item_files").delete().eq("order_item_id", item.id);
      await admin.from("order_item_steps").delete().eq("order_item_id", item.id);
    }
    await admin.from("order_items").delete().eq("order_id", order.id);
  }
  await admin.from("orders").delete().eq("user_id", userId);
  await admin.from("customer_profiles").delete().eq("user_id", userId);
  await admin.from("checks").delete().eq("user_id", userId);
  await admin.from("fix_requests").delete().eq("user_id", userId);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
