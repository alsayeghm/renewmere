import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB per file

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const stepId = formData.get("step_id");
  const text = formData.get("text");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (typeof stepId !== "string") {
    return NextResponse.json({ error: "missing_step_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify this step's order item actually belongs to the requesting user.
  const { data: step } = await admin
    .from("order_item_steps")
    .select("id, order_item_id, order_items!inner(orders!inner(user_id))")
    .eq("id", stepId)
    .single();
  const ownerId = (
    step?.order_items as unknown as { orders: { user_id: string } } | null
  )?.orders?.user_id;
  if (!step || ownerId !== userData.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "file_too_large", file: file.name }, { status: 413 });
    }
  }

  await admin
    .from("order_item_steps")
    .update({
      customer_response_text: typeof text === "string" && text.trim() ? text.trim() : null,
      customer_response_submitted_at: new Date().toISOString(),
    })
    .eq("id", stepId);

  for (const file of files) {
    const path = `${step.order_item_id}/${stepId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await admin.storage
      .from("intake-files")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) continue;
    await admin.from("order_item_files").insert({
      order_item_id: step.order_item_id,
      step_id: stepId,
      file_path: path,
      file_name: file.name,
    });
  }

  return NextResponse.json({ ok: true });
}
