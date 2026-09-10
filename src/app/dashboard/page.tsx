import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Dashboard, type OrderRow, type LatestCheck, type CustomerProfile } from "@/components/Dashboard";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Your dashboard — Renewmere",
};

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: orders }, { data: checks }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, items, status, total_one_time_pence, total_annual_pence, total_recurring_pence, trial_end_at, current_period_end, cancel_at_period_end, created_at, order_items(id, title, module_name, billing, price_pence, fulfillment_status, customer_note, canceled_at, stripe_subscription_item_id, order_item_steps(id, title, description, status, customer_prompt, customer_response_text, customer_response_submitted_at))",
      )
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("checks")
      .select("id, result, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("customer_profiles").select("*").eq("user_id", userData.user.id).maybeSingle(),
  ]);

  // Signed download URLs for any files already uploaded against this
  // customer's own steps — generated with the admin client since storage
  // RLS only allows the service role to read, but the steps themselves were
  // already fetched through the RLS-scoped client above (ownership-safe).
  const stepIds = (orders ?? []).flatMap((o) => (o.order_items ?? []).flatMap((i) => (i.order_item_steps ?? []).map((s) => s.id)));
  const filesByStep: Record<string, { name: string; url: string }[]> = {};
  if (stepIds.length > 0) {
    const admin = createAdminClient();
    const { data: files } = await admin
      .from("order_item_files")
      .select("step_id, file_name, file_path")
      .in("step_id", stepIds);
    for (const f of files ?? []) {
      if (!f.step_id) continue;
      const { data: signed } = await admin.storage.from("intake-files").createSignedUrl(f.file_path, 3600);
      if (!signed) continue;
      (filesByStep[f.step_id] ??= []).push({ name: f.file_name, url: signed.signedUrl });
    }
  }

  const orderRows = (orders ?? []).map((o) => ({
    ...o,
    order_items: (o.order_items ?? []).map((i) => ({
      ...i,
      order_item_steps: (i.order_item_steps ?? []).map((s) => ({ ...s, files: filesByStep[s.id] ?? [] })),
    })),
  }));

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-14">
        <Dashboard
          orders={orderRows as unknown as OrderRow[]}
          latestCheck={(checks?.[0] as LatestCheck) ?? null}
          profile={(profile as CustomerProfile) ?? null}
          email={userData.user.email ?? ""}
        />
      </section>
    </div>
  );
}
