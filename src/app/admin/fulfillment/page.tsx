import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminFulfillment, type FulfillmentRow, type StepRow } from "@/components/AdminFulfillment";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export const metadata = {
  title: "Fulfillment — Renewmere admin",
};

export default async function AdminFulfillmentPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/admin/fulfillment");
  }

  if (!isAdminEmail(userData.user.email)) {
    return (
      <div className="min-h-screen bg-paper">
        <SiteHeader />
        <section className="mx-auto max-w-2xl px-6 py-14 text-center">
          <p className="text-[14px] text-muted">Not authorized.</p>
        </section>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("*, orders(id, user_id, status, created_at)")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((items ?? []).map((i) => i.orders?.user_id).filter(Boolean))] as string[];
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of usersPage.users) {
      if (userIds.includes(u.id)) emailMap[u.id] = u.email ?? "unknown";
    }
  }

  const itemIds = (items ?? []).map((i) => i.id);

  const [{ data: steps }, { data: files }] = await Promise.all([
    itemIds.length > 0
      ? admin
          .from("order_item_steps")
          .select("*")
          .in("order_item_id", itemIds)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [] }),
    itemIds.length > 0
      ? admin.from("order_item_files").select("order_item_id, step_id, file_name, file_path").in("order_item_id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const fileUrlsByStep: Record<string, { name: string; url: string }[]> = {};
  for (const f of files ?? []) {
    if (!f.step_id) continue;
    const { data: signed } = await admin.storage.from("intake-files").createSignedUrl(f.file_path, 3600);
    if (!signed) continue;
    (fileUrlsByStep[f.step_id] ??= []).push({ name: f.file_name, url: signed.signedUrl });
  }

  const stepsByItem: Record<string, StepRow[]> = {};
  for (const s of steps ?? []) {
    (stepsByItem[s.order_item_id] ??= []).push({
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status,
      customer_prompt: s.customer_prompt,
      customer_response_text: s.customer_response_text,
      customer_response_submitted_at: s.customer_response_submitted_at,
      files: fileUrlsByStep[s.id] ?? [],
    });
  }

  const rows: FulfillmentRow[] = (items ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    module_name: i.module_name,
    billing: i.billing,
    price_pence: i.price_pence,
    fulfillment_status: i.fulfillment_status,
    admin_notes: i.admin_notes,
    customer_note: i.customer_note,
    steps: stepsByItem[i.id] ?? [],
    created_at: i.created_at,
    order_status: i.orders?.status ?? "unknown",
    customer_email: i.orders?.user_id ? (emailMap[i.orders.user_id] ?? "unknown") : "unknown",
  }));

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <AdminFulfillment items={rows} />
      </section>
    </div>
  );
}
